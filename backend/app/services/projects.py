"""PostgreSQL-backed project persistence and durable AI-response history."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from app.core.logging import get_logger
from app.db.postgres import execute, fetch, fetchrow, pool
from app.models.project import new_project_doc

logger = get_logger("services.projects")
_MAX_LOGS = 250


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_project(idea: str, title: Optional[str], user_id: str, manager_inputs: dict[str,Any] | None = None) -> dict[str, Any]:
    doc = new_project_doc(idea, title, manager_inputs)
    doc["user_id"] = user_id
    workspace_id = await ensure_personal_workspace(user_id)
    doc["workspace_id"] = workspace_id
    doc["revision"] = 0
    await execute(
        """INSERT INTO projects (id, user_id, workspace_id, title, status, progress, document)
           VALUES ($1, $2, $3, $4, $5, $6, $7)""",
        doc["id"], user_id, workspace_id, doc["title"], doc["status"], doc["progress"], doc,
    )
    logger.info("Created project %s for user %s", doc["id"], user_id)
    return doc


async def get_project(project_id: str, user_id: str | None = None) -> Optional[dict[str, Any]]:
    if user_id is None:  # trusted internal orchestration path
        row = await fetchrow("SELECT document FROM projects WHERE id=$1", project_id)
    else:
        row = await fetchrow(
            """SELECT p.document FROM projects p
               LEFT JOIN workspace_members wm ON wm.workspace_id=p.workspace_id AND wm.user_id=$2
               WHERE p.id=$1 AND (p.user_id=$2 OR wm.user_id IS NOT NULL)""", project_id, user_id,
        )
    return dict(row["document"]) if row else None


async def list_projects(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    rows = await fetch(
        """SELECT p.document FROM projects p
           LEFT JOIN workspace_members wm ON wm.workspace_id=p.workspace_id AND wm.user_id=$1
           WHERE p.user_id=$1 OR wm.user_id IS NOT NULL
           ORDER BY p.created_at DESC LIMIT $2""", user_id, limit,
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


async def ensure_personal_workspace(user_id: str) -> str:
    workspace_id = f"personal_{user_id}"
    await execute(
        """INSERT INTO workspaces (id, name, owner_id) VALUES ($1, 'My Workspace', $2)
           ON CONFLICT (id) DO NOTHING""", workspace_id, user_id,
    )
    await execute(
        """INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')
           ON CONFLICT (workspace_id, user_id) DO NOTHING""", workspace_id, user_id,
    )
    return workspace_id

async def ensure_project_workspace(project_id:str,doc:dict[str,Any])->str:
    if doc.get("workspace_id"): return str(doc["workspace_id"])
    workspace_id=await ensure_personal_workspace(doc["user_id"])
    doc["workspace_id"]=workspace_id
    await execute("UPDATE projects SET workspace_id=$2,document=$3 WHERE id=$1",project_id,workspace_id,doc)
    return workspace_id


async def project_role(project_id: str, user_id: str) -> str | None:
    row = await fetchrow(
        """SELECT CASE WHEN p.user_id=$2 THEN 'owner' ELSE wm.role END AS role
           FROM projects p LEFT JOIN workspace_members wm
             ON wm.workspace_id=p.workspace_id AND wm.user_id=$2
           WHERE p.id=$1 AND (p.user_id=$2 OR wm.user_id IS NOT NULL)""", project_id, user_id,
    )
    return str(row["role"]) if row and row["role"] else None


def _set_path(document: dict[str, Any], path: str, value: Any) -> None:
    parts = [part for part in path.strip("/").split("/") if part]
    if not parts or parts[0] in {"id", "user_id", "workspace_id", "revision", "orchestration", "status"}:
        raise ValueError("path is not editable")
    cursor: Any = document
    for part in parts[:-1]:
        key: Any = int(part) if isinstance(cursor, list) else part
        cursor = cursor[key]
    key = int(parts[-1]) if isinstance(cursor, list) else parts[-1]
    cursor[key] = value


async def edit_content(project_id: str, actor_id: str, path: str, value: Any, expected_revision: int | None = None, operation: str = "edit") -> dict[str, Any] | None:
    """Atomically edit any user-facing document field and retain an undo snapshot."""
    async with pool().acquire() as conn:
        await conn.set_type_codec("jsonb", encoder=__import__('json').dumps, decoder=__import__('json').loads, schema="pg_catalog")
        async with conn.transaction():
            row = await conn.fetchrow("SELECT document FROM projects WHERE id=$1 FOR UPDATE", project_id)
            if not row:
                return None
            before = dict(row["document"])
            current_revision = int(before.get("revision", 0))
            if expected_revision is not None and expected_revision != current_revision:
                raise RuntimeError("revision conflict")
            after = __import__('copy').deepcopy(before)
            _set_path(after, path, value)
            after["revision"] = current_revision + 1
            after["updated_at"] = _now()
            await conn.execute(
                """UPDATE projects SET title=$2, document=$3, updated_at=NOW() WHERE id=$1""",
                project_id, after.get("title", before.get("title", "Untitled")), after,
            )
            await conn.execute(
                """INSERT INTO project_revisions
                   (project_id, actor_id, revision, operation, path, before_document, after_document)
                   VALUES ($1,$2,$3,$4,$5,$6,$7)""",
                project_id, actor_id, after["revision"], operation, path, before, after,
            )
            return after


async def undo(project_id: str, actor_id: str) -> dict[str, Any] | None:
    async with pool().acquire() as conn:
        await conn.set_type_codec("jsonb", encoder=__import__('json').dumps, decoder=__import__('json').loads, schema="pg_catalog")
        async with conn.transaction():
            row = await conn.fetchrow("SELECT document FROM projects WHERE id=$1 FOR UPDATE", project_id)
            rev = await conn.fetchrow("SELECT * FROM project_revisions WHERE project_id=$1 ORDER BY revision DESC LIMIT 1", project_id)
            if not row or not rev:
                return None
            current = dict(row["document"])
            restored = dict(rev["before_document"])
            restored["revision"] = int(current.get("revision", 0)) + 1
            restored["updated_at"] = _now()
            await conn.execute("UPDATE projects SET title=$2, document=$3, updated_at=NOW() WHERE id=$1", project_id, restored["title"], restored)
            await conn.execute("DELETE FROM project_revisions WHERE id=$1", rev["id"])
            return restored


async def revision_history(project_id: str, limit: int = 30) -> list[dict[str, Any]]:
    rows = await fetch("SELECT revision, operation, path, actor_id, created_at FROM project_revisions WHERE project_id=$1 ORDER BY revision DESC LIMIT $2", project_id, limit)
    return [dict(row) for row in rows]


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
    elif etype == "run_failed":
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
