# Brief OS — specifics

OS-specific rules. Loaded by Claude Code on top of [/CLAUDE.md](../../../CLAUDE.md), [/platform/CLAUDE.md](../../CLAUDE.md), and [/platform/oses/CLAUDE.md](../CLAUDE.md). Read those first.

Brief OS is the **plug-and-play proof** — the platform's minimal example of an OS. It's deliberately tiny: one subagent, no outbound channels, just a cross-OS reader and a delivery hop. Reference it when you want to see the smallest OS that still uses the full agentic pattern.

## 1. Orchestrator responsibility

Single-subagent dispatch. The orchestrator routes every brief to `briefer` (no classifier needed because there's only one specialist). Owns brief delivery and persistence.

Code: [orchestrator.py](orchestrator.py).

## 2. Subagent roster

| Subagent | Status | Responsibility |
|---|---|---|
| [`briefer`](agents/briefer/) | shipped | Reads cross-OS state (Sales OS leads, opportunity reports, budgets, recent outreach) and produces a personalized markdown briefing |

There are no plans to add more subagents to Brief OS. If a new responsibility emerges (e.g. "scheduled briefing delivery"), evaluate whether it belongs in `briefer` (skill addition) or as a standalone subagent.

## 3. OS-specific contracts

### 3.1 Cross-OS reads go through `cross_os_reader.py`

Brief OS reads state from other OSes (Sales pipeline, opportunity reports, budgets) **only** via [cross_os_reader.py](cross_os_reader.py). Direct imports from `oses.sales.*_tools` or `oses.<other>.*` are rejected. This isolation is what makes Brief OS removable cleanly (un-entitle → workspace gone, Sales OS untouched).

### 3.2 No own outbound channels

Brief OS does not send via Twilio, LiveKit, or any direct outbound stack. When `delivery_email` is configured, it reuses the Sales OS Gmail wiring through the shared connector — but Brief OS itself doesn't own a Gmail tool. **Don't add an `outbound_tools.py` here**; if outbound expands, the right move is to extract a shared "delivery" service, not to clone Sales OS's outbound surface.

### 3.3 Internal-only tools

Brief OS only exposes [internal_tools.py](internal_tools.py): `get_brief_context`, `save_brief`. New tools must be internal-only (no external SaaS) unless explicitly justified.

## 4. Brief-OS-specific anti-patterns

- ❌ Adding direct dependencies on `oses.sales.*` modules. Use [cross_os_reader.py](cross_os_reader.py).
- ❌ Adding `outbound_tools.py` to Brief OS. Reuse Sales OS Gmail via shared infrastructure or escalate to platform team.
- ❌ Splitting `briefer` into multiple subagents to "modularize". The single-subagent shape is intentional — Brief OS is the *minimal* OS proof.
- ❌ Removing the `cross_os_reader.py` abstraction in favor of direct DB queries. The abstraction is what proves OSes can compose without coupling.
- ❌ Adding a `channel_picker.py` here. Brief OS doesn't pick channels — it has one delivery path.

## 5. Pointers

- **Subagent code**: [agents/briefer/](agents/briefer/)
- **Orchestrator**: [orchestrator.py](orchestrator.py)
- **Cross-OS reader (the contract)**: [cross_os_reader.py](cross_os_reader.py)
- **Internal tools**: [internal_tools.py](internal_tools.py)
- **Migrations**: [migrations/](migrations/)
- **Brief-applicable skills**: `briefing-template` and `friendly-summary` in [/platform/skills/](../../skills/) (`applies_to` includes `briefer`)
- **Live status**: [/platform/STATUS.md](../../STATUS.md) — Phase 4

## Why Brief OS is the reference for "what minimal looks like"

If you're standing up a new OS that's even simpler than Sales OS, look at Brief OS first:
- Single subagent
- No outbound stack
- Cross-OS state via a single reader module
- ~50% fewer files than Sales OS

This is intentional — Brief OS proves you don't have to start big. New OSes should aim closer to Brief than to Sales until the responsibility set demands otherwise.
