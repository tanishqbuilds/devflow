"""Project assistant — a grounded chat over a completed (or in-progress) plan.

Unlike the agents, this is a plain conversational completion (no schema). It is
given a compact summary of the project's plan so it answers from the real data
rather than hallucinating. Routed to the fast Groq model to keep it cheap.
"""
from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from llm.langchain_client import get_chat_model
from llm.router import FAST_MODEL
from prompts.context import (
    summarize_architecture,
    summarize_backlog,
    summarize_executive,
    summarize_requirements,
)
from utils.logging import get_logger

logger = get_logger("assistant")

SYSTEM_PROMPT = (
    "You are Devflow's project assistant, embedded inside a software delivery workspace. "
    "You help a product manager / founder understand, refine, and act on THIS project's plan. "
    "Answer using only the project context provided — if something isn't in the plan, say so and "
    "suggest how to add it. Be concise and concrete: prefer short paragraphs and tight bullet lists, "
    "give specific numbers from the plan, and end with a suggested next step when useful. "
    "Never invent metrics that aren't in the context."
)


def _line(label: str, value: Any) -> str:
    return f"{label}: {value}" if value not in (None, "", []) else ""


def build_project_context(project: dict[str, Any]) -> str:
    """Assemble a compact, token-light briefing from the project document."""
    parts: list[str] = []
    title = project.get("title")
    idea = project.get("idea")
    if title:
        parts.append(f"# Project: {title}")
    if idea:
        parts.append(f"Original brief: {str(idea)[:600]}")

    execu = summarize_executive(project)
    if execu:
        parts.append("## Executive\n" + execu)

    reqs = summarize_requirements(project)
    if reqs:
        parts.append("## Requirements\n" + reqs)

    arch = summarize_architecture(project)
    if arch:
        parts.append("## Architecture\n" + arch)

    backlog = summarize_backlog(project)
    if backlog:
        parts.append("## Backlog\n" + backlog)

    risks = project.get("risks") if isinstance(project.get("risks"), dict) else None
    if risks:
        items = risks.get("risks", [])[:6]
        rl = [f"- [{r.get('severity')}] {r.get('title')} (mitigation: {str(r.get('mitigation',''))[:80]})" for r in items]
        parts.append(f"## Risks (overall {risks.get('overall_risk_level','?')})\n" + "\n".join(rl))

    team = project.get("team") if isinstance(project.get("team"), dict) else None
    if team:
        members = team.get("members", [])
        tm = [f"- {m.get('count',1)}× {m.get('seniority','')} {m.get('role','')}" for m in members[:8]]
        parts.append("## Team\n" + "\n".join(tm))

    cost = project.get("cost") if isinstance(project.get("cost"), dict) else None
    if cost:
        parts.append(
            f"## Cost\nMonthly ${cost.get('monthly_total_usd',0):,.0f}; "
            f"project total ${cost.get('project_total_usd',0):,.0f} over {cost.get('duration_months','?')} months."
        )

    timeline = project.get("timeline") if isinstance(project.get("timeline"), dict) else None
    if timeline:
        ms = timeline.get("milestones", [])
        tl = [f"- {m.get('title')} ({m.get('phase')}, +{m.get('start_week')}w for {m.get('duration_weeks')}w)" for m in ms[:6]]
        parts.append(f"## Timeline (total {timeline.get('total_duration_weeks','?')}w)\n" + "\n".join(tl))

    integ = project.get("integrations") if isinstance(project.get("integrations"), dict) else None
    if integ:
        names = ", ".join(i.get("name", "") for i in integ.get("integrations", [])[:8])
        parts.append("## Integrations\n" + names)

    if len(parts) <= 2:
        parts.append("(The plan is still being generated — only partial data is available so far.)")

    return "\n\n".join(p for p in parts if p)


async def chat(
    project: dict[str, Any],
    message: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    model = get_chat_model(model=FAST_MODEL, temperature=0.45, max_tokens=600)
    context = build_project_context(project)
    messages = [
        SystemMessage(content=f"{SYSTEM_PROMPT}\n\n--- PROJECT CONTEXT ---\n{context}"),
    ]
    for turn in (history or [])[-6:]:
        role = turn.get("role")
        content = str(turn.get("content", ""))[:1500]
        if role == "user" and content:
            messages.append(HumanMessage(content=content))
        elif role == "assistant" and content:
            messages.append(AIMessage(content=content))
    messages.append(HumanMessage(content=message[:2000]))

    response = await model.ainvoke(messages)
    return str(response.content).strip()
