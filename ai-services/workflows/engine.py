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
import os
import re
from typing import Any

from agents.registry import AGENTS, get_agent
from llm.router import FAST_MODEL, SECONDARY_MODEL, ModelConfig, resolve
from memory.project_memory import ProjectMemory
from services.cost import compute_cost
from services.diagram import build_diagram, build_mermaid
from services.evaluation import evaluate_agent_output
from services.rag import ensure_project_index, index_agent_output
from services.resilient_outputs import build_integration_runbook
from services.run_trace import finish_run, record_step, start_run
from utils.logging import get_logger
from workflows.events import EventEmitter, EventListener
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


def _is_provider_rate_limit(exc: Exception) -> bool:
    """Identify transport/provider throttles without scanning generated JSON."""
    status_code = getattr(exc, "status_code", None)
    if status_code == 429:
        return True
    class_name = type(exc).__name__.lower().replace("_", "")
    if "ratelimit" in class_name:
        return True
    message = str(exc)
    return bool(
        re.search(r"(?:error|status)\s*code\s*[:=]\s*429\b", message, re.IGNORECASE)
        or re.search(r"['\"]code['\"]\s*:\s*['\"]rate_limit_exceeded['\"]", message)
    )


def _is_daily_quota_exhausted(exc: Exception) -> bool:
    """Daily token quotas cannot recover within this run's retry window."""
    message = str(exc)
    return bool(
        re.search(r"tokens\s+per\s+day|\bTPD\b|daily\s+(?:token\s+)?(?:limit|quota)", message, re.IGNORECASE)
    )


def _is_request_too_large(exc: Exception) -> bool:
    status_code = getattr(exc, "status_code", None)
    return status_code == 413 or "request too large" in str(exc).lower()


def _provider_retry_delay(exc: Exception, attempt: int) -> float:
    """Honor provider retry hints and leave a small window-reset buffer."""
    response = getattr(exc, "response", None)
    headers = getattr(response, "headers", None)
    if headers:
        retry_after = headers.get("retry-after")
        if retry_after:
            try:
                return min(float(retry_after) + 2.0, 180.0)
            except (TypeError, ValueError):
                pass

    match = re.search(
        r"try again in\s+(\d+(?:\.\d+)?)\s*(ms|s|sec(?:ond)?s?|m|min(?:ute)?s?)?",
        str(exc),
        flags=re.IGNORECASE,
    )
    if match:
        delay = float(match.group(1))
        unit = (match.group(2) or "s").lower()
        if unit == "ms":
            delay /= 1000.0
        elif unit.startswith("m"):
            delay *= 60.0
        return min(delay + 2.0, 180.0)
    return min(20.0 * attempt, 180.0)


class WorkflowEngine:
    def __init__(
        self,
        project_id: str,
        user_id: str | None = None,
        listener: EventListener | None = None,
        redis: Any = None,
    ):
        self._emitter = EventEmitter(project_id, listener=listener)
        self._project_id = project_id
        self._memory = ProjectMemory(project_id, user_id)
        self._ctx: dict[str, Any] = {}
        self._completed_units = 0
        self._agent_versions: dict[str, int] = {}
        self._supervisor = CEOSupervisor(self._emitter, project_id, self._run_agent)
        self._run_id: str | None = None
        self._run_started_at: float | None = None
        # Groq's free/on-demand tiers have a shared TPM window. Serializing
        # peers prevents their retries from repeatedly colliding in that same
        # window. Higher-tier or local providers can opt back into fan-out.
        default_concurrency = "1" if os.getenv("LLM_PROVIDER", "groq").lower() == "groq" else "3"
        try:
            configured_concurrency = int(os.getenv("LLM_STAGE_CONCURRENCY", default_concurrency))
        except ValueError:
            configured_concurrency = int(default_concurrency)
        self._stage_concurrency = max(1, configured_concurrency)

    async def _run_agent(
        self, agent_id: str, directive: str | None = None, max_attempts: int = 3
    ) -> bool:
        agent = get_agent(agent_id)
        node = agent.node
        section = SECTION_OF[agent_id]
        version = self._agent_versions.get(agent_id, 0) + 1
        self._agent_versions[agent_id] = version
        try:
            max_provider_retries = max(1, int(os.getenv("LLM_RATE_LIMIT_RETRIES", "6")))
        except ValueError:
            max_provider_retries = 6
        generation_attempt = 1
        provider_retries = 0
        model_override: ModelConfig | None = None
        secondary_fallback_used = False

        while generation_attempt <= max_attempts:
            try:
                await self._emitter.node_update(node, "thinking", 20, agent.name)
                msg = _WORKING_MSG.get(agent_id, "working...")
                if directive:
                    msg = f"Addressing CEO directive: {directive[:80]}..."
                elif provider_retries:
                    msg = f"Retrying after provider pause ({provider_retries}/{max_provider_retries})..."
                elif generation_attempt > 1:
                    msg = f"Retrying structured output ({generation_attempt}/{max_attempts})..."
                await self._emitter.log(agent_id, f"{agent.name}: {msg}")

                data = await agent.run(
                    self._ctx, directive=directive, model_config=model_override
                )
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
                await index_agent_output(self._project_id, agent_id, section, data)

                await self._emitter.section_complete(agent_id, section, node, data)
                await self._emitter.node_update(node, "complete", 100, agent.name)
                await self._emitter.log(agent_id, f"{agent.name}: complete ✓")

                # The sprint planner also satisfies the dedicated 'sprint' graph node.
                if agent_id == "sprint_planner":
                    await self._emitter.node_update("sprint", "complete", 100, "Sprint Plan")
                if not directive:
                    self._completed_units += 1
                    await self._emitter.progress(int(self._completed_units / TOTAL_UNITS * 90))
                return True

            except Exception as exc:
                err_msg = str(exc)
                is_rate_limit = _is_provider_rate_limit(exc)
                quota_exhausted = is_rate_limit and _is_daily_quota_exhausted(exc)
                request_too_large = _is_request_too_large(exc)
                logger.warning(
                    "Agent %s generation attempt %d/%d failed%s: %s",
                    agent_id,
                    generation_attempt,
                    max_attempts,
                    f" (provider retry {provider_retries}/{max_provider_retries})" if is_rate_limit else "",
                    err_msg[:200],
                )
                if quota_exhausted and model_override is None:
                    configured = resolve(agent_id)
                    if configured.model != FAST_MODEL:
                        fallback_caps = {
                            "architect": 1800,
                            "product_manager": 1800,
                            "risk": 1600,
                            "timeline": 1000,
                            "integration": 1200,
                        }
                        model_override = ModelConfig(
                            FAST_MODEL, min(configured.temperature, 0.3),
                            min(configured.max_tokens, fallback_caps.get(agent_id, 1600)),
                        )
                        provider_retries = 0
                        await self._emitter.log(
                            agent_id,
                            f"{agent.name}: smart-model daily quota exhausted; falling back to {FAST_MODEL}...",
                            level="warning",
                        )
                        continue

                if is_rate_limit and not quota_exhausted and provider_retries < max_provider_retries:
                    provider_retries += 1
                    try:
                        switch_after = max(1, int(os.getenv("LLM_SECONDARY_AFTER_RETRIES", "3")))
                    except ValueError:
                        switch_after = 3
                    active_model = (model_override or resolve(agent_id)).model
                    if (
                        provider_retries >= switch_after
                        and not secondary_fallback_used
                        and active_model != SECONDARY_MODEL
                    ):
                        configured = model_override or resolve(agent_id)
                        model_override = ModelConfig(
                            SECONDARY_MODEL,
                            min(configured.temperature, 0.3),
                            min(configured.max_tokens, 1600),
                        )
                        secondary_fallback_used = True
                        provider_retries = 0
                        await self._emitter.log(
                            agent_id,
                            f"{agent.name}: primary fallback remains throttled; switching to {SECONDARY_MODEL}...",
                            level="warning",
                        )
                        continue
                    backoff = _provider_retry_delay(exc, provider_retries)
                    await self._emitter.log(
                        agent_id,
                        f"{agent.name}: transient provider rate limit, pausing {backoff:.1f}s "
                        f"before provider retry ({provider_retries}/{max_provider_retries})...",
                        level="warning",
                    )
                    await asyncio.sleep(backoff)
                    continue

                if not is_rate_limit and not request_too_large and generation_attempt < max_attempts:
                    backoff = 2.0 * generation_attempt
                    await self._emitter.log(
                        agent_id,
                        f"{agent.name}: generation or validation error, pausing {backoff:.1f}s "
                        f"before structured-output retry ({generation_attempt}/{max_attempts})...",
                        level="warning",
                    )
                    generation_attempt += 1
                    provider_retries = 0
                    await asyncio.sleep(backoff)
                    continue

                if request_too_large:
                    failure_reason = "provider request exceeds the model token budget"
                elif quota_exhausted:
                    failure_reason = "provider daily token quota exhausted"
                elif is_rate_limit:
                    failure_reason = f"provider rate limit persisted after {max_provider_retries} retries"
                else:
                    failure_reason = f"structured output failed after {max_attempts} attempts"
                # Keep a deployable, transparent baseline during a total model
                # outage. This path is deterministic, quality-gated, and
                # explicitly marked in both output and run provenance.
                if agent_id == "integration":
                    fallback_started = asyncio.get_event_loop().time()
                    data = build_integration_runbook(self._ctx)
                    fallback_issues, fallback_metrics = evaluate_agent_output(agent_id, data)
                    if fallback_issues:
                        raise RuntimeError(
                            "resilience runbook failed deterministic quality gates: "
                            + "; ".join(fallback_issues)
                        )
                    self._ctx[section] = data
                    await record_step(
                        self._run_id, agent_id, "resilience_tool", "complete",
                        input_context={"reason": failure_reason},
                        output={
                            "generation_mode": data["generation_mode"],
                            "quality_metrics": fallback_metrics,
                        },
                        started_at=fallback_started,
                    )
                    await self._memory.agent_store.save_output(agent_id, section, data, version=version)
                    await self._memory.save_iteration_diff(section, data)
                    await index_agent_output(self._project_id, agent_id, section, data)
                    await self._emitter.section_complete(agent_id, section, node, data)
                    await self._emitter.node_update(node, "complete", 100, agent.name)
                    await self._emitter.log(
                        agent_id,
                        f"{agent.name}: provider unavailable; auditable resilience runbook generated ✓",
                        level="warning",
                    )
                    if not directive:
                        self._completed_units += 1
                        await self._emitter.progress(int(self._completed_units / TOTAL_UNITS * 90))
                    return True
                logger.exception("Agent %s permanently failed: %s", agent_id, failure_reason)
                await self._emitter.error(node, agent_id, str(exc)[:300])
                await self._emitter.node_update(node, "failed", 100, agent.name)
                await self._emitter.log(
                    agent_id,
                    f"{agent.name}: failed ({failure_reason}) — {str(exc)[:120]}",
                    level="error",
                )
                if not directive:
                    self._completed_units += 1
                    await self._emitter.progress(int(self._completed_units / TOTAL_UNITS * 90))
                return False

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
        # 1. Establish durable provenance and index all authoritative project
        # sources before any specialist is allowed to generate.
        self._run_started_at = asyncio.get_event_loop().time()
        self._run_id = await start_run(
            self._project_id,
            "targeted_retry" if target_agents else ("resume" if only_missing else "analysis"),
            {"idea": idea, "title": title, "target_agents": target_agents or []},
        )
        rag_started = asyncio.get_event_loop().time()
        rag_metrics = await ensure_project_index(self._project_id)
        await record_step(
            self._run_id, "orchestrator", "index_sources", "complete",
            output=rag_metrics, started_at=rag_started,
        )

        # 2. Pre-load prior database state and conversation context for iterations
        prior_context = await self._memory.get_previous_project_context()
        chat_context = await self._memory.get_project_chat_context()
        existing_outputs = await self._memory.agent_store.get_all_outputs()

        self._ctx = {
            "idea": idea,
            "project_id": self._project_id,
            "prior_project_database": prior_context,
            "chat_history": chat_context,
            "run_id": self._run_id,
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
        # A targeted re-run must prove its replacement output. Remove the old
        # value from working context so a failed re-run cannot be mistaken for
        # a successful completion merely because stale data existed.
        for agent_id in target_agents or []:
            section = SECTION_OF.get(agent_id)
            if section:
                self._ctx.pop(section, None)

        await self._emitter.run_started(
            [{"id": a.id, "name": a.name, "role": a.role, "node": a.node} for a in AGENTS.values()]
        )
        # The idea-intake node is satisfied as soon as we begin.
        await self._emitter.node_update("idea", "thinking", 30, "Idea Intake")

        # 3. Run all stages with checkpoint resumability
        for stage in STAGES:
            stage_limit = asyncio.Semaphore(min(self._stage_concurrency, len(stage)))

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
                async with stage_limit:
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
            await finish_run(
                self._run_id, "failed",
                output_summary={"completed_sections": sorted(k for k in SECTION_OF.values() if self._ctx.get(k))},
                metrics={"rag": rag_metrics}, error=f"missing sections: {', '.join(missing)}",
            )
            return self._ctx

        # 4. Run CEO Supervisor outer loop for quality assurance & selective refinement
        self._ctx = await self._supervisor.evaluate_and_supervise(self._ctx)

        await self._emitter.progress(100)
        await self._emitter.run_complete()
        elapsed_ms = int((asyncio.get_event_loop().time() - self._run_started_at) * 1000)
        await finish_run(
            self._run_id, "complete",
            output_summary={"sections": sorted(SECTION_OF.values())},
            metrics={"rag": rag_metrics, "duration_ms": elapsed_ms},
        )
        logger.info("Workflow complete for project %s", self._project_id)
        return self._ctx
