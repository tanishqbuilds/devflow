"""Model router.

Maps each agent to a model + generation parameters. The default model comes
from ``LLM_MODEL``; any agent can be overridden with ``LLM_MODEL_<AGENT>``
(e.g. ``LLM_MODEL_RISK=llama3.1``). This lets us route heavier reasoning
agents to stronger models while keeping cheap agents on a fast one.
"""
from __future__ import annotations

import os
from dataclasses import dataclass

from utils.env import load_runtime_env
from utils.logging import get_logger

load_runtime_env()
logger = get_logger("llm.router")


DEFAULT_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
SMART_MODEL = os.getenv("LLM_MODEL_SMART", DEFAULT_MODEL)
FAST_MODEL = os.getenv("LLM_MODEL_FAST", "llama-3.1-8b-instant")


@dataclass(frozen=True)
class ModelConfig:
    model: str
    temperature: float
    max_tokens: int


_PROFILES: dict[str, ModelConfig] = {
    "requirement_agent": ModelConfig(SMART_MODEL, 0.4, 3500),
    "architect_agent": ModelConfig(SMART_MODEL, 0.35, 3500),
    "sprint_planner_agent": ModelConfig(SMART_MODEL, 0.3, 3500),
    "github_monitor": ModelConfig(FAST_MODEL, 0.3, 1500),
    "risk_agent": ModelConfig(FAST_MODEL, 0.4, 1500),
    "deployment_advisor": ModelConfig(FAST_MODEL, 0.4, 2000),
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
