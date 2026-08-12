"""Project memory and durable context store for Devflow agents."""
from __future__ import annotations

from typing import Any

from memory.agent_store import AgentStore
from services.db_client import fetch_project_chat_history, fetch_project_document, save_project_iteration
from utils.logging import get_logger

logger = get_logger("memory.project")

# Global in-memory cache for decisions & iterations during runs
_PROJECT_DECISIONS: dict[str, list[dict[str, Any]]] = {}
_PROJECT_DOC_CACHE: dict[str, dict[str, Any]] = {}


class ProjectMemory:
    """Manages persistent project memory, past iterations, decisions, and chat context."""

    def __init__(self, project_id: str, user_id: str | None = None):
        self.project_id = project_id
        self.user_id = user_id or "system"
        self.agent_store = AgentStore(project_id, self.user_id)

    async def get_previous_project_context(self) -> dict[str, Any]:
        """Retrieve the authoritative prior database state of the project for iterations."""
        # 1. Try PostgreSQL / Supabase document
        db_proj = await fetch_project_document(self.project_id)
        if db_proj and db_proj.get("document"):
            doc = db_proj["document"]
            _PROJECT_DOC_CACHE[self.project_id] = doc
            return {
                "project_id": self.project_id,
                "title": db_proj.get("title"),
                "previous_document": doc,
                "executive_summary": doc.get("executive_summary"),
                "requirements": doc.get("requirements"),
                "architecture": doc.get("architecture"),
                "backlog": doc.get("backlog"),
                "risks": doc.get("risks"),
                "team": doc.get("team"),
                "timeline": doc.get("timeline"),
                "integrations": doc.get("integrations"),
                "cost": doc.get("cost"),
            }

        # 2. Fallback to in-memory cache
        if self.project_id in _PROJECT_DOC_CACHE:
            doc = _PROJECT_DOC_CACHE[self.project_id]
            return {"project_id": self.project_id, "previous_document": doc}

        return {"project_id": self.project_id}

    async def get_project_chat_context(self) -> list[dict[str, Any]]:
        """Retrieve recent chat interactions and user requests for this project."""
        return await fetch_project_chat_history(self.project_id, limit=10)

    async def get_agent_specific_context(self, agent_id: str) -> dict[str, Any]:
        """Return a minimal, token-efficient context for a specific agent.

        Uses the agent_store to retrieve only the upstream sections this agent
        depends on, dramatically reducing token waste.
        """
        scoped = await self.agent_store.get_scoped_outputs(agent_id)
        decisions = await self.agent_store.get_decision_log()
        return {
            "upstream_outputs": scoped,
            "quality_decisions": decisions,
        }

    async def save_decision(self, agent_id: str, topic: str, decision: dict[str, Any]) -> None:
        """Store a durable architectural or product decision."""
        entry = {
            "agent_id": agent_id,
            "topic": topic,
            "decision": decision,
        }
        if self.project_id not in _PROJECT_DECISIONS:
            _PROJECT_DECISIONS[self.project_id] = []
        _PROJECT_DECISIONS[self.project_id].append(entry)

    async def save_iteration_diff(self, section: str, data: dict[str, Any]) -> None:
        """Store a versioned iteration diff in PostgreSQL / Supabase and in-memory cache."""
        # Save to PostgreSQL / Supabase
        await save_project_iteration(self.project_id, self.user_id, section, data)

        if self.project_id not in _PROJECT_DOC_CACHE:
            _PROJECT_DOC_CACHE[self.project_id] = {}
        _PROJECT_DOC_CACHE[self.project_id][section] = data

    async def get_history(self) -> list[dict[str, Any]]:
        """Retrieve all recorded decisions for this project."""
        return list(_PROJECT_DECISIONS.get(self.project_id, []))
