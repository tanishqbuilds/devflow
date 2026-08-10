"""CEO Supervisor — LangGraph outer supervision loop.

Evaluates the collective output of all specialist agents for coherence,
completeness, and quality. When defects or inconsistencies are detected, the
supervisor issues targeted directives and orchestrates selective re-runs.
"""
from __future__ import annotations

import os
from typing import Any, Callable, Coroutine

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel

from agents.schemas import CEOReview
from llm.langchain_client import get_chat_model
from llm.router import resolve
from prompts.ceo import CEO_REVIEW_PROMPT, build_review_prompt
from utils.logging import get_logger
from workflows.events import EventEmitter

logger = get_logger("workflows.supervisor")

MAX_SUPERVISION_ROUNDS = int(os.getenv("MAX_SUPERVISION_ROUNDS", "2"))
ENABLE_SUPERVISION = os.getenv("ENABLE_CEO_SUPERVISION", "true").lower() in ("1", "true", "yes")


class CEOSupervisor:
    """Orchestrates outer quality evaluation and targeted re-runs across all agents."""

    def __init__(
        self,
        emitter: EventEmitter,
        project_id: str,
        run_agent_fn: Callable[[str, str | None], Coroutine[Any, Any, None]],
    ):
        self._emitter = emitter
        self._project_id = project_id
        self._run_agent = run_agent_fn
        self._round = 0

    async def evaluate_and_supervise(self, ctx: dict[str, Any]) -> dict[str, Any]:
        """Run the CEO supervision review loop over the accumulated context."""
        if not ENABLE_SUPERVISION:
            logger.info("CEO Supervision disabled via env config")
            return ctx

        model_cfg = resolve("ceo_review")
        model = get_chat_model(
            model=model_cfg.model,
            temperature=model_cfg.temperature,
            max_tokens=model_cfg.max_tokens,
        )
        reviewer = model.with_structured_output(CEOReview)

        review_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", CEO_REVIEW_PROMPT),
                ("human", "{review_content}"),
            ]
        )

        while self._round < MAX_SUPERVISION_ROUNDS:
            self._round += 1
            logger.info("🎯 CEO Supervisor starting review round %d/%d", self._round, MAX_SUPERVISION_ROUNDS)
            await self._emitter.log("ceo", f"CEO Supervisor: Evaluating collective plan quality (round {self._round}/{MAX_SUPERVISION_ROUNDS})...")

            try:
                review_content = build_review_prompt(ctx)
                review: CEOReview = await (review_prompt | reviewer).ainvoke(
                    {"review_content": review_content}
                )
            except Exception as exc:
                logger.warning("CEO Supervisor review call failed (passing by default): %s", exc)
                await self._emitter.supervisor_review(self._round, True, "Review skipped due to transient model issue")
                break

            logger.info(
                "CEO Supervisor outcome (round %d): passed=%s, directives=%d",
                self._round,
                review.passed,
                len(review.directives),
            )

            await self._emitter.supervisor_review(
                self._round,
                review.passed,
                review.overall_assessment,
                len(review.directives),
            )

            if review.passed or not review.directives:
                await self._emitter.log(
                    "ceo",
                    f"CEO Supervisor: Plan approved ✓ — {review.overall_assessment[:120]}",
                )
                break

            # Process directives and re-run flagged agents
            directives_to_run = review.directives[:3]  # Cap at 3 agents per round for token budget
            for directive in directives_to_run:
                target_agent = directive.agent_id.lower().strip()
                reason = directive.reason
                logger.info("⚡ CEO Directive: Re-running agent '%s' (reason: %s)", target_agent, reason[:100])
                await self._emitter.supervisor_directive(target_agent, reason, self._round)
                await self._emitter.log(
                    "ceo",
                    f"CEO Directive to {target_agent}: {reason[:140]}",
                    level="warning",
                )
                try:
                    await self._run_agent(target_agent, reason)
                except Exception as exc:
                    logger.warning("Failed to re-run agent '%s' during supervision: %s", target_agent, exc)

        return ctx
