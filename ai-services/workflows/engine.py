"""The Devflow workflow engine.

Implements the orchestration graph with outer CEO supervision:

    CEO -> Product Manager -> Architect -> [Sprint Planner | Risk | Team Allocation]
                                        -> [Timeline | Integration]
                                        -> CEO Supervisor Evaluation -> [Re-runs if needed]

Stages run sequentially; agents *within* a stage run in parallel. The engine
tracks per-node state, saves structured per-agent JSON snapshots, emits events throughout,
and runs the CEO supervisor loop to guarantee output quality.
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
from workflows.supervisor import CEOSupervisor

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
        self._agent_versions: dict[str, int] = {}
        self._supervisor = CEOSupervisor(self._emitter, project_id, self._run_agent)

    async def _run_agent(
        self, agent_id: str, directive: str | None = None, max_attempts: int = 3
    ) -> bool:
        agent = get_agent(agent_id)
        node = agent.node
        section = SECTION_OF[agent_id]
        version = self._agent_versions.get(agent_id, 0) + 1
        self._agent_versions[agent_id] = version

        for attempt in range(1, max_attempts + 1):
            try:
                await self._emitter.node_update(node, "thinking", 20, agent.name)
                msg = _WORKING_MSG.get(agent_id, "working...")
                if directive:
                    msg = f"Addressing CEO directive: {directive[:80]}..."
                elif attempt > 1:
                    msg = f"Retrying ({attempt}/{max_attempts})..."
                await self._emitter.log(agent_id, f"{agent.name}: {msg}")

                data = await agent.run(self._ctx, directive=directive)
                self._ctx[section] = data

                # Derived artifacts.
                if agent_id == "architect":
                    data["diagram"] = build_diagram(data)
                    data["mermaid"] = build_mermaid(data)
                    self._ctx[section] = data
                if agent_id == "team_allocation":
                    await self._emit_cost()

                # Record versioned structured output in agent store & PostgreSQL
                await self._memory.agent_store.save_output(agent_id, section, data, version=version)
                await self._memory.save_iteration_diff(section, data)

                await self._emitter.section_complete(agent_id, section, node, data)
                await self._emitter.node_update(node, "complete", 100, agent.name)
                await self._emitter.log(agent_id, f"{agent.name}: complete ✓")

                # The sprint planner also satisfies the dedicated 'sprint' graph node.
                if agent_id == "sprint_planner":
                    await self._emitter.node_update("sprint", "complete", 100, "Sprint Plan")
                return True

            except Exception as exc:
                err_msg = str(exc)
                logger.warning(
                    "Agent %s attempt %d/%d failed: %s",
                    agent_id, attempt, max_attempts, err_msg[:200],
                )
                if attempt < max_attempts:
                    is_rate_limit = "429" in err_msg or "413" in err_msg or "rate limit" in err_msg.lower() or "tokens per minute" in err_msg.lower()
                    backoff = 20.0 * attempt if is_rate_limit else 2.0 * attempt
                    await self._emitter.log(
                        agent_id,
                        f"{agent.name}: transient provider rate limit, pausing {backoff:.0f}s before retry ({attempt}/{max_attempts})...",
                        level="warning",
                    )
                    await asyncio.sleep(backoff)
                else:
                    logger.exception("Agent %s permanently failed after %d attempts", agent_id, max_attempts)
                    await self._emitter.error(node, agent_id, str(exc)[:300])
                    await self._emitter.node_update(node, "failed", 100, agent.name)
                    await self._emitter.log(agent_id, f"{agent.name}: failed — {str(exc)[:160]}", level="error")
                    return False
            finally:
                if not directive and attempt == 1:
                    self._completed_units += 1
                    await self._emitter.progress(int(self._completed_units / TOTAL_UNITS * 90))

        return False

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

    async def run(
        self,
        idea: str,
        title: str | None = None,
        only_missing: bool = True,
        target_agents: list[str] | None = None,
    ) -> dict[str, Any]:
        # 1. Pre-load prior database state and conversation context for iterations
        prior_context = await self._memory.get_previous_project_context()
        chat_context = await self._memory.get_project_chat_context()
        existing_outputs = await self._memory.agent_store.get_all_outputs()

        self._ctx = {
            "idea": idea,
            "project_id": self._project_id,
            "prior_project_database": prior_context,
            "chat_history": chat_context,
        }
        if title:
            self._ctx["title"] = title

        # Populate context with all existing completed deliverables
        for sec_key, sec_data in existing_outputs.items():
            if sec_data:
                self._ctx[sec_key] = sec_data
        if prior_context.get("previous_document"):
            for sec_key in SECTION_OF.values():
                if sec_key not in self._ctx and prior_context["previous_document"].get(sec_key):
                    self._ctx[sec_key] = prior_context["previous_document"][sec_key]

        await self._emitter.run_started(
            [{"id": a.id, "name": a.name, "role": a.role, "node": a.node} for a in AGENTS.values()]
        )
        # The idea-intake node is satisfied as soon as we begin.
        await self._emitter.node_update("idea", "thinking", 30, "Idea Intake")

        # 2. Run all stages with checkpoint resumability
        for stage in STAGES:
            async def run_stage_agent(aid: str) -> None:
                sec = SECTION_OF[aid]
                node = get_agent(aid).node
                is_already_done = bool(self._ctx.get(sec))
                is_targeted = target_agents and aid in target_agents

                if only_missing and is_already_done and not is_targeted:
                    # Skip re-running; section is already persisted in DB
                    logger.info("Agent %s: Section '%s' already cached, restoring state", aid, sec)
                    await self._emitter.node_update(node, "complete", 100, get_agent(aid).name)
                    await self._emitter.section_complete(aid, sec, node, self._ctx[sec])
                    await self._emitter.log(aid, f"{get_agent(aid).name}: Restored from database cache ✓")
                    self._completed_units += 1
                    await self._emitter.progress(int(self._completed_units / TOTAL_UNITS * 90))
                else:
                    await self._run_agent(aid)
            async def staggered_run(aid: str, delay_idx: int) -> None:
                if delay_idx > 0:
                    await asyncio.sleep(delay_idx * 1.5)
                await run_stage_agent(aid)

            # Fan-out/fan-in: peers in a stage communicate through the shared
            # upstream context and complete before dependent stages start.
            await asyncio.gather(*(staggered_run(aid, idx) for idx, aid in enumerate(stage)))
            await asyncio.sleep(0.6)  # Gentle pacing for provider rate limits

        missing=[section for section in SECTION_OF.values() if not self._ctx.get(section)]
        if missing:
            await self._emitter.log("system",f"Run incomplete; missing required sections: {', '.join(missing)}",level="error")
            await self._emitter.run_failed(missing)
            logger.error("Workflow incomplete for %s: %s",self._project_id,missing)
            return self._ctx

        # 3. Run CEO Supervisor outer loop for quality assurance & selective refinement
        self._ctx = await self._supervisor.evaluate_and_supervise(self._ctx)

        await self._emitter.progress(100)
        await self._emitter.run_complete()
        logger.info("Workflow complete for project %s", self._project_id)
        return self._ctx
