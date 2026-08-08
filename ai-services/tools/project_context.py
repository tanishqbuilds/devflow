"""Agent-scoped project context retrieval.

This is deliberately a tool instead of dumping all workflow state into every
prompt. Each specialist receives the full records it depends on, while derived
artifacts (diagram coordinates, Mermaid text and cost calculations) are omitted.
"""
from __future__ import annotations

import json
from typing import Any

from langchain_core.tools import tool

DEPENDENCIES: dict[str, tuple[str, ...]] = {
    "ceo": (),
    "product_manager": ("executive_summary",),
    "architect": ("executive_summary", "requirements"),
    "sprint_planner": ("executive_summary", "requirements", "architecture"),
    "risk": ("executive_summary", "requirements", "architecture"),
    "team_allocation": ("executive_summary", "architecture", "backlog"),
    "timeline": ("executive_summary", "architecture", "backlog", "team"),
    "integration": ("executive_summary", "requirements", "architecture"),
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
    return json.dumps(selected, ensure_ascii=False, separators=(",", ":"), default=str)
