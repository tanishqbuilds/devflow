"""System Architect Agent prompt — architecture across all layers."""
from __future__ import annotations

from typing import Any

from prompts.context import build_base_context

SYSTEM_PROMPT = (
    "You are a principal System Architect. Design a pragmatic, production-grade architecture "
    "for the product across four layers: frontend, backend, database, and infrastructure.\n\n"
    "For each layer give a summary, the key components, the recommended technologies, the "
    "important architectural decisions (and why), and key_entities (primary data models, schemas, "
    "or API endpoints relevant to that layer).\n\n"
    "Provide overall technology recommendations, a concrete scalability plan, and integration points. "
    "Favor proven, modern, well-supported technologies. Keep choices internally consistent across layers. "
    "Commit to ONE specific technology per concern — pick a single frontend framework, a single primary database, etc. "
    "Never list alternatives like 'React, Angular, Vue' or 'MySQL, PostgreSQL'; decide and recommend the one you would build with. "
    "Respect all binding decisions and constraints from upstream CEO and Product Manager."
)


def build_user_prompt(ctx: dict[str, Any]) -> str:
    context = build_base_context(ctx, include=["executive", "requirements"])
    es = ctx.get("executive_summary", {})
    decisions = es.get("key_decisions", []) if isinstance(es, dict) else []
    decisions_block = ""
    if decisions:
        decisions_block = (
            "\n\nUpstream CEO Strategic Decisions:\n"
            + "\n".join(f"- {d}" for d in decisions)
        )
    return (
        f"Founder's idea:\n\"{ctx.get('idea', '')}\"\n\n"
        f"{context}{decisions_block}\n\n"
        "Design the full architecture. Ensure the database layer lists main data entities and key_entities "
        "with schema details, the backend lists services/modules and API routes, the frontend lists major UI surfaces "
        "and client state management, and infrastructure covers hosting, CI/CD, observability and scaling."
    )
