"""Per-agent structured output storage with versioning and scoped retrieval.

Stores each agent's validated output as a versioned JSON record, cached in Redis
for hot reads during a workflow run, and persisted to PostgreSQL for durability.
Downstream agents receive only the upstream sections they depend on, minimizing
token waste and improving context quality.
"""
from __future__ import annotations

import json
from typing import Any

from services.db_client import (
    fetch_agent_output,
    fetch_agent_outputs,
    save_agent_output as db_save_agent_output,
    save_quality_record,
)
from services.redis_client import get_redis
from tools.project_context import DEPENDENCIES
from utils.logging import get_logger

logger = get_logger("memory.agent_store")

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
        self._cache_key = f"agent_store:{project_id}"

    async def save_output(
        self, agent_id: str, section: str, data: dict[str, Any], version: int = 1
    ) -> None:
        """Store an agent's validated output with versioning."""
        # 1. Persist to PostgreSQL
        await db_save_agent_output(self.project_id, self.user_id, agent_id, section, data, version)

        # 2. Cache in Redis for hot reads during the run
        redis = get_redis()
        if redis:
            try:
                payload = json.dumps(
                    {"agent_id": agent_id, "section": section, "version": version, "data": data},
                    default=str,
                )
                await redis.hset(self._cache_key, agent_id, payload)
                await redis.expire(self._cache_key, 86400)  # 24h TTL
            except Exception as exc:
                logger.warning("Failed to cache agent output in Redis: %s", exc)

    async def get_output(self, agent_id: str) -> dict[str, Any] | None:
        """Retrieve the latest output for a specific agent (cache-first)."""
        # 1. Try Redis cache
        redis = get_redis()
        if redis:
            try:
                cached = await redis.hget(self._cache_key, agent_id)
                if cached:
                    record = json.loads(cached)
                    return record.get("data")
            except Exception as exc:
                logger.debug("Redis cache miss for agent %s: %s", agent_id, exc)

        # 2. Fall back to PostgreSQL
        record = await fetch_agent_output(self.project_id, agent_id)
        return record

    async def get_all_outputs(self) -> dict[str, dict[str, Any]]:
        """Retrieve all latest agent outputs for this project, keyed by section."""
        # 1. Try Redis cache
        redis = get_redis()
        if redis:
            try:
                all_cached = await redis.hgetall(self._cache_key)
                if all_cached:
                    result = {}
                    for _agent_id, raw in all_cached.items():
                        record = json.loads(raw)
                        result[record["section"]] = record["data"]
                    return result
            except Exception as exc:
                logger.debug("Redis cache miss for all outputs: %s", exc)

        # 2. Fall back to PostgreSQL
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

        # Cache quality scores in Redis
        redis = get_redis()
        if redis:
            try:
                quality_key = f"quality:{self.project_id}"
                record = json.dumps(
                    {"agent_id": agent_id, "passed": passed, "issues": issues},
                    default=str,
                )
                await redis.hset(quality_key, agent_id, record)
                await redis.expire(quality_key, 86400)
            except Exception as exc:
                logger.debug("Failed to cache quality score: %s", exc)

    async def get_decision_log(self) -> list[dict[str, Any]]:
        """Retrieve CEO/PM decisions and quality outcomes for this project."""
        redis = get_redis()
        if not redis:
            return []
        try:
            quality_key = f"quality:{self.project_id}"
            records = await redis.hgetall(quality_key)
            return [json.loads(v) for v in records.values()] if records else []
        except Exception as exc:
            logger.debug("Failed to read decision log: %s", exc)
            return []
