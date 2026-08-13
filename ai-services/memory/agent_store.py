"""Per-agent structured output storage with versioning and scoped retrieval.

Stores each agent's validated output as a versioned JSON record, cached in memory
for hot reads during a workflow run, and persisted to PostgreSQL / Supabase for durability.
Downstream agents receive only the upstream sections they depend on, minimizing
token waste and improving context quality.
"""
from __future__ import annotations

from typing import Any

from services.db_client import (
    fetch_agent_output,
    fetch_agent_outputs,
    save_agent_output as db_save_agent_output,
    save_quality_record,
)
from tools.project_context import DEPENDENCIES
from utils.logging import get_logger

logger = get_logger("memory.agent_store")

# Global in-memory cache for fast agent-to-agent output sharing during runs:
# { project_id: { agent_id: { "agent_id": str, "section": str, "version": int, "data": dict } } }
_AGENT_CACHE: dict[str, dict[str, dict[str, Any]]] = {}
_QUALITY_CACHE: dict[str, dict[str, dict[str, Any]]] = {}

# Maps agent_id -> the section key it produces.
AGENT_SECTION: dict[str, str] = {
    "ceo": "executive_summary",
    "product_manager": "requirements",
    "architect": "architecture",
    "sprint_planner": "backlog",
    "risk": "risks",
    "team_allocation": "team",
    "timeline": "timeline",
    "integration": "integrations",
}

# Reverse: section -> agent_id
SECTION_AGENT: dict[str, str] = {v: k for k, v in AGENT_SECTION.items()}


class AgentStore:
    """Manages per-agent structured output with versioning and scoped retrieval."""

    def __init__(self, project_id: str, user_id: str = "system"):
        self.project_id = project_id
        self.user_id = user_id

    async def save_output(
        self, agent_id: str, section: str, data: dict[str, Any], version: int = 1
    ) -> None:
        """Store an agent's validated output with versioning."""
        # 1. Persist to PostgreSQL / Supabase
        await db_save_agent_output(self.project_id, self.user_id, agent_id, section, data, version)

        # 2. Cache in memory for hot reads during the run
        if self.project_id not in _AGENT_CACHE:
            _AGENT_CACHE[self.project_id] = {}
        _AGENT_CACHE[self.project_id][agent_id] = {
            "agent_id": agent_id,
            "section": section,
            "version": version,
            "data": data,
        }

    async def get_output(self, agent_id: str) -> dict[str, Any] | None:
        """Retrieve the latest output for a specific agent (cache-first)."""
        # 1. Try in-memory cache
        if self.project_id in _AGENT_CACHE and agent_id in _AGENT_CACHE[self.project_id]:
            return _AGENT_CACHE[self.project_id][agent_id].get("data")

        # 2. Fall back to PostgreSQL / Supabase
        record = await fetch_agent_output(self.project_id, agent_id)
        return record

    async def get_all_outputs(self) -> dict[str, dict[str, Any]]:
        """Retrieve all latest agent outputs for this project, keyed by section."""
        # 1. Try in-memory cache
        if self.project_id in _AGENT_CACHE and _AGENT_CACHE[self.project_id]:
            result = {}
            for _agent_id, record in _AGENT_CACHE[self.project_id].items():
                result[record["section"]] = record["data"]
            return result

        # 2. Fall back to PostgreSQL / Supabase
        return await fetch_agent_outputs(self.project_id)

    async def get_scoped_outputs(self, agent_id: str) -> dict[str, Any]:
        """Return only the upstream agent outputs that this agent depends on.

        Uses the DEPENDENCIES map to filter, dramatically reducing token count
        for downstream agents.
        """
        deps = DEPENDENCIES.get(agent_id, ())
        if not deps:
            return {}

        all_outputs = await self.get_all_outputs()
        scoped: dict[str, Any] = {}
        for section_key in deps:
            if section_key in all_outputs:
                scoped[section_key] = all_outputs[section_key]

        return scoped

    async def save_quality_score(
        self, agent_id: str, passed: bool, issues: list[str]
    ) -> None:
        """Track quality gate outcomes per agent."""
        await save_quality_record(self.project_id, agent_id, passed, issues)

        if self.project_id not in _QUALITY_CACHE:
            _QUALITY_CACHE[self.project_id] = {}
        _QUALITY_CACHE[self.project_id][agent_id] = {
            "agent_id": agent_id,
            "passed": passed,
            "issues": issues,
        }

    async def get_decision_log(self) -> list[dict[str, Any]]:
        """Retrieve CEO/PM decisions and quality outcomes for this project."""
        if self.project_id in _QUALITY_CACHE:
            return list(_QUALITY_CACHE[self.project_id].values())
        return []
