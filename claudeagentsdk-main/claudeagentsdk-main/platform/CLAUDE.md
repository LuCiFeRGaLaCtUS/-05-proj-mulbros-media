# /platform — cross-OS conventions

This file is loaded by Claude Code on top of [/CLAUDE.md](../CLAUDE.md) when working anywhere under `/platform/`. It captures the conventions that apply to **every OS** — the shared foundation that makes parallel teams' code fit together.

## Layout

```
platform/
  apps/             # FastAPI server, scheduler, CLI — these orchestrate OSes, they do NOT replace them
  chat/             # Translation layer for chat-driven tool calls (per-OS, dispatch by os_name)
  config/           # platform.yaml, tenants/<slug>.yaml, policies.yaml (governance allowlists)
  governance/       # @governed middleware, budget ledger, PII filters, variance alerts, policies engine
  oses/             # ⭐ one folder per OS — every OS follows the same shape (see oses/CLAUDE.md)
    _protocol.py    # The OS protocol every OS implements (do not modify casually)
    _template/      # Copy this when standing up a new OS
    sales/          # Sales OS
    brief/          # Brief OS
    <future-os>/    # Future OSes plug in here
  platform_os/      # Cross-OS spine: registry, classifier, opportunity scanner, meta-OS
  shared/           # DB client, mem0 wrapper, observability, auth — same surface for every OS
  skills/           # Markdown skills, gated to subagents via applies_to frontmatter
  tools/            # Connectors (Composio + direct adapters). Tools call connectors; agents call tools.
  wizards/          # Schema-driven onboarding wizards — generated from each OS's config schema
```

## Cross-OS rules (apply to Sales, Marketing, Brief, CX, …)

### 1. Every OS plugs in via the OS protocol

Every OS must export `OS_INSTANCE` from its `__init__.py` conforming to the `OS` protocol in [oses/_protocol.py](oses/_protocol.py). The platform registry auto-discovers OSes by walking `oses/*/`. Sales OS and Brief OS are the canonical examples.

```python
# oses/<name>/__init__.py
OS_INSTANCE: OS = _MyOS()
```

### 2. Tenant context is non-negotiable

Every OS handler receives a `TenantCtx` (see [_protocol.py](oses/_protocol.py)). Every database table has `tenant_id`. Every Mem0 namespace is tenant-scoped. Every outbound action checks `ctx.sandbox` and redirects accordingly. **There is no global state.**

### 3. Sandbox mode is the default safety net

When `ctx.sandbox.enabled == True`, every outbound action redirects to the operator's contacts. `original_to` is preserved in audit so policies can't be bypassed by pretending to be sandbox. This applies to **every OS that does outbound** — Sales sends, Marketing sends, future CX sends.

### 4. Governance wraps every tool

Every tool function — every one — wraps with `@governed` from [governance/middleware.py](governance/middleware.py). This handles:
- Audit row in `audit_events` (with `agent_name` so we know which subagent acted)
- Budget ledger debit if the tool has a `cost` declaration
- Sandbox redirection
- Tool allowlist check against [config/policies.yaml](config/policies.yaml)

A tool that doesn't have `@governed` is an architectural bug.

### 5. Mem0 access goes through the shared wrapper

Use [shared/memory/mem0.py](shared/memory/mem0.py) (`remember()` / `recall()`). It applies PII redaction on write and tenant-scoping on read. **Do not import `mem0ai` directly anywhere outside this module.**

### 6. Composio is the preferred connector layer

If a Composio toolkit exists for the SaaS you need (Gmail, Apollo, LinkedIn, HubSpot, Salesforce, Slack, Google Calendar, …), use [tools/composio.py](tools/composio.py). Fall back to a direct adapter under `tools/<name>.py` (modeled on [tools/twilio.py](tools/twilio.py) or [tools/livekit.py](tools/livekit.py)) only when no Composio coverage exists. See [tools/CLAUDE.md](tools/CLAUDE.md).

### 7. Every OS owns its own migrations

Migrations live at `oses/<os>/migrations/<NNN>_<name>.sql`. They are append-only, numbered, and scoped to the OS's tables. Every table has `tenant_id`. **Never** modify a shipped migration; add a new one.

### 8. Prompts are versioned, never edited in place

Subagent prompts live at `oses/<os>/agents/<name>/prompts/v<N>.md`. To change a shipped prompt, write `v<N+1>.md` and bump `PROMPT_VERSION` in `definition.py`. The version manifest in `audit_events` lets us roll back. **Never edit `v1.md` after it ships.**

### 9. Skills are platform-wide, gated per subagent

All skills live in [/platform/skills/](skills/). The `applies_to` frontmatter field is the gate — only a subagent listed there gets the skill injected into its prompt. **Don't put skills under `oses/<os>/skills/`** (the Sales OS folder has a stale `skills/` subdir; treat it as deprecated and add new skills to the platform-wide dir).

### 10. Multi-tenant is real, not aspirational

Two tenants (`acme-test` and `northwind-health`) coexist with verified isolation. **Every** new code path must remain tenant-isolated. Run `make demo-snapshot` to verify after schema changes.

## Anti-patterns rejected at the platform level

- ❌ Adding global mutable state in any module under `/platform/`.
- ❌ Calling `mem0ai` directly anywhere outside [shared/memory/mem0.py](shared/memory/mem0.py).
- ❌ Writing to a database table without `tenant_id` filtered.
- ❌ Editing `v1.md` of a shipped prompt instead of bumping to `v2.md`.
- ❌ Skipping `@governed` on a tool function.
- ❌ Adding a hardcoded tenant slug anywhere outside [config/tenants/](config/tenants/).
- ❌ Adding logic to `apps/api/` routes that should live inside an OS orchestrator.
- ❌ Importing `platform` as a Python package — name collides with stdlib `platform`. Use the modules directly (`oses.sales`, `governance.middleware`, etc.) per [pyproject.toml](pyproject.toml).

## Where the agentic pattern lives

| Concern | File |
|---|---|
| OS construction + subagent shape | [oses/CLAUDE.md](oses/CLAUDE.md) |
| Skill format | [skills/CLAUDE.md](skills/CLAUDE.md) |
| Connector pattern | [tools/CLAUDE.md](tools/CLAUDE.md) |
| Per-OS specifics (Sales) | [oses/sales/CLAUDE.md](oses/sales/CLAUDE.md) |
| Per-OS specifics (Brief) | [oses/brief/CLAUDE.md](oses/brief/CLAUDE.md) |
| Live status | [STATUS.md](STATUS.md) |
