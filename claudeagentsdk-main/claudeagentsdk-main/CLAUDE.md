# Lead Agents Team — architectural rules for any Claude Code session

This file is auto-loaded on every Claude Code session in this repo. It is the **non-negotiable contract** between every contributor and every AI assistant working in this codebase.

## The one rule (applies to every OS, current and future)

This is an **agentic platform**. Every new capability inside [/platform/oses/](platform/oses/) is implemented as either:

- **(a)** the OS's **orchestrator agent**, or
- **(b)** a **specialist subagent** within it

— each with its own **skills + tools + connectors**.

We do **NOT** accept new procedural single-flow code paths anywhere under [/platform/oses/](platform/oses/). This rule applies identically to **Sales OS, Marketing OS, CX OS, Brief OS, and every future OS**. Multiple teams work in parallel on different OSes; the pattern is what makes their code fit together.

## Vocabulary (use these terms precisely)

- **OS**: a vertical capability area (Sales, Marketing, CX, Brief, …). Lives at `/platform/oses/<name>/`. Has one orchestrator + N specialists.
- **Orchestrator agent**: the one Claude Agent SDK agent at the top of an OS that routes briefs, owns memory, and escalates to humans.
- **Specialist subagent**: a narrow agent (e.g. `lead_sourcer`, `bdr_outbound`) that owns one responsibility. Drops into `/platform/oses/<os>/agents/<name>/`.
- **Skill**: a Markdown file under [/platform/skills/](platform/skills/) that gives a subagent **judgment** (what to say, when to escalate, which template). Frontmatter declares `applies_to: [<subagent>]`.
- **Tool**: a Python function exposed via MCP that takes an **action** (calls a SaaS, writes to DB). Lives in the OS's `internal_tools.py` or `outbound_tools.py`. Wraps with `@governed`.
- **Connector**: the SaaS-reaching adapter. Prefer **Composio toolkits** ([tools/composio.py](platform/tools/composio.py)). Fall back to a direct adapter under [/platform/tools/](platform/tools/) only when no Composio toolkit exists.

**Skills give judgment. Tools take action. Connectors reach the SaaS.** Never blur these.

## When you start ANY task in /platform/

1. Read [/platform/CLAUDE.md](platform/CLAUDE.md) for cross-OS conventions.
2. Read [/platform/oses/CLAUDE.md](platform/oses/CLAUDE.md) for the OS construction template + universal subagent shape.
3. Read the relevant OS's CLAUDE.md (e.g. [/platform/oses/sales/CLAUDE.md](platform/oses/sales/CLAUDE.md), [/platform/oses/brief/CLAUDE.md](platform/oses/brief/CLAUDE.md)).
4. **Identify which subagent owns this capability.** If none fits, propose a new one *before writing code* — see the new-subagent checklist in [/platform/oses/CLAUDE.md](platform/oses/CLAUDE.md).
5. Decide where each piece lives: **skill** (judgment) vs. **tool** (action) vs. **connector** (SaaS reach).
6. Wrap every new tool with `@governed` and register it in [config/policies.yaml](platform/config/policies.yaml) under the owning subagent's allowlist.

## Anti-patterns we reject (in EVERY OS)

- ❌ A new endpoint in `apps/api/` that calls a SaaS directly without going through a subagent.
- ❌ A new `do_X.py` script under `/platform/oses/<os>/` that runs imperatively instead of being a tool a subagent calls.
- ❌ Adding **logic** (judgment, branching templates) to `*_tools.py` — that belongs in a skill.
- ❌ Creating a connector under `/platform/tools/` without registering the corresponding tool in any subagent's `TOOLS` list.
- ❌ Calling Mem0 or Composio **directly** from FastAPI routes — route through a subagent or governed tool.
- ❌ Bypassing an OS's deterministic contracts (Sales: [channel_picker.py](platform/oses/sales/channel_picker.py); other OSes: see their CLAUDE.md).
- ❌ Creating a new OS without copying [/platform/oses/_template/](platform/oses/_template/) and writing the OS's CLAUDE.md.
- ❌ Editing a shipped subagent prompt at `prompts/v1.md` instead of bumping to `v2.md`.

## Standing up a new OS

See [/platform/oses/CLAUDE.md](platform/oses/CLAUDE.md) and copy [/platform/oses/_template/](platform/oses/_template/). Marketing OS will be the first to use this path; document any rough edges back into the template.

## Where to find what

| Topic | File |
|---|---|
| Cross-OS conventions | [/platform/CLAUDE.md](platform/CLAUDE.md) |
| OS construction template + subagent shape | [/platform/oses/CLAUDE.md](platform/oses/CLAUDE.md) |
| New-OS skeleton (copy this) | [/platform/oses/_template/](platform/oses/_template/) |
| Sales OS specifics | [/platform/oses/sales/CLAUDE.md](platform/oses/sales/CLAUDE.md) |
| Brief OS specifics | [/platform/oses/brief/CLAUDE.md](platform/oses/brief/CLAUDE.md) |
| Skill format | [/platform/skills/CLAUDE.md](platform/skills/CLAUDE.md) |
| Connector pattern | [/platform/tools/CLAUDE.md](platform/tools/CLAUDE.md) |
| Live build status | [/platform/STATUS.md](platform/STATUS.md) |
| Human-readable contributor guide | [/CONTRIBUTING.md](CONTRIBUTING.md) |

## Tone for AI assistants in this repo

- Lead with the rule, then the rationale.
- Name the subagent before naming the SaaS.
- Refuse to write code that violates the pattern; propose the pattern-aligned alternative instead.
- When in doubt about which subagent owns a capability, ask the human — do not invent a new responsibility silently.
