"""Durable provenance for orchestration runs, retrieval, tools, and quality gates."""
from __future__ import annotations

import json
import time
import uuid
from typing import Any

from services.db_client import get_db_pool
from utils.logging import get_logger

logger = get_logger("services.run_trace")


async def start_run(project_id: str, trigger: str, inputs: dict[str, Any]) -> str | None:
    pool = await get_db_pool()
    if not pool:
        return None
    run_id = uuid.uuid4().hex
    async with pool.acquire() as conn:
        result = await conn.execute(
            """INSERT INTO agent_runs(id, workspace_id, project_id, trigger, input)
               SELECT $1, workspace_id, id, $3, $4::jsonb
               FROM projects WHERE id=$2 AND workspace_id IS NOT NULL""",
            run_id, project_id, trigger, json.dumps(inputs, default=str),
        )
    if result != "INSERT 0 1":
        logger.warning("Could not create agent run for project %s", project_id)
        return None
    return run_id


async def finish_run(
    run_id: str | None,
    status: str,
    *,
    output_summary: dict[str, Any] | None = None,
    metrics: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    if not run_id:
        return
    pool = await get_db_pool()
    if not pool:
        return
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE agent_runs SET status=$2, output_summary=$3::jsonb,
                       metrics=$4::jsonb, error=$5, completed_at=NOW()
               WHERE id=$1""",
            run_id, status, json.dumps(output_summary or {}, default=str),
            json.dumps(metrics or {}, default=str), error,
        )


async def record_step(
    run_id: str | None,
    agent_id: str,
    phase: str,
    status: str,
    *,
    tool_name: str | None = None,
    input_context: dict[str, Any] | None = None,
    output: dict[str, Any] | None = None,
    started_at: float | None = None,
) -> None:
    if not run_id:
        return
    pool = await get_db_pool()
    if not pool:
        return
    duration_ms = max(0, int((time.monotonic() - started_at) * 1000)) if started_at else None
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO agent_run_steps
                       (run_id, agent_id, phase, status, tool_name, input_context, output, duration_ms)
                   VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)""",
                run_id, agent_id, phase, status, tool_name,
                json.dumps(input_context or {}, default=str),
                json.dumps(output or {}, default=str), duration_ms,
            )
    except Exception as exc:
        # Provenance should improve the run, never become a new failure mode.
        logger.warning("Could not persist %s/%s trace: %s", agent_id, phase, exc)


async def fetch_run_summary(project_id: str, limit: int = 10) -> list[dict[str, Any]]:
    pool = await get_db_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT r.id, r.trigger, r.status, r.input, r.output_summary, r.metrics,
                      r.error, r.started_at, r.completed_at,
                      count(s.id)::int AS step_count
               FROM agent_runs r LEFT JOIN agent_run_steps s ON s.run_id=r.id
               WHERE r.project_id=$1
               GROUP BY r.id ORDER BY r.started_at DESC LIMIT $2""",
            project_id, limit,
        )
    return [dict(row) for row in rows]
