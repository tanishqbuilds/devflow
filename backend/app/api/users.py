"""Users REST API."""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services import users as user_service
from app.core.logging import get_logger
from app.core.auth import CurrentUser, current_user

logger = get_logger("api.users")
router = APIRouter(prefix="/users", tags=["users"])

class SyncUserRequest(BaseModel):
    clerk_id: str
    email: str
    first_name: str
    last_name: str
    image_url: str

@router.post("/sync")
async def sync_user(req: SyncUserRequest, current: CurrentUser=Depends(current_user)) -> dict[str, Any]:
    """Upsert a user from the frontend and return their DB profile (including role)."""
    try:
        user = await user_service.upsert_user(
            current.id, req.email, req.first_name, req.last_name, req.image_url
        )
        return user
    except Exception as exc:
        logger.error("Failed to sync user: %s", exc)
        raise HTTPException(status_code=500, detail="Could not sync user")

@router.get("")
async def list_users(current: CurrentUser=Depends(current_user)) -> dict[str, Any]:
    """List all users for task assignment dropdowns."""
    try:
        users = await user_service.list_users()
        return {"users": users}
    except Exception as exc:
        logger.error("Failed to list users: %s", exc)
        raise HTTPException(status_code=500, detail="Could not fetch users")
