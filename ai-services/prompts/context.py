"""Helpers to compactly summarize upstream agent outputs for downstream prompts.

We feed condensed summaries (not full JSON) to keep prompts small, which matters
for local CPU inference latency and context limits.
"""
from __future__ import annotations

from typing import Any


def _get(ctx: dict[str, Any], key: str) -> dict | None:
    val = ctx.get(key)
    return val if isinstance(val, dict) else None


def summarize_executive(ctx: dict[str, Any]) -> str:
    es = _get(ctx, "executive_summary")
    if not es:
        return ""
    lines = [
        f"Product: {es.get('project_title', '')} — {es.get('tagline', '')}",
        f"Overview: {es.get('overview', '')}",
        f"Complexity: {es.get('complexity_label', '')} ({es.get('complexity_score', '')}/100)",
        f"Estimated duration: {es.get('estimated_duration_weeks', '')} weeks, "
        f"team size ~{es.get('recommended_team_size', '')}",
        "Business goals: " + "; ".join(es.get("business_goals", [])[:4]),
        "Target users: " + "; ".join(es.get("target_users", [])[:4]),
    ]
    return "\n".join(lines)


def summarize_requirements(ctx: dict[str, Any]) -> str:
    rq = _get(ctx, "requirements")
    if not rq:
        return ""
    fr = rq.get("functional_requirements", [])
    nfr = rq.get("non_functional_requirements", [])
    parts = ["Functional requirements:"]
    parts += [f"- [{r.get('category')}] {r.get('title')}" for r in fr[:12]]
    parts.append("Non-functional requirements:")
    parts += [f"- [{r.get('category')}] {r.get('title')}" for r in nfr[:8]]
    return "\n".join(parts)


def summarize_architecture(ctx: dict[str, Any]) -> str:
    ar = _get(ctx, "architecture")
    if not ar:
        return ""
    parts = []
    for layer in ("frontend", "backend", "database", "infrastructure"):
        layer_data = ar.get(layer, {})
        techs = ", ".join(layer_data.get("technologies", [])[:6])
        parts.append(f"{layer.title()}: {techs}")
    parts.append("Recommendations: " + "; ".join(ar.get("technology_recommendations", [])[:5]))
    return "\n".join(parts)


def summarize_backlog(ctx: dict[str, Any]) -> str:
    bl = _get(ctx, "backlog")
    if not bl:
        return ""
    tasks = bl.get("tasks", [])
    epics = bl.get("epics", [])
    parts = ["Epics: " + "; ".join(e.get("title", "") for e in epics[:8])]
    parts.append(f"Total tasks: {len(tasks)}, sprints: {len(bl.get('sprints', []))}")
    return "\n".join(parts)


def build_base_context(ctx: dict[str, Any], *, include: list[str]) -> str:
    """Assemble a context block from the named upstream summaries."""
    builders = {
        "executive": summarize_executive,
        "requirements": summarize_requirements,
        "architecture": summarize_architecture,
        "backlog": summarize_backlog,
    }
    blocks = []
    for name in include:
        text = builders[name](ctx)
        if text:
            blocks.append(f"### {name.title()}\n{text}")
    return "\n\n".join(blocks)
