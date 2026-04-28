"""Thin Langfuse wrapper — one trace per run, tagged with tenant/os/manifest.

Optional: if LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY aren't set, this module
is a no-op and every function returns gracefully. That keeps Phase 0 demos
running cleanly without requiring Langfuse signup.

Design:
    One Langfuse trace ≈ one orchestrator run. All metadata the operator
    needs to filter/debug (tenant, os, run_id, brief, manifest, cost) lives
    on that single trace. Per-tool spans are in our Supabase `audit_events`
    table — linked by run_id, queryable with richer SQL than Langfuse.

Usage:
    trace = start_run(tenant_id, os_name, brief, run_id, manifest)
    try:
        ... do work ...
        end_run(trace, summary=..., cost_usd=..., turns=...)
    finally:
        flush()
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from shared import logging as plog

log = plog.get("shared.obs.langfuse")


@lru_cache(maxsize=1)
def _client():
    """Return a Langfuse client or None if not configured."""
    if not os.environ.get("LANGFUSE_PUBLIC_KEY") or not os.environ.get("LANGFUSE_SECRET_KEY"):
        return None
    try:
        from langfuse import Langfuse
    except ImportError:
        plog.event(log, "langfuse.not_installed")
        return None
    return Langfuse(
        public_key=os.environ["LANGFUSE_PUBLIC_KEY"],
        secret_key=os.environ["LANGFUSE_SECRET_KEY"],
        host=os.environ.get("LANGFUSE_HOST", "https://cloud.langfuse.com"),
    )


def start_run(
    tenant_id: str,
    os_name: str,
    brief: str,
    run_id: str,
    version_manifest: dict[str, Any] | None = None,
) -> Any | None:
    """Open a Langfuse span for this run. Returns a handle (or None if disabled).

    The handle is what Langfuse calls a 'span' in v4; we don't use it as a
    context manager because the orchestrator's work is async and streaming.
    """
    c = _client()
    if c is None:
        return None
    try:
        # Langfuse v4: observations replace the older trace/span distinction.
        # as_type="agent" gets us the agent-run UI treatment (rollup, timeline).
        span = c.start_observation(
            name=f"{os_name}-run",
            as_type="agent",
            input={"brief": brief},
            metadata={
                "tenant_id": tenant_id,
                "os_name": os_name,
                "run_id": run_id,
                "version_manifest": version_manifest or {},
            },
        )
        return span
    except Exception as e:
        plog.event(log, "langfuse.start_failed", err=str(e))
        return None


def end_run(
    span: Any | None,
    *,
    summary: str = "",
    cost_usd: float | None = None,
    turns: int | None = None,
    error: str | None = None,
) -> None:
    if span is None:
        return
    try:
        span.update(
            output={"summary": summary},
            metadata={
                "cost_usd": cost_usd,
                "turns": turns,
                "error": error,
            },
        )
        # v4 spans close on end()
        if hasattr(span, "end"):
            span.end()
    except Exception as e:
        plog.event(log, "langfuse.end_failed", err=str(e))


def flush() -> None:
    c = _client()
    if c is None:
        return
    try:
        c.flush()
    except Exception as e:
        plog.event(log, "langfuse.flush_failed", err=str(e))
