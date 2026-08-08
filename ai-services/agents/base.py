"""Base agent abstraction.

Every Devflow agent shares the same execution shape: take the accumulated
project context, render a dedicated prompt, call the LLM for structured output,
and return a validated dict. The differences (role, prompt, schema, model) are
pure configuration, so a single ``Agent`` class is parameterized by metadata.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Callable, Type

from pydantic import BaseModel

from llm.router import resolve
from utils.logging import get_logger
from workflows.agent_graph import build_agent_graph

logger = get_logger("agents")


@dataclass(frozen=True)
class Agent:
    id: str
    name: str
    role: str
    node: str  # the orchestration-graph node this agent drives
    schema: Type[BaseModel]
    system_prompt: str
    build_user_prompt: Callable[[dict[str, Any]], str]

    async def run(self, ctx: dict[str, Any]) -> dict[str, Any]:
        """Execute the agent against the project context, returning a plain dict."""
        started = time.time()
        logger.info("▶ %s (%s) starting", self.name, self.id)
        graph = build_agent_graph(
            agent_id=self.id,
            system_prompt=self.system_prompt,
            schema=self.schema,
            model_config=resolve(self.id),
        )
        state = await graph.ainvoke(
            {"context": ctx, "user_prompt": self.build_user_prompt(ctx)}
        )
        result = state["result"]
        elapsed = time.time() - started
        logger.info("✓ %s finished in %.1fs", self.name, elapsed)
        return result.model_dump(mode="json")
