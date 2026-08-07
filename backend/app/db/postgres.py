"""PostgreSQL pool and schema for users, projects, and durable AI output."""
from __future__ import annotations

import json
from typing import Any

import asyncpg

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("db.postgres")
_pool: asyncpg.Pool | None = None

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    clerk_user_id TEXT PRIMARY KEY,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    image_url TEXT,
    role TEXT NOT NULL DEFAULT 'developer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'developer';
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    document JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS projects_user_created_idx ON projects(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS ai_responses (
    id BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'assistant',
    content TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ai_responses_project_created_idx
    ON ai_responses(project_id, created_at ASC);
"""


async def init_postgres() -> None:
    global _pool
    _pool = await asyncpg.create_pool(settings.database_url, min_size=1, max_size=10)
    async with _pool.acquire() as conn:
        await conn.set_type_codec("jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
        await conn.execute(SCHEMA)
    logger.info("PostgreSQL schema ensured")


def pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("PostgreSQL has not been initialized")
    return _pool


async def fetchrow(query: str, *args: Any) -> asyncpg.Record | None:
    async with pool().acquire() as conn:
        await conn.set_type_codec("jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
        return await conn.fetchrow(query, *args)


async def fetch(query: str, *args: Any) -> list[asyncpg.Record]:
    async with pool().acquire() as conn:
        await conn.set_type_codec("jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
        return await conn.fetch(query, *args)


async def execute(query: str, *args: Any) -> str:
    async with pool().acquire() as conn:
        await conn.set_type_codec("jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
        return await conn.execute(query, *args)


async def close_postgres() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
