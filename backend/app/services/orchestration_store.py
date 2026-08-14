"""PostgreSQL-backed job queue and orchestration event replay store."""
from __future__ import annotations

from typing import Any

from app.db.postgres import execute, fetch, fetchrow


async def enqueue(project_id: str, request: dict[str, Any] | None = None) -> int | None:
    row = await fetchrow(
        """INSERT INTO orchestration_jobs(project_id, request)
           VALUES ($1, $2)
           ON CONFLICT (project_id) WHERE status IN ('queued', 'running') DO NOTHING
           RETURNING id""",
        project_id, request or {},
    )
    if row:
        return int(row["id"])
    active = await fetchrow(
        """SELECT id FROM orchestration_jobs
           WHERE project_id=$1 AND status IN ('queued','running')
           ORDER BY created_at DESC LIMIT 1""",
        project_id,
    )
    return int(active["id"]) if active else None


async def claim(worker_id: str, lease_seconds: int) -> tuple[int, str, dict[str, Any]] | None:
    # A process killed mid-run leaves a lease, not a permanently stuck job.
    await execute(
        """UPDATE orchestration_jobs
           SET status='queued', locked_at=NULL, locked_by=NULL, updated_at=NOW(),
               error='Recovered after expired worker lease'
           WHERE status='running' AND locked_at < NOW() - ($1 * INTERVAL '1 second')""",
        lease_seconds,
    )
    row = await fetchrow(
        """WITH candidate AS (
               SELECT id FROM orchestration_jobs
               WHERE status='queued' AND available_at <= NOW()
               ORDER BY created_at
               FOR UPDATE SKIP LOCKED LIMIT 1
           )
           UPDATE orchestration_jobs job
           SET status='running', attempt=attempt+1, locked_at=NOW(),
               locked_by=$1, updated_at=NOW()
           FROM candidate WHERE job.id=candidate.id
           RETURNING job.id, job.project_id, job.request""",
        worker_id,
    )
    return (int(row["id"]), str(row["project_id"]), dict(row["request"])) if row else None


async def finish(job_id: int, status: str, error: str | None = None) -> None:
    await execute(
        """UPDATE orchestration_jobs SET status=$2, error=$3,
                  completed_at=NOW(), updated_at=NOW()
           WHERE id=$1""",
        job_id, status, error,
    )


async def append_event(job_id: int, project_id: str, event: dict[str, Any]) -> int:
    row = await fetchrow(
        """INSERT INTO orchestration_events(job_id, project_id, event_type, payload)
           VALUES ($1,$2,$3,$4) RETURNING id""",
        job_id, project_id, str(event.get("type", "unknown")), event,
    )
    return int(row["id"])


async def latest_job(project_id: str) -> int | None:
    row = await fetchrow(
        "SELECT id FROM orchestration_jobs WHERE project_id=$1 ORDER BY created_at DESC LIMIT 1",
        project_id,
    )
    return int(row["id"]) if row else None


async def events_after(job_id: int, event_id: int = 0, limit: int = 2000) -> list[dict[str, Any]]:
    rows = await fetch(
        """SELECT id, payload FROM orchestration_events
           WHERE job_id=$1 AND id>$2 ORDER BY id LIMIT $3""",
        job_id, event_id, limit,
    )
    events: list[dict[str, Any]] = []
    for row in rows:
        payload = dict(row["payload"])
        payload["event_id"] = int(row["id"])
        events.append(payload)
    return events
