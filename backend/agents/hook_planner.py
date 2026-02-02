"""
Weekly hook planner: allocate hook counts per source and generate RAG queries
using an agentic LangGraph flow with Anthropic (Claude) for reasoning.

Sources supported:
- news
- company_docs
- slack
- user_input

Usage (example):
    from agents.hook_planner import run_hook_planner, SourceSummary

    summaries = [
        SourceSummary(source="news", summary="Top tech headlines...", freshness_days=2, volume=50, engagement=0.7, top_topics=["ai", "chips"]),
        SourceSummary(source="company_docs", summary="Docs updated for new billing flow", freshness_days=1, volume=5, engagement=0.6, top_topics=["billing", "pricing"]),
        SourceSummary(source="slack", summary="Users complaining about onboarding friction", freshness_days=3, volume=20, engagement=0.8, top_topics=["onboarding", "latency"]),
        SourceSummary(source="user_input", summary="Users asking for analytics insights", freshness_days=2, volume=15, engagement=0.5, top_topics=["analytics"]),
    ]
    plan = run_hook_planner(summaries, target_hooks=12)
    print(plan["allocations"])
    print(plan["queries"])

Environment:
- ANTHROPIC_API_KEY must be set for the planner to call Claude.
"""

from __future__ import annotations

import json
from functools import partial
from typing import List, Literal, Optional, TypedDict

from langchain_anthropic import ChatAnthropic
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

SourceType = Literal["news", "company_docs", "slack", "user_input"]


class SourceSummary(BaseModel):
    source: SourceType
    summary: str
    freshness_days: Optional[float] = Field(
        default=None, description="Average age of items in days (lower = fresher)."
    )
    volume: Optional[int] = Field(
        default=None, description="How many items/messages/docs were ingested."
    )
    engagement: Optional[float] = Field(
        default=None,
        description="Optional engagement score (0-1) if available from analytics.",
        ge=0.0,
        le=1.0,
    )
    top_topics: List[str] = Field(default_factory=list)


class Allocation(BaseModel):
    source: SourceType
    hooks: int
    rationale: str


class QueryBundle(BaseModel):
    source: SourceType
    queries: List[str]
    rationale: str


class PlannerState(TypedDict, total=False):
    summaries: List[SourceSummary]
    target_hooks: int
    allocations: List[Allocation]
    queries: List[QueryBundle]
    max_queries_per_source: int
    model: str


def _make_llm(model: str, temperature: float = 0.3, max_tokens: int = 1000) -> ChatAnthropic:
    return ChatAnthropic(model=model, temperature=temperature, max_tokens=max_tokens)


def _json_only_prompt(instructions: str, data: dict) -> List[dict]:
    """Wrap instructions and data; enforce JSON-only response."""
    return [
        {
            "role": "system",
            "content": (
                "You are a planning agent. Respond with strictly valid JSON only, "
                "no prose, no markdown. If you cannot comply, return an empty JSON object {}."
            ),
        },
        {"role": "user", "content": f"{instructions}\n\nCONTEXT:\n{json.dumps(data, ensure_ascii=False)}"},
    ]


def allocate_hooks(state: PlannerState) -> PlannerState:
    model = state.get("model", "claude-3-5-sonnet-20241022")
    target_hooks = state.get("target_hooks", 12)
    summaries = state.get("summaries", [])

    instructions = (
        "Given source summaries, produce an allocation of hook counts per source. "
        "Aim to sum hooks to the target. Favor fresher, higher-engagement, and diverse topics. "
        "Cap any single source to at most half the target. Output JSON: "
        '{"allocations":[{"source":"news|company_docs|slack|user_input","hooks":int,"rationale":"..."}]}'
    )
    llm = _make_llm(model, temperature=0.2, max_tokens=1200)
    messages = _json_only_prompt(
        instructions,
        {
            "target_hooks": target_hooks,
            "summaries": [s.model_dump() for s in summaries],
        },
    )
    raw = llm.invoke(messages).content or "{}"
    try:
        parsed = json.loads(raw)
        allocations = [Allocation(**item) for item in parsed.get("allocations", [])]
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Failed to parse allocation response: {raw}") from exc

    # Simple validator: enforce sum and cap
    total = sum(a.hooks for a in allocations)
    if total > 0 and target_hooks > 0 and total != target_hooks:
        # Proportionally rescale to target
        scale = target_hooks / total
        scaled = []
        for a in allocations:
            scaled_hooks = max(1, round(a.hooks * scale))
            scaled.append(Allocation(source=a.source, hooks=scaled_hooks, rationale=a.rationale))
        allocations = scaled

    state["allocations"] = allocations
    return state


def generate_queries(state: PlannerState) -> PlannerState:
    model = state.get("model", "claude-3-5-sonnet-20241022")
    max_queries = state.get("max_queries_per_source", 3)
    allocations = state.get("allocations", [])
    summaries = state.get("summaries", [])

    instructions = (
        "For each allocation, propose up to N focused RAG queries tailored to that source. "
        "Queries should target recent, high-signal content (e.g., last 14 days for news/slack, "
        "recent changes for company docs). Avoid near-duplicate queries. "
        "Output JSON: {\"queries\":[{\"source\":\"...\",\"queries\":[\"...\"],\"rationale\":\"...\"}]} "
        f"Limit queries per source to {max_queries}."
    )
    llm = _make_llm(model, temperature=0.4, max_tokens=1500)
    messages = _json_only_prompt(
        instructions,
        {
            "allocations": [a.model_dump() for a in allocations],
            "summaries": [s.model_dump() for s in summaries],
            "max_queries_per_source": max_queries,
        },
    )
    raw = llm.invoke(messages).content or "{}"
    try:
        parsed = json.loads(raw)
        queries = [QueryBundle(**item) for item in parsed.get("queries", [])]
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Failed to parse query response: {raw}") from exc

    # Trim to max per source if the model returns more
    trimmed: List[QueryBundle] = []
    for qb in queries:
        trimmed.append(
            QueryBundle(
                source=qb.source,
                rationale=qb.rationale,
                queries=qb.queries[:max_queries],
            )
        )
    state["queries"] = trimmed
    return state


def build_planner_graph(model: str = "claude-3-5-sonnet-20241022", max_queries_per_source: int = 3):
    graph = StateGraph(PlannerState)
    graph.add_node("allocate", allocate_hooks)
    graph.add_node("generate_queries", generate_queries)

    graph.set_entry_point("allocate")
    graph.add_edge("allocate", "generate_queries")
    graph.add_edge("generate_queries", END)

    compiled = graph.compile()

    def invoke(initial_state: PlannerState) -> PlannerState:
        initial_state = {
            **initial_state,
            "model": model,
            "max_queries_per_source": max_queries_per_source,
        }
        return compiled.invoke(initial_state)

    return invoke


def run_hook_planner(
    summaries: List[SourceSummary],
    target_hooks: int = 12,
    model: str = "claude-3-5-sonnet-20241022",
    max_queries_per_source: int = 3,
) -> PlannerState:
    """
    Run the planner end-to-end. Returns a dict with allocations and queries.
    """
    app = build_planner_graph(model=model, max_queries_per_source=max_queries_per_source)
    state: PlannerState = {
        "summaries": summaries,
        "target_hooks": target_hooks,
    }
    return app(state)


__all__ = [
    "SourceSummary",
    "Allocation",
    "QueryBundle",
    "run_hook_planner",
    "build_planner_graph",
]
