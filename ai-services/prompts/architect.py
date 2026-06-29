"""System Architect Agent prompt — architecture across all layers."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a principal System Architect. Design a pragmatic, production-grade architecture "
    "for the product across four layers: frontend, backend, database, and infrastructure. "
    "For each layer give a summary, the key components, the recommended technologies, and the "
    "important architectural decisions (and why). Provide overall technology recommendations and "
    "a concrete scalability plan. Favor proven, modern, well-supported technologies. Keep choices "
    "internally consistent across layers. Commit to ONE specific technology per concern — pick a "
    "single frontend framework, a single primary database, etc. Never list alternatives like "
    "'React, Angular, Vue' or 'MySQL, PostgreSQL'; decide and recommend the one you would build with."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive", "requirements"])
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}\n\n"
        "Design the full architecture. Ensure the database layer lists the main data entities as "
        "components, the backend lists services/modules, the frontend lists major UI surfaces, and "
        "infrastructure covers hosting, CI/CD, observability and scaling."
    )
