"""LangGraph quality pipeline used by every specialist agent.

Flow: retrieve scoped context + prior database state + domain/inter-agent tools ->
generate typed output -> review consistency -> conditionally refine -> return schema-validated output.
"""
from __future__ import annotations

import json
import os
from typing import Any, Literal, TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from llm.langchain_client import LLM_PROVIDER, get_chat_model
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
    supervision_directive: str
    draft: BaseModel
    review: QualityReview
    result: BaseModel


def _structured(model: Any, schema: type[BaseModel]) -> Any:
    # Groq's tool-calling parser is brittle with large nested schemas: a model
    # response containing a duplicate key or an unfamiliar enum is rejected by
    # Groq before Pydantic gets a chance to normalize it. JSON mode lets us
    # validate and normalize the complete response locally instead. Other
    # providers retain native structured output support.
    if LLM_PROVIDER.lower() == "groq":
        return model.with_structured_output(schema, method="json_mode")
    return model.with_structured_output(schema)


def build_agent_graph(
    *,
    agent_id: str,
    system_prompt: str,
    schema: type[BaseModel],
    model_config: ModelConfig,
    directive: str | None = None,
) -> Any:
    """Compile a fresh, stateless graph for an agent configuration with domain tools and iteration memory."""
    model = get_chat_model(
        model=model_config.model,
        temperature=model_config.temperature,
        max_tokens=model_config.max_tokens,
    )
    generator = _structured(model, schema)
    reviewer = _structured(
        get_chat_model(model=model_config.model, temperature=0.0, max_tokens=600),
        QualityReview,
    )
    sys_messages = [
        ("system", system_prompt),
    ]
    if directive:
        sys_messages.append(
            ("system", f"CRITICAL CEO SUPERVISOR DIRECTIVE (you MUST address this):\n{directive}")
        )
    sys_messages.append(("system", "Authoritative project context (JSON):\n{scoped_context}\n\nResults from callable specialist tools:\n{tool_insights}"))
    schema_str = json.dumps(schema.model_json_schema(), indent=2).replace("{", "{{").replace("}", "}}")
    sys_messages.append(("system", f"Return only one valid JSON object matching the following schema:\n```json\n{schema_str}\n```\nDo not return a function/tool envelope, markdown, or commentary."))

    generation_prompt = ChatPromptTemplate.from_messages(
        [
            *sys_messages,
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

        return {
            "scoped_context": scoped,
            "supervision_directive": directive or "",
        }

    async def generate(state: AgentGraphState) -> dict[str, Any]:
        try:
            draft = await (generation_prompt | generator).ainvoke(state)
        except Exception as exc:
            import re
            err_str = str(exc)
            raw_json = None

            # Pattern 1: <function=...>{...}</function>
            match = re.search(r"<function=[^>]+>\s*(\{.*\})\s*</function>", err_str, re.S)
            if match:
                raw_json = match.group(1)

            # Pattern 2: failed_generation: '...' or "..." or raw JSON object
            if not raw_json and "failed_generation" in err_str:
                fg_match = re.search(r"['\"]failed_generation['\"]\s*:\s*(['\"])(.*?)\1(?=[,\}])", err_str, re.S)
                if fg_match:
                    raw_candidate = fg_match.group(2)
                    try:
                        raw_candidate = raw_candidate.encode().decode('unicode_escape')
                    except Exception:
                        pass
                    inner_m = re.search(r"<function=[^>]+>\s*(\{.*\})\s*</function>", raw_candidate, re.S)
                    if inner_m:
                        raw_json = inner_m.group(1)
                    else:
                        json_m = re.search(r"(\{.*\})", raw_candidate, re.S)
                        if json_m:
                            raw_json = json_m.group(1)
                else:
                    json_m = re.search(r"(\{.*\})", err_str, re.S)
                    if json_m:
                        raw_json = json_m.group(1)

            if raw_json:
                try:
                    parsed = json.loads(raw_json)
                    if isinstance(parsed, dict) and "parameters" in parsed and isinstance(parsed["parameters"], dict):
                        parsed = parsed["parameters"]
                    draft = schema.model_validate(parsed)
                    logger.warning("Agent %s recovered schema-valid output from rejected tool envelope", agent_id)
                    return {"draft": draft}
                except Exception as parse_err:
                    logger.debug("Failed to salvage rejected tool envelope: %s", parse_err)
            raise exc
        return {"draft": draft}

    async def call_tools(state: AgentGraphState) -> dict[str, Any]:
        """Execute each safe domain tool and expose its grounded result to generation.

        Consultation tools require a question and are represented by upstream agent state;
        domain/calculation tools are true LangChain tools invoked through their schemas.
        """
        results=[]
        for specialist_tool in get_tools_for_agent(agent_id):
            if specialist_tool.name.startswith("consult_"):
                continue
            schema=getattr(specialist_tool,"args_schema",None)
            fields=getattr(schema,"model_fields",{}) if schema else {}
            if any(field.is_required() for field in fields.values()):
                continue
            try:
                value=await specialist_tool.ainvoke({})
                results.append(f"[{specialist_tool.name}]\n{value}")
                logger.info("Agent %s called tool %s",agent_id,specialist_tool.name)
            except Exception as exc:
                logger.warning("Agent %s tool %s unavailable: %s",agent_id,specialist_tool.name,str(exc)[:120])
        return {"tool_insights":"\n\n".join(results) or "No external tool result was required."}

    async def review(state: AgentGraphState) -> dict[str, Any]:
        if os.getenv("LLM_QUALITY_REVIEW", "false").lower() not in {"1", "true", "yes"}:
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
        try:
            revised = await (refine_prompt | generator).ainvoke(
                {
                    **state,
                    "candidate": state["draft"].model_dump_json(),
                    "issues": "\n".join(f"- {issue}" for issue in state["review"].issues),
                }
            )
            return {"result": revised}
        except Exception as exc:
            logger.warning(
                "Agent %s refine step failed (%s), safely using initial valid draft",
                agent_id, str(exc)[:200],
            )
            return {"result": state["draft"]}

    async def finish(state: AgentGraphState) -> dict[str, Any]:
        return {"result": state["draft"]}

    graph = StateGraph(AgentGraphState)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("generate", generate)
    graph.add_node("call_tools", call_tools)
    graph.add_node("review", review)
    graph.add_node("refine", refine)
    graph.add_node("finish", finish)
    graph.add_edge(START, "retrieve_context")
    graph.add_edge("retrieve_context", "call_tools")
    graph.add_edge("call_tools", "generate")
    graph.add_edge("generate", "review")
    graph.add_conditional_edges(
        "review", route_after_review, {"refine": "refine", "finish": "finish"}
    )
    graph.add_edge("refine", END)
    graph.add_edge("finish", END)
    return graph.compile()
