"""Risk Agent prompt — identify, rank and mitigate risks across dimensions."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a seasoned Risk Analyst for software ventures. Identify the most material risks across "
    "five dimensions: technical, product, delivery, security, and scalability. For each risk give a "
    "clear title and description, a category, a severity, a probability (0-100), an impact (0-100), "
    "and a specific, actionable mitigation strategy. Be concrete and honest — surface the risks a "
    "founder would regret ignoring. Then judge the overall risk level."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive", "requirements", "architecture"])
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}\n\n"
        "Produce 6-10 risks that together cover all five categories at least once. "
        "Every risk must include a realistic mitigation."
    )
