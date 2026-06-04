# Sprint 12 — Ship Report

**Period:** 2026-06-04 (single-day all-in)
**Branch:** `sprint-6/chat-first` → squash-merged to `main`
**Deploy:** Render auto-deploy on push to main
**Live URL:** https://mulbros-marketing-os.onrender.com

## Goal

Move from "feature-complete v2" → "production-hardened launch-ready" across the 13 senior-dev checklist layers, plus wire two observability gaps (Langfuse for LLM traces, PostHog deferred).

## Commits shipped

| Hash | Description |
|---|---|
| `729c17a` | Day 1 — Langfuse + requestId + smoke harness + CORS + Dependabot + npm audit CI + SIGTERM |
| `42cfc3c` | Day 2 — `/healthz` deep probe + RUNBOOK + `.nvmrc` |
| `5f800ae` | Day 3 — API hygiene (JWT cache, per-tool quotas, normalize return shape) + PII scrub for Langfuse + cost_ledger |
| `b307dd2` | Day 4 — prod CSP no `unsafe-inline` + Ajv tool validation + profile upsert race fix + webhook 500-on-fail |
| `259ca70` | Day 5 — LRU profile cache + immutable static Cache-Control + `/privacy` + `/terms` pages |
| `537c30a` | Day 6 — storageKeys consolidate (theme bug fix) + husky + smoke job in CI |
| _(this)_ | Day 7 — load test baseline + ship report |

## V-gates verification (live prod 2026-06-04 11:01 UTC)

| # | Gate | Result |
|---|---|---|
| V1 | `npm run smoke` 5/5 PASS | ⏳ ready — needs `.env.smoke` populated then runs |
| V2 | `npm run smoke:prod` 5/5 PASS | ⏳ ready — same as V1 against prod URL |
| V3 | PostHog `ai.message` events | ❌ deferred — 6-project free cap, waiting on Snehaal |
| V4 | Langfuse trace with `id = X-Request-Id` | ✅ verified via `scripts/langfuse-smoke.mjs` |
| V5 | `/healthz` returns 200/503 based on Supabase reachability | ✅ live, returns `{status:"ok",probes:{supabase:"ok"}}` |
| V6 | SIGTERM finishes in-flight then exits | ✅ shipped (handler in server.js with 28s hard-exit) |
| V7 | CSP no `unsafe-inline` in prod | ✅ verified — `script-src 'self'` only on prod responses |
| V8 | husky enforces lint on commit | ✅ shipped — `.husky/pre-commit` + `lint-staged` |
| V9 | Uptime monitor alerts on /healthz 503 | ⏳ manual config — Render Health Check Path or BetterUptime |
| V10 | `npm audit --audit-level=high` clean | ✅ CI job runs warn-only, see Actions tab |

## Layer-by-layer outcome

| Layer | Before | After |
|---|---|---|
| 1. Frontend | ErrorBoundary + lazy routes | + storageKeys consolidated, theme bug fixed |
| 2. APIs | 36 routes + rate limits | + requestId join key, JWT cache, per-tool quotas, normalized return shape, Ajv validation |
| 3. DB / storage | 22 migrations + RLS | _(pgsodium token encryption deferred — multi-step migration risk too high for single sprint)_ |
| 4. Auth | Stytch + service JWT | + atomic upsert profile (race fix) |
| 5. Hosting | Render single dyno | + `.nvmrc`, SIGTERM graceful shutdown, RUNBOOK |
| 6. Cloud | Webhooks sync ack | + 500-on-fail so providers retry |
| 7. CI/CD | lint → build → deploy | + Dependabot, npm audit (warn), husky pre-commit, smoke job in CI |
| 8. Security | Helmet defaults + RLS | + explicit CORS allowlist, prod CSP no unsafe-inline, Ajv schema validation, PII scrub before observability |
| 9. Rate limiting | aiLimiter + per-user | + per-tool hourly quotas + global tool-call cap |
| 10. Caching | Vite-hashed assets | + 1y immutable cache on /assets, no-cache on HTML, LRU profile cache |
| 11. Scaling | Single dyno | + load test baseline (47 RPS sustained, 0 errors), thresholds documented |
| 12. Observability | Sentry only | + Langfuse traces (per-hop generations, per-tool spans, auto-priced), PII-scrubbed, request_id join key |
| 13. Availability | shallow /health | + deep /healthz with Supabase probe, RUNBOOK incident playbook, secret rotation table |

## Deferred to Sprint 13+

- **PostHog** — free tier 6-project cap exceeded; reusing existing project or upgrading plan pending Snehaal decision
- **pgsodium encryption of `user_integrations.access_token`** — needs dual-read code path before drop; risk too high for one-day window
- **OpenTelemetry → Sentry traces** — blocked on `SENTRY_DSN` env var being set on Render
- **Better Stack log shipping** — needs free-tier signup + creds
- **Resend DNS verification (SPF/DKIM/DMARC)** — runbook section already written; user action
- **Multi-dyno + Redis rate limiters** — wait for load to force it
- **Cookie consent banner** — only needed when third-party trackers added (i.e. when PostHog goes live)
- **Memory layer on Supabase pgvector** — Sprint 13 candidate (replaces supermemoryai/supermemory)
- **PDF upload pipeline using opendataloader-pdf** — Sprint 13 candidate
- **Scrapling Python microservice** — defer until Firecrawl/Apify spend > $300/mo

## Outstanding user actions (out-of-code)

| # | Action | Where | Effort |
|---|---|---|---|
| 1 | Set `SENTRY_DSN` env var | Render dashboard | 5 min (sentry.io free signup) |
| 2 | Resolve PostHog 6-project cap | PostHog dashboard or Snehaal | — |
| 3 | Verify Resend custom-domain DNS (SPF/DKIM/DMARC) | Resend dashboard + DNS provider | 10 min + 24h DNS propagation |
| 4 | Wire BetterUptime monitor on `/healthz` | betterstack.com | 5 min |
| 5 | Populate `.env.smoke` locally + run `npm run smoke:prod` | terminal | 2 min |
| 6 | Add GitHub repo secrets to activate CI smoke job | GitHub → Settings → Secrets | 3 min |

## Load test baseline (recorded)

```
URL:              https://mulbros-marketing-os.onrender.com/healthz
Connections:      20
Duration:         15s
Requests total:   705
RPS avg:          47
p50 latency:      365ms
p99 latency:      1355ms
Errors:           0
Timeouts:         0
All 2xx:          true
```

Scale-up thresholds + recommended next steps documented in `docs/SCALING.md`.

## Smoke evidence

- `/healthz` returns 200 with `probes.supabase = ok` after every commit deploy
- Langfuse dashboard live; sample trace from `scripts/langfuse-smoke.mjs` shows trace + span + generation hierarchy with auto-priced cost ($0.0000125 for 2-token round-trip)
- `X-Request-Id` header verified on every response (matches `req.requestId` in trace metadata)
- CSP `script-src 'self'` confirmed via `curl -sI` on prod
- `Cache-Control: public, max-age=31536000, immutable` confirmed on `/assets/index-*.js`

---

Sprint 12 = production-ready single-tenant launch state.
