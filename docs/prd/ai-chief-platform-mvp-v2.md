# AI Chief — Product Requirements Document (v2)

**Project:** AI Chief Platform — multi-tenant agent OS hosting PARTNER AI (Media/Talent) and Sales OS as initial tenants
**Version:** 2.0 (consolidates v1.0 + LLM Council review + Perplexity deep research)
**Date:** 2026-04-27
**Owner:** Arghya Chowdhury · Snehaal (PM) · Sean (Client/Stakeholder)
**Status:** Approved — implementation greenlit
**Methodology:** Outcome-Driven Innovation (ODI) — measure outcomes ("grow sales 10×", "automate film lifecycle"), not feature counts

---

## 1. Executive Summary

**AI Chief** is a multi-tenant platform that ships domain-specific AI workspaces ("OS tenants") for SMBs and creative professionals. Each tenant runs an orchestrator agent + specialized sub-agents + skills + tool connectors atop a shared Stage-1 stack:

```
CopilotKit · Claude Agent SDK · Composio · LiveKit · Mem0 · Supabase · Langfuse
```

Two initial tenants ship at launch:
- **PARTNER AI** — Media/Talent tenant for 9 creative personas. Filmmakers get 5-phase deep lifecycle (Development → Pre-Pro → Production → Post → Distribution).
- **Sales OS** — Sales/CRM tenant: Lead Gen → Outbound (Email/SMS/Voice SDR) → Inbound (Concierge + Demo Scheduler) → CRM writer → Conversion.

**Positioning**
- Snehaal (platform): *"Every SMB owner needs two people they can't afford: a world-class COO to run it, and a world-class CMO to grow it. AI Chief is both, in one operator."*
- Sean (PARTNER tenant): *"PARTNER AI — A personalized AI team that takes care of your business, so you can take care of your art."*

**Critical-path MVP target:** Sprint 2 complete — week 6 from kickoff.

---

## 2. Architecture Diagram

```
                ┌──────────────────────────────────────────────┐
                │   AI Chief  (meta-platform / oversight)      │
                │   - cross-tenant Langfuse, audit, admin       │
                │   - tenant provisioning, RBAC, billing        │
                │   - "COO + CMO for SMB owner" positioning     │
                └──────────────────────────────────────────────┘
                            │              │              │
                ┌───────────▼─────┐  ┌─────▼──────┐ ┌─────▼─────┐
                │   PARTNER AI    │  │  Sales OS  │ │  future   │
                │  (Media tenant) │  │            │ │  tenants  │
                │                 │  │            │ │  (Legal,  │
                │  - 9 personas   │  │            │ │  Health,  │
                │  - Filmmaker 5φ │  │            │ │  EdTech…) │
                └─────────────────┘  └────────────┘ └───────────┘
                            │              │              │
                ┌───────────▼──────────────▼──────────────▼─────┐
                │  Shared Stage-1 stack (every tenant uses):    │
                │   CopilotKit · Claude Agent SDK (wrapped) ·   │
                │   Composio · LiveKit · Mem0 · Supabase ·      │
                │   Langfuse · Stytch                            │
                └───────────────────────────────────────────────┘
```

---

## 3. Problem Statement

| Audience | Pain |
|---|---|
| Creative professionals | 10–20 disjoint tools (DAW, DistroKid, Final Draft, Wrapbook, Movie Magic, Calendly, Stripe). Context switching kills creative time. No unifying business companion. |
| Filmmakers / Producers | Lifecycle tools fragmented across 5 phases. No single source of truth per project. |
| SMB sales teams | Outbound + inbound + scheduling + CRM hygiene split across Apollo, Smartlead, Cal.com, HubSpot. Each requires its own setup + automation rules. |
| Cross-domain | Every vertical has the same pattern: data sources → enrichment → outreach → conversion → memory. Yet each rebuilds it. |

**Insight (Snehaal):** the pattern is plug-and-play. One platform. Many tenants. Same primitives configured per domain.
**Insight (Sean):** integration > rebuild. Don't compete with Final Draft / Movie Magic / Wrapbook. Be the AI layer above them.

---

## 4. Target Users

### AI Chief admin (meta-tenant)
- Internal MulBros team
- Provisions tenants, monitors traces + costs, manages billing, escalates incidents

### PARTNER AI (9 personas)

| Persona | Sample user | Top job-to-be-done |
|---|---|---|
| Musician | Indie band releasing EP | Spotify stats · gig booking · royalty tracking · fan growth |
| Composer | Film/TV composer | Project pipeline · library catalog · sync licensing |
| Actor | Working actor | Audition tracking · agent comms · headshot/reel mgmt |
| Visual Artist | Painter / illustrator | Commissions · galleries · social · sales |
| Writer | Novelist / journalist | Pitch tracking · submissions · contract mgmt |
| Screenwriter | TV/feature writer | Loglines · query tracking · agent submissions |
| Film Crew | DP / Gaffer / Sound | Job board · day-rate negotiation · calendar |
| Arts Org | Non-profit director | Grant tracking · donor mgmt · programming |
| **Filmmaker** | Independent producer | **5-phase production lifecycle (deep)** |

### Sales OS

| Persona | JTBD |
|---|---|
| SMB founder (bootstrap SaaS) | Cold outbound + inbound concierge + demo booking |
| Sales lead (5–20 person team) | SDR augmentation: 10× pipeline without hiring |
| Solo consultant | One-person business that books own demos |

---

## 5. Goals & Non-Goals

### Goals (MVP)
1. Multi-tenant platform with `tenants` + `memberships` + tenant-scoped RLS, **bulletproof isolation**
2. PARTNER AI tenant live: 9 personas + Filmmaker 5-phase shell + 4 Tier-1 integrations
3. Sales OS tenant live: end-to-end demo flow (Prospector → Email SDR → Demo Scheduler → CRM write)
4. Shared agent runtime (Claude Agent SDK behind `AgentRuntime` abstraction wrapper)
5. CopilotKit chat surface
6. Mem0 memory + Langfuse observability across all tenants
7. Sean's verbatim positioning copy on PARTNER surfaces
8. Sean's 4Q onboarding (self / work / goals / tools)
9. HITL fallback for high-stakes actions (budget imports, CRM writes)
10. Production deploy on Vercel + Supabase

### Non-Goals (MVP)
- Native iOS/Android apps
- Marketplace with full bidding (Sprint 3+)
- All 18 Sean filmmaker integrations (4 in MVP, 14 deferred)
- Voice agents for Talent Agency (Sprint 3)
- Replacing Final Draft / Movie Magic / Wrapbook (forever non-goal — Sean explicit)
- Replacing Composio with custom action layer
- Multi-region data residency (Sprint 4)
- White-label per tenant (Sprint 4)
- Self-serve signup (invite-only for MVP per Council)

---

## 6. Methodology — Outcome-Driven Innovation (ODI)

Per Perplexity research, frame all features around user outcomes, not features:

| User outcome | Tenant | MVP feature delivering it |
|---|---|---|
| "Grow sales 10× without hiring" | Sales OS | Lead-to-demo automation (Prospector + Email SDR + Demo Scheduler + CRM Writer) |
| "Automate my film lifecycle" | PARTNER Filmmaker | 5-phase shell + script ingest + budget compare + call-sheet generator |
| "Free my creative time from busywork" | PARTNER (all 9) | Persona dashboard + universal PARTNER chat + Mem0 context + Composio actions |
| "Trust my AI operator with my business" | All | HITL fallback + Langfuse audit + per-tenant cost visibility |

Every feature ships with a measurable outcome metric (see §14).

---

## 7. Feature Priority Matrix

| Feature | Priority | Impact | Complexity | Sprint |
|---|---|---|---|---|
| Multi-tenant RLS foundation | Must-Have | High | High | 0 |
| Stytch ↔ Supabase JWT bridge | Must-Have | Critical | High | 0 (already shipped — carry-forward) |
| Agent runtime + abstraction wrapper | Must-Have | High | High | 0 |
| 4Q onboarding + goal refinement | Must-Have | High | Medium | 1 |
| Filmmaker 5-phase shell + 4 Tier-1 integrations | Must-Have | High | Medium | 2 |
| Sales OS lead-to-demo flow | Must-Have | High | Medium | 1 |
| Mem0 namespaces + Langfuse traces | Must-Have | High | Low | 0–1 |
| HITL fallback (high-stakes actions) | Must-Have | Critical | Low | 1 |
| Real-time RAG (Mem0 mid-chat retrieval) | Should-Have | Medium | Medium | 2 |
| Vendor directory v1 (read-only) | Should-Have | Medium | Low | 2 |
| Voice SDR (LiveKit + ElevenLabs + Deepgram) | Should-Have | Medium | High | 1.5 / 3 |
| Cross-jurisdiction budget compare v1 | Could-Have | Medium | Medium | 2 |
| Meta-tenant admin UI | Could-Have | Low | Low | 4 |
| Marketplace bidding | Won't (MVP) | High | High | 3 |
| 14 remaining filmmaker integrations | Won't (MVP) | Medium | High | 3+ |

---

## 8. MVP Scope

### Must ship (no exceptions)
- AI Chief platform with multi-tenant data model + RBAC
- Shared Stage-1 stack
- CopilotKit chat surface (web)
- PARTNER AI: 9 personas with onboarding-driven access · Filmmaker 5-phase nav with empty-phase agent prompts · Sean's marketing copy verbatim
- Sean's 4Q onboarding (self / work / goals / tools_used)
- Filmmaker Tier-1 integrations: Final Draft `.fdx` · Movie Magic Budget CSV · Wrapbook OAuth · Excel/CSV
- Sales OS: Lead Gen pod (Apollo/Clay/Firecrawl) · Email SDR (Smartlead/Gmail via Composio) · Demo Scheduler (Cal.com via Composio) · CRM Writer (HubSpot + Salesforce via Composio)
- Mem0 per-user memory namespaces
- Langfuse traces on every agent + tool call (Sprint 1, not deferred — per Council)
- Stytch auth + per-tenant RLS
- HITL approval modals for high-stakes actions
- Invite-only signup gating

### Should ship if time permits
- Vendor directory v1 (read-only, Filmmaker tenant)
- Call-sheet PDF generator
- Cross-jurisdiction budget comparison v1 (top 10 jurisdictions, static incentive table)
- Voice SDR

### Won't ship in MVP
- 14 of 18 Sean filmmaker tool integrations
- Marketplace with bidding
- Meta-agent (cross-tenant COO/CMO supervisor)
- Mobile apps
- Voice for Talent Agency / PARTNER personas

---

## 9. Architecture

### 9.1 Layered model

| Layer | Component | Responsibility |
|---|---|---|
| Presentation | Next.js 15 + CopilotKit | SPA shell, tenant switcher, chat surface, vertical workspaces |
| Auth | Stytch + custom Supabase JWT bridge | Login, session, JWT mint with `tenant_id` in claims |
| Orchestration | Claude Agent SDK behind `AgentRuntime` wrapper | Per-tenant orchestrator + sub-agent routing + skills loader |
| Skills | `SKILL.md` files | Loaded dynamically per agent invocation |
| Tools | Composio (primary) + LiveKit + custom adapters | Gmail/Slack/CRM/Calendar + voice/video + bespoke (FDX/MMB) |
| Memory | Mem0 (hosted) | Tenant + user + entity (lead/project/script) namespaces |
| State | Supabase Postgres + pgvector | Tenant-scoped tables, RLS, embeddings |
| Observability | Langfuse Cloud | Traces, evals, PII filters, cost attribution per tenant |
| Hosting | Vercel (UI) + Supabase (DB) + Render (Express stragglers) | Multi-region in Sprint 4 |

### 9.2 Multi-tenant scoping

Every business table has `tenant_id uuid NOT NULL` with RLS:
```sql
CREATE POLICY tenant_isolation ON {table}
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));
```

Stytch JWT bridge mints Supabase JWT with `tenant_id` claim. Server middleware sets `current_setting('request.jwt.claims', true)` for query-level filtering.

### 9.3 Tenant-aware connection pooling (Council)

- **PgBouncer** (Supabase native) in transaction mode
- Per-tenant query labels via `set_config('request.tenant_id', ...)` for slow-query attribution in `pg_stat_statements`
- Connection budget per tenant (Sprint 4) to prevent noisy-neighbor saturation

### 9.4 Agent runtime abstraction wrapper

Wrap Claude Agent SDK behind an `AgentRuntime` interface. Critical fallback path if SDK proves immature in production.

```ts
// /apps/ai-chief/lib/agent/runtime.ts
export interface AgentRuntime {
  run(input: AgentInput): AsyncIterable<AgentEvent>;
}
// Default: ClaudeAgentSdkRuntime
// Fallback: DirectAnthropicRuntime — same skill-loading + tool-call contract
```

No callsite changes — only wrapper internals swap.

### 9.5 Per-request flow

```
User message
  → CopilotKit hook
  → Next.js API route /api/agent
  → AgentRuntime (tenant orchestrator)
       ├─ load skills (per persona / phase)
       ├─ route to sub-agent
       │   ├─ tool call → Composio / custom adapter (HITL gate if high-stakes)
       │   ├─ memory read/write → Mem0 (tenant + user namespace)
       │   └─ DB read/write → Supabase (RLS-gated)
       └─ Langfuse trace emitted with tenant_id + cost
  → Streaming response back to client
```

### 9.6 Path-based routing (Council)

- `aichief.com/media` — PARTNER AI tenant
- `aichief.com/sales` — Sales OS tenant
- `aichief.com/admin` — meta-tenant admin
- Sub-domains (`media.aichief.com`) defer to Sprint 4 — saves SSL + DNS overhead at MVP

---

## 10. Tech Stack

### Stage-1 Core (locked)
- Next.js 15 + React 19 + TypeScript (strict)
- CopilotKit (UI)
- Claude Agent SDK (TS)
- Anthropic API (Claude Opus / Sonnet / Haiku)
- OpenAI API (web search Responses API + embeddings + fallback)
- Composio (250+ tool adapters)
- LiveKit (voice/video)
- ElevenLabs + Deepgram + Twilio (voice agent stack)
- Mem0 (hosted)
- Supabase (Postgres + pgvector + Auth + Realtime + Storage)
- Stytch (auth provider — already wired in MulBros app)
- Langfuse Cloud (observability)

### Adopted open-source (MIT-compatible)
- **wshobson/agents** — orchestrator + 184 sub-agents + 150 skills + 78 plugins foundation
- **msitarzewski/agency-agents** — Sales 8 + Marketing 24 personalities for Sales OS
- **anthropics/skills** — document handling skills (PDF/PPTX/XLSX/DOCX)
- **VoltAgent/awesome-agent-skills** — 1000+ curated skills (Stripe, Linear, Resend, Sentry, Remotion, fal.ai)
- **wildwinter/screenplay-tools** OR **screenplay-js** (npm) — FDX + Fountain parser
- **alexc-hollywood/screenplay-parser** — auto-breakdown reference
- **MatthewDailey/open-sdr** — outbound automation patterns

### Skipped (evaluated, rejected)
- **AutoGPT** — Polyform Shield License blocks commercial multi-tenant SaaS
- **Dify** — competitor stack, not Claude SDK fit
- **LangGraph** — Claude Agent SDK chosen instead

### Frontend libs
- Tailwind 3.4 · shadcn/ui · Radix · Framer Motion · Lucide · @dnd-kit · date-fns · Zod · react-hot-toast

### Backend libs
- Next.js API Routes · Helmet · jsonwebtoken · Anthropic SDK · OpenAI SDK · Stytch SDK (server) · Supabase JS · Resend

### DevOps
- Vercel · Render · GitHub Actions · Sentry · Playwright · Vitest · ESLint · Prettier · pnpm (monorepo)

---

## 11. Data Model

### Core (AI Chief platform)
| Table | Key fields |
|---|---|
| `tenants` | id, slug, name, type ('media'\|'sales'\|...), settings jsonb |
| `memberships` | user_id, tenant_id, role ('owner'\|'admin'\|'member') |
| `profiles` | id (auth), stytch_user_id, email, default_tenant_id, goals jsonb, tools_used jsonb |
| `agent_runs` | id, tenant_id, user_id, agent_type, langfuse_trace_id, started_at, ended_at, cost_usd |
| `mem0_namespaces` | tenant_id, user_id, scope, mem0_collection_id |
| `hitl_approvals` | id, tenant_id, user_id, action_type, payload, status ('pending'\|'approved'\|'rejected'), decided_at |

### PARTNER AI (Media tenant)
| Table | Key fields |
|---|---|
| `personas` | tenant_id, user_id, persona_type, sub_persona_data jsonb |
| `projects` | tenant_id, user_id, persona, type, status, metadata jsonb |
| `pipeline_items` | project_id, stage, title, due_date, assignee |
| `chat_sessions` | tenant_id, user_id, title, last_message_at |
| `agent_chats` | session_id, role, content, created_at |
| `calendar_posts` | tenant_id, user_id, scheduled_at, channel, content |
| `back_office_invoices` / `_contracts` / `_payments` | tenant_id, user_id, ... |

### PARTNER AI Filmmaker
| Table | Key fields |
|---|---|
| `film_projects` | tenant_id, user_id, title, phase, script_id, budget_id |
| `film_scripts` | project_id, source_format, parsed_json, characters[], locations[] |
| `film_budgets` | project_id, source, line_items jsonb |
| `film_locations` | project_id, jurisdiction, name, contact, permitting, pricing |
| `film_vendors` | project_id, vendor_id, role, status |
| `film_call_sheets` | project_id, shoot_date, pdf_url, distributed_to[] |
| `film_assets` | project_id, dept, asset_type, path |

### Sales OS tenant
| Table | Key fields |
|---|---|
| `leads` | tenant_id, source, email, company, enrichment jsonb, intent_score |
| `outbound_messages` | lead_id, channel, status, scheduled_at, sent_at |
| `demos` | lead_id, scheduled_at, attendee_email, gong_recording_url |
| `crm_sync_log` | lead_id, target ('hubspot'\|'salesforce'), op, succeeded_at |

---

## 12. Key User Flows

### 12.1 Signup → tenant pick → onboarding → workspace

1. Stytch sign-up
2. Bridge mints Supabase JWT + creates `profiles` row
3. Tenant pick screen — "PARTNER AI (Creative)" or "Sales OS (Sales)"
4. Sean's 4Q onboarding (PARTNER):
   1. About yourself
   2. Your work
   3. Your goals (free-text + AI refinement via `callAI`)
   4. Tools you already use (multi-select from curated catalog)
5. Orchestrator seeds 3–5 starter tasks based on answers
6. Land on tenant dashboard

### 12.2 PARTNER AI Filmmaker — script ingest → breakdown

1. Upload `.fdx` script
2. `screenplay-js` parses → characters[], locations[], scenes[]
3. Filmmaker-Producer sub-agent generates breakdown (DOOD, props, day count)
4. Mem0 namespace persists script context for follow-up chats
5. Saved to `film_scripts` + `film_projects`; visible in Pre-Production phase

### 12.3 Sales OS — lead → demo

1. Inbound lead lands (RB2B de-anon or webhook from form)
2. Prospector sub-agent enriches via Apollo + Clay (Composio)
3. Intent detector scores; if score > threshold → route to Email SDR
4. Email SDR drafts personalized email using lead context + Mem0
5. **HITL approval gate** — first 30 days per tenant — user approves draft
6. Send via Smartlead or Gmail (Composio)
7. Reply triggers Demo Scheduler → Cal.com booking link → calendar invite to AE
8. CRM Writer logs activity to HubSpot + Salesforce (both via Composio)
9. Langfuse trace shows full chain with cost attribution

### 12.4 AI Chief admin → cross-tenant view

1. Admin logs in → meta-tenant view
2. Sees all tenants, agent runs (last 24h), token spend, Langfuse error rate
3. Drills into tenant → sees that tenant's leads/projects/users
4. Can pause an agent or impersonate user (audit-logged)

---

## 13. HITL (Human-in-the-Loop) Fallback Policy

High-stakes actions require explicit user approval until reliability proven (3-month track record minimum):

| Action class | HITL? | Approval UX |
|---|---|---|
| Outbound email send (Email SDR) | ✅ first 30 days per tenant | Draft + approve modal |
| CRM write (HubSpot / Salesforce) | ✅ always for delete/update | Confirm dialog with diff |
| Calendar booking on user's behalf | ❌ auto if user opted in | Slack/email confirmation post-fact |
| Filmmaker budget import (MMB / Excel) | ✅ always | Preview before commit |
| Stripe charge / refund | ✅ always | 2FA + reason required |
| Voice SDR call placement | ✅ first 60 days | Per-call enable toggle |
| Mem0 memory write | ❌ auto | Visible in user memory page |
| Wrapbook timecard READ | ❌ auto | Read-only, no approval needed |

After 30/60/90 days of <5% error rate per action, HITL can be disabled with admin override.

---

## 14. Success Metrics

### 14.1 Time-to-First-Value (TTFV) — primary outcome metric
- PARTNER Filmmaker: signup → first script breakdown rendered ≤ **10 min**
- PARTNER non-Filmmaker: signup → first persona-specific task seeded ≤ **5 min**
- Sales OS: signup → first enriched lead + drafted email ≤ **5 min**
- Sales OS: signup → first booked demo ≤ **24 hr**

### 14.2 Activation
- Onboarding completion rate ≥ **70%**
- Goals + tools_used captured for ≥ **80%** of completed onboardings
- ≥ 3 starter tasks seeded per user (PARTNER)
- ≥ 1 tool connected via Composio in first session (Sales OS)

### 14.3 Engagement
- DAU / MAU ≥ **30%** (SMB SaaS benchmark)
- Avg PARTNER chat sessions per user / week ≥ **3**
- Tool integrations connected per user (median) ≥ **2**
- Mem0 retrieval hit rate ≥ **40%**

### 14.4 Reliability (Council critical)
- Agent run success rate ≥ **95%**
- p95 agent response time < **10s**
- Langfuse error rate < **2%**
- HITL escalation rate < **15%** (high → reduce)

### 14.5 Cost & efficiency
- Avg cost per agent run < **$0.10** (PARTNER), < **$0.25** (Sales OS)
- Cache hit rate on common agent states ≥ **30%**
- Token spend per tenant tracked + visible in admin

### 14.6 Business
- 3 paying tenants (1 Media + 2 Sales) within 60 days of MVP launch
- Stripe MRR ≥ **$5k by day 90**
- Logo retention ≥ 90% at day 60

---

## 15. Team Configuration (Council)

| Role | Allocation | Focus |
|---|---|---|
| Senior Full-Stack Engineer | 1.0 FTE | Critical path: auth, RLS, agent runtime, tenant isolation |
| Frontend Specialist | 1.0 FTE | CopilotKit, complex UI, tenant switcher, dashboards |
| DevOps | 0.5 FTE | Vercel + Supabase + Render infra, monitoring, cost tracking |
| Product Manager | 1.0 FTE | Stakeholder alignment (Sean + Snehaal + tenants), spec, eval |

If team smaller — extend timeline proportionally; do **NOT** cut critical path (auth + RLS + monitoring).

---

## 16. Strategic Roadmap (30 / 60 / 90 days)

| Window | Objective | Key deliverables |
|---|---|---|
| **Day 30 — Foundation** | Stable auth + tenant isolation + agent runtime spike | Stytch-Supabase JWT bridge production-stable · multi-tenant RLS verified by automated penetration tests · monorepo scaffolded · `AgentRuntime` wrapper in place · CopilotKit shell live · Composio Gmail action working · Langfuse first traces · HITL approval UI shipped |
| **Day 60 — Tenant Validation** | Both tenants running for pilot users | PARTNER AI live with 4Q onboarding + filmmaker 5-phase shell + 4 Tier-1 integrations · Sales OS lead-to-demo end-to-end · 3 invite-only pilot tenants onboarded · TTFV measured on real users |
| **Day 90 — Optimization & Scale** | Cost + performance + admin maturity | Meta-tenant admin UI shipped · Langfuse-driven prompt refinement (top 5 high-cost chains optimized) · token spend dashboards · agent caching layer hot · 3 paying tenants converted from pilot · MRR ≥ $5k |

---

## 17. Sprint Validation Gates (Council mandatory)

| Gate | Pass criteria | Fail action |
|---|---|---|
| **Sprint 0** | Auth bridge + RLS automated tests passing + tenant isolation verified | BLOCK Sprint 1 — fix before any user data exists |
| **Sprint 1** | One Sales OS demo booked end-to-end on real tools | Investigate Composio adapter coverage; consider custom for Gmail/HubSpot/Cal.com only |
| **Sprint 2** | One filmmaker script processed FDX → breakdown → budget → vendor pull | Slip integrations to Sprint 3; ship shell-only for MVP |
| **MVP launch** | All 3 above + monitoring live + invite-only signup gated | Hold launch until all gates clear |

---

## 18. Sprint Plan

| Sprint | Weeks | Deliverable |
|---|---|---|
| **Sprint 0 — Scaffold** | 1 | Greenfield Next.js repo, CopilotKit shell, Claude Agent SDK orchestrator demo, Composio Gmail action, Mem0 demo, Langfuse trace, multi-tenant DB schema, `AgentRuntime` wrapper |
| **Sprint 1 — Two tracks** | 2 | Track A (Sales OS): demo end-to-end. Track B (MulBros app): Sean's PARTNER copy + 4Q onboarding + filmmaker 5-phase nav + route gating |
| **Sprint 2 — Migrate Media** | 3 | Port PARTNER AI to AI Chief platform as Media tenant. Ship 4 filmmaker integrations (FDX, MMB CSV, Wrapbook, Excel). Migrate MulBros users. |
| **Sprint 3 — Depth + Marketplace** | 4 | Filmmaker deep features (call-sheet, budget compare v1, location DB v1). Vendor marketplace v1 read-only. Voice SDR for Sales. |
| **Sprint 4 — Meta + remaining** | 4 | AI Chief meta-tenant admin UI. 14 remaining filmmaker integrations. Cross-tenant analytics. |

**MVP launch target:** end of Sprint 2 (week 6).

---

## 19. Integrations

### Sean's filmmaker tools

| Tool | MVP? | Source | Notes |
|---|---|---|---|
| Final Draft `.fdx` | ✅ | `screenplay-js` npm | XML parse; characters + locations |
| Fountain | ✅ | `screenplay-js` npm | Highland + Slugline export |
| Movie Magic Budget | ✅ | Custom CSV ingest | User exports CSV from MMB |
| Wrapbook | ✅ | OAuth (custom) | Timecards + payroll read |
| Excel/CSV | ✅ | papa-parse | Generic ledger ingest |
| Other 14 (EP suite, Gorilla, Set Hero, Scriptation, Skarratt, ScriptE, Raccorder, ZoeLog, FadeIn, Celtx, payroll services) | ❌ | Sprint 3+ | Per Composio availability or custom |

### Composio adapters (MVP set)
Gmail · Google Calendar · Slack · Linear · HubSpot · Salesforce · Stripe · Notion · Resend · Sentry · Apollo · Cal.com

### Carry-forward from current MulBros app
Spotify · OpenAI Responses API web_search · Apify (`trudax~reddit-scraper-lite`) · Firecrawl · Resend · jsPDF

---

## 20. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Multi-tenant RLS bug = data leak | **CRITICAL** | Mandatory test suite per migration; Supabase advisor in CI; manual audit Sprint 0; third-party security audit |
| Stytch ↔ Supabase JWT bridge brittle | HIGH | Custom-fetch interceptor pattern shipped; Sprint 0 carries forward + adds penetration tests |
| Claude Agent SDK + CopilotKit + Composio integration immature | HIGH | `AgentRuntime` abstraction wrapper (§9.4); fall back to direct Anthropic SDK |
| Composio missing adapters for Sean's filmmaker tools | MEDIUM | Custom adapters OK; tier-1 only needs FDX (parser) + Wrapbook (OAuth) |
| Multi-tenant performance lags | MEDIUM | Tenant-aware connection pooling immediately (§9.3); per-tenant query labels |
| Wrapbook + Movie Magic API sandbox unavailable | MEDIUM | Sean to confirm by Sprint 1 start; if blocked, slip to Sprint 3 |
| Mem0 hosted cost / latency | LOW | Start hosted; revisit if usage spikes |
| Langfuse retention costs | LOW | Sample non-production traces; full retention prod only |
| Sub-agent quality from `wshobson/agents` requires curation | MEDIUM | Cherry-pick + retest per tenant; not adopt-as-is |
| Sales OS — Apollo / Clay / RB2B quotas | MEDIUM | Free tiers for Sprint 1; paid quotas locked before paying tenants |
| Solo dev splitting context across MulBros + greenfield | HIGH | Path C explicit: greenfield in new repo; MulBros app gets only minimal pivot copy |
| Demo-only features that don't drive engagement | MEDIUM | TTFV metric enforces real user value, not screenshot quality |

---

## 21. Locked Decisions

| # | Decision | Source |
|---|---|---|
| 1 | Repo: monorepo (`pnpm` workspaces) — `/apps/ai-chief`, `/apps/mulbros` | Council |
| 2 | Brand: AI Chief umbrella + PARTNER AI Media tenant | Sean + user |
| 3 | Path C — greenfield Stage-1 + parallel MulBros app | Council |
| 4 | Mem0: hosted for MVP | Council |
| 5 | Langfuse: Cloud for MVP | Council |
| 6 | Routing: path-based (`aichief.com/media`, `aichief.com/sales`) | Council |
| 7 | Signup: invite-only for MVP | Council |
| 8 | Sprint validation gates mandatory (§17) | Council |
| 9 | Monitoring infra in Sprint 1 — not deferred | Council |
| 10 | `AgentRuntime` abstraction wrapper for SDK contingency | Council |
| 11 | HITL fallback policy for high-stakes actions (§13) | Perplexity |
| 12 | TTFV as primary outcome metric | Perplexity |
| 13 | ODI methodology for feature framing | Perplexity |
| 14 | Tenant-aware connection pooling (PgBouncer + per-tenant labels) | Council |
| 15 | CRM: HubSpot + Salesforce both via Composio | User |
| 16 | Filmmaker MVP: 5-phase shell + 4 Tier-1 integrations | Sean + user |
| 17 | Skipped: AutoGPT (license), Dify (stack), LangGraph (Claude SDK chosen) | Eval research |

---

## 22. Open Decisions

1. **Sales OS tenant brand name** — "AI Chief for Sales" / "Pipeline AI" / other?
2. **Composio paid-tier upgrade trigger** — adapter or quota threshold?
3. **Wrapbook + Movie Magic API access** — Sean to confirm sandbox by Sprint 1
4. **Pricing model** — per-tenant flat / per-seat / per-agent-run? (Snehaal)
5. **Voice SDR scope** — Sprint 1.5 (text+voice in MVP) or Sprint 3?
6. **Cost-attribution granularity** — per-agent-run vs per-tool-call (affects Langfuse export schema)

---

## 23. Glossary

| Term | Definition |
|---|---|
| **AI Chief** | Meta-platform brand. Multi-tenant, multi-OS. |
| **OS Tenant** | Domain-specific workspace under AI Chief (PARTNER AI, Sales OS, etc.) |
| **PARTNER AI** | Media/Talent OS tenant. Sean's vision. |
| **Sub-agent** | Specialized agent invoked by tenant orchestrator |
| **Skill** | A `SKILL.md` file with YAML frontmatter teaching Claude how to do a specific task |
| **Connector / Adapter** | Tool integration (Gmail, HubSpot, FDX parser). Most via Composio. |
| **Stage-1 stack** | Shared infra: CopilotKit + Claude Agent SDK + Composio + LiveKit + Mem0 + Supabase + Langfuse |
| **Mem0 namespace** | Scoped memory store (per tenant + user + entity) |
| **Persona** | One of Sean's 9 creative personas in PARTNER AI |
| **Phase** | One of 5 filmmaker lifecycle phases |
| **TTFV** | Time-to-First-Value — outcome metric (signup → first useful action delivered) |
| **HITL** | Human-in-the-Loop — explicit user approval gate for high-stakes actions |
| **ODI** | Outcome-Driven Innovation — methodology framing features around user outcomes |
| **AgentRuntime** | Abstraction wrapper around Claude Agent SDK enabling fallback to direct Anthropic API |

---

## 24. Faithfulness Check

### Sean's email
- ✅ All 9 personas captured (8 modular + Filmmaker deep)
- ✅ 4Q onboarding (self / work / goals / tools)
- ✅ Goal refinement loop (orchestrator seeds tasks)
- ✅ Filmmaker 5-phase shell
- ✅ Every Development / Pre-Pro / Production / Post / Distribution wishlist item mapped to MVP or Sprint 3
- ✅ All 18 tool integrations on backlog (4 in MVP, 14 in Sprint 3)
- ✅ Symbiotic marketplace on roadmap (Sprint 3)
- ✅ Sean's verbatim positioning copy in product surfaces
- ✅ Brand candidates surfaced (PARTNER AI Media tenant locked)

### Snehaal's diagrams + Slack
- ✅ Stage-1 stack matches diagram exactly (CopilotKit / Claude Agent SDK / Composio / LiveKit / Mem0 / Supabase / Langfuse)
- ✅ Stage-2 module pattern (Sources → pods → orchestrator → conversion → data → governance) delivered as Sales OS
- ✅ Plug-and-play architecture (orchestrator + sub-agents + skills loader)
- ✅ Multi-tenant via tenants + memberships + RLS by tenant_id
- ✅ Meta-level oversight UI (Sprint 4)
- ✅ "AI Chief — COO + CMO in one operator" positioning baked into platform brand

### LLM Council directive
- ✅ Stable auth bridge before any user data (Sprint 0 gate)
- ✅ Recommended team config documented (§15)
- ✅ All locked decisions per consensus (§21)
- ✅ Monitoring infra in Sprint 1, not deferred (§14.4)
- ✅ Abstraction wrapper for SDK contingency (§9.4)
- ✅ Tenant-aware connection pooling (§9.3)
- ✅ Sprint validation checkpoints mandatory (§17)

### Perplexity deep research
- ✅ Outcome-Driven Innovation methodology adopted (§6)
- ✅ TTFV as primary outcome metric (§14.1)
- ✅ HITL fallback policy for high-stakes actions (§13)
- ✅ Multi-tenant RLS isolation flagged CRITICAL (§20)
- ✅ Aggressive caching of common agent states (§14.5)
- ✅ Manual fallback for budget imports + CRM writes (§13)
- ✅ Avoid demo-only features (TTFV gates this — §14.1, §20)

---

**End of PRD v2.**
