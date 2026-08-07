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

async def list_users() -> list[dict[str, Any]]:
    rows = await fetch("SELECT clerk_user_id as id, email, first_name, last_name, image_url, role FROM users ORDER BY first_name ASC, email ASC")
    return [dict(r) for r in rows]
