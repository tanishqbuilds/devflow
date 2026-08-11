from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.core.auth import CurrentUser, current_user
from app.services import workspaces

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

class CreateWorkspace(BaseModel):
    name: str = Field(min_length=1,max_length=100)
class InviteRequest(BaseModel):
    role: str = Field(pattern="^(admin|editor|viewer)$")
    expires_hours: int = Field(default=168,ge=1,le=720)
class RoleRequest(BaseModel):
    role: str = Field(pattern="^(admin|editor|viewer)$")

async def _require(workspace_id: str, user_id: str, roles: set[str]) -> dict[str, Any]:
    ws = await workspaces.get(workspace_id,user_id)
    if not ws: raise HTTPException(404,"workspace not found")
    if ws["role"] not in roles: raise HTTPException(403,"insufficient workspace permission")
    return ws

@router.get("")
async def list_workspaces(user: CurrentUser=Depends(current_user)): return {"workspaces":await workspaces.list_for_user(user.id)}
@router.post("",status_code=201)
async def create_workspace(req: CreateWorkspace,user: CurrentUser=Depends(current_user)): return await workspaces.create(req.name,user.id)
@router.get("/{workspace_id}/members")
async def list_members(workspace_id: str,user: CurrentUser=Depends(current_user)):
    await _require(workspace_id,user.id,{"owner","admin","editor","viewer"}); return {"members":await workspaces.members(workspace_id)}
@router.post("/{workspace_id}/invites",status_code=201)
async def create_invite(workspace_id: str,req: InviteRequest,user: CurrentUser=Depends(current_user)):
    await _require(workspace_id,user.id,{"owner","admin"}); return await workspaces.invite(workspace_id,req.role,user.id,req.expires_hours)
@router.post("/invites/{token}/accept")
async def accept_invite(token: str,user: CurrentUser=Depends(current_user)):
    result=await workspaces.accept(token,user.id)
    if not result: raise HTTPException(410,"invite is invalid, expired, or already used")
    return result
@router.put("/{workspace_id}/members/{member_id}")
async def update_role(workspace_id: str,member_id: str,req: RoleRequest,user: CurrentUser=Depends(current_user)):
    await _require(workspace_id,user.id,{"owner","admin"})
    if not await workspaces.set_role(workspace_id,member_id,req.role): raise HTTPException(404,"member not found or owner role is immutable")
    return {"status":"ok"}
