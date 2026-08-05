"""The agent registry — the single source of truth for Devflow's AI org.

Each entry binds an agent id to its human role, the orchestration-graph node it
drives, its output schema, and its dedicated prompt module.
"""
from __future__ import annotations

from agents.base import Agent
from agents import schemas
from prompts import (
    architect,
    ceo,
    integration,
    product_manager,
    risk,
    sprint_planner,
    team_allocation,
    timeline,
)

AGENTS: dict[str, Agent] = {
    "ceo": Agent(
        id="ceo",
        name="CEO Agent",
        role="Chief Vision Officer",
        node="idea",
        schema=schemas.ExecutiveSummary,
        system_prompt=ceo.SYSTEM_PROMPT,
        build_user_prompt=ceo.build_user_prompt,
    ),
    "product_manager": Agent(
        id="product_manager",
        name="Product Manager Agent",
        role="Senior Product Manager",
        node="requirements",
        schema=schemas.RequirementsBundle,
        system_prompt=product_manager.SYSTEM_PROMPT,
        build_user_prompt=product_manager.build_user_prompt,
    ),
    "architect": Agent(
        id="architect",
        name="System Architect Agent",
        role="Principal System Architect",
        node="architecture",
        schema=schemas.ArchitectureBundle,
        system_prompt=architect.SYSTEM_PROMPT,
        build_user_prompt=architect.build_user_prompt,
    ),
    "sprint_planner": Agent(
        id="sprint_planner",
        name="Sprint Planner Agent",
        role="Agile Delivery Lead",
        node="tasks",
        schema=schemas.SprintPlan,
        system_prompt=sprint_planner.SYSTEM_PROMPT,
        build_user_prompt=sprint_planner.build_user_prompt,
    ),
    "risk": Agent(
        id="risk",
        name="Risk Agent",
        role="Risk Analyst",
        node="risk",
        schema=schemas.RiskBundle,
        system_prompt=risk.SYSTEM_PROMPT,
        build_user_prompt=risk.build_user_prompt,
    ),
    "team_allocation": Agent(
        id="team_allocation",
        name="Team Allocation Agent",
        role="VP of Engineering",
        node="cost",
        schema=schemas.TeamPlan,
        system_prompt=team_allocation.SYSTEM_PROMPT,
        build_user_prompt=team_allocation.build_user_prompt,
    ),
    "timeline": Agent(
        id="timeline",
        name="Timeline Agent",
        role="Delivery Manager",
        node="execution",
        schema=schemas.TimelinePlan,
        system_prompt=timeline.SYSTEM_PROMPT,
        build_user_prompt=timeline.build_user_prompt,
    ),
    "integration": Agent(
        id="integration",
        name="Integration Agent",
        role="Platform / DevOps Architect",
        node="execution",
        schema=schemas.IntegrationBundle,
        system_prompt=integration.SYSTEM_PROMPT,
        build_user_prompt=integration.build_user_prompt,
    ),
}


def get_agent(agent_id: str) -> Agent:
    if agent_id not in AGENTS:
        raise KeyError(f"unknown agent '{agent_id}'")
    return AGENTS[agent_id]
