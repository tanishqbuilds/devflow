"""Project memory and durable context store for Devflow agents."""
from __future__ import annotations

import json
from typing import Any

from memory.agent_store import AgentStore
from services.db_client import fetch_project_chat_history, fetch_project_document, save_project_iteration
from services.redis_client import get_redis
from utils.logging import get_logger

logger = get_logger("memory.project")


class ProjectMemory:
    """Manages persistent project memory, past iterations, decisions, and chat context."""

    def __init__(self, project_id: str, user_id: str | None = None):
        self.project_id = project_id
        self.user_id = user_id or "system"
        self._memory_key = f"project_memory:{project_id}"
        self._iteration_key = f"project_iterations:{project_id}"
        self.agent_store = AgentStore(project_id, self.user_id)

    async def get_previous_project_context(self) -> dict[str, Any]:
        """Retrieve the authoritative prior database state of the project for iterations."""
        # 1. Try PostgreSQL document
        db_proj = await fetch_project_document(self.project_id)
        if db_proj and db_proj.get("document"):
            doc = db_proj["document"]
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

        # 2. Fallback to Redis cache
        redis = get_redis()
        if redis:
            try:
                cached = await redis.get(f"project_doc:{self.project_id}")
                if cached:
                    return json.loads(cached)
            except Exception as exc:
                logger.debug("Redis memory lookup fallback: %s", exc)

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
        redis = get_redis()
        entry = {
            "agent_id": agent_id,
            "topic": topic,
            "decision": decision,
        }
        if redis:
            try:
                await redis.rpush(self._memory_key, json.dumps(entry, default=str))
                await redis.expire(self._memory_key, 86400 * 7)  # 7 days retention
            except Exception as exc:
                logger.warning("Failed to save decision to Redis: %s", exc)

    async def save_iteration_diff(self, section: str, data: dict[str, Any]) -> None:
        """Store a versioned iteration diff in both PostgreSQL and Redis."""
        # Save to PostgreSQL
        await save_project_iteration(self.project_id, self.user_id, section, data)

        # Cache snapshot in Redis
        redis = get_redis()
        if redis:
            try:
                await redis.hset(self._iteration_key, section, json.dumps(data, default=str))
                await redis.expire(self._iteration_key, 86400 * 7)
            except Exception as exc:
                logger.warning("Failed to cache iteration snapshot in Redis: %s", exc)

    async def get_history(self) -> list[dict[str, Any]]:
        """Retrieve all recorded decisions for this project."""
        redis = get_redis()
        if not redis:
            return []
        try:
            records = await redis.lrange(self._memory_key, 0, -1)
            return [json.loads(r) for r in records if r]
        except Exception as exc:
            logger.warning("Failed to read memory from Redis: %s", exc)
            return []
