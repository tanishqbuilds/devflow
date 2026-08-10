"""PostgreSQL-backed project persistence and durable AI-response history."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from app.core.logging import get_logger
from app.db.postgres import execute, fetch, fetchrow
from app.models.project import new_project_doc

logger = get_logger("services.projects")
_MAX_LOGS = 250


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_project(idea: str, title: Optional[str], user_id: str) -> dict[str, Any]:
    doc = new_project_doc(idea, title)
    doc["user_id"] = user_id
    await execute(
        """INSERT INTO projects (id, user_id, title, status, progress, document)
           VALUES ($1, $2, $3, $4, $5, $6)""",
        doc["id"], user_id, doc["title"], doc["status"], doc["progress"], doc,
    )
    logger.info("Created project %s for user %s", doc["id"], user_id)
    return doc


async def get_project(project_id: str, user_id: str | None = None) -> Optional[dict[str, Any]]:
    # In collaborative MVP, all users can see all projects.
    row = await fetchrow("SELECT document FROM projects WHERE id=$1", project_id)
    return dict(row["document"]) if row else None


async def list_projects(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    # In collaborative MVP, all users can see all projects.
    rows = await fetch(
        """SELECT document FROM projects
           ORDER BY created_at DESC LIMIT $1""",
        limit,
    )
    keys = ("id", "title", "status", "progress", "created_at", "updated_at")
    return [{key: row["document"].get(key) for key in keys} for row in rows]


async def _save_doc(project_id: str, doc: dict[str, Any]) -> None:
    await execute(
        """UPDATE projects SET title=$2, status=$3, progress=$4, document=$5,
           updated_at=NOW() WHERE id=$1""",
        project_id, doc["title"], doc["status"], doc["progress"], doc,
    )


async def set_status(
    project_id: str, status: str, *, progress: Optional[int] = None, error: Optional[str] = None
) -> None:
    doc = await get_project(project_id)
    if not doc:
        return
    doc["status"] = status
    doc["updated_at"] = _now()
    if progress is not None:
        doc["progress"] = progress
    if error is not None:
        doc["error"] = error
    await _save_doc(project_id, doc)


async def update_section(project_id: str, section: str, data: Any) -> bool:
    doc = await get_project(project_id)
    if not doc:
        return False
    doc[section] = data
    doc["updated_at"] = _now()
    await _save_doc(project_id, doc)
    return True


async def add_ai_response(
    project_id: str,
    user_id: str,
    kind: str,
    *,
    role: str = "assistant",
    content: str | None = None,
    payload: Any = None,
) -> None:
    await execute(
        """INSERT INTO ai_responses (project_id, user_id, kind, role, content, payload)
           VALUES ($1, $2, $3, $4, $5, $6)""",
        project_id, user_id, kind, role, content, payload,
    )


async def apply_event(project_id: str, event: dict[str, Any]) -> None:
    doc = await get_project(project_id)
    if not doc:
        return
    etype = event.get("type")
    now = _now()
    if etype == "node_update" and event.get("node"):
        node = event["node"]
        doc["orchestration"]["nodes"][node].update(
            status=event.get("status", "idle"), progress=event.get("progress", 0)
        )
        doc["orchestration"]["current_node"] = node
    elif etype == "log":
        doc["orchestration"]["logs"] = (doc["orchestration"]["logs"] + [{
            "agent": event.get("agent"), "level": event.get("level", "info"),
            "message": event.get("message", ""), "ts": event.get("ts"),
        }])[-_MAX_LOGS:]
    elif etype == "section_complete" and event.get("section"):
        section = event["section"]
        doc[section] = event.get("data")
        await add_ai_response(
            project_id, doc["user_id"], f"section:{section}", payload=event.get("data")
        )
    elif etype == "progress":
        doc["progress"] = event.get("progress", 0)
    elif etype == "error":
        doc["error"] = event.get("message")
    elif etype == "supervisor_review":
        await add_ai_response(
            project_id, doc["user_id"], "supervisor_review", payload=event
        )
    elif etype == "supervisor_directive":
        await add_ai_response(
            project_id, doc["user_id"], "supervisor_directive", payload=event
        )
    else:
        return
    doc["updated_at"] = now
    await _save_doc(project_id, doc)
