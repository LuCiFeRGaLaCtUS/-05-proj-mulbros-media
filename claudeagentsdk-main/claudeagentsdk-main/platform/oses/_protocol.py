"""The OS protocol — the contract every OS module implements.

Adding a new OS = creating a module under oses/<name>/ that defines these
attributes, plus a `register()` call in its __init__.py.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

from pydantic import BaseModel


@dataclass
class ResourceSpec:
    """A billable/capped external resource this OS consumes."""
    key: str                          # e.g. "apollo_credits"
    display_name: str                 # "Apollo credits"
    unit: str = "units"               # "credits", "sends", "minutes"
    default_period: str = "month"     # "day" | "week" | "month"
    ask_user_for_limit: bool = True


@dataclass
class TriggerSpec:
    """How a subagent announces what it handles. Read by the OS pre-classifier."""
    description: str
    handles: list[str] = field(default_factory=list)
    does_not_handle: list[str] = field(default_factory=list)
    example_briefs: list[str] = field(default_factory=list)
    produces: list[str] = field(default_factory=list)        # event types emitted
    consumes: list[str] = field(default_factory=list)
    order_hints: dict[str, list[str]] = field(default_factory=dict)
    # e.g. {"before": ["lead_enricher"]} — soft hint used when multiple agents chain


@dataclass
class SubagentSpec:
    """One subagent, as discovered and registered by an OS."""
    name: str
    display_name: str
    triggers: TriggerSpec
    prompt_version: str
    tools: list[str]
    skills: list[str]
    model: str = "sonnet"


@dataclass
class OSResult:
    """The outcome of OS.handle()."""
    summary: str
    messages: list[str] = field(default_factory=list)
    events: list[dict[str, Any]] = field(default_factory=list)
    needs_human: bool = False


@dataclass
class TenantCtx:
    """Everything an OS needs to know about the requesting tenant."""
    tenant_id: str
    display_name: str
    entitled_oses: list[str]
    locale: str = "en-US"
    timezone: str = "UTC"
    sandbox: dict[str, Any] | None = None       # {"enabled": bool, "redirect_email": str, ...}
    session_id: str | None = None                 # chat session if any
    run_id: str | None = None


@runtime_checkable
class OS(Protocol):
    name: str
    display_name: str
    version: str
    config_schema: type[BaseModel]
    name_suggestions: list[str]
    resources: list[ResourceSpec]

    def bootstrap(self, ctx: TenantCtx) -> None: ...
    def handle(self, brief: str, ctx: TenantCtx) -> OSResult: ...
    def health(self, ctx: TenantCtx) -> dict[str, Any]: ...
    def subagents(self) -> list[SubagentSpec]: ...
