"""Model router.

Maps each agent to a model + generation parameters. The default model comes
from ``LLM_MODEL``; any agent can be overridden with ``LLM_MODEL_<AGENT>``
(e.g. ``LLM_MODEL_RISK=llama3.1``). This lets us route heavier reasoning
agents to stronger models while keeping cheap agents on a fast one.
"""
from __future__ import annotations

import os
from dataclasses import dataclass

from utils.logging import get_logger

logger = get_logger("llm.router")

DEFAULT_MODEL = os.getenv("LLM_MODEL", "qwen3")

# On Groq's free tier the binding constraints are tokens-per-minute and tokens-per-day,
# and the 3 parallel agents in stage 4 can spike TPM. So we route the three "foundation"
# agents that set coherence (CEO, PM, Architect) — which run sequentially, one at a time —
# to a stronger model, and route the parallel / downstream agents to a fast, high-limit
# model. Both default to the configured ``LLM_MODEL`` when these envs are unset, so nothing
# changes for non-Groq setups unless explicitly configured.
SMART_MODEL = os.getenv("LLM_MODEL_SMART", DEFAULT_MODEL)
FAST_MODEL = os.getenv("LLM_MODEL_FAST", DEFAULT_MODEL)


@dataclass(frozen=True)
class ModelConfig:
    model: str
    temperature: float
    max_tokens: int


# Per-agent generation profiles. Temperature is kept low for structured output;
# creative agents (CEO/PM) get a touch more room. ``max_tokens`` is sized to the
# schema (enough to satisfy min-length lists without truncation, which would force a
# costly retry) while staying lean for free-tier token budgets.
_PROFILES: dict[str, ModelConfig] = {
    "ceo": ModelConfig(SMART_MODEL, 0.5, 1000),
    "product_manager": ModelConfig(SMART_MODEL, 0.4, 1500),
    "architect": ModelConfig(SMART_MODEL, 0.35, 1600),
    "sprint_planner": ModelConfig(FAST_MODEL, 0.3, 1600),
    "risk": ModelConfig(FAST_MODEL, 0.4, 1200),
    "team_allocation": ModelConfig(FAST_MODEL, 0.4, 1000),
    "timeline": ModelConfig(SMART_MODEL, 0.35, 1200),
    "integration": ModelConfig(FAST_MODEL, 0.4, 1000),
    # CEO supervision review — low temp for objective evaluation.
    "ceo_review": ModelConfig(SMART_MODEL, 0.2, 700),
}


def resolve(agent_id: str) -> ModelConfig:
    base = _PROFILES.get(agent_id, ModelConfig(DEFAULT_MODEL, 0.4, 2000))
    override = os.getenv(f"LLM_MODEL_{agent_id.upper()}")
    if override:
        logger.info("Agent %s routed to override model %s", agent_id, override)
        return ModelConfig(override, base.temperature, base.max_tokens)
    return base


def all_models() -> set[str]:
    return {resolve(a).model for a in _PROFILES}
