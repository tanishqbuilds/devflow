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
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);
CREATE TABLE IF NOT EXISTS workspace_invites (
    token TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    created_by TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_by TEXT REFERENCES users(clerk_user_id),
    accepted_at TIMESTAMPTZ
);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS projects_user_created_idx ON projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_workspace_created_idx ON projects(workspace_id, created_at DESC);
CREATE TABLE IF NOT EXISTS project_revisions (
    id BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    revision INTEGER NOT NULL,
    operation TEXT NOT NULL,
    path TEXT,
    before_document JSONB NOT NULL,
    after_document JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, revision)
);
CREATE INDEX IF NOT EXISTS project_revisions_project_idx ON project_revisions(project_id, revision DESC);
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


import ssl
import urllib.parse

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("db.postgres")
_pool: asyncpg.Pool | None = None


def _prepare_dsn_and_ssl(dsn: str) -> tuple[str, Any]:
    url = dsn.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]

    parsed = urllib.parse.urlparse(url)
    query_params = urllib.parse.parse_qs(parsed.query)
    ssl_mode = query_params.get("sslmode", [None])[0]

    # Strip sslmode parameter from query if present for asyncpg compatibility
    if "sslmode" in query_params:
        clean_query = urllib.parse.urlencode(
            {k: v for k, v in query_params.items() if k != "sslmode"}, doseq=True
        )
        url = urllib.parse.urlunparse(parsed._replace(query=clean_query))

    ssl_arg = None
    if ssl_mode in ("require", "verify-ca", "verify-full"):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ssl_arg = ctx
    elif ssl_mode == "disable":
        ssl_arg = None
    elif parsed.hostname and parsed.hostname not in ("localhost", "127.0.0.1", "postgres"):
        # Cloud/Supabase hosts require SSL
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ssl_arg = ctx

    return url, ssl_arg


async def init_postgres() -> None:
    global _pool
    clean_dsn, ssl_ctx = _prepare_dsn_and_ssl(settings.database_url)
    kwargs: dict[str, Any] = {"min_size": 1, "max_size": 10, "statement_cache_size": 0}
    if ssl_ctx is not None:
        kwargs["ssl"] = ssl_ctx

    _pool = await asyncpg.create_pool(clean_dsn, **kwargs)
    async with _pool.acquire() as conn:
        await conn.set_type_codec("jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
        await conn.execute(SCHEMA)
    logger.info("PostgreSQL / Supabase schema ensured")


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
