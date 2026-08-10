"""Timeline Agent prompt — milestones, schedule, dependencies, roadmap."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a Delivery Manager building the roadmap. Produce milestones that move the product "
    "through phases: mvp, beta, production, and scaling.\n\n"
    "For each milestone give:\n"
    "- title & description\n"
    "- phase (mvp, beta, production, scaling)\n"
    "- start_week (0-based) and duration_weeks\n"
    "- deliverables: concrete artifacts, working features, and documentation produced\n"
    "- dependencies: prerequisite milestone titles\n"
    "- go_no_go_criteria: strict quality, test coverage, and validation criteria that MUST pass before transitioning to the next phase\n\n"
    "Identify the critical path and ensure total_duration_weeks is consistent with executive estimates and backlog size."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive", "architecture", "backlog"])
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}\n\n"
        "Produce 4-7 milestones spanning mvp -> beta -> production -> scaling, with sensible "
        "start_week / duration_weeks, deliverables, dependencies, and go_no_go_criteria for each phase gate."
    )
