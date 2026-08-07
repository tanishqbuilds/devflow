"""Project REST API."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import CurrentUser, current_user
from app.core.logging import get_logger
from app.models.project import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    MigrateRequest,
    migration_idea,
)
from app.orchestrator.manager import enqueue_analysis
from app.services import projects as project_service
from app.services.ai_client import ai_services

logger = get_logger("api.projects")
router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/analyze", response_model=AnalyzeResponse, status_code=202)
async def analyze(req: AnalyzeRequest, user: CurrentUser = Depends(current_user)) -> AnalyzeResponse:
    """Kick off the autonomous AI organization on a raw product idea."""
    doc = await project_service.create_project(req.idea, req.title, user.id)
    await enqueue_analysis(doc["id"])
    return AnalyzeResponse(project_id=doc["id"], status="queued")


@router.post("/migrate", response_model=AnalyzeResponse, status_code=202)
async def migrate(req: MigrateRequest, user: CurrentUser = Depends(current_user)) -> AnalyzeResponse:
    """Reconstruct a full plan from an existing project's spec/export/repo."""
    idea = migration_idea(req.source, req.content)
    title = req.title or f"Imported · {req.content.strip().splitlines()[0][:48]}"
    doc = await project_service.create_project(idea, title, user.id)
    await enqueue_analysis(doc["id"])
    return AnalyzeResponse(project_id=doc["id"], status="queued")


@router.post("/{project_id}/chat")
async def chat(
    project_id: str, req: ChatRequest, user: CurrentUser = Depends(current_user)
) -> dict[str, Any]:
    """Answer a question grounded in the project's plan."""
    doc = await project_service.get_project(project_id, user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="project not found")
    try:
        result = await ai_services.chat(
            doc, req.message, [{"role": m.role, "content": m.content} for m in req.history]
        )
    except Exception as exc:
        logger.warning("Assistant chat failed for %s: %s", project_id, exc)
        raise HTTPException(status_code=502, detail="assistant unavailable")
    reply = result.get("reply", "")
    await project_service.add_ai_response(
        project_id, user.id, "chat", role="user", content=req.message
    )
    await project_service.add_ai_response(
        project_id, user.id, "chat", role="assistant", content=reply
    )
    return {"reply": reply}


@router.get("")
async def list_projects(user: CurrentUser = Depends(current_user)) -> dict[str, Any]:
    return {"projects": await project_service.list_projects(user.id)}


@router.get("/{project_id}")
async def get_project(project_id: str, user: CurrentUser = Depends(current_user)) -> dict[str, Any]:
    doc = await project_service.get_project(project_id, user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="project not found")
    return doc


class UpdateBacklogRequest(BaseModel):
    backlog: dict[str, Any]


@router.put("/{project_id}/backlog")
async def update_backlog(project_id: str, req: UpdateBacklogRequest) -> dict[str, Any]:
    success = await project_service.update_section(project_id, "backlog", req.backlog)
    if not success:
        raise HTTPException(status_code=404, detail="project not found")
    return {"status": "ok"}


agents_router = APIRouter(tags=["agents"])


@agents_router.get("/agents")
async def list_agents() -> dict[str, Any]:
    """Proxy the AI org roster from ai-services (frontend never calls it directly)."""
    try:
        return await ai_services.list_agents()
    except Exception as exc:
        logger.warning("Could not fetch agents: %s", exc)
        raise HTTPException(status_code=502, detail="ai-services unavailable")
