"""Product Manager Agent prompt — requirements, user stories, acceptance criteria."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a world-class Senior Product Manager. Given the product vision, you produce "
    "rigorous, buildable requirements. Functional requirements describe WHAT the system does; "
    "non-functional requirements cover performance, security, reliability, scalability, "
    "compliance and UX quality. Write crisp user stories in the 'As a / I want / So that' form, "
    "each with testable acceptance criteria. Define what is explicitly in and out of scope. "
    "Categorize each requirement accurately."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive"])
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}\n\n"
        "Produce a complete requirements bundle. Aim for 6-10 functional requirements, "
        "4-6 non-functional requirements, and 5-8 user stories with concrete acceptance criteria."
    )
