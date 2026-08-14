"""Orchestration manager.

Responsibilities:
* Enqueue analysis jobs into a durable PostgreSQL queue.
* Run background worker(s) that pop jobs and drive the workflow.
* Stream events directly from ai-services over HTTP, persist them to
  PostgreSQL / Supabase, and expose them to replica-safe WebSocket polling.
"""
from __future__ import annotations

import asyncio
import json
import os
import socket
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.services import projects as project_service
from app.services import orchestration_store
from app.services.ai_client import ai_services

logger = get_logger("orchestrator")

_workers: list[asyncio.Task] = []
_shutdown = asyncio.Event()
_DURABLE_EVENT_TYPES = {
    "section_complete",
    "error",
    "run_failed",
}


async def enqueue_analysis(project_id: str, target_agents: list[str] | None = None) -> None:
    job_id = await orchestration_store.enqueue(
        project_id, {"target_agents": target_agents or []}
    )
    logger.info("Enqueued analysis job %s for project %s", job_id, project_id)


async def _consume_run(
    project_id: str, job_id: int, target_agents: list[str] | None = None
) -> None:
    """Stream events from ai-services, buffer in memory, and persist to database."""
    deadline = asyncio.get_event_loop().time() + settings.run_timeout_seconds
    attempt = 0
    inputs_ready = False
    idea, title = "", None

    while not _shutdown.is_set():
        try:
            idea, title = await _project_inputs(project_id)
            inputs_ready = True
            break
        except Exception as exc:
            logger.error("Failed to load project inputs for %s: %s", project_id, exc)
            await project_service.set_status(project_id, "failed", error=f"Project inputs error: {exc}")
            await orchestration_store.finish(job_id, "failed", f"Project inputs error: {exc}")
            return

    if not inputs_ready:
        return

    while not _shutdown.is_set():
        try:
            attempt += 1
            logger.info("Connecting to AI service stream for project %s (attempt %d)", project_id, attempt)
            stream = (
                ai_services.stream_retry(project_id, idea, title, target_agents)
                if target_agents else ai_services.stream_workflow(project_id, idea, title)
            )
            stream_started = False
            async for event in stream:
                if _shutdown.is_set():
                    break

                if not stream_started:
                    await project_service.set_status(project_id, "running", error=None)
                    stream_started = True

                # Persist every event in the current durable job stream. WebSocket
                # clients may be connected to any backend replica and poll by id.
                await orchestration_store.append_event(job_id, project_id, event)

                # Live node/log events already live in the append-only event log.
                # Apply only state that must survive a
                # process restart; writing the full JSONB document for every
                # log line makes the cloud-database round trips lag minutes
                # behind the live workflow.
                if event.get("type") in _DURABLE_EVENT_TYPES:
                    await project_service.apply_event(project_id, event)

                if event.get("type") == "run_complete":
                    await project_service.set_status(project_id, "complete", progress=100, error=None)
                    await orchestration_store.finish(job_id, "complete")
                    logger.info("Run %s complete", project_id)
                    return
                if event.get("type") == "run_failed":
                    missing = ", ".join(event.get("missing_sections") or [])
                    await project_service.set_status(
                        project_id, "failed", error=f"Incomplete AI output: {missing}"
                    )
                    logger.error("Run %s incomplete: %s", project_id, missing)
                    await orchestration_store.finish(job_id, "failed", f"Incomplete AI output: {missing}")
                    return

            # An NDJSON stream is authoritative only when it emits an explicit
            # terminal event. A proxy disconnect or crashed AI worker can end
            # the response without raising in the HTTP client.
            error = "AI workflow stream ended without a terminal event"
            await project_service.set_status(project_id, "failed", error=error)
            await orchestration_store.finish(job_id, "failed", error)
            logger.error("%s for project %s", error, project_id)
            return

        except Exception as exc:
            if asyncio.get_event_loop().time() >= deadline:
                logger.error("AI service recovery deadline exceeded for %s: %s", project_id, exc)
                await project_service.set_status(project_id, "failed", error="AI service recovery deadline exceeded")
                await orchestration_store.finish(job_id, "failed", "AI service recovery deadline exceeded")
                return

            delay = min(15.0, 2 ** min(attempt, 4))
            logger.warning(
                "AI service stream error for %s (attempt %d); retrying in %.0fs: %s",
                project_id,
                attempt,
                delay,
                exc,
            )
            await project_service.set_status(
                project_id, "queued", error=f"AI service reconnecting (attempt {attempt})"
            )
            await asyncio.sleep(delay)


async def _project_inputs(project_id: str) -> tuple[str, str | None]:
    doc = await project_service.get_project(project_id)
    if not doc:
        raise RuntimeError(f"project {project_id} not found")
    inputs = doc.get("manager_inputs") or {}
    enriched = doc["idea"]
    if inputs:
        enriched += "\n\nMANAGER-PROVIDED DELIVERY CONSTRAINTS (authoritative):\n" + json.dumps(inputs)
    return enriched, doc.get("title")


async def _worker(worker_id: int) -> None:
    worker_name = f"{socket.gethostname()}:{os.getpid()}:{worker_id}"
    logger.info("Orchestrator worker %s online", worker_name)
    while not _shutdown.is_set():
        claimed: tuple[int, str, dict[str, Any]] | None = None
        try:
            claimed = await orchestration_store.claim(worker_name, settings.run_timeout_seconds + 300)
            if claimed is None:
                await asyncio.sleep(1)
                continue
            job_id, project_id, request = claimed
            logger.info("Worker %d picked up project %s", worker_id, project_id)
            await project_service.set_status(project_id, "running", progress=0)
            await _consume_run(
                project_id, job_id, list(request.get("target_agents") or [])
            )
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.exception("Worker %d encountered an error", worker_id)
            if claimed is not None:
                await orchestration_store.finish(claimed[0], "failed", str(exc)[:500])
            await asyncio.sleep(1)
    logger.info("Orchestrator worker %s stopped", worker_name)


def start_workers() -> None:
    _shutdown.clear()
    for i in range(max(1, settings.worker_count)):
        _workers.append(asyncio.create_task(_worker(i + 1)))


async def stop_workers() -> None:
    _shutdown.set()
    for task in _workers:
        task.cancel()
    for task in _workers:
        try:
            await task
        except (asyncio.CancelledError, Exception):
            pass
    _workers.clear()
