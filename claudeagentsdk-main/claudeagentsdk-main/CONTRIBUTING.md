# Contributing

Welcome. This repo is an agentic platform — it's not a typical Python service. **Read this file fully before opening your first PR.** Most rejected PRs come from drifting away from the architectural pattern, not from code-quality issues.

## The architectural rule (one rule, no exceptions)

Every capability under [/platform/oses/](platform/oses/) is implemented as either:

- **(a)** the OS's **orchestrator agent**, or
- **(b)** a **specialist subagent** within it

— each owning its own **skills + tools + connectors**.

We do **NOT** accept new procedural single-flow code paths anywhere under `/platform/oses/`. This applies identically to **Sales OS, Marketing OS, Brief OS, CX OS, and every future OS**. Multiple teams work in parallel on different OSes; the pattern is what makes their code fit together.

If you're tempted to write a script that "just does X" — stop, find or propose the subagent that owns X, and route the work through it.

## How Claude Code agents are kept on the pattern

Every Claude Code session in this repo auto-loads a hierarchy of `CLAUDE.md` files:

| File | Loaded when |
|---|---|
| [/CLAUDE.md](CLAUDE.md) | Every session, always |
| [/platform/CLAUDE.md](platform/CLAUDE.md) | Working anywhere under `/platform/` |
| [/platform/oses/CLAUDE.md](platform/oses/CLAUDE.md) | Touching any OS or creating a new one |
| [/platform/oses/<os>/CLAUDE.md](platform/oses/) | Touching that specific OS |
| [/platform/skills/CLAUDE.md](platform/skills/CLAUDE.md) | Adding/editing a skill |
| [/platform/tools/CLAUDE.md](platform/tools/CLAUDE.md) | Adding/editing a connector |

Claude Code reads them automatically. **Humans should read them too** — they're written for both audiences.

There are also two advisory hooks in [/.claude/settings.json](.claude/settings.json) that nudge away from off-pattern file layouts. They never block — they remind. Set `HOOK_BLOCK_OFF_PATTERN=1` in your shell if you want them to ask for confirmation instead.

## First-time setup

```bash
cp .env.example .env   # then fill in the keys you need (see notes below)
make install           # editable install into ../.venv
make bootstrap         # migrate + upsert tenant + seed budgets/goals
make demo-seed         # 3 pre-enriched leads to exercise the pipeline without Apollo
make up                # scheduler + API; open http://localhost:3000
```

**Set `SANDBOX_EMAIL` and `SANDBOX_PHONE` in `.env`** — sandboxed outbound from the dev tenants (`acme-test`, `northwind-health`) is redirected to those values, so they should be your own inbox/phone. The server warns at startup and refuses to send if either is missing.

`APP_ENV` defaults to `dev`; set it to `prod` only on real deployments. In `prod` the demo/operator surfaces are unmounted and the server hard-fails at boot if any tenant has `sandbox.enabled=true`.

See [/platform/STATUS.md](platform/STATUS.md) for the live build status — phases shipped, what's pending, known caveats.

## Workflow for a typical change

1. **Identify the OS.** Which OS owns this capability? If none, you're proposing a new OS — see [/platform/oses/CLAUDE.md](platform/oses/CLAUDE.md) and copy [/platform/oses/_template/](platform/oses/_template/).
2. **Identify the subagent.** Which specialist owns it? Read the OS's CLAUDE.md for the roster. If none, propose a new subagent *before writing code*.
3. **Decide what each piece is.**
   - Judgment ("when to escalate", "what tone", "which template") → **skill** in [/platform/skills/](platform/skills/)
   - Action ("write to DB", "send a message", "call a SaaS") → **tool** in the OS's `*_tools.py`, wrapped with `@governed`
   - Outside-world reach (HTTP, SDK) → **connector** under [/platform/tools/](platform/tools/), Composio first
4. **Write the smallest change.** No speculative abstraction, no scaffolding for hypothetical futures.
5. **Update [/platform/STATUS.md](platform/STATUS.md)** when you ship.

## What we reject in code review

- ❌ A new endpoint in `apps/api/` that calls a SaaS directly.
- ❌ A new `do_X.py` script under `/platform/oses/<os>/` that runs imperatively.
- ❌ Branching template logic inside `*_tools.py`. That's a skill.
- ❌ A connector under `/platform/tools/` not referenced by any subagent's `TOOLS` list.
- ❌ Calling Mem0 or Composio directly from a route. Route through a subagent or governed tool.
- ❌ Editing `prompts/v1.md` of a shipped subagent instead of bumping to `v2.md`.
- ❌ Skipping `@governed` on a tool function.
- ❌ A new OS without a `CLAUDE.md`. The OS isn't shipped without it.

## Working with Claude Code

- Open the project in your editor → Claude Code loads the CLAUDE.md hierarchy automatically.
- Ask in natural language ("add WhatsApp support") — Claude should respond by referencing the right subagent + skill + connector before writing code. If it doesn't, point it at the relevant CLAUDE.md.
- Use `/init` only if you're stuck — the existing CLAUDE.md hierarchy is more accurate than what `/init` would generate.
- Run `make smoke` after any significant change. Run `make demo-snapshot` before opening a PR if you changed the schema.

## Pull requests

- One subagent or one skill per PR where possible.
- Reference the relevant CLAUDE.md section in your PR description if you're doing something the docs don't explicitly cover.
- If your PR introduces a new SaaS, your description must answer: which subagent owns it? Which skill? Which tool? Composio toolkit or direct adapter?
- A PR that ships a new OS must include the OS's CLAUDE.md and a STATUS.md update.

## Where to find help

- Architectural questions → [/CLAUDE.md](CLAUDE.md) → drill down through the hierarchy
- Live status / what's done → [/platform/STATUS.md](platform/STATUS.md)
- Plan / roadmap context → ask the team lead; the architectural plans live in `~/.claude/plans/` of the originating engineer
