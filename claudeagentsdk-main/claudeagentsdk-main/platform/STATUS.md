# Platform build status

Live scorecard tracking what's shipped against the [approved plan](/Users/avithe1/.claude/plans/this-is-amazing-and-floating-sifakis.md). Update at the end of each work chunk.

**Last updated**: 2026-04-27 · Phase 4 — Brief OS + Operator dashboard + multi-tenant.
**Current state**: Phases 0-3 complete. Phase 4: **Brief OS** is the plug-and-play proof (single-subagent OS reading cross-OS state into personalized briefings). **Operator dashboard** surfaces the meta-OS's cross-tenant pitch reports. **Multi-tenant** is now real — `acme-test` (fintech) and `northwind-health` (healthcare) coexist with verified isolation; the operator view aggregates pitches across both. Sales OS runs the full loop: classifier-routed sourcing → scoring → channel-picked outreach → 4-touch cadence → inbound qualification → meeting-book. Voice outbound via LiveKit (room-only or SIP-bridged) is live.

---

## Phase scorecard

### Phase 0 — Sales OS vertical slice ✅
| Item | State | Notes |
|---|---|---|
| Repo skeleton + Makefile + pyproject | ✅ | [platform/](.)  |
| Shared utils (config / db / memory / logging) | ✅ | [shared/](shared/) |
| DB migrations (core + leads) | ✅ | [001_core.sql](shared/db/migrations/001_core.sql), [001_leads.sql](oses/sales/migrations/001_leads.sql) |
| OS plugin protocol + registry + tenant ctx | ✅ | [_protocol.py](oses/_protocol.py), [registry.py](platform_os/registry.py) |
| Tenant config w/ sandbox (acme-test) | ✅ | [acme-test.yaml](config/tenants/acme-test.yaml) |
| Governance middleware (@governed, audit, sandbox) | ✅ | [middleware.py](governance/middleware.py) |
| Budget ledger + pacing engine v1 | ✅ | [budget.py](governance/budget.py) |
| 5 Sales OS subagents (auto-discovered plugin pattern) | ✅ | [agents/](oses/sales/agents/) |
| 20 populated skills (Predictable Revenue / MEDDIC / etc.) | ✅ | [skills/](skills/) |
| CLI entry (`make cli`, `make smoke`, `make demo-smoke`) | ✅ | [apps/cli](apps/cli/) |
| Real Composio MCP delivery (Gmail via `COMPOSIO_MULTI_EXECUTE_TOOL`) | ✅ | [tools/composio.py](tools/composio.py) |
| Sandbox-gated outbound delivered to inbox | ✅ | Phase 0 acceptance criterion met |

### Phase 1 — Scaffolding hardening ✅
| Item | State | Notes |
|---|---|---|
| Version resolution layer (prompts/skills/configs) | ✅ | [shared/versions.py](shared/versions.py) |
| `os_config_versions` append-only CRUD + CLI | ✅ | [os_config.py](shared/db/os_config.py), [config_cmd.py](apps/cli/config_cmd.py) |
| `version_manifest` on every audit_events row | ✅ | wired in orchestrator |
| Langfuse tracing (optional, per-run) | ✅ | [langfuse_tracer.py](shared/obs/langfuse_tracer.py) |
| Schema-driven wizard engine + widgets (CLI) | ✅ | [wizards/](wizards/) |
| `make onboard` (re-runnable, edit mode) | ✅ | [apps/cli/onboard.py](apps/cli/onboard.py) |
| Variance alerts with remedy hints | ✅ | [variance.py](governance/variance.py) |
| Hot-reloadable policies engine | ✅ | [policies.yaml](config/policies.yaml), [policies.py](governance/policies.py) |
| Policy checks honor `original_to` (sandbox can't bypass) | ✅ | verified |
| Variance alerts surface in orchestrator prompt | ✅ |  |
| PII redaction on mem0 remember/recall | ✅ | [pii.py](governance/pii.py) |
| Prompt-injection scan at orchestrator intake | ✅ | logged, not blocked |
| Stytch integration (HS256 agent tokens + B2B client scaffolded) | ✅ | [auth/stytch.py](shared/auth/stytch.py) |
| Rollback verification test (<60s) | ✅ | exercised v1↔v2 via CLI |

### Phase 2 — Meta-OS + local Web UI ✅
| Item | State | Notes |
|---|---|---|
| `os_events` emitted on lead/outreach transitions | ✅ | [shared/events.py](shared/events.py) |
| Opportunity scanner (4 patterns: pipeline-gap, stale-contacted, budget-warning, cross-OS-pitch) | ✅ | [opportunity.py](platform_os/opportunity.py) |
| `make meta-digest` + daily scheduler | ✅ | [apps/scheduler](apps/scheduler/), [meta_digest.py](apps/cli/meta_digest.py) |
| Opportunity reports in orchestrator prompt | ✅ |  |
| FastAPI backend | ✅ | [apps/api](apps/api/) |
| Chat session + message persistence | ✅ | [shared/db/chat.py](shared/db/chat.py) |
| Plain HTML chat UI (sidebar + bottom-center chat bar) | ✅ | [apps/web](apps/web/) |
| Dashboard view (funnel tiles / budgets / goals / leads / outreach) | ✅ | per-OS `/api/.../dashboard` |
| Opportunity cards with structured remedies → chat actions | ✅ |  |
| Inline wizard widget (edit config in chat) | ✅ | [wizards/schema_json.py](wizards/schema_json.py) |
| `make up` (scheduler + api together) | ✅ |  |
| Session auto-rename from first brief | ✅ |  |
| `make demo-seed / demo-reset / demo-snapshot` | ✅ | [demo_*.py](shared/db/) |

### Phase 3 — Sales OS depth (in progress)
| Item | State | Notes |
|---|---|---|
| Intent-driven sourcing pre-classifier (Haiku) | ✅ | [classifier.py](platform_os/classifier.py); logs to `os_events` as `classifier.decided`; ~$0.002/call |
| SDR inbound webhook (reply → qualify → respond → update lead) | ✅ | [webhooks.py](apps/api/webhooks.py), [inbound.py](oses/sales/inbound.py); POST `/api/webhooks/inbound` with `X-Webhook-Secret` |
| Correlation by provider_id OR email hint | ✅ |  |
| Dashboard: inbound tile + Recent inbound section | ✅ |  |
| 4-touch cadence scheduler (bump / value / break-up) | ✅ | [cadence.py](shared/db/cadence.py); `003_cadence.sql`; auto-scheduled on first-touch, cancelled on reply, dispatched by `apps/scheduler` each tick |
| Dashboard: Scheduled follow-ups section | ✅ |  |
| Deterministic channel picker (pure Python) | ✅ | [channel_picker.py](oses/sales/channel_picker.py); budget + compliance-aware; exposed as `pick_channel` MCP tool |
| BDR prompt v3 — uses `pick_channel` before drafting | ✅ | [v3.md](oses/sales/agents/bdr_outbound/prompts/v3.md) |
| LiveKit voice outbound | ✅ | [tools/livekit.py](tools/livekit.py); room + access-token always works; SIP dial-out if `LIVEKIT_SIP_TRUNK_ID` set, else warm-dial URL |
| Reply threading (Re: header chain) | ⏳ | subject preserved today; deeper threading deferred to post-Phase-3 |

### Phase 4 — Brief OS (plug-and-play proof) ✅
| Item | State | Notes |
|---|---|---|
| OS plugin module + `OS_INSTANCE` export | ✅ | [oses/brief/__init__.py](oses/brief/__init__.py) |
| `BriefConfig` pydantic schema (4 basic fields) | ✅ | [config.py](oses/brief/config.py) |
| Single subagent (`briefer`, drop-in pattern) | ✅ | [briefer/](oses/brief/agents/briefer/) |
| Cross-OS reader — pipeline / opportunities / budgets / outreach | ✅ | [cross_os_reader.py](oses/brief/cross_os_reader.py) |
| Internal MCP tools (`get_brief_context`, `save_brief`) | ✅ | [internal_tools.py](oses/brief/internal_tools.py) |
| Skills: `briefing-template` + `friendly-summary` | ✅ | [skills/briefing-template.md](skills/briefing-template.md), [skills/friendly-summary.md](skills/friendly-summary.md) |
| Migration: `briefs` table | ✅ | [001_briefs.sql](oses/brief/migrations/001_briefs.sql) |
| Orchestrator (single-subagent dispatch, no classifier) | ✅ | [orchestrator.py](oses/brief/orchestrator.py) |
| Wired into `platform.yaml` + tenant entitlement | ✅ | brief: experimental |
| API `post_message` per-OS handler dispatch | ✅ | `_OS_HANDLERS` map in [server.py](apps/api/server.py) |
| API dashboard endpoint (`_brief_dashboard`) | ✅ | tiles + recent briefs + cross-OS opps |
| Web UI: workspace switching + Brief OS dashboard | ✅ | `renderBriefDashboard` in [app.js](apps/web/app.js) |
| Translation layer entries for brief tools | ✅ | [translations.py](chat/translations.py) |
| Sandbox-aware Gmail send when `delivery_email` set | ✅ | reuses Sales OS's Composio Gmail wiring |
| Removable cleanly (un-entitle → workspace gone, Sales OS untouched) | ✅ | proven by toggling acme-test.yaml |

### Phase 4d — Multi-tenant in practice ✅
| Item | State | Notes |
|---|---|---|
| Second tenant config (`northwind-health.yaml`) | ✅ | healthcare vertical, sales-only entitlement, smaller budgets |
| `GET /api/tenants` (sidebar tenant switcher) | ✅ | enumerates `config/tenants/*.yaml` |
| `?tenant=<slug>` URL override in web UI | ✅ | sidebar tenant chip becomes a dropdown when >1 tenant exists |
| `cross_os_pitch` extended to recommend Brief OS | ✅ | available-vs-roadmap status surfaces in pitch metadata |
| Operator dashboard now shows 5 pitches across 2 tenants | ✅ | grouped by tenant; hydrated display names |
| Tenant isolation verified | ✅ | per-tenant dashboards return only their own leads; zero cross-tenant overlap |
| Healthcare-flavored seed leads for Northwind (4 leads at varied statuses) | ✅ | distinct from Acme's fintech leads; visually differentiated demo |

### Phase 4c — Operator dashboard ✅
| Item | State | Notes |
|---|---|---|
| `GET /api/operator/pitches` (cross-tenant unacked operator-audience) | ✅ | hydrates `tenant_display`; reuses existing ack endpoint |
| `POST /api/operator/scan` (re-run scanner across all tenants) | ✅ | enumerates `config/tenants/*.yaml`, calls `opportunity.run_for_tenant` |
| Sidebar "Operator" view-item with live pitch-count pill | ✅ | pill updates on boot + each load |
| Operator pane: tiles (open pitches, tenants in scope) + grouped pitch cards | ✅ | reuses `.opp-card` styling; tenant-grouped |
| Acknowledge / dismiss flow | ✅ | shared `/api/opportunities/{id}/acknowledge` endpoint |
| Cross-OS pitch threshold tuned (5 → 3 active leads) | ✅ | fires earlier so operator can pitch sooner |
| Seeded pitch reports (Marketing + CX upsell candidates for acme-test) | ✅ | `make meta-digest` produces them |

### Phase 4b — Second product OS ⏳
| Item | State | Notes |
|---|---|---|
| Marketing OS (or CX OS) scope lock | ⏳ | confirm at phase start per scope-discipline rule |
| Thin first version ≤500 LOC + config schema + 2-4 skills | ⏳ |  |
| Meta-OS cross-OS opportunity detection | ✅ | scanner pattern `cross_os_pitch` operational; operator dashboard surfaces them |

### Phase 5 — External deploy (optional, on-demand) ⏳
| Item | State | Notes |
|---|---|---|
| Dockerize platform + scheduler + next.js web | ⏳ |  |
| Stytch B2B human auth (magic link / SSO) | ⏳ | B2B client already initializing (Phase 1); needs UI + session handling |
| Real Stytch M2M agent tokens (drop-in upgrade) | ⏳ | code path ready; needs dashboard M2M client |
| RLS flipped on per-tenant | ⏳ | scaffolded in migrations |
| Scheduler → hosted cron | ⏳ |  |

---

## Quick-reference commands

Setup (one-time):
```bash
make install                               # editable install into ../.venv
# install exec_sql RPC in Supabase once:   shared/db/setup_rpc.sql
make bootstrap                             # migrate + upsert tenant + seed budgets/goals
```

Daily:
```bash
make up                                    # scheduler + api; open localhost:3000
make smoke                                 # CLI end-to-end (source+enrich+score+BDR)
make demo-smoke                            # skip sourcing; score+BDR on seeded leads
make meta-digest TENANT=acme-test          # run meta-OS scanner once
```

Governance / ops:
```bash
make onboard                               # re-run the wizard in edit mode
make config-list                           # config version history
make config-show
python -m apps.cli.config_cmd --tenant acme-test --os sales restore --version 3
python -m apps.cli.config_cmd --tenant acme-test --os sales pin-prompt --agent lead_sourcer --version 1
```

Demo lifecycle:
```bash
make demo-seed                             # insert 3 pre-enriched leads
make demo-snapshot                         # export ./snapshots/<tenant>-<ts>.json
make demo-reset                            # wipe operational state (prompts first)
```

---

## Known caveats / deferred

- **Orchestrator routing is still prompt-based.** The plan calls for a Haiku pre-classifier; current behavior uses the orchestrator's system prompt + subagent `TriggerSpec`s. It works but isn't a proper classifier yet — Phase 3.
- **Subagents share the orchestrator's token scope (`tool:*`).** Per-subagent scope narrowing is deferred to Phase 3/4 when we have per-subagent contexts.
- **Web UI is plain HTML + vanilla JS, not Next.js.** This was a pragmatic Phase 2 choice — ports to Next.js in Phase 5 when we do external deploy + Stytch human auth.
- **SMS requires direct Twilio** (Composio doesn't have a Twilio toolkit). Optional; `send_sms` returns `status=skipped` if Twilio creds unset.
- **Apollo Master API Key required** for real sourcing via Composio. Use `make demo-seed` to exercise the pipeline without it.
- **No per-subagent token; single run-scoped token.** Means a compromised subagent prompt could in theory request tools outside its declared allowlist. Mitigated by policies.yaml's `tool_allowlist` + agent name identification in audit.
- **Prompt-injection scan is log-only** (no block). Intentional — false positives on legit briefs would harm productivity more than current threat.

---

## How to update this doc

When you finish a chunk of work:
1. Tick the relevant rows to ✅.
2. Add file references using `[filename](path)` so grep-hints stay accurate.
3. Bump the "Last updated" timestamp.
4. If deferring something new, add it under "Known caveats / deferred" with a reason.
