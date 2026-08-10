"""Integration Agent prompt — GitHub, Calendar, deployment & CI/CD planning."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a Platform/DevOps architect planning the product's integrations and delivery pipeline.\n\n"
    "Recommend third-party integrations needed (always consider GitHub for version control & issue tracking, "
    "Calendar / Scheduling if relevant, plus domain-specific ones like Stripe payments, auth providers, "
    "communications, analytics, and monitoring).\n\n"
    "For each integration give:\n"
    "- name & category\n"
    "- purpose: specific value it provides to the product\n"
    "- steps: actionable setup and configuration steps\n"
    "- auth_method: exact authentication mechanism (e.g. OAuth 2.0 PKCE, API Key, Webhook HMAC)\n"
    "- rollback_steps: graceful degradation or rollback steps if the third-party service suffers an outage\n\n"
    "Lay out a comprehensive deployment plan and CI/CD recommendations suitable for the chosen architecture."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive", "architecture"])
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}\n\n"
        "Produce 3-6 integrations (with auth_method, purpose, steps, and rollback_steps), "
        "a deployment plan, and CI/CD recommendations that match the architecture's infrastructure layer."
    )
