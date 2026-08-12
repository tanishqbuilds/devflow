"""WebSocket streaming of orchestration events to the browser.

On connect the client receives a full snapshot, then the buffered event history
(so a late joiner sees the whole run), then live events. Events carry a
monotonic ``seq`` which is used to de-duplicate across the buffer/live boundary.
"""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.auth import websocket_user
from app.core.logging import get_logger
from app.services.event_bus import event_bus
from app.services import projects as project_service

logger = get_logger("api.stream")
router = APIRouter()


@router.websocket("/projects/{project_id}/stream")
async def stream(websocket: WebSocket, project_id: str) -> None:
    try:
        user = await websocket_user(websocket)
    except Exception:
        await websocket.close(code=4401, reason="Authentication required")
        return
    await websocket.accept()

    doc = await project_service.get_project(project_id, user.id)
    if not doc:
        await websocket.send_json({"type": "error", "message": "project not found"})
        await websocket.close(code=4404)
        return

    # 1. Full snapshot so the client can render immediately.
    await websocket.send_json({"type": "snapshot", "project": doc})

    max_seq = 0
    try:
        # 2. Replay buffered events (subscribed first, so nothing is lost).
        buffered = event_bus.get_buffer(project_id)
        for event in buffered:
            max_seq = max(max_seq, int(event.get("seq", 0)))
            await websocket.send_json(event)

        # If the run already finished, no live events will arrive.
        if doc.get("status") in ("complete", "failed"):
            await websocket.send_json({"type": "stream_end"})
            return

        # 3. Stream live events from in-memory event bus
        async for event in event_bus.subscribe(project_id):
            seq = int(event.get("seq", 0))
            if seq > 0 and seq <= max_seq:
                continue
            max_seq = max(max_seq, seq)
            await websocket.send_json(event)
            if event.get("type") in ("run_complete", "run_failed"):
                await websocket.send_json({"type": "stream_end"})
                break

    except WebSocketDisconnect:
        logger.info("Client disconnected from %s stream", project_id)
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("Error in stream for project %s", project_id)
