# /platform/oses/_template — copy this to start a new OS

**Do not edit files in this folder when working on an actual OS.** This is the canonical skeleton — copy the whole tree to `oses/<your-os-name>/` and replace placeholders.

## How to use this template

```bash
cp -r platform/oses/_template platform/oses/<your-os-name>
# Then:
#   1. Replace every "TEMPLATE_OS" / "template_os" placeholder with your OS name
#   2. Replace every "EXAMPLE_SUBAGENT" / "example_subagent" placeholder with a real subagent name
#      (or remove the example subagent and start clean)
#   3. Fill in CLAUDE.md following the 5-section per-OS template (see /platform/oses/CLAUDE.md)
#   4. Add the OS to platform.yaml and entitle in at least one tenant config
#   5. Run the new-OS checklist in /platform/oses/CLAUDE.md
```

## What's in here

```
_template/
  __init__.py                  # OS_INSTANCE export — pattern from oses/sales/__init__.py
  config.py                    # pydantic schema — pattern from oses/sales/config.py
  orchestrator.py              # Claude Agent SDK orchestrator — pattern from oses/sales/orchestrator.py
  internal_tools.py            # @governed internal tools — pattern from oses/sales/internal_tools.py
  outbound_tools.py            # @governed outbound tools — pattern from oses/sales/outbound_tools.py
  agents/
    __init__.py                # agent_specs() — auto-discovers subagent folders
    example_subagent/
      __init__.py              # exports build()
      definition.py            # NAME, DISPLAY_NAME, PROMPT_VERSION, MODEL, SKILLS_USED, TOOLS, build()
      prompts/v1.md            # system prompt — never edit after shipping; bump to v2.md
      triggers.py              # TriggerSpec — when the orchestrator routes here
  migrations/
    001_template_os.sql        # First migration — every table has tenant_id
  CLAUDE.md                    # ⭐ This file — replace it with your OS's CLAUDE.md
```

## Read before copying

1. [/CLAUDE.md](../../../CLAUDE.md) — the platform's one rule
2. [/platform/CLAUDE.md](../../CLAUDE.md) — cross-OS conventions
3. [/platform/oses/CLAUDE.md](../CLAUDE.md) — OS construction template + new-OS checklist

When you copy this, your `<your-os>/CLAUDE.md` should follow the **per-OS 5-section template** defined in [/platform/oses/CLAUDE.md](../CLAUDE.md):

1. Orchestrator responsibility — one sentence
2. Subagent roster — table
3. OS-specific contracts — "do not bypass X"
4. OS-specific anti-patterns
5. Pointers
