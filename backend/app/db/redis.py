"""Redis access layer — used for the orchestration job queue, the pub/sub event
channel, and the per-project durable event buffer (for WebSocket replay)."""
from __future__ import annotations

import redis.asyncio as aioredis

from app.core.config import settings

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
    return _redis


def event_channel(project_id: str) -> str:
    return f"events:{project_id}"


def event_buffer_key(project_id: str) -> str:
    return f"events:{project_id}:buffer"


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
