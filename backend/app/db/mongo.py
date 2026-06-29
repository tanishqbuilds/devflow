"""MongoDB access layer.

Stores the canonical project documents (executive summary, requirements,
architecture, backlog, risks, team, cost, timeline, integrations) plus the
live orchestration state.
"""
from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("db.mongo")

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_url, serverSelectionTimeoutMS=5000)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongo_db]


def projects():
    return get_db()["projects"]


async def init_indexes() -> None:
    try:
        await projects().create_index("id", unique=True)
        await projects().create_index("created_at")
        logger.info("Mongo indexes ensured")
    except Exception as exc:  # non-fatal — app can still serve
        logger.warning("Could not ensure Mongo indexes: %s", exc)


async def close_mongo() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
