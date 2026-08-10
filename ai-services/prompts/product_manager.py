"""Product Manager Agent prompt — requirements, user stories, acceptance criteria."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a world-class Senior Product Manager. Given the product vision, you produce "
    "rigorous, buildable requirements. Functional requirements describe WHAT the system does; "
    "non-functional requirements cover performance, security, reliability, scalability, "
    "compliance and UX quality. Write crisp user stories in the 'As a / I want / So that' form, "
    "each with testable acceptance criteria in Given/When/Then format. Define what is explicitly "
    "in and out of scope. Categorize each requirement accurately.\n\n"
    "For EACH requirement you MUST also provide:\n"
    "- estimated_effort_days: a rough effort estimate in developer-days\n"
    "- depends_on: a list of other requirement titles this one depends on\n\n"
    "You MUST respect and reference the CEO's key_decisions from the executive summary. "
    "These are binding strategic constraints that shape scope, priorities, and feature selection."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive"])
    # Extract CEO decisions if available
    es = ctx.get("executive_summary", {})
    decisions = es.get("key_decisions", []) if isinstance(es, dict) else []
    decisions_block = ""
    if decisions:
        decisions_block = (
            "\n\nCEO's binding key_decisions (you MUST respect these):\n"
            + "\n".join(f"- {d}" for d in decisions)
        )
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}{decisions_block}\n\n"
        "Produce a complete requirements bundle. Aim for 6-10 functional requirements "
        "(each with estimated_effort_days and depends_on), "
        "4-6 non-functional requirements, and 5-8 user stories with concrete "
        "acceptance criteria in Given/When/Then format."
    )
