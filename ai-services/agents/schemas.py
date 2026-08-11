"""Structured output schemas for every Devflow agent.

Each agent is given a JSON schema (derived from these Pydantic models) and is
required to return data matching it. The LLM-facing schemas intentionally avoid
volatile fields like server-generated ids; those are added during normalization
in the backend. This keeps small local models reliable.
"""
from __future__ import annotations

from typing import Any, List, Literal

from pydantic import BaseModel, Field, model_validator

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
    competitive_landscape: str = Field(
        default="", description="Brief analysis of competitive landscape and positioning"
    )
    go_to_market: str = Field(
        default="", description="High-level go-to-market strategy or launch approach"
    )
    key_decisions: List[str] = Field(
        default_factory=list,
        description="Binding strategic decisions downstream agents must respect",
    )
    complexity_score: int = Field(..., ge=1, le=100, description="1=trivial, 100=extreme")
    complexity_label: Literal["Low", "Moderate", "High", "Very High"]
    estimated_duration_weeks: int = Field(..., ge=1, le=260)
    recommended_team_size: int = Field(..., ge=1, le=200)


# --------------------------------------------------------------------------- #
# Product Manager Agent — Requirements
# --------------------------------------------------------------------------- #
class RequirementItem(BaseModel):
    title: str = Field(default="")
    category: RequirementCategory = Field(default="backend")
    description: str = Field(default="")
    priority: Priority = "medium"
    estimated_effort_days: float = Field(
        default=1.0, ge=0.5, le=60,
        description="Rough effort estimate in developer-days",
    )
    depends_on: List[str] = Field(
        default_factory=list,
        description="Titles of other requirements this one depends on",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_req_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            effort = data.get("estimated_effort_days")
            if effort is None or (isinstance(effort, (int, float)) and effort < 0.5):
                data["estimated_effort_days"] = 0.5
            if "category" in data and isinstance(data["category"], str):
                cat = data["category"].lower().strip().replace("-", "_")
                valid = {"frontend", "backend", "security", "ai", "integrations", "infrastructure"}
                if cat not in valid:
                    # NFR models commonly use labels such as performance,
                    # scalability, reliability, compliance, or UX. They are
                    # still valid requirements; map them to the closest
                    # supported delivery area instead of rejecting the run.
                    data["category"] = {
                        "ux": "frontend", "usability": "frontend",
                        "performance": "infrastructure", "scalability": "infrastructure",
                        "reliability": "infrastructure", "compliance": "security",
                        "data": "backend", "database": "backend",
                    }.get(cat, "backend")
                else:
                    data["category"] = cat
        return data


class UserStory(BaseModel):
    as_a: str = Field(default="user", description="The user role / persona")
    i_want: str = Field(default="", description="The capability desired")
    so_that: str = Field(default="", description="The value / outcome")
    acceptance_criteria: List[str] = Field(
        default_factory=list,
        description="Testable criteria, ideally in Given/When/Then format",
    )
    priority: Priority = "medium"

    @model_validator(mode="before")
    @classmethod
    def normalize_story_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "as_a" not in data or not data["as_a"]:
                data["as_a"] = data.get("asA") or data.get("role") or data.get("user") or data.get("persona") or "user"
            if "i_want" not in data or not data["i_want"]:
                data["i_want"] = data.get("iWant") or data.get("want") or data.get("action") or data.get("capability") or data.get("title") or ""
            if "so_that" not in data or not data["so_that"]:
                data["so_that"] = data.get("soThat") or data.get("benefit") or data.get("value") or data.get("outcome") or ""
            if "acceptance_criteria" not in data or not data["acceptance_criteria"]:
                ac = data.get("acceptanceCriteria") or data.get("criteria") or []
                if isinstance(ac, str):
                    ac = [ac]
                data["acceptance_criteria"] = ac
        return data


class RequirementsBundle(BaseModel):
    functional_requirements: List[RequirementItem] = Field(default_factory=list)
    non_functional_requirements: List[RequirementItem] = Field(default_factory=list)
    user_stories: List[UserStory] = Field(default_factory=list)
    scope_in: List[str] = Field(default_factory=list)
    scope_out: List[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# System Architect Agent — Architecture
# --------------------------------------------------------------------------- #
class ArchitectureLayer(BaseModel):
    summary: str = Field(default="")
    components: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    decisions: List[str] = Field(default_factory=list)
    key_entities: List[str] = Field(
        default_factory=list,
        description="Primary data models or API endpoints relevant to this layer",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_layer(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key in ["components", "technologies", "decisions", "key_entities"]:
                val = data.get(key)
                if isinstance(val, str):
                    data[key] = [x.strip() for x in val.split(",") if x.strip()]
        return data


class ArchitectureBundle(BaseModel):
    frontend: ArchitectureLayer = Field(default_factory=ArchitectureLayer)
    backend: ArchitectureLayer = Field(default_factory=ArchitectureLayer)
    database: ArchitectureLayer = Field(default_factory=ArchitectureLayer)
    infrastructure: ArchitectureLayer = Field(default_factory=ArchitectureLayer)
    technology_recommendations: List[str] = Field(default_factory=list)
    scalability_plan: List[str] = Field(default_factory=list)
    integration_points: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def normalize_arch(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key in ["technology_recommendations", "scalability_plan", "integration_points"]:
                val = data.get(key)
                if isinstance(val, str):
                    data[key] = [x.strip() for x in val.split("\n") if x.strip()]
        return data


# --------------------------------------------------------------------------- #
# Sprint Planner Agent — Backlog, Tasks, Sprints
# --------------------------------------------------------------------------- #
class Epic(BaseModel):
    title: str = Field(default="")
    description: str = Field(default="")


class TaskItem(BaseModel):
    title: str = Field(default="")
    description: str = Field(default="")
    category: str = Field(default="backend", description="e.g. frontend, backend, infra, ai, qa")
    epic: str = Field(default="", description="Title of the parent epic")
    estimated_days: float = Field(default=3.0, ge=0.5, le=60)
    story_points: int = Field(
        default=3, ge=1, le=13,
        description="Fibonacci story points: 1, 2, 3, 5, 8, 13",
    )
    priority: Priority = "medium"
    sprint: int = Field(default=1, ge=1)
    dependencies: List[str] = Field(default_factory=list, description="Titles of prerequisite tasks")
    definition_of_done: str = Field(
        default="",
        description="Specific criteria for marking this task complete",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_task(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "description" not in data or not data["description"]:
                data["description"] = data.get("definition_of_done") or data.get("title") or ""
            if "estimated_days" not in data:
                data["estimated_days"] = float(data.get("estimate") or data.get("days") or 3.0)
            if "category" not in data:
                data["category"] = "backend"
        return data


class Sprint(BaseModel):
    number: int = Field(default=1, ge=1)
    name: str = Field(default="Sprint 1")
    goal: str = Field(default="")
    task_titles: List[str] = Field(default_factory=list)


class SprintPlan(BaseModel):
    methodology: str = "Scrum"
    sprint_length_weeks: int = Field(default=2, ge=1, le=4)
    epics: List[Epic] = Field(default_factory=list)
    tasks: List[TaskItem] = Field(default_factory=list)
    sprints: List[Sprint] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Risk Agent — Risk Analysis
# --------------------------------------------------------------------------- #
class RiskItem(BaseModel):
    title: str = Field(default="")
    description: str = Field(default="")
    category: RiskCategory = Field(default="technical")
    severity: Severity = Field(default="medium")
    probability: int = Field(default=50, ge=0, le=100)
    impact: int = Field(default=50, ge=0, le=100)
    mitigation: str = Field(default="")
    cost_of_delay_per_week: str = Field(
        default="",
        description="Estimated business cost if this risk materializes and is unaddressed per week",
    )
    compounds_with: List[str] = Field(
        default_factory=list,
        description="Titles of other risks this one amplifies or is amplified by",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_risk(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "category" in data and isinstance(data["category"], str):
                cat = data["category"].lower()
                valid = {"technical", "product", "delivery", "security", "scalability"}
                if cat not in valid:
                    data["category"] = "technical"
            if "severity" in data and isinstance(data["severity"], str):
                sev = data["severity"].lower()
                valid_sev = {"critical", "high", "medium", "low"}
                if sev not in valid_sev:
                    data["severity"] = "medium"
        return data


class RiskBundle(BaseModel):
    risks: List[RiskItem] = Field(default_factory=list, description="Cover technical, product, delivery, security, scalability")
    overall_risk_level: Literal["Low", "Moderate", "High", "Critical"] = "Moderate"
    summary: str = Field(default="")

    @model_validator(mode="before")
    @classmethod
    def normalize_risk_bundle(cls, data: Any) -> Any:
        if isinstance(data, dict):
            rl = data.get("overall_risk_level", "Moderate")
            if isinstance(rl, str):
                rl_map = {"low": "Low", "moderate": "Moderate", "medium": "Moderate", "high": "High", "critical": "Critical"}
                data["overall_risk_level"] = rl_map.get(rl.lower(), rl.capitalize() if rl else "Moderate")
        return data


# --------------------------------------------------------------------------- #
# Team Allocation Agent — Staffing
# --------------------------------------------------------------------------- #
class TeamMember(BaseModel):
    role: str = Field(default="")
    seniority: str = Field(default="Senior")
    count: int = Field(default=1, ge=1, le=20)
    skills: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    allocation_pct: int = Field(default=100, ge=10, le=100)
    owns_area: str = Field(
        default="",
        description="The architecture layer or backlog area this role primarily owns",
    )
    onboarding_weeks: int = Field(
        default=2, ge=1, le=12,
        description="Estimated onboarding ramp-up time in weeks",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_member(cls, data: Any) -> Any:
        if isinstance(data, dict):
            s = data.get("seniority", "Senior")
            if isinstance(s, str):
                s_map = {"junior": "Junior", "mid": "Mid", "senior": "Senior", "lead": "Lead", "principal": "Principal"}
                data["seniority"] = s_map.get(s.lower(), s.capitalize() if s else "Senior")
            for key in ["skills", "responsibilities"]:
                val = data.get(key)
                if isinstance(val, str):
                    data[key] = [x.strip() for x in val.split(",") if x.strip()]
        return data


class TeamPlan(BaseModel):
    members: List[TeamMember] = Field(default_factory=list)
    staffing_notes: List[str] = Field(default_factory=list)
    ownership: List[str] = Field(default_factory=list, description="Who owns which area")

    @model_validator(mode="before")
    @classmethod
    def normalize_plan(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key in ["staffing_notes", "ownership"]:
                val = data.get(key)
                if isinstance(val, str):
                    data[key] = [x.strip() for x in val.split("\n") if x.strip()]
        return data


# --------------------------------------------------------------------------- #
# Timeline Agent — Milestones & Roadmap
# --------------------------------------------------------------------------- #
class MilestoneItem(BaseModel):
    title: str = Field(default="")
    description: str = Field(default="")
    phase: MilestonePhase = Field(default="mvp")
    start_week: int = Field(default=1, ge=0)
    duration_weeks: int = Field(default=2, ge=1, le=104)
    deliverables: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    go_no_go_criteria: List[str] = Field(
        default_factory=list,
        description="Criteria that must be met before transitioning to the next phase",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_milestone(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "phase" in data and isinstance(data["phase"], str):
                p = data["phase"].lower()
                valid = {"mvp", "beta", "production", "scaling"}
                if p not in valid:
                    data["phase"] = "mvp"
            for key in ["deliverables", "dependencies", "go_no_go_criteria"]:
                val = data.get(key)
                if isinstance(val, str):
                    data[key] = [x.strip() for x in val.split(",") if x.strip()]
        return data


class TimelinePlan(BaseModel):
    milestones: List[MilestoneItem] = Field(default_factory=list)
    total_duration_weeks: int = Field(default=12, ge=1)
    critical_path: List[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Integration Agent — Integrations & Deployment
# --------------------------------------------------------------------------- #
class IntegrationItem(BaseModel):
    name: str = Field(default="")
    category: IntegrationCategory = Field(default="other")
    purpose: str = Field(default="")
    steps: List[str] = Field(default_factory=list)
    auth_method: str = Field(
        default="",
        description="Authentication method (e.g. OAuth2, API Key, JWT, Webhook Secret)",
    )
    rollback_steps: List[str] = Field(
        default_factory=list,
        description="Steps to safely rollback or disable this integration",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_integration(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "category" in data and isinstance(data["category"], str):
                cat = data["category"].lower()
                valid = {"github", "calendar", "deployment", "payments", "communication", "analytics", "other"}
                if cat not in valid:
                    data["category"] = "other"
            for key in ["steps", "rollback_steps"]:
                val = data.get(key)
                if isinstance(val, str):
                    data[key] = [x.strip() for x in val.split("\n") if x.strip()]
        return data


class IntegrationBundle(BaseModel):
    integrations: List[IntegrationItem] = Field(default_factory=list)
    deployment_plan: List[str] = Field(default_factory=list)
    cicd_recommendations: List[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# CEO Supervision — Review Schema
# --------------------------------------------------------------------------- #
class SupervisionDirective(BaseModel):
    agent_id: str = Field(..., description="The agent that needs to re-run")
    reason: str = Field(..., description="Specific issue the agent must address")
    priority: Priority = "high"


class CEOReview(BaseModel):
    passed: bool = Field(
        ..., description="True if the collective output is coherent and production-ready"
    )
    overall_assessment: str = Field(
        ..., description="1-3 sentence summary of the overall plan quality"
    )
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    directives: List[SupervisionDirective] = Field(
        default_factory=list,
        description="Agents that should re-run with targeted feedback (empty if passed)",
    )


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
