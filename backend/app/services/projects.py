"""Project service — persistence and event application.

Owns the MongoDB project documents and translates orchestration events into
durable state updates.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from app.core.logging import get_logger
from app.db.mongo import projects
from app.models.project import new_project_doc

logger = get_logger("services.projects")

_MAX_LOGS = 250


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_project(idea: str, title: Optional[str]) -> dict[str, Any]:
    doc = new_project_doc(idea, title)
    await projects().insert_one(dict(doc))
    logger.info("Created project %s", doc["id"])
    doc.pop("_id", None)
    return doc


async def get_project(project_id: str) -> Optional[dict[str, Any]]:
    return await projects().find_one({"id": project_id}, {"_id": 0})


async def list_projects(limit: int = 50) -> list[dict[str, Any]]:
    cursor = (
        projects()
        .find(
            {},
            {"_id": 0, "id": 1, "title": 1, "status": 1, "progress": 1, "created_at": 1, "updated_at": 1},
        )
        .sort("created_at", -1)
        .limit(limit)
    )
    return [doc async for doc in cursor]


async def set_status(
    project_id: str, status: str, *, progress: Optional[int] = None, error: Optional[str] = None
) -> None:
    update: dict[str, Any] = {"status": status, "updated_at": _now()}
    if progress is not None:
        update["progress"] = progress
    if error is not None:
        update["error"] = error
    await projects().update_one({"id": project_id}, {"$set": update})


async def apply_event(project_id: str, event: dict[str, Any]) -> None:
    """Translate a single orchestration event into a Mongo update."""
    etype = event.get("type")
    now = _now()

    if etype == "node_update":
        node = event.get("node")
        if not node:
            return
        await projects().update_one(
            {"id": project_id},
            {
                "$set": {
                    f"orchestration.nodes.{node}.status": event.get("status", "idle"),
                    f"orchestration.nodes.{node}.progress": event.get("progress", 0),
                    "orchestration.current_node": node,
                    "updated_at": now,
                }
            },
        )

    elif etype == "log":
        entry = {
            "agent": event.get("agent"),
            "level": event.get("level", "info"),
            "message": event.get("message", ""),
            "ts": event.get("ts"),
        }
        await projects().update_one(
            {"id": project_id},
            {
                "$push": {"orchestration.logs": {"$each": [entry], "$slice": -_MAX_LOGS}},
                "$set": {"updated_at": now},
            },
        )

    elif etype == "section_complete":
        section = event.get("section")
        if not section:
            return
        await projects().update_one(
            {"id": project_id},
            {"$set": {section: event.get("data"), "updated_at": now}},
        )

    elif etype == "progress":
        await projects().update_one(
            {"id": project_id},
            {"$set": {"progress": event.get("progress", 0), "updated_at": now}},
        )

    elif etype == "error":
        await projects().update_one(
            {"id": project_id},
            {"$set": {"error": event.get("message"), "updated_at": now}},
        )
