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
from services.rag import format_retrieved_context, retrieve_for_agent
from prompts.context import (
    summarize_architecture,
    summarize_backlog,
    summarize_executive,
    summarize_requirements,
)
from utils.logging import get_logger
from pydantic import BaseModel, Field

logger = get_logger("assistant")

SYSTEM_PROMPT = (
    "You are Devflow's project assistant, embedded inside a software delivery workspace. "
    "You help a product manager / founder understand, refine, and act on THIS project's plan. "
    "Answer using only the project context provided — if something isn't in the plan, say so and "
    "suggest how to add it. Be concise and concrete: prefer short paragraphs and tight bullet lists, "
    "give specific numbers from the plan, and end with a suggested next step when useful. "
    "Never invent metrics that aren't in the context."
)

class AssistantEdit(BaseModel):
    path: str = Field(description="Existing JSON pointer path in the project, e.g. /executive_summary/tagline")
    value: Any

class AssistantCommand(BaseModel):
    reply: str
    edits: list[AssistantEdit] = Field(default_factory=list)


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
) -> AssistantCommand:
    model = get_chat_model(model=FAST_MODEL, temperature=0.45, max_tokens=600)
    context = build_project_context(project)
    retrieved = await retrieve_for_agent(
        str(project.get("id", "")), "product_manager", message, limit=6
    )
    evidence = format_retrieved_context(retrieved, max_chars=6000)
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

    command_model = model.with_structured_output(AssistantCommand)
    compact_json=__import__('json').dumps(project,default=str,separators=(",",":"))[:10000]
    messages[0] = SystemMessage(content=f"{SYSTEM_PROMPT}\n\nYou are named Flowmate. You may edit the workspace when the user asks. For an edit request, return the smallest set of JSON-pointer edits targeting existing user-facing fields; never target id, user_id, workspace_id, revision, orchestration, status, or progress. For a question, return no edits. Always set reply and make edits an array. When retrieved evidence materially supports an answer, cite its identifier exactly as [SOURCE kind:key#chunk].\n\n--- PROJECT SUMMARY ---\n{context}\n\n--- RETRIEVED EVIDENCE ---\n{evidence}\n\n--- EDITABLE PROJECT JSON (TRUNCATED) ---\n{compact_json}")
    try:
        return await command_model.ainvoke(messages)
    except Exception as exc:
        # Some smaller OpenAI-compatible models emit a useful tool payload that
        # narrowly misses the schema (commonly one edit object instead of a list).
        # Recover it before falling back to a normal conversational completion.
        import json, re
        match=re.search(r'<function=AssistantCommand>\s*(\{.*?\})\s*</function>',str(exc),re.S)
        if match:
            try:
                raw=json.loads(match.group(1)); edits=raw.get("edits",[])
                if isinstance(edits,dict): edits=[edits]
                return AssistantCommand(reply=raw.get("reply") or f"Applied {len(edits)} requested workspace change(s).",edits=edits)
            except Exception:
                pass
        logger.warning("Structured Flowmate response failed; falling back to text: %s",str(exc)[:180])
        response=await model.ainvoke(messages)
        reply=str(response.content).strip()
        edits=[]
        for block in re.findall(r"```(?:json)?\s*(\{.*?\})\s*```",reply,re.S):
            try:
                mapping=json.loads(block)
                edits.extend(AssistantEdit(path=path,value=value) for path,value in mapping.items() if str(path).startswith("/"))
            except Exception:
                continue
        return AssistantCommand(reply=reply,edits=edits)
