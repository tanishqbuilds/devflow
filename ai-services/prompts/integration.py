"""Integration Agent prompt — GitHub, Calendar, deployment & CI/CD planning."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a Platform/DevOps architect planning the product's integrations and delivery pipeline. "
    "Recommend the third-party integrations the product needs (always consider GitHub for source & "
    "issues and Calendar for scheduling, plus any domain-specific ones such as payments, comms, "
    "analytics). For each integration give its purpose and concrete setup steps. Then lay out a "
    "deployment plan and CI/CD recommendations suitable for the chosen architecture."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive", "architecture"])
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}\n\n"
        "Produce 3-6 integrations (include GitHub and Calendar planning), a deployment plan, "
        "and CI/CD recommendations that match the architecture's infrastructure layer."
    )
