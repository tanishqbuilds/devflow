"""Agent-scoped project context retrieval (v2 — 6-agent roster).

Maps each agent to the upstream sections it depends on, so downstream
agents receive only what they need instead of the entire accumulated state.
"""
from __future__ import annotations

import json
from typing import Any

from langchain_core.tools import tool

DEPENDENCIES: dict[str, tuple[str, ...]] = {
    "requirement_agent": (),
    "architect_agent": ("requirements",),
    "sprint_planner_agent": ("requirements", "architecture"),
    "github_monitor": ("backlog",),
    "risk_agent": ("requirements", "architecture", "backlog", "github_progress"),
    "deployment_advisor": ("requirements", "architecture", "risks"),
}

_DERIVED_ARCHITECTURE_KEYS = {"diagram", "mermaid"}


@tool
def select_project_context(agent_id: str, project_context: dict[str, Any]) -> str:
    """Return the authoritative project facts relevant to one specialist agent."""
    selected: dict[str, Any] = {
        "idea": project_context.get("idea", ""),
        "title": project_context.get("title"),
    }
    for key in DEPENDENCIES.get(agent_id, ()):
        value = project_context.get(key)
        if key == "architecture" and isinstance(value, dict):
            value = {k: v for k, v in value.items() if k not in _DERIVED_ARCHITECTURE_KEYS}
        if value is not None:
            selected[key] = value
    result = json.dumps(selected, ensure_ascii=False, separators=(",", ":"), default=str)
    # Truncate to stay within free-tier TPM limits (~2500 chars ≈ 700 tokens)
    if len(result) > 2500:
        result = result[:2500] + '..."}'
    return result
