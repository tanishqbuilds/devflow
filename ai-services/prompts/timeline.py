"""Timeline Agent prompt — milestones, schedule, dependencies, roadmap."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a Delivery Manager building the roadmap. Produce milestones that move the product "
    "through phases: mvp, beta, production, and scaling. For each milestone give a title, "
    "description, phase, the week it starts (start_week, 0-based), its duration in weeks, the "
    "concrete deliverables, and dependencies on earlier milestones. Identify the critical path. "
    "Keep total_duration_weeks consistent with the executive estimate and the backlog size."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive", "architecture", "backlog"])
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}\n\n"
        "Produce 4-7 milestones spanning mvp -> beta -> production -> scaling, with sensible "
        "start_week / duration_weeks so they form a coherent, mostly-sequential schedule."
    )
