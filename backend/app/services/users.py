"""User management service."""
from typing import Any, Optional
from app.db.postgres import execute, fetch, fetchrow

async def upsert_user(
    clerk_id: str,
    email: str,
    first_name: str,
    last_name: str,
    image_url: str,
    role: str = "developer"
) -> dict[str, Any]:
    # Check if user exists to preserve their role if they are already an admin/manager.
    existing = await fetchrow("SELECT * FROM users WHERE clerk_user_id = $1", clerk_id)
    if existing:
        await execute(
            """UPDATE users SET email=$2, first_name=$3, last_name=$4, image_url=$5, updated_at=NOW()
               WHERE clerk_user_id = $1""",
            clerk_id, email, first_name, last_name, image_url
        )
        return dict(existing)
    
    # If it's a new user, insert them with the requested default role
    await execute(
        """INSERT INTO users (clerk_user_id, email, first_name, last_name, image_url, role)
           VALUES ($1, $2, $3, $4, $5, $6)""",
        clerk_id, email, first_name, last_name, image_url, role
    )
    new_user = await fetchrow("SELECT * FROM users WHERE clerk_user_id = $1", clerk_id)
    return dict(new_user) if new_user else {}

async def list_users(requesting_user_id: str) -> list[dict[str, Any]]:
    """List only users who share at least one workspace with the caller."""
    rows = await fetch(
        """SELECT DISTINCT u.clerk_user_id AS id, u.email, u.first_name,
                  u.last_name, u.image_url, u.role
           FROM workspace_members mine
           JOIN workspace_members peer ON peer.workspace_id=mine.workspace_id
           JOIN users u ON u.clerk_user_id=peer.user_id
           WHERE mine.user_id=$1
           ORDER BY u.first_name ASC, u.email ASC""",
        requesting_user_id,
    )
    return [dict(r) for r in rows]
