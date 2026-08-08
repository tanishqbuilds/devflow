"""Inter-agent tool calling system for Devflow.

Allows one specialist agent in the AI organization to dynamically consult
another specialist agent to resolve dependencies, cross-validate technical
decisions, and elevate output quality.
"""
from __future__ import annotations

import json
from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool

from llm.langchain_client import get_chat_model
from llm.router import resolve
from utils.logging import get_logger

logger = get_logger("tools.inter_agent")


async def _run_consultation(
    target_agent_name: str,
    role_description: str,
    query: str,
    proposed_context: str = "",
) -> str:
    """Execute a lightweight specialist consultation with the target agent model."""
    logger.info("⚡ Inter-Agent Call -> Consulting %s: %s", target_agent_name, query[:80])
    model_cfg = resolve(target_agent_name.lower().replace(" ", "_"))
    model = get_chat_model(
        model=model_cfg.model,
        temperature=0.2,
        max_tokens=600,
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                f"You are the {target_agent_name} ({role_description}) at Devflow. Another specialist "
                "agent is consulting you to refine their plan. Provide concise, highly authoritative, "
                "and actionable technical guidance formatted in JSON.",
            ),
            (
                "human",
                f"Query from peer agent:\n{query}\n\nRelevant Context:\n{proposed_context}",
            ),
        ]
    )
    try:
        response = await (prompt | model).ainvoke({})
        return str(response.content)
    except Exception as exc:
        logger.warning("Inter-agent consultation fallback for %s: %s", target_agent_name, exc)
        return json.dumps({
            "consultant": target_agent_name,
            "status": "advisory",
            "guidance": f"Proceed with standard production best practices regarding: {query}",
        })


@tool
async def consult_system_architect(query: str, proposed_context: str = "") -> str:
    """Consult the System Architect on tech stack choices, database models, caching, or API designs."""
    return await _run_consultation(
        "System Architect",
        "Principal System Architect specializing in distributed systems, async databases, and scalable cloud architectures",
        query,
        proposed_context,
    )


@tool
async def consult_risk_analyst(query: str, proposed_context: str = "") -> str:
    """Consult the Risk & Security Analyst on OWASP vulnerabilities, GDPR/SOC2 compliance, and technical debt."""
    return await _run_consultation(
        "Risk Analyst",
        "Principal Risk & Security Analyst specializing in threat modeling, compliance, and mitigation strategies",
        query,
        proposed_context,
    )


@tool
async def consult_product_manager(query: str, proposed_context: str = "") -> str:
    """Consult the Product Manager on functional scope, user personas, and feature prioritization (MoSCoW/RICE)."""
    return await _run_consultation(
        "Product Manager",
        "Senior Product Manager specializing in user journeys, requirements decomposition, and acceptance criteria",
        query,
        proposed_context,
    )


@tool
async def consult_sprint_planner(query: str, proposed_context: str = "") -> str:
    """Consult the Sprint Planner on epic breakdown, task estimation, story points, and agile velocity."""
    return await _run_consultation(
        "Sprint Planner",
        "Agile Delivery Lead specializing in sprint planning, dependency DAGs, and work breakdown structures",
        query,
        proposed_context,
    )


@tool
async def consult_team_allocation(query: str, proposed_context: str = "") -> str:
    """Consult the VP of Engineering on engineering rate cards, team sizing, and financial cost modeling."""
    return await _run_consultation(
        "Team Allocation Specialist",
        "VP of Engineering specializing in team composition, compensation benchmarks, and budget estimation",
        query,
        proposed_context,
    )


@tool
async def consult_integration_agent(query: str, proposed_context: str = "") -> str:
    """Consult the DevOps / Platform Architect on CI/CD pipelines, Docker containerization, and observability."""
    return await _run_consultation(
        "Integration Agent",
        "Platform / DevOps Architect specializing in CI/CD automation, Docker/K8s deployments, and OpenTelemetry",
        query,
        proposed_context,
    )
