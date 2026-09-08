from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import CurrentUser, current_user
from app.services import rbac

router = APIRouter(tags=["rbac"])

class InviteRequest(BaseModel):
    email: str = Field(..., max_length=100)
    role: str = Field(pattern="^(manager|developer|tester)$")
    specialization: Optional[str] = Field(default=None, max_length=50)

class RoleUpdateRequest(BaseModel):
    role: str = Field(pattern="^(manager|developer|tester)$")
    specialization: Optional[str] = Field(default=None, max_length=50)

class GlobalRoleRequest(BaseModel):
    role: str = Field(pattern="^(manager|developer|tester)$")
    specialization: Optional[str] = Field(default=None, max_length=50)


async def _require_manager(project_id: str, user_id: str):
    if not await rbac.check_project_permission(project_id, user_id, "assign_roles"):
        raise HTTPException(status_code=403, detail="Manager permission required")


@router.get("/projects/{project_id}/members")
async def list_members(project_id: str, user: CurrentUser = Depends(current_user)):
    role = await rbac.get_project_role(project_id, user.id)
    if not role:
        raise HTTPException(status_code=404, detail="project not found or access denied")
    return {"members": await rbac.list_project_members(project_id), "role": role}


@router.post("/projects/{project_id}/members", status_code=201)
async def invite_member(project_id: str, req: InviteRequest, user: CurrentUser = Depends(current_user)):
    await _require_manager(project_id, user.id)
    try:
        invite = await rbac.create_project_invite(
            project_id, req.email, req.role, user.id, req.specialization
        )
        return invite
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/projects/{project_id}/members/{member_id}")
async def update_member(
    project_id: str, member_id: str, req: RoleUpdateRequest, user: CurrentUser = Depends(current_user)
):
    await _require_manager(project_id, user.id)
    try:
        success = await rbac.update_project_member_role(
            project_id, member_id, req.role, req.specialization
        )
        if not success:
            raise HTTPException(status_code=404, detail="Member not found")
        return {"status": "ok"}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/projects/{project_id}/members/{member_id}")
async def remove_member(project_id: str, member_id: str, user: CurrentUser = Depends(current_user)):
    await _require_manager(project_id, user.id)
    try:
        success = await rbac.remove_project_member(project_id, member_id)
        if not success:
            raise HTTPException(status_code=404, detail="Member not found")
        return {"status": "ok"}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/projects/{project_id}/invites")
async def list_invites(project_id: str, user: CurrentUser = Depends(current_user)):
    await _require_manager(project_id, user.id)
    return {"invites": await rbac.list_project_invites(project_id)}


@router.delete("/projects/{project_id}/invites/{invite_id}")
async def revoke_invite(project_id: str, invite_id: str, user: CurrentUser = Depends(current_user)):
    await _require_manager(project_id, user.id)
    success = await rbac.revoke_project_invite(invite_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invite not found")
@router.post("/invites/{invite_id}/accept")
async def accept_invite_endpoint(invite_id: str, user: CurrentUser = Depends(current_user)):
    success = await rbac.accept_invite_by_id(invite_id, user.id)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid, expired, or already accepted invitation")
    return {"status": "ok"}


@router.put("/users/me/role")
async def update_my_role(req: GlobalRoleRequest, user: CurrentUser = Depends(current_user)):
    from app.services.users import update_user_role
    await update_user_role(user.id, req.role, req.specialization)
    return {"status": "ok"}
