"""LangGraph quality pipeline used by every specialist agent.

Flow: retrieve scoped context + prior database state + domain/inter-agent tools ->
generate typed output -> review consistency -> conditionally refine -> return schema-validated output.
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Literal, TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.utils.json import parse_partial_json
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from llm.langchain_client import LLM_PROVIDER, get_chat_model
from llm.router import ModelConfig
from services.evaluation import evaluate_agent_output
from services.rag import format_retrieved_context, retrieve_for_agent
from services.run_trace import record_step
from tools.agent_tools import get_tools_for_agent
from tools.project_context import select_project_context
from utils.logging import get_logger

logger = get_logger("workflows.agent_graph")


class QualityGateError(RuntimeError):
    """A schema-valid draft is still too incomplete to become project truth."""


def _is_provider_throttle(exc: Exception) -> bool:
    """Preserve provider throttles so the engine can honor retry windows."""
    return getattr(exc, "status_code", None) == 429 or "rate limit" in type(exc).__name__.lower()


def _extract_json_object(text: str) -> str | None:
    """Return the first balanced JSON object, respecting strings and escapes."""
    start = text.find("{")
    if start < 0:
        return None
    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start:index + 1]
    return None


class QualityReview(BaseModel):
    passed: bool = Field(description="True only when the output is complete and consistent")
    issues: list[str] = Field(default_factory=list, description="Specific, actionable defects")


class AgentGraphState(TypedDict, total=False):
    context: dict[str, Any]
    scoped_context: str
    prior_database_context: str
    retrieved_context: str
    retrieval_sources: list[dict[str, Any]]
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
    sys_messages.append(("system", "Authoritative project context (JSON):\n{scoped_context}\n\nRetrieved project evidence (cite these SOURCE ids in reasoning when relevant):\n{retrieved_context}\n\nResults from callable specialist tools:\n{tool_insights}"))
    sys_messages.append(("system", "Return only one valid JSON object matching the requested schema. Do not return a function/tool envelope, markdown, or commentary."))

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
                "Return one valid JSON object satisfying the configured output schema.",
            ),
            (
                "human",
                "Request:\n{user_prompt}\n\nContext:\n{scoped_context}\n\n"
                "Candidate:\n{candidate}\n\nQuality issues:\n{issues}",
            ),
        ]
    )

    async def retrieve_context(state: AgentGraphState) -> dict[str, Any]:
        started = time.monotonic()
        scoped = await select_project_context.ainvoke(
            {"agent_id": agent_id, "project_context": state["context"]}
        )
        query = f"{state['user_prompt']}\n{scoped}"
        chunks = await retrieve_for_agent(
            str(state["context"].get("project_id", "")), agent_id, query, limit=5
        )
        sources = [
            {
                "citation": chunk.citation,
                "title": chunk.source_title,
                "score": round(chunk.score, 4),
            }
            for chunk in chunks
        ]
        await record_step(
            state["context"].get("run_id"), agent_id, "retrieve", "complete",
            input_context={"query": query[:1000]},
            output={"sources": sources, "result_count": len(sources)},
            started_at=started,
        )
        return {
            "scoped_context": scoped,
            "retrieved_context": format_retrieved_context(
                chunks, max_chars=3000 if agent_id == "integration" else 4000
            ),
            "retrieval_sources": sources,
            "supervision_directive": directive or "",
        }

    async def generate(state: AgentGraphState) -> dict[str, Any]:
        started = time.monotonic()
        try:
            draft = await (generation_prompt | generator).ainvoke(state)
        except Exception as exc:
            import re
            err_str = str(exc)
            raw_json = getattr(exc, "llm_output", None)
            if not isinstance(raw_json, str):
                raw_json = None
            body = getattr(exc, "body", None)
            if not raw_json and isinstance(body, dict):
                failed = body.get("failed_generation")
                if not failed and isinstance(body.get("error"), dict):
                    failed = body["error"].get("failed_generation")
                if isinstance(failed, str) and failed.strip():
                    raw_json = _extract_json_object(failed) or failed

            # LangChain may reject an otherwise recoverable JSON-mode response
            # before our schema's normalizers run. Extract the exact balanced
            # completion and validate it locally.
            completion_marker = "from completion "
            marker_index = err_str.lower().find(completion_marker)
            if not raw_json and marker_index >= 0:
                raw_json = _extract_json_object(
                    err_str[marker_index + len(completion_marker):]
                )

            # Pattern 1: <function=...>{...}</function>
            match = re.search(r"<function=[^>]+>\s*(\{.*\})\s*</function>", err_str, re.S)
            if not raw_json and match:
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
                    try:
                        parsed = json.loads(raw_json)
                    except json.JSONDecodeError:
                        parsed = parse_partial_json(raw_json)
                    if isinstance(parsed, dict) and "parameters" in parsed and isinstance(parsed["parameters"], dict):
                        parsed = parsed["parameters"]
                    draft = schema.model_validate(parsed)
                    logger.warning("Agent %s recovered and normalized rejected structured output", agent_id)
                    await record_step(
                        state["context"].get("run_id"), agent_id, "generate", "complete",
                        output={"recovered": True, "schema": schema.__name__}, started_at=started,
                    )
                    return {"draft": draft}
                except Exception as parse_err:
                    logger.warning("Agent %s local structured-output recovery failed: %s", agent_id, parse_err)
            raise exc
        await record_step(
            state["context"].get("run_id"), agent_id, "generate", "complete",
            output={"recovered": False, "schema": schema.__name__}, started_at=started,
        )
        return {"draft": draft}

    async def call_tools(state: AgentGraphState) -> dict[str, Any]:
        """Execute each safe domain tool and expose its grounded result to generation.

        Consultation tools require a question and are represented by upstream agent state;
        domain/calculation tools are true LangChain tools invoked through their schemas.
        """
        started = time.monotonic()
        results=[]
        calls: list[dict[str, Any]] = []
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
                calls.append({"tool": specialist_tool.name, "status": "complete"})
                logger.info("Agent %s called tool %s",agent_id,specialist_tool.name)
            except Exception as exc:
                calls.append({"tool": specialist_tool.name, "status": "failed", "error": str(exc)[:160]})
                logger.warning("Agent %s tool %s unavailable: %s",agent_id,specialist_tool.name,str(exc)[:120])
        await record_step(
            state["context"].get("run_id"), agent_id, "tools", "complete",
            output={"calls": calls}, started_at=started,
        )
        return {"tool_insights":("\n\n".join(results)[:2500] or "No external tool result was required.")}

    async def review(state: AgentGraphState) -> dict[str, Any]:
        started = time.monotonic()
        deterministic_issues, metrics = evaluate_agent_output(
            agent_id, state["draft"].model_dump(mode="json")
        )
        if deterministic_issues:
            result = QualityReview(passed=False, issues=deterministic_issues)
            await record_step(
                state["context"].get("run_id"), agent_id, "quality_gate", "complete",
                output={"passed": False, "issues": deterministic_issues, "metrics": metrics},
                started_at=started,
            )
            return {"review": result}
        if os.getenv("LLM_QUALITY_REVIEW", "false").lower() not in {"1", "true", "yes"}:
            result = QualityReview(passed=True)
            await record_step(
                state["context"].get("run_id"), agent_id, "quality_gate", "complete",
                output={"passed": True, "issues": [], "metrics": metrics, "llm_review": False},
                started_at=started,
            )
            return {"review": result}
        try:
            result = await (review_prompt | reviewer).ainvoke(
                {
                    **state,
                    "candidate": state["draft"].model_dump_json(),
                }
            )
            logger.info("Agent %s quality review: passed=%s", agent_id, result.passed)
            await record_step(
                state["context"].get("run_id"), agent_id, "quality_gate", "complete",
                output={"passed": result.passed, "issues": result.issues, "metrics": metrics, "llm_review": True},
                started_at=started,
            )
            return {"review": result}
        except Exception as exc:
            # A reviewer outage must not discard an already schema-valid result.
            logger.warning("Agent %s quality review skipped: %s", agent_id, str(exc)[:200])
            return {"review": QualityReview(passed=True)}

    def route_after_review(state: AgentGraphState) -> Literal["refine", "finish"]:
        return "finish" if state["review"].passed else "refine"

    async def refine(state: AgentGraphState) -> dict[str, Any]:
        started = time.monotonic()
        try:
            revised = await (refine_prompt | generator).ainvoke(
                {
                    **state,
                    "candidate": state["draft"].model_dump_json(),
                    "issues": "\n".join(f"- {issue}" for issue in state["review"].issues),
                }
            )
            issues, metrics = evaluate_agent_output(agent_id, revised.model_dump(mode="json"))
            await record_step(
                state["context"].get("run_id"), agent_id, "refine", "complete",
                output={"remaining_issues": issues, "metrics": metrics}, started_at=started,
            )
            if issues:
                raise QualityGateError(
                    f"{agent_id} refinement still failed quality gates: {'; '.join(issues)}"
                )
            return {"result": revised}
        except QualityGateError:
            raise
        except Exception as exc:
            if _is_provider_throttle(exc):
                raise
            logger.warning(
                "Agent %s refine step failed (%s); rejecting incomplete draft",
                agent_id, str(exc)[:200],
            )
            raise QualityGateError(
                f"{agent_id} quality refinement unavailable; draft rejected"
            ) from exc

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
