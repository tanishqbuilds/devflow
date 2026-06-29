"""Structured output schemas for every PlanForge agent.

Each agent is given a JSON schema (derived from these Pydantic models) and is
required to return data matching it. The LLM-facing schemas intentionally avoid
volatile fields like server-generated ids; those are added during normalization
in the backend. This keeps small local models reliable.
"""
from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field

Priority = Literal["high", "medium", "low"]
Severity = Literal["critical", "high", "medium", "low"]
RequirementCategory = Literal[
    "frontend", "backend", "security", "ai", "integrations", "infrastructure"
]
RiskCategory = Literal["technical", "product", "delivery", "security", "scalability"]
MilestonePhase = Literal["mvp", "beta", "production", "scaling"]
IntegrationCategory = Literal[
    "github", "calendar", "deployment", "payments", "communication", "analytics", "other"
]


# --------------------------------------------------------------------------- #
# CEO Agent — Executive Summary
# --------------------------------------------------------------------------- #
class ExecutiveSummary(BaseModel):
    project_title: str = Field(..., description="A concise, marketable product name")
    tagline: str = Field(..., description="One-sentence positioning statement")
    vision: str = Field(..., description="The long-term vision for the product")
    overview: str = Field(..., description="2-4 sentence project overview")
    business_goals: List[str] = Field(..., min_length=2)
    success_criteria: List[str] = Field(..., min_length=2)
    target_users: List[str] = Field(..., min_length=1)
    key_differentiators: List[str] = Field(..., min_length=1)
    complexity_score: int = Field(..., ge=1, le=100, description="1=trivial, 100=extreme")
    complexity_label: Literal["Low", "Moderate", "High", "Very High"]
    estimated_duration_weeks: int = Field(..., ge=1, le=260)
    recommended_team_size: int = Field(..., ge=1, le=200)


# --------------------------------------------------------------------------- #
# Product Manager Agent — Requirements
# --------------------------------------------------------------------------- #
class RequirementItem(BaseModel):
    title: str
    category: RequirementCategory
    description: str
    priority: Priority = "medium"


class UserStory(BaseModel):
    as_a: str = Field(..., description="The user role / persona")
    i_want: str = Field(..., description="The capability desired")
    so_that: str = Field(..., description="The value / outcome")
    acceptance_criteria: List[str] = Field(..., min_length=1)
    priority: Priority = "medium"


class RequirementsBundle(BaseModel):
    functional_requirements: List[RequirementItem] = Field(..., min_length=3)
    non_functional_requirements: List[RequirementItem] = Field(..., min_length=2)
    user_stories: List[UserStory] = Field(..., min_length=3)
    scope_in: List[str] = Field(..., min_length=2)
    scope_out: List[str] = Field(..., min_length=1)


# --------------------------------------------------------------------------- #
# System Architect Agent — Architecture
# --------------------------------------------------------------------------- #
class ArchitectureLayer(BaseModel):
    summary: str
    components: List[str] = Field(..., min_length=2)
    technologies: List[str] = Field(..., min_length=1)
    decisions: List[str] = Field(default_factory=list)


class ArchitectureBundle(BaseModel):
    frontend: ArchitectureLayer
    backend: ArchitectureLayer
    database: ArchitectureLayer
    infrastructure: ArchitectureLayer
    technology_recommendations: List[str] = Field(..., min_length=2)
    scalability_plan: List[str] = Field(..., min_length=2)
    integration_points: List[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Sprint Planner Agent — Backlog, Tasks, Sprints
# --------------------------------------------------------------------------- #
class Epic(BaseModel):
    title: str
    description: str


class TaskItem(BaseModel):
    title: str
    description: str
    category: str = Field(..., description="e.g. frontend, backend, infra, ai, qa")
    epic: str = Field(default="", description="Title of the parent epic")
    estimated_days: float = Field(..., ge=0.5, le=60)
    priority: Priority = "medium"
    sprint: int = Field(default=1, ge=1)
    dependencies: List[str] = Field(default_factory=list, description="Titles of prerequisite tasks")


class Sprint(BaseModel):
    number: int = Field(..., ge=1)
    name: str
    goal: str
    task_titles: List[str] = Field(default_factory=list)


class SprintPlan(BaseModel):
    methodology: str = "Scrum"
    sprint_length_weeks: int = Field(default=2, ge=1, le=4)
    epics: List[Epic] = Field(..., min_length=2)
    tasks: List[TaskItem] = Field(..., min_length=5)
    sprints: List[Sprint] = Field(..., min_length=2)


# --------------------------------------------------------------------------- #
# Risk Agent — Risk Analysis
# --------------------------------------------------------------------------- #
class RiskItem(BaseModel):
    title: str
    description: str
    category: RiskCategory
    severity: Severity
    probability: int = Field(..., ge=0, le=100)
    impact: int = Field(..., ge=0, le=100)
    mitigation: str


class RiskBundle(BaseModel):
    risks: List[RiskItem] = Field(..., min_length=5, description="Cover technical, product, delivery, security, scalability")
    overall_risk_level: Literal["Low", "Moderate", "High", "Critical"]
    summary: str


# --------------------------------------------------------------------------- #
# Team Allocation Agent — Staffing
# --------------------------------------------------------------------------- #
class TeamMember(BaseModel):
    role: str
    seniority: Literal["Junior", "Mid", "Senior", "Lead", "Principal"]
    count: int = Field(default=1, ge=1, le=20)
    skills: List[str] = Field(..., min_length=1)
    responsibilities: List[str] = Field(..., min_length=1)
    allocation_pct: int = Field(default=100, ge=10, le=100)


class TeamPlan(BaseModel):
    members: List[TeamMember] = Field(..., min_length=3)
    staffing_notes: List[str] = Field(..., min_length=1)
    ownership: List[str] = Field(default_factory=list, description="Who owns which area")


# --------------------------------------------------------------------------- #
# Timeline Agent — Milestones & Roadmap
# --------------------------------------------------------------------------- #
class MilestoneItem(BaseModel):
    title: str
    description: str
    phase: MilestonePhase
    start_week: int = Field(..., ge=0)
    duration_weeks: int = Field(..., ge=1, le=104)
    deliverables: List[str] = Field(..., min_length=1)
    dependencies: List[str] = Field(default_factory=list)


class TimelinePlan(BaseModel):
    milestones: List[MilestoneItem] = Field(..., min_length=3)
    total_duration_weeks: int = Field(..., ge=1)
    critical_path: List[str] = Field(..., min_length=1)


# --------------------------------------------------------------------------- #
# Integration Agent — Integrations & Deployment
# --------------------------------------------------------------------------- #
class IntegrationItem(BaseModel):
    name: str
    category: IntegrationCategory
    purpose: str
    steps: List[str] = Field(..., min_length=1)


class IntegrationBundle(BaseModel):
    integrations: List[IntegrationItem] = Field(..., min_length=2)
    deployment_plan: List[str] = Field(..., min_length=2)
    cicd_recommendations: List[str] = Field(..., min_length=1)


# Registry of agent_id -> output schema, used by the workflow engine and tests.
AGENT_SCHEMAS: dict[str, type[BaseModel]] = {
    "ceo": ExecutiveSummary,
    "product_manager": RequirementsBundle,
    "architect": ArchitectureBundle,
    "sprint_planner": SprintPlan,
    "risk": RiskBundle,
    "team_allocation": TeamPlan,
    "timeline": TimelinePlan,
    "integration": IntegrationBundle,
}
