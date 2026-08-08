"""The Devflow workflow engine.

Implements the orchestration graph:

    CEO -> Product Manager -> Architect -> [Sprint Planner | Risk | Team Allocation]
                                        -> [Timeline | Integration]

Stages run sequentially; agents *within* a stage run in parallel. The engine
tracks per-node state and overall progress, loads prior database versions
for iterations, emits events throughout, and records versioned iteration snapshots.
"""
from __future__ import annotations

import asyncio
from typing import Any

import redis.asyncio as aioredis

from agents.registry import AGENTS, get_agent
from memory.project_memory import ProjectMemory
from services.cost import compute_cost
from services.diagram import build_diagram, build_mermaid
from utils.logging import get_logger
from workflows.events import EventEmitter

logger = get_logger("workflow.engine")

# Sequential stages; each inner list runs in parallel.
STAGES: list[list[str]] = [
    ["ceo"],
    ["product_manager"],
    ["architect"],
    ["sprint_planner", "risk", "team_allocation"],
    ["timeline", "integration"],
]

# Which project-document section each agent populates.
SECTION_OF: dict[str, str] = {
    "ceo": "executive_summary",
    "product_manager": "requirements",
    "architect": "architecture",
    "sprint_planner": "backlog",
    "risk": "risks",
    "team_allocation": "team",
    "timeline": "timeline",
    "integration": "integrations",
}

# Friendly per-agent working messages for the stream log.
_WORKING_MSG: dict[str, str] = {
    "ceo": "Distilling product vision and success criteria...",
    "product_manager": "Decomposing functional & non-functional requirements...",
    "architect": "Designing system architecture across all layers...",
    "sprint_planner": "Generating backlog, epics and sprint plan...",
    "risk": "Assessing technical, product, delivery & security risks...",
    "team_allocation": "Recommending team structure and ownership...",
    "timeline": "Building milestones and delivery roadmap...",
    "integration": "Planning integrations and deployment pipeline...",
}

TOTAL_UNITS = len(AGENTS)


class WorkflowEngine:
    def __init__(self, redis: aioredis.Redis, project_id: str, user_id: str | None = None):
        self._emitter = EventEmitter(redis, project_id)
        self._project_id = project_id
        self._memory = ProjectMemory(project_id, user_id)
        self._ctx: dict[str, Any] = {}
        self._completed_units = 0

    async def _run_agent(self, agent_id: str) -> None:
        agent = get_agent(agent_id)
        node = agent.node
        section = SECTION_OF[agent_id]
        try:
            await self._emitter.node_update(node, "thinking", 20, agent.name)
            await self._emitter.log(agent_id, f"{agent.name}: {_WORKING_MSG.get(agent_id, 'working...')}")

            data = await agent.run(self._ctx)
            self._ctx[section] = data

            # Derived artifacts.
            if agent_id == "architect":
                data["diagram"] = build_diagram(data)
                data["mermaid"] = build_mermaid(data)
                self._ctx[section] = data
            if agent_id == "team_allocation":
                await self._emit_cost()

            # Record iteration state into memory & database
            await self._memory.save_iteration_diff(section, data)

            await self._emitter.section_complete(agent_id, section, node, data)
            await self._emitter.node_update(node, "complete", 100, agent.name)
            await self._emitter.log(agent_id, f"{agent.name}: complete ✓")

            # The sprint planner also satisfies the dedicated 'sprint' graph node.
            if agent_id == "sprint_planner":
                await self._emitter.node_update("sprint", "complete", 100, "Sprint Plan")
        except Exception as exc:  # resilient: report and continue
            logger.exception("Agent %s failed", agent_id)
            await self._emitter.error(node, agent_id, str(exc)[:300])
            await self._emitter.node_update(node, "complete", 100, agent.name)
            await self._emitter.log(agent_id, f"{agent.name}: failed — {str(exc)[:160]}", level="error")
        finally:
            self._completed_units += 1
            await self._emitter.progress(int(self._completed_units / TOTAL_UNITS * 100))

    async def _emit_cost(self) -> None:
        es = self._ctx.get("executive_summary", {}) or {}
        cost = compute_cost(
            self._ctx.get("team", {}),
            duration_weeks=int(es.get("estimated_duration_weeks", 12) or 12),
            complexity_score=int(es.get("complexity_score", 50) or 50),
        )
        self._ctx["cost"] = cost
        # Cost shares the 'cost' graph node with the team allocation agent.
        await self._emitter.section_complete("team_allocation", "cost", "cost", cost)

    async def run(self, idea: str, title: str | None = None) -> dict[str, Any]:
        # Pre-load prior database state and conversation context for iterations
        prior_context = await self._memory.get_previous_project_context()
        chat_context = await self._memory.get_project_chat_context()

        self._ctx = {
            "idea": idea,
            "project_id": self._project_id,
            "prior_project_database": prior_context,
            "chat_history": chat_context,
        }
        if title:
            self._ctx["title"] = title

        await self._emitter.run_started(
            [{"id": a.id, "name": a.name, "role": a.role, "node": a.node} for a in AGENTS.values()]
        )
        # The idea-intake node is satisfied as soon as we begin.
        await self._emitter.node_update("idea", "thinking", 30, "Idea Intake")

        for stage in STAGES:
            await asyncio.gather(*(self._run_agent(aid) for aid in stage))

        await self._emitter.run_complete()
        logger.info("Workflow complete for project %s", self._project_id)
        return self._ctx
