# /platform/oses — How to build an OS in this platform

This file is the **OS construction template**. Every OS in `/platform/oses/<name>/` has the same shape. Sales OS is the canonical example; Brief OS is the minimal example. Marketing OS (and every future OS) is built using this template.

Loaded by Claude Code on top of [/CLAUDE.md](../../CLAUDE.md) and [/platform/CLAUDE.md](../CLAUDE.md).

## Mandatory folder shape for every OS

```
oses/<os-name>/
  __init__.py             # exports OS_INSTANCE (per oses/_protocol.py)
  config.py               # pydantic schema for the OS's tenant config block
  orchestrator.py         # the OS's orchestrator agent (Claude Agent SDK)
  internal_tools.py       # internal-only @governed tools (DB writes, mem0, etc.)
  outbound_tools.py       # external-action @governed tools (only if the OS does outbound)
  inbound.py              # webhook handlers (only if the OS receives inbound)
  agents/                 # one folder per specialist subagent (see "Subagent shape" below)
    __init__.py           # exports agent_specs() — auto-discovers all subagent folders
    <subagent>/
  migrations/             # SQL migrations scoped to the OS's tables
  CLAUDE.md               # ⭐ OS-specific rules — required for the OS to be considered "shipped"
```

Optional add-ons by OS type:
- `channel_picker.py` — only for OSes that pick between outbound channels (Sales does; Brief doesn't).
- `cross_os_reader.py` — for OSes that read state from other OSes (Brief does this for cross-OS briefings).

## Subagent shape (identical across every OS)

```
oses/<os-name>/agents/<subagent-name>/
  __init__.py             # exports build()
  definition.py           # NAME, DISPLAY_NAME, PROMPT_VERSION, MODEL, SKILLS_USED, TOOLS, build()
  prompts/v1.md           # system prompt; bump to v2.md on breaking changes (NEVER edit v1)
  triggers.py             # TriggerSpec — when the orchestrator should route here
```

### `definition.py` skeleton (copy this for any new subagent)

```python
"""<Subagent display name> subagent definition."""
from __future__ import annotations

from pathlib import Path

from claude_agent_sdk import AgentDefinition

from oses._protocol import SubagentSpec
from skills import _loader as skills


NAME = "my_subagent"
DISPLAY_NAME = "My Subagent"
PROMPT_VERSION = "1"
MODEL = "sonnet"   # haiku for cheap classifiers, opus for high-stakes reasoning
SKILLS_USED = [
    "skill-one",                    # must exist in /platform/skills/ with applies_to=[my_subagent]
    "skill-two",
]
TOOLS = [
    "mcp__composio__*",
    "mcp__<os>_internal__list_things",
    "mcp__<os>_internal__update_thing",
    "mcp__<os>_internal__remember",
    "mcp__<os>_internal__recall",
    # Add ONLY the tools this subagent legitimately needs (least privilege).
]


def _load_prompt() -> str:
    p = Path(__file__).parent / "prompts" / f"v{PROMPT_VERSION}.md"
    text = p.read_text()
    if text.startswith("---"):
        _, _fm, body = text.split("---", 2)
        text = body.strip()
    return text


def build() -> tuple[AgentDefinition, SubagentSpec]:
    prompt = skills.inject(_load_prompt(), SKILLS_USED)
    definition = AgentDefinition(
        description="One-line description of when to route to this subagent.",
        prompt=prompt,
        model=MODEL,
    )
    from oses.<os>.agents.my_subagent.triggers import SPEC as trig
    spec = SubagentSpec(
        name=NAME,
        display_name=DISPLAY_NAME,
        triggers=trig,
        prompt_version=PROMPT_VERSION,
        tools=TOOLS,
        skills=SKILLS_USED,
        model=MODEL,
    )
    return definition, spec
```

### `triggers.py` skeleton

```python
from oses._protocol import TriggerSpec

SPEC = TriggerSpec(
    description="When this subagent should run, in one sentence.",
    handles=["intents this owns"],
    does_not_handle=["intents that belong to other subagents"],
    example_briefs=["Concrete brief that should route here"],
    produces=["event_type.emitted"],
    consumes=["event_type.consumed"],
    order_hints={"after": ["upstream_subagent"]},
)
```

## Decision tree for "where does my new feature go?"

1. Is it about **judgment** (what to say, when to escalate, which template)? → **skill** in [/platform/skills/](../skills/) with `applies_to=[<subagent>]`. See [/platform/skills/CLAUDE.md](../skills/CLAUDE.md).
2. Is it about **action** (call a SaaS, write to DB, send a message)? → **tool** under the OS's `*_tools.py`, wrapped with `@governed`.
3. Is it the **outside-world endpoint** (HTTP API, Python SDK, third-party REST)? → **connector** under [/platform/tools/](../tools/), prefer Composio. See [/platform/tools/CLAUDE.md](../tools/CLAUDE.md).
4. Is it **routing** across specialists? → orchestrator (`orchestrator.py`).
5. Is it a brand-new responsibility no existing specialist owns? → **new subagent** (use the shape above).

If the feature spans multiple steps, decompose first — don't write a single 200-line tool.

## Checklists

### New-subagent checklist

- [ ] Folder created under `oses/<os>/agents/<name>/` with the four files above
- [ ] `SKILLS_USED` references skills that exist in [/platform/skills/](../skills/)
- [ ] Each skill's `applies_to` frontmatter includes this subagent's name
- [ ] `TOOLS` list is the minimum needed (principle of least authority)
- [ ] `triggers.py` declares when the orchestrator routes here
- [ ] [config/policies.yaml](../config/policies.yaml) has the subagent's `tool_allowlist`
- [ ] Translation entries added to [chat/translations.py](../chat/translations.py) if the subagent exposes new tools
- [ ] At least one smoke test exercises the path (`make smoke` or OS-specific equivalent)
- [ ] [STATUS.md](../STATUS.md) updated

### New-OS checklist

- [ ] Copied [_template/](_template/) to `oses/<name>/`
- [ ] Implemented the OS protocol — `OS_INSTANCE` exported from `__init__.py`
- [ ] Wrote `oses/<name>/CLAUDE.md` following the per-OS template (see below)
- [ ] Added the OS to [config/platform.yaml](../config/platform.yaml) and entitled in at least one tenant ([config/tenants/](../config/tenants/))
- [ ] Migration `001_<os>.sql` adds the OS's tables (every table has `tenant_id`)
- [ ] At least one specialist subagent exists
- [ ] [STATUS.md](../STATUS.md) has a phase row for the OS
- [ ] `make smoke` (or OS-specific smoke) passes end-to-end
- [ ] OS dashboard endpoint added under `apps/api/` so the web UI can render its tiles

## Per-OS CLAUDE.md — fixed template (every OS uses this exact structure)

Every per-OS `CLAUDE.md` (e.g. [sales/CLAUDE.md](sales/CLAUDE.md), [brief/CLAUDE.md](brief/CLAUDE.md), and the next ones) follows this 5-section structure:

1. **Orchestrator responsibility** — one sentence.
2. **Subagent roster** — table: name, status (shipped/planned), responsibility.
3. **OS-specific contracts** — the "do not bypass X" rules unique to this OS (e.g. Sales' channel picker, Marketing's audience selector, CX's SLA timer).
4. **OS-specific anti-patterns** — what we reject in this OS specifically.
5. **Pointers** — into the OS's `agents/`, `migrations/`, and the relevant `applies_to=` skill subset.

Keep it under ~150 lines. Cross-link, don't duplicate platform-wide rules.

## Anti-patterns rejected at the OS layer

- ❌ Top-level files inside `oses/<os>/` other than the canonical layout above (no `helpers.py`, no `utils.py`, no `do_thing.py`).
- ❌ Editing `v1.md` of a shipped subagent prompt instead of bumping to `v2.md`.
- ❌ A subagent's `TOOLS` list containing tools no other subagent uses, but no skill explaining when to use them.
- ❌ Standing up a new OS without writing its CLAUDE.md (the OS is not "shipped" until that file exists).
- ❌ Sharing tool implementations across OSes by importing from another OS's `*_tools.py` (cross-OS reads go through `cross_os_reader.py` patterns or shared events, not direct imports).
- ❌ A subagent that calls another subagent directly. Subagents are siblings; the orchestrator routes between them.
