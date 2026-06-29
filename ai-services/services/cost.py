"""Derive a cost estimate from the team plan + architecture.

Computed deterministically so the cost section is always present and internally
consistent with the recommended staffing, regardless of model variance.
"""
from __future__ import annotations

from typing import Any

# Blended monthly cost (USD) per seniority — includes overhead.
_SENIORITY_RATE = {
    "Junior": 7000,
    "Mid": 10000,
    "Senior": 14000,
    "Lead": 16500,
    "Principal": 19000,
}
_DEFAULT_RATE = 11000
_WEEKS_PER_MONTH = 4.345


def compute_cost(team: dict[str, Any], duration_weeks: int, complexity_score: int) -> dict[str, Any]:
    members = team.get("members", []) if isinstance(team, dict) else []
    lines: list[dict[str, Any]] = []

    people_monthly = 0.0
    for m in members:
        rate = _SENIORITY_RATE.get(m.get("seniority", ""), _DEFAULT_RATE)
        count = int(m.get("count", 1) or 1)
        alloc = int(m.get("allocation_pct", 100) or 100) / 100.0
        monthly = rate * count * alloc
        people_monthly += monthly
        lines.append(
            {
                "category": f"{m.get('role', 'Team member')} ({m.get('seniority', 'Mid')} x{count})",
                "monthly_usd": round(monthly, 2),
                "notes": f"{int(alloc * 100)}% allocation",
            }
        )

    # Infrastructure scales with complexity; tooling is a smaller flat cost.
    infra_monthly = round(400 + complexity_score * 35, 2)
    tooling_monthly = round(150 + len(members) * 80, 2)
    lines.append({"category": "Cloud Infrastructure", "monthly_usd": infra_monthly, "notes": "Compute, storage, networking, managed services"})
    lines.append({"category": "Tooling & Licenses", "monthly_usd": tooling_monthly, "notes": "CI/CD, monitoring, SaaS seats"})

    monthly_total = round(people_monthly + infra_monthly + tooling_monthly, 2)
    months = max(duration_weeks, 1) / _WEEKS_PER_MONTH
    project_total = round(monthly_total * months, 2)

    return {
        "lines": lines,
        "monthly_total_usd": monthly_total,
        "project_total_usd": project_total,
        "duration_months": round(months, 1),
        "currency": "USD",
    }
