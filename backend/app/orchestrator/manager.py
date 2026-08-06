"""Orchestration manager.

Responsibilities:
* Enqueue analysis jobs onto a Redis queue.
* Run background worker(s) that pop jobs and drive the workflow.
* Subscribe to the per-project event channel published by ai-services, persist
  every event to PostgreSQL, and append it to a durable Redis buffer so that
  late-joining WebSocket clients can replay the full run.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.db.redis import event_buffer_key, event_channel, get_redis
from app.services import projects as project_service
from app.services.ai_client import ai_services

logger = get_logger("orchestrator")

_workers: list[asyncio.Task] = []
_shutdown = asyncio.Event()


async def enqueue_analysis(project_id: str) -> None:
    redis = get_redis()
    await redis.lpush(settings.analyze_queue, project_id)
    logger.info("Enqueued analysis job for project %s", project_id)


async def _buffer_event(redis, project_id: str, raw: str) -> None:
    key = event_buffer_key(project_id)
    await redis.rpush(key, raw)
    await redis.ltrim(key, -2000, -1)
    await redis.expire(key, settings.event_buffer_ttl_seconds)


async def _consume_run(project_id: str) -> None:
    """Subscribe to the project's event channel and persist events until the run
    completes or times out."""
    redis = get_redis()
    pubsub = redis.pubsub()
    channel = event_channel(project_id)
    await pubsub.subscribe(channel)

    # Trigger the AI workflow only after we're subscribed, so no early events are lost.
    try:
        await ai_services.run_workflow(project_id, *await _project_inputs(project_id))
    except Exception as exc:
        logger.error("Failed to start workflow for %s: %s", project_id, exc)
        await project_service.set_status(project_id, "failed", error=f"AI services unreachable: {exc}")
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()
        return

    deadline = asyncio.get_event_loop().time() + settings.run_timeout_seconds
    try:
        while not _shutdown.is_set():
            remaining = deadline - asyncio.get_event_loop().time()
            if remaining <= 0:
                logger.warning("Run %s timed out", project_id)
                await project_service.set_status(project_id, "failed", error="orchestration timed out")
                break

            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=min(remaining, 5.0))
            if message is None:
                continue

            raw = message.get("data")
            if not raw:
                continue
            try:
                event = json.loads(raw)
            except (TypeError, ValueError):
                continue

            await _buffer_event(redis, project_id, raw)
            await project_service.apply_event(project_id, event)

            if event.get("type") == "run_complete":
                await project_service.set_status(project_id, "complete", progress=100)
                logger.info("Run %s complete", project_id)
                break
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()


async def _project_inputs(project_id: str) -> tuple[str, str | None]:
    doc = await project_service.get_project(project_id)
    if not doc:
        raise RuntimeError(f"project {project_id} not found")
    return doc["idea"], doc.get("title")


async def _worker(worker_id: int) -> None:
    redis = get_redis()
    logger.info("Orchestrator worker %d online", worker_id)
    while not _shutdown.is_set():
        try:
            popped = await redis.brpop(settings.analyze_queue, timeout=2)
            if popped is None:
                continue
            _, project_id = popped
            logger.info("Worker %d picked up project %s", worker_id, project_id)
            await project_service.set_status(project_id, "running", progress=0)
            await _consume_run(project_id)
        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("Worker %d encountered an error", worker_id)
            await asyncio.sleep(1)
    logger.info("Orchestrator worker %d stopped", worker_id)


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
