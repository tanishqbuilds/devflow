"""Workspace membership, role, and expiring invitation persistence."""
from __future__ import annotations

import secrets
import uuid
from typing import Any

from app.db.postgres import execute, fetch, fetchrow


async def create(name: str, owner_id: str) -> dict[str, Any]:
    wid = uuid.uuid4().hex
    await execute("INSERT INTO workspaces (id,name,owner_id) VALUES ($1,$2,$3)", wid, name, owner_id)
    await execute("INSERT INTO workspace_members (workspace_id,user_id,role) VALUES ($1,$2,'owner')", wid, owner_id)
    return await get(wid, owner_id) or {}


async def get(workspace_id: str, user_id: str) -> dict[str, Any] | None:
    row = await fetchrow(
        """SELECT w.id,w.name,w.owner_id,wm.role,w.created_at FROM workspaces w
           JOIN workspace_members wm ON wm.workspace_id=w.id
           WHERE w.id=$1 AND wm.user_id=$2""", workspace_id, user_id,
    )
    return dict(row) if row else None


async def list_for_user(user_id: str) -> list[dict[str, Any]]:
    rows = await fetch("""SELECT w.id,w.name,w.owner_id,wm.role,w.created_at FROM workspaces w
      JOIN workspace_members wm ON wm.workspace_id=w.id WHERE wm.user_id=$1 ORDER BY w.created_at""", user_id)
    return [dict(row) for row in rows]


async def members(workspace_id: str) -> list[dict[str, Any]]:
    rows = await fetch("""SELECT u.clerk_user_id AS user_id,u.email,u.first_name,u.last_name,u.image_url,wm.role,wm.joined_at
      FROM workspace_members wm JOIN users u ON u.clerk_user_id=wm.user_id
      WHERE wm.workspace_id=$1 ORDER BY wm.joined_at""", workspace_id)
    return [dict(row) for row in rows]


async def invite(workspace_id: str, role: str, creator: str, hours: int = 168) -> dict[str, Any]:
    token = secrets.token_urlsafe(32)
    row = await fetchrow("""INSERT INTO workspace_invites(token,workspace_id,role,created_by,expires_at)
      VALUES($1,$2,$3,$4,NOW()+($5 * INTERVAL '1 hour')) RETURNING token,workspace_id,role,expires_at""",
      token, workspace_id, role, creator, hours)
    return dict(row) if row else {}


async def accept(token: str, user_id: str) -> dict[str, Any] | None:
    invite_row = await fetchrow("""UPDATE workspace_invites SET accepted_by=$2,accepted_at=NOW()
      WHERE token=$1 AND accepted_at IS NULL AND expires_at>NOW() RETURNING workspace_id,role""", token, user_id)
    if not invite_row:
        return None
    await execute("""INSERT INTO workspace_members(workspace_id,user_id,role) VALUES($1,$2,$3)
      ON CONFLICT(workspace_id,user_id) DO UPDATE SET role=EXCLUDED.role""",
      invite_row["workspace_id"], user_id, invite_row["role"])
    return await get(invite_row["workspace_id"], user_id)


async def set_role(workspace_id: str, target_user: str, role: str) -> bool:
    result = await execute("UPDATE workspace_members SET role=$3 WHERE workspace_id=$1 AND user_id=$2 AND role<>'owner'", workspace_id, target_user, role)
    return result.endswith("1")
