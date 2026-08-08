"""LangGraph quality pipeline used by every specialist agent.

Flow: retrieve scoped context + prior database state + domain/inter-agent tools ->
generate typed output -> review consistency -> conditionally refine once -> return schema-validated output.
"""
from __future__ import annotations

import json
import os
from typing import Any, Literal, TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from llm.langchain_client import get_chat_model
from llm.router import ModelConfig
from tools.agent_tools import get_tools_for_agent
from tools.project_context import select_project_context
from utils.logging import get_logger

logger = get_logger("workflows.agent_graph")


class QualityReview(BaseModel):
    passed: bool = Field(description="True only when the output is complete and consistent")
    issues: list[str] = Field(default_factory=list, description="Specific, actionable defects")


class AgentGraphState(TypedDict, total=False):
    context: dict[str, Any]
    scoped_context: str
    prior_database_context: str
    tool_insights: str
    user_prompt: str
    draft: BaseModel
    review: QualityReview
    result: BaseModel


def _structured(model: Any, schema: type[BaseModel]) -> Any:
    # Function calling / tool calling works across ChatGroq, OpenAI, and Ollama.
    return model.with_structured_output(schema)


def build_agent_graph(
    *,
    agent_id: str,
    system_prompt: str,
    schema: type[BaseModel],
    model_config: ModelConfig,
) -> Any:
    """Compile a fresh, stateless graph for an agent configuration with domain tools and iteration memory."""
    model = get_chat_model(
        model=model_config.model,
        temperature=model_config.temperature,
        max_tokens=model_config.max_tokens,
    )
    generator = _structured(model, schema)
    reviewer = _structured(
        get_chat_model(model=model_config.model, temperature=0.0, max_tokens=700),
        QualityReview,
    )

    generation_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("system", "Authoritative upstream project context (JSON):\n{scoped_context}"),
            ("system", "Prior Project Database & Historical Revision Context (JSON):\n{prior_database_context}"),
            ("system", "Specialist Domain Knowledge & Inter-Agent Tool Insights (JSON):\n{tool_insights}"),
            ("human", "{user_prompt}"),
        ]
    )
    review_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a strict software-plan quality gate. Check the candidate against the "
                "request, authoritative context, prior database state, and domain benchmarks. "
                "Fail only for material defects: missing scope, contradictions with prior decisions, "
                "invalid cross-references, implausible estimates, generic filler, or technology choices "
                "inconsistent with upstream decisions. Return at most five short, actionable issues.",
            ),
            (
                "human",
                "Request:\n{user_prompt}\n\nContext:\n{scoped_context}\n\nCandidate:\n{candidate}",
            ),
        ]
    )
    refine_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            (
                "system",
                "Revise the candidate to resolve every quality issue while preserving correct, "
                "specific content, domain consistency, and alignment with prior database decisions. "
                "The response must satisfy the configured output schema.",
            ),
            ("system", "Domain Knowledge & Database Benchmarks (JSON):\n{tool_insights}"),
            (
                "human",
                "Request:\n{user_prompt}\n\nContext:\n{scoped_context}\n\n"
                "Candidate:\n{candidate}\n\nQuality issues:\n{issues}",
            ),
        ]
    )

    async def retrieve_context(state: AgentGraphState) -> dict[str, Any]:
        scoped = await select_project_context.ainvoke(
            {"agent_id": agent_id, "project_context": state["context"]}
        )

        # Extract prior database context if this is a reiteration / modification
        prior_db = state["context"].get("prior_project_database", {})
        prior_context_str = json.dumps(
            prior_db.get("previous_document") or prior_db or {},
            ensure_ascii=False,
            separators=(",", ":"),
            default=str,
        )

        # Execute specialist tools and retrieve domain database & inter-agent insights
        tools = get_tools_for_agent(agent_id)
        tool_results: dict[str, Any] = {}
        for t in tools:
            try:
                res = await t.ainvoke({})
                tool_results[t.name] = json.loads(res) if isinstance(res, str) else res
            except Exception:
                try:
                    res = t.invoke({})
                    tool_results[t.name] = json.loads(res) if isinstance(res, str) else res
                except Exception as exc:
                    logger.debug("Tool %s execution fallback: %s", t.name, exc)

        return {
            "scoped_context": scoped,
            "prior_database_context": prior_context_str,
            "tool_insights": json.dumps(tool_results, ensure_ascii=False, separators=(",", ":"), default=str),
        }

    async def generate(state: AgentGraphState) -> dict[str, Any]:
        draft = await (generation_prompt | generator).ainvoke(state)
        return {"draft": draft}

    async def review(state: AgentGraphState) -> dict[str, Any]:
        if os.getenv("LLM_QUALITY_REVIEW", "true").lower() not in {"1", "true", "yes"}:
            return {"review": QualityReview(passed=True)}
        try:
            result = await (review_prompt | reviewer).ainvoke(
                {
                    **state,
                    "candidate": state["draft"].model_dump_json(),
                }
            )
            logger.info("Agent %s quality review: passed=%s", agent_id, result.passed)
            return {"review": result}
        except Exception as exc:
            # A reviewer outage must not discard an already schema-valid result.
            logger.warning("Agent %s quality review skipped: %s", agent_id, str(exc)[:200])
            return {"review": QualityReview(passed=True)}

    def route_after_review(state: AgentGraphState) -> Literal["refine", "finish"]:
        return "finish" if state["review"].passed else "refine"

    async def refine(state: AgentGraphState) -> dict[str, Any]:
        revised = await (refine_prompt | generator).ainvoke(
            {
                **state,
                "candidate": state["draft"].model_dump_json(),
                "issues": "\n".join(f"- {issue}" for issue in state["review"].issues),
            }
        )
        return {"result": revised}

    async def finish(state: AgentGraphState) -> dict[str, Any]:
        return {"result": state["draft"]}

    graph = StateGraph(AgentGraphState)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("generate", generate)
    graph.add_node("review", review)
    graph.add_node("refine", refine)
    graph.add_node("finish", finish)
    graph.add_edge(START, "retrieve_context")
    graph.add_edge("retrieve_context", "generate")
    graph.add_edge("generate", "review")
    graph.add_conditional_edges(
        "review", route_after_review, {"refine": "refine", "finish": "finish"}
    )
    graph.add_edge("refine", END)
    graph.add_edge("finish", END)
    return graph.compile()
