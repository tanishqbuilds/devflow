"""API models and the project-document factory."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field

# Orchestration graph nodes (must match the frontend graph).
NODE_IDS = ["idea", "requirements", "architecture", "tasks", "sprint", "risk", "cost", "execution"]
NODE_LABELS = {
    "idea": "Idea Intake",
    "requirements": "Requirements",
    "architecture": "Architecture",
    "tasks": "Task Generation",
    "sprint": "Sprint Plan",
    "risk": "Risk Analysis",
    "cost": "Cost Estimate",
    "execution": "Execution Plan",
}

# Sections of the project document the agents populate.
SECTION_KEYS = [
    "executive_summary",
    "requirements",
    "architecture",
    "backlog",
    "risks",
    "team",
    "cost",
    "timeline",
    "integrations",
]


class AnalyzeRequest(BaseModel):
    idea: str = Field(..., min_length=8, max_length=4000)
    title: Optional[str] = Field(default=None, max_length=200)
    team_size: int = Field(default=4, ge=1, le=200)
    timeline_weeks: Optional[int] = Field(default=None, ge=1, le=260)
    budget_usd: Optional[int] = Field(default=None, ge=0)
    methodology: str = Field(default="Agile", max_length=40)
    team_skills: list[str] = Field(default_factory=list, max_length=30)
    priorities: list[str] = Field(default_factory=list, max_length=20)
    constraints: str = Field(default="", max_length=3000)


class AnalyzeResponse(BaseModel):
    project_id: str
    status: str


class MigrateRequest(BaseModel):
    """Reconstruct a plan from an existing project's artifacts."""
    source: str = Field(default="spec", max_length=20)  # spec | file | repo | tickets
    content: str = Field(..., min_length=12, max_length=16000)
    title: Optional[str] = Field(default=None, max_length=200)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)
    apply_changes: bool = True


def migration_idea(source: str, content: str) -> str:
    """Frame imported material so the agent org reconstructs (not reinvents) the plan."""
    return (
        "Reconstruct a complete software delivery plan from this EXISTING project. Treat the "
        "material below as the source of truth: infer the product, requirements, architecture, "
        "backlog, risks, team, cost and timeline from it rather than inventing a new idea. Preserve "
        "the project's real names, scope and intent.\n\n"
        f"--- EXISTING PROJECT ARTIFACT (source: {source}) ---\n{content.strip()}"
    )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _derive_title(idea: str) -> str:
    snippet = idea.strip().split("\n")[0]
    return (snippet[:60] + "…") if len(snippet) > 60 else snippet


def new_project_doc(idea: str, title: Optional[str] = None, manager_inputs: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    now = _now()
    return {
        "id": uuid.uuid4().hex,
        "title": title or _derive_title(idea),
        "idea": idea,
        "manager_inputs": manager_inputs or {},
        "status": "queued",
        "progress": 0,
        "error": None,
        "created_at": now,
        "updated_at": now,
        "orchestration": {
            "current_node": None,
            "nodes": {
                nid: {"status": "idle", "progress": 0, "label": NODE_LABELS[nid]}
                for nid in NODE_IDS
            },
            "logs": [],
        },
        # Section payloads — populated as agents complete.
        **{key: None for key in SECTION_KEYS},
    }
