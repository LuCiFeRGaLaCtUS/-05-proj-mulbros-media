# Platform (Phase 0 foundation)

Multi-OS agent platform. Phase 0 ships a testable **Sales OS** with real Apollo sourcing + enrichment + scoring + sandbox-gated outbound.

See [the approved plan](/Users/avithe1/.claude/plans/this-is-amazing-and-floating-sifakis.md) for the full multi-phase design.

## Quick start

1. **Install deps** — from the parent `lead-agents-team/` directory (venv already exists there):
   ```
   cd platform && make install
   ```

2. **Install the Supabase `exec_sql` RPC once** — copy [shared/db/setup_rpc.sql](shared/db/setup_rpc.sql) into the Supabase SQL Editor and run it. One-time only.

3. **Bootstrap** — migrate, create the test tenant, seed budgets, seed goal:
   ```
   make bootstrap
   ```
   Idempotent — safe to re-run whenever you change the tenant config.

4. **Run a brief**:
   ```
   make smoke
   # or:
   make cli
   # or explicitly:
   ../.venv/bin/python -m apps.cli --tenant acme-test --os sales --brief "Source 3 UK fintech VP-Sales leads and send outreach"
   ```

Outbound is **sandboxed** to the contacts in `config/tenants/acme-test.yaml` — emails go to `avifszt@gmail.com` and SMS/voice to `+919821535682` with clear `[SANDBOX]` markers. The original target is preserved in `outreach_events` for audit.

## Layout

- `apps/cli/` — entry point (Phase 0: one-shot + simple prompt)
- `platform_os/` — intake, classifier, registry, tenant context
- `oses/sales/` — Sales OS: orchestrator + 5 subagents as drop-in modules under `agents/`
- `skills/` — 20 populated starter skills based on Predictable Revenue / MEDDIC / Outreach / Lemlist / HubSpot playbooks
- `governance/` — `@governed` middleware (audit, sandbox, budget)
- `shared/` — Supabase, Mem0, config, logging
- `config/` — `platform.yaml` (OS catalog), `branding.yaml`, `tenants/<slug>.yaml`

## What's next (not Phase 0)

- Phase 1: full chat REPL, onboarding wizard, Stytch real integration, Langfuse, versioning UI, pacing richness
- Phase 2: meta-OS, local Web UI
- Phase 3: second OS (Marketing)
- Phase 4: external deploy
