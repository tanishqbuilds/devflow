"""PostgreSQL database client for AI Services.

Provides connection pooling and retrieval of authoritative project documents,
previous versions, iteration revisions, and chat history.
"""
from __future__ import annotations

import json
import os
from typing import Any

import asyncpg

from utils.logging import get_logger

logger = get_logger("services.db")

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://devflow:devflow@postgres:5432/devflow"
)
_pool: asyncpg.Pool | None = None


async def get_db_pool() -> asyncpg.Pool | None:
    """Return the global asyncpg connection pool."""
    global _pool
    if _pool is not None:
        return _pool
    try:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
        logger.info("Connected to PostgreSQL database for AI Services")
        return _pool
    except Exception as exc:
        logger.warning("Could not connect to PostgreSQL database: %s", exc)
        return None


async def close_db() -> None:
    """Close the database pool."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Closed PostgreSQL database pool")


async def fetch_project_document(project_id: str) -> dict[str, Any] | None:
    """Fetch the current full project document from PostgreSQL."""
    pool = await get_db_pool()
    if not pool:
        return None
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, user_id, title, status, progress, document, created_at, updated_at "
                "FROM projects WHERE id = $1",
                project_id,
            )
            if not row:
                return None
            doc = row["document"]
            if isinstance(doc, str):
                doc = json.loads(doc)
            return {
                "id": row["id"],
                "user_id": row["user_id"],
                "title": row["title"],
                "status": row["status"],
                "progress": row["progress"],
                "document": doc,
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            }
    except Exception as exc:
        logger.warning("Failed to fetch project %s from DB: %s", project_id, exc)
        return None


async def fetch_project_chat_history(project_id: str, limit: int = 20) -> list[dict[str, Any]]:
    """Fetch recent assistant and user chat history for the project."""
    pool = await get_db_pool()
    if not pool:
        return []
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT kind, role, content, payload, created_at "
                "FROM ai_responses WHERE project_id = $1 AND kind = 'chat' "
                "ORDER BY created_at ASC LIMIT $2",
                project_id,
                limit,
            )
            return [
                {
                    "role": r["role"],
                    "content": r["content"],
                    "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                }
                for r in rows
            ]
    except Exception as exc:
        logger.warning("Failed to fetch chat history for %s: %s", project_id, exc)
        return []


async def save_project_iteration(
    project_id: str,
    user_id: str,
    section: str,
    data: dict[str, Any],
    iteration_label: str = "reiteration",
) -> None:
    """Save an iteration revision snapshot to ai_responses."""
    pool = await get_db_pool()
    if not pool:
        return
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO ai_responses (project_id, user_id, kind, role, content, payload) "
                "VALUES ($1, $2, $3, $4, $5, $6)",
                project_id,
                user_id,
                iteration_label,
                "assistant",
                f"Iteration update for section '{section}'",
                json.dumps(data, default=str),
            )
    except Exception as exc:
        logger.warning("Failed to save iteration snapshot for %s: %s", project_id, exc)
