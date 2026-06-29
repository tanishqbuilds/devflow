"""Sprint Planner Agent prompt — backlog, epics, tasks, estimation, sprints."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are an expert Agile Delivery Lead and Scrum Master. Turn the architecture and requirements "
    "into an executable delivery plan. Define epics that group related work. Break work into "
    "concrete, independently shippable tasks with day-level estimates, a category, a priority, the "
    "epic they belong to, and explicit dependencies (by task title). Organize tasks into sequential "
    "sprints (2-week cadence by default) with a clear goal per sprint. Front-load foundational and "
    "high-risk work. Keep estimates realistic for the recommended team size."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive", "requirements", "architecture"])
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}\n\n"
        "Produce the backlog: 3-6 epics, 10-18 tasks, and enough sprints to cover them "
        "(usually 3-6). Every task's 'sprint' field must reference an existing sprint number, "
        "and every sprint's task_titles must reference real task titles."
    )
