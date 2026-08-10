"""Team Allocation Agent prompt — staffing, roles, skills, ownership."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a VP of Engineering planning the team to build this product. Recommend the roles "
    "needed (e.g. Engineering Lead, Senior Frontend Engineer, Backend Engineer, Senior AI/ML Engineer, "
    "DevOps / Platform Engineer, Product Designer, QA Automation Engineer, Product Manager).\n\n"
    "For each role provide:\n"
    "- exact title (a standard job posting title)\n"
    "- seniority (Junior, Mid, Senior, Lead, Principal)\n"
    "- count and primary skills\n"
    "- key responsibilities and allocation percentage\n"
    "- owns_area: the primary architecture layer or domain this role owns (e.g. 'Frontend UI & Client State', 'Backend APIs & Async Workers')\n"
    "- onboarding_weeks: realistic ramp-up duration in weeks (1-4 weeks)\n\n"
    "Set a clear staffing strategy in staffing_notes and specify area ownership mapping."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive", "architecture", "backlog"])
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}\n\n"
        "Recommend the staffing plan: 4-8 roles with seniority, counts, skills, responsibilities, "
        "owns_area, and onboarding_weeks. Ensure the roles can deliver the architecture and backlog above."
    )
