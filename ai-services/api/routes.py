"""AI-services HTTP API.

* ``GET  /agents``                  list the AI org
* ``POST /agents/{agent_id}/run``   run one agent independently (testable)
* ``POST /workflow/run``            execute the full orchestration graph
"""
from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents.registry import AGENTS, get_agent
from services.assistant import chat as assistant_chat
from services.redis_client import get_redis
from utils.logging import get_logger
from workflows.engine import WorkflowEngine

logger = get_logger("api")
router = APIRouter()

# Keep references to background workflow tasks so they aren't garbage-collected.
_BACKGROUND_TASKS: set[asyncio.Task] = set()


class AgentRunRequest(BaseModel):
    context: dict[str, Any] = Field(
        default_factory=dict,
        description="Accumulated project context; must at least include 'idea'.",
    )


class WorkflowRunRequest(BaseModel):
    project_id: str
    idea: str
    title: str | None = None


class ChatMessage(BaseModel):
    role: str
    content: str


class AssistantChatRequest(BaseModel):
    project: dict[str, Any] = Field(default_factory=dict)
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


@router.get("/agents")
async def list_agents() -> dict[str, Any]:
    return {
        "agents": [
            {"id": a.id, "name": a.name, "role": a.role, "node": a.node}
            for a in AGENTS.values()
        ]
    }


@router.post("/agents/{agent_id}/run")
async def run_agent(agent_id: str, req: AgentRunRequest) -> dict[str, Any]:
    try:
        agent = get_agent(agent_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"unknown agent '{agent_id}'")
    if not req.context.get("idea"):
        raise HTTPException(status_code=422, detail="context.idea is required")
    try:
        data = await agent.run(req.context)
    except Exception as exc:
        logger.exception("Agent %s failed", agent_id)
        raise HTTPException(status_code=502, detail=f"agent execution failed: {exc}")
    return {"agent": agent_id, "node": agent.node, "data": data}


class WorkflowRetryRequest(BaseModel):
    project_id: str
    idea: str | None = None
    title: str | None = None
    target_agents: list[str] | None = None


async def _run_workflow(
    project_id: str,
    idea: str,
    title: str | None,
    target_agents: list[str] | None = None,
) -> None:
    engine = WorkflowEngine(get_redis(), project_id)
    try:
        await engine.run(idea, title, only_missing=True, target_agents=target_agents)
    except Exception:
        logger.exception("Workflow crashed for project %s", project_id)


@router.post("/workflow/run")
async def run_workflow(req: WorkflowRunRequest) -> dict[str, Any]:
    task = asyncio.create_task(_run_workflow(req.project_id, req.idea, req.title))
    _BACKGROUND_TASKS.add(task)
    task.add_done_callback(_BACKGROUND_TASKS.discard)
    logger.info("Workflow accepted for project %s", req.project_id)
    return {"status": "started", "project_id": req.project_id}


@router.post("/workflow/retry")
async def retry_workflow(req: WorkflowRetryRequest) -> dict[str, Any]:
    idea = req.idea or ""
    task = asyncio.create_task(_run_workflow(req.project_id, idea, req.title, req.target_agents))
    _BACKGROUND_TASKS.add(task)
    task.add_done_callback(_BACKGROUND_TASKS.discard)
    logger.info("Workflow retry queued for project %s", req.project_id)
    return {"status": "started", "project_id": req.project_id}


@router.post("/assistant/chat")
async def assistant(req: AssistantChatRequest) -> dict[str, Any]:
    """Grounded conversational answer about a project's plan (no schema)."""
    if not req.message.strip():
        raise HTTPException(status_code=422, detail="message is required")
    try:
        reply = await assistant_chat(
            req.project,
            req.message,
            [{"role": m.role, "content": m.content} for m in req.history],
        )
    except Exception as exc:
        logger.exception("Assistant chat failed")
        raise HTTPException(status_code=502, detail=f"assistant failed: {exc}")
    return {"reply": reply}
