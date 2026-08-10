"""Orchestration event emission.

The workflow engine publishes events to a Redis pub/sub channel
(``events:{project_id}``) as it runs. The backend subscribes to this channel to
(a) persist section outputs to PostgreSQL and (b) relay events to the browser over
WebSockets. Events also carry a monotonically increasing ``seq`` for ordering.
"""
from __future__ import annotations

import json
import time
from typing import Any

import redis.asyncio as aioredis

from utils.logging import get_logger

logger = get_logger("workflow.events")


def channel_for(project_id: str) -> str:
    return f"events:{project_id}"


class EventEmitter:
    def __init__(self, redis: aioredis.Redis, project_id: str):
        self._redis = redis
        self._project_id = project_id
        self._channel = channel_for(project_id)
        self._seq = 0

    async def _publish(self, event: dict[str, Any]) -> None:
        self._seq += 1
        event.update(
            {
                "project_id": self._project_id,
                "seq": self._seq,
                "ts": round(time.time(), 3),
            }
        )
        try:
            await self._redis.publish(self._channel, json.dumps(event))
        except Exception as exc:  # never let telemetry break the run
            logger.error("Failed to publish event %s: %s", event.get("type"), exc)

    async def run_started(self, agents: list[dict[str, Any]]) -> None:
        await self._publish({"type": "run_started", "agents": agents})

    async def node_update(self, node: str, status: str, progress: int, label: str = "") -> None:
        await self._publish(
            {"type": "node_update", "node": node, "status": status, "progress": progress, "label": label}
        )

    async def log(self, agent: str, message: str, level: str = "info") -> None:
        await self._publish({"type": "log", "agent": agent, "level": level, "message": message})

    async def section_complete(self, agent: str, section: str, node: str, data: dict[str, Any]) -> None:
        await self._publish(
            {"type": "section_complete", "agent": agent, "section": section, "node": node, "data": data}
        )

    async def progress(self, value: int) -> None:
        await self._publish({"type": "progress", "progress": value})

    async def run_complete(self) -> None:
        await self._publish({"type": "run_complete", "progress": 100})

    async def error(self, node: str, agent: str, message: str) -> None:
        await self._publish({"type": "error", "node": node, "agent": agent, "message": message})

    async def supervisor_review(self, round_num: int, passed: bool, assessment: str, directives_count: int = 0) -> None:
        await self._publish({
            "type": "supervisor_review",
            "round": round_num,
            "passed": passed,
            "assessment": assessment,
            "directives_count": directives_count,
        })

    async def supervisor_directive(self, agent_id: str, reason: str, round_num: int) -> None:
        await self._publish({
            "type": "supervisor_directive",
            "agent": agent_id,
            "reason": reason,
            "round": round_num,
        })

    async def quality_score(self, agent_id: str, passed: bool, issues: list[str]) -> None:
        await self._publish({
            "type": "quality_score",
            "agent": agent_id,
            "passed": passed,
            "issues": issues,
        })
