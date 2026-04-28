"""Pre-classifier — a cheap Haiku call that turns a natural-language brief
into a structured routing plan (which subagents, in what order).

Before Phase 3, the orchestrator's system prompt asked Claude to reason
through the subagent catalog on every run. That worked but was fuzzy and
expensive on larger briefs. The pre-classifier makes that decision explicit:

    Input:  brief + subagent catalog + tenant/OS state (counts)
    Output: {reasoning, agents: [{name, notes}], needs_human_input, clarification_question?}

The orchestrator still has final say (we inject the plan into its system
prompt as a strong recommendation, not as hard enforcement), which keeps
graceful fallback when the classifier misses a nuance. But the typical run
follows the plan deterministically — auditable, cheaper, A/B-testable
independent of the main orchestrator prompt.

Cost target: < $0.005 per classification. Haiku @ ~1.2k input tokens
(catalog + state) + ~200 output tokens ≈ $0.001.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from typing import Any

from shared import events as event_bus, logging as plog

log = plog.get("platform_os.classifier")


# The Haiku ID — centralized so we can bump once if/when a newer Haiku ships.
_MODEL = os.environ.get("CLASSIFIER_MODEL", "claude-haiku-4-5")
_MAX_TOKENS = 600


# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------
@dataclass
class PlannedAgent:
    name: str
    notes: str = ""


@dataclass
class ClassifierDecision:
    reasoning: str
    agents: list[PlannedAgent] = field(default_factory=list)
    needs_human_input: bool = False
    clarification_question: str | None = None
    cost_usd: float = 0.0
    latency_ms: int = 0
    model: str = _MODEL

    def as_dict(self) -> dict[str, Any]:
        return {
            "reasoning": self.reasoning,
            "agents": [{"name": a.name, "notes": a.notes} for a in self.agents],
            "needs_human_input": self.needs_human_input,
            "clarification_question": self.clarification_question,
            "cost_usd": self.cost_usd,
            "latency_ms": self.latency_ms,
            "model": self.model,
        }

    def recommended_chain(self) -> str:
        """Human-readable summary suitable for injecting into prompts."""
        if not self.agents:
            return "No subagents needed — respond directly."
        parts = [f"{i+1}. **{a.name}**" + (f" — {a.notes}" if a.notes else "")
                 for i, a in enumerate(self.agents)]
        return "\n".join(parts)


# ---------------------------------------------------------------------------
# Prompt assembly
# ---------------------------------------------------------------------------
_SYSTEM = """You are a routing classifier for a multi-agent Sales OS.

Your ONLY job: given a user's brief and the catalog of available subagents,
decide which subagents should run and in what order. Return structured JSON.

You are NOT running the work yourself — you're planning the dispatch.

Rules:
- Pick ONLY subagents from the provided catalog. Never invent names.
- Order matters: if a brief needs sourcing AND scoring AND outreach, the
  order should be source → enrich → score → BDR (respect upstream-first).
- Skip subagents that aren't needed. If the brief is "score my enriched
  leads", return only lead_scorer — do NOT include lead_sourcer.
- If the brief is genuinely ambiguous (e.g. "do something with my leads"),
  set needs_human_input=true and provide ONE clarifying question.
- If the brief is a pure information question answerable from state alone
  (e.g. "how many leads do I have"), return agents=[] and answer via the
  orchestrator's natural reasoning — no subagents needed.

Output JSON ONLY (no surrounding prose, no code fence):
{
  "reasoning": "<1-2 sentences>",
  "agents":    [{"name": "<slug>", "notes": "<what this specifically does for this brief>"}, ...],
  "needs_human_input": false,
  "clarification_question": null
}
"""


def _catalog_text(specs: list[dict[str, Any]]) -> str:
    lines: list[str] = ["## Subagent catalog"]
    for s in specs:
        lines.append(f"- **{s['name']}**: {s.get('description', '')}")
        if s.get("handles"):
            lines.append(f"    Handles: {', '.join(s['handles'])}")
        if s.get("does_not_handle"):
            lines.append(f"    Does NOT handle: {', '.join(s['does_not_handle'])}")
        if s.get("order_hints"):
            lines.append(f"    Order hints: {s['order_hints']}")
    return "\n".join(lines)


def _state_text(state: dict[str, int]) -> str:
    if not state:
        return ""
    parts = [f"{k}={v}" for k, v in state.items() if v]
    if not parts:
        return "\n## Current state\nNo leads in any stage yet."
    return "\n## Current state\n- " + "\n- ".join(parts)


def _build_user_message(brief: str, specs: list[dict], state: dict) -> str:
    return (
        f"## User brief\n{brief}\n\n"
        + _catalog_text(specs)
        + _state_text(state)
    )


# ---------------------------------------------------------------------------
# Subagent catalog helpers — turn SubagentSpecs into plain dicts for the prompt
# ---------------------------------------------------------------------------
def catalog_from_specs(specs) -> list[dict[str, Any]]:
    """`specs` is an iterable of `oses._protocol.SubagentSpec` objects."""
    out: list[dict[str, Any]] = []
    for s in specs:
        trig = s.triggers
        out.append({
            "name": s.name,
            "description": trig.description,
            "handles": list(trig.handles),
            "does_not_handle": list(trig.does_not_handle),
            "order_hints": trig.order_hints,
        })
    return out


# ---------------------------------------------------------------------------
# Cost accounting
# ---------------------------------------------------------------------------
_HAIKU_INPUT_USD_PER_MTOK  = 1.0     # Haiku 4.5 pricing (approximate — gets
_HAIKU_OUTPUT_USD_PER_MTOK = 5.0     # logged; exact numbers may drift)


def _estimate_cost(input_tokens: int, output_tokens: int) -> float:
    return (input_tokens * _HAIKU_INPUT_USD_PER_MTOK / 1_000_000
            + output_tokens * _HAIKU_OUTPUT_USD_PER_MTOK / 1_000_000)


# ---------------------------------------------------------------------------
# Main entry
# ---------------------------------------------------------------------------
def classify(
    *,
    tenant_id: str,
    os_name: str,
    brief: str,
    subagent_specs: list[dict[str, Any]],
    state: dict[str, int] | None = None,
) -> ClassifierDecision:
    """Run the classifier once. Returns a decision with cost + latency stats.

    If Anthropic isn't reachable (missing key, network, etc.), we fall back
    to a permissive "run everything in catalog order" decision — the
    orchestrator still dispatches, just without the pre-classifier benefit."""
    from anthropic import Anthropic

    state = state or {}
    user_text = _build_user_message(brief, subagent_specs, state)

    t0 = time.perf_counter()
    try:
        client = Anthropic()  # reads ANTHROPIC_API_KEY from env
        resp = client.messages.create(
            model=_MODEL,
            max_tokens=_MAX_TOKENS,
            system=_SYSTEM,
            messages=[{"role": "user", "content": user_text}],
        )
        latency_ms = int((time.perf_counter() - t0) * 1000)
        # Collect text from response blocks
        text = ""
        for blk in resp.content:
            if getattr(blk, "type", None) == "text":
                text += getattr(blk, "text", "")
        cost = _estimate_cost(resp.usage.input_tokens, resp.usage.output_tokens)
        decision = _parse_decision(text)
        decision.cost_usd = cost
        decision.latency_ms = latency_ms
    except Exception as e:
        plog.event(log, "classifier.failed", err=str(e))
        decision = _fallback_decision(subagent_specs, reason=str(e))
        decision.latency_ms = int((time.perf_counter() - t0) * 1000)

    # Log to os_events so the meta-OS and audit UI can see routing decisions.
    event_bus.emit(
        tenant_id=tenant_id,
        os_name=os_name,
        event_type="classifier.decided",
        payload={
            "brief_preview": brief[:200],
            **decision.as_dict(),
        },
        agent_name="platform_classifier",
    )
    return decision


def _parse_decision(text: str) -> ClassifierDecision:
    text = text.strip()
    # Strip ```json ... ``` if the model wrapped it anyway.
    if text.startswith("```"):
        text = text.strip("`")
        nl = text.find("\n")
        if nl != -1 and text[:nl].strip().lower() in ("json", ""):
            text = text[nl+1:]
        if text.endswith("```"):
            text = text[:-3].rstrip()
    try:
        obj = json.loads(text)
    except Exception as e:
        plog.event(log, "classifier.bad_json", text_preview=text[:300], err=str(e))
        return ClassifierDecision(
            reasoning="Classifier returned non-JSON; falling back to empty plan.",
        )
    agents = [
        PlannedAgent(name=a.get("name", ""), notes=a.get("notes", ""))
        for a in obj.get("agents") or []
        if a.get("name")
    ]
    return ClassifierDecision(
        reasoning=obj.get("reasoning") or "",
        agents=agents,
        needs_human_input=bool(obj.get("needs_human_input")),
        clarification_question=obj.get("clarification_question"),
    )


def _fallback_decision(specs: list[dict], reason: str) -> ClassifierDecision:
    """If the classifier errored, emit a conservative pass-through so the
    orchestrator still runs. Don't hard-fail user work on a classifier hiccup."""
    return ClassifierDecision(
        reasoning=(f"Classifier unavailable ({reason[:120]}). "
                   "Orchestrator will route on its own."),
        agents=[],  # empty = orchestrator uses its own catalog-reading
    )
