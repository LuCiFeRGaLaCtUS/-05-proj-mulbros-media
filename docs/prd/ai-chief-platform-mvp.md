# AI Chief — Product Requirements Document & MVP Spec

**Project:** AI Chief Platform — multi-tenant agent OS hosting PARTNER AI (Media/Talent) and Sales OS as initial tenants
**Version:** 1.1
**Date:** 2026-04-27
**Owner:** Arghya Chowdhury · Snehaal (PM) · Sean (Client/Stakeholder)
**Status:** Approved with conditions (LLM Council + Perplexity deep research, 2026-04-27)
**Methodology:** Outcome-Driven Innovation (ODI) — focus on user outcomes ("grow sales 10×", "automate film lifecycle"), not feature counts.

---

## 0. External Review Outcomes (v1.1)

### LLM Council Final Directive — APPROVE WITH CONDITIONS
1. Week 1 must deliver stable Stytch↔Supabase bridge + verified tenant isolation
2. Resource allocation must match recommended team config (see §14.1)
3. Open decisions resolved per consensus: monorepo · hosted Mem0+Langfuse · invite-only MVP · path-based routing
4. Monitoring infra implemented from Sprint 1, not deferred

### Perplexity Deep Research — Validation
- Outcome-Driven Innovation framework endorsed
- Multi-tenant RLS isolation flagged as critical-priority engineering work
- Time-to-first-value (TTFV) added as core activation metric (not just completion %)
- Manual HITL fallback required for high-stakes actions (budget imports, CRM writes) until reliability proven
- Aggressive caching of common agent states for cost control

---

## 1. Executive Summary

**AI Chief** is a multi-tenant platform that delivers domain-specific AI workspaces ("OS tenants") for SMBs and creative professionals. Each tenant runs an orchestrator agent + specialized sub-agents + skills + tool connectors atop a shared Stage-1 stack (Claude Agent SDK + CopilotKit + Composio + LiveKit + Mem0 + Supabase + Langfuse).

Two initial tenants ship at launch:
- **PARTNER AI** — Media/Talent tenant for 9 creative personas (Musicians, Composers, Actors, Visual Artists, Writers, Screenwriters, Film Crew, Arts Orgs, Filmmakers). Filmmakers get 5-phase deep lifecycle (Development → Pre-Pro → Production → Post → Distribution).
- **Sales OS** — Sales/CRM tenant with Lead Gen, Outbound (Email/SMS/Voice SDR), Inbound (Concierge + Demo Scheduler), CRM writer, Conversion.

**Positioning:** *"Every SMB owner needs two people they can't afford: a world-class COO to run it, and a world-class CMO to grow it. AI Chief is both, in one operator."* (Snehaal). For artists: *"PARTNER AI — A personalized AI team that takes care of your business, so you can take care of your art."* (Sean).

---

## 2. Problem Statement

| Audience | Pain |
|---|---|
| Creative professionals | Forced to jump between 10–20 disjoint tools (DAWs, DistroKid, Final Draft, Wrapbook, Movie Magic, Calendly, Stripe, etc.) — context switch tax kills creative time. No unifying business companion. |
| Filmmakers/Producers | Lifecycle tools fragmented across 5 phases. Budgets, schedules, locations, vendors, payroll, distribution — each in separate app. No single source of truth for a project. |
| SMB sales teams | Outbound + inbound + scheduling + CRM hygiene split across Apollo + Smartlead + Cal.com + HubSpot — each requiring its own setup, automation rules, and reporting. |
| Cross-domain | Every vertical has same pattern: data sources → enrichment → outreach → conversion → memory. Yet every vertical buys/builds its own version. |

**Insight (Snehaal):** the pattern is plug-and-play across domains. One platform. Many tenants. Same orchestrator + sub-agent + skill + connector primitives, configured per domain.

**Insight (Sean):** integration > rebuild. Don't compete with Final Draft / Movie Magic / Wrapbook. Be the AI layer that talks to all of them.

---

## 3. Vision

```
                ┌──────────────────────────────────────────────┐
                │   AI Chief  (meta-platform / oversight)      │
                │   - cross-tenant Langfuse, audit, admin       │
                │   - tenant provisioning, RBAC, billing        │
                │   - meta agent: COO + CMO for SMB owner       │
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
                │   CopilotKit · Claude Agent SDK · Composio ·  │
                │   LiveKit · Mem0 · Supabase · Langfuse         │
                └───────────────────────────────────────────────┘
```

**3-year endgame:** AI Chief is the de-facto agent platform for SMBs across 5–10 verticals. Each tenant ships in 4–6 weeks because the stack is shared.

---

## 4. Goals & Non-Goals

### Goals (MVP)
1. Multi-tenant platform with `tenants` + `memberships` + tenant-scoped RLS
2. PARTNER AI tenant live with Sean's 9 personas + Filmmaker 5-phase shell + 4 Tier-1 integrations
3. Sales OS tenant live with end-to-end demo flow (Prospector → Email SDR → Demo Scheduler → CRM write)
4. Shared agent runtime (Claude Agent SDK) + CopilotKit chat surface
5. Mem0 memory + Langfuse observability across all tenants
6. Sean's verbatim positioning copy on PARTNER AI surfaces
7. Onboarding = Sean's 4Q (self / work / goals / tools)
8. Production deploy on Vercel + Render + Supabase

### Non-Goals (MVP)
- Native iOS/Android apps
- Full marketplace with bidding (Sprint 3+)
- All 18 of Sean's filmmaker tool integrations (4 in MVP, 14 deferred)
- Voice agents for Talent Agency (Sprint 3)
- Replacing Final Draft / Movie Magic / Wrapbook (forever non-goal — Sean explicit)
- Replacing Composio with custom action layer
- Multi-region data residency (Sprint 4)
- White-label per tenant (Sprint 4)

---

## 5. Target Users & Personas

### AI Chief admin (meta-tenant)
- Internal MulBros team
- Provisions tenants, monitors traces/costs, manages billing, escalates incidents

### PARTNER AI users (Sean's 9 personas)
| Persona | Sample user | Top job-to-be-done |
|---|---|---|
| Musician | Indie band releasing EP | Spotify stats, gig booking, royalty tracking, fan growth |
| Composer | Film/TV composer | Project pipeline, library catalog, sync licensing |
| Actor | Working actor | Audition tracking, agent comms, headshot/reel mgmt |
| Visual Artist | Painter / illustrator | Commissions, gallery relationships, social, sales |
| Writer | Novelist / journalist | Pitch tracking, submissions, contract mgmt |
| Screenwriter | TV/feature writer | Loglines, query tracking, agent submissions |
| Film Crew | DP / Gaffer / Sound | Job board, day-rate negotiation, calendar |
| Arts Org | Non-profit director | Grant tracking, donor mgmt, programming |
| **Filmmaker** | Independent producer | **5-phase production lifecycle (deep)** |

### Sales OS users
| Persona | Sample user | Top job-to-be-done |
|---|---|---|
| SMB founder | Bootstrap SaaS | Cold outbound + inbound concierge + demo booking |
| Sales lead | 5–20 person team | SDR augmentation: 10× pipeline without hiring |
| Solo consultant | Indie | One-person business that books own demos |

---

## 5.1 Feature Priority / Impact / Complexity Matrix (per Perplexity ODI framing)

| Feature | Priority | Impact | Complexity |
|---|---|---|---|
| Multi-tenant RLS foundation | Must-Have | High | High |
| Stytch ↔ Supabase JWT bridge | Must-Have | Critical | High |
| Agent orchestration (Claude Agent SDK + abstraction wrapper) | Must-Have | High | High |
| 4Q onboarding + goal refinement | Must-Have | High | Medium |
| Filmmaker 5-phase shell + 4 Tier-1 integrations | Must-Have | High | Medium |
| Sales OS lead-to-demo flow (end-to-end) | Must-Have | High | Medium |
| Mem0 namespaces + Langfuse traces | Must-Have | High | Low |
| HITL fallback (budget imports, CRM writes) | Must-Have | Critical | Low |
| Real-time RAG (Mem0 retrieval mid-chat) | Should-Have | Medium | Medium |
| Vendor directory v1 (read-only) | Should-Have | Medium | Low |
| Voice SDR (LiveKit + ElevenLabs + Deepgram) | Should-Have | Medium | High |
| Cross-jurisdiction budget compare | Could-Have | Medium | Medium |
| Meta-tenant admin UI | Could-Have | Low | Low |
| Marketplace bidding | Won't-Have (MVP) | High | High |
| 14 remaining filmmaker tool integrations | Won't-Have (MVP) | Medium | High |

---

## 6. MVP Scope (Sharp Cut)

### Must ship
- ✅ AI Chief platform with multi-tenant data model + RBAC
- ✅ Shared Stage-1 stack
- ✅ CopilotKit chat surface (web)
- ✅ PARTNER AI tenant: 9 personas with onboarding-driven access; Filmmaker 5-phase nav with empty-phase agent prompts; Sean's marketing copy verbatim
- ✅ Sean's 4Q onboarding: self / work / goals / tools_used
- ✅ Filmmaker Tier-1 integrations: Final Draft, Movie Magic Budget (CSV ingest), Wrapbook OAuth, Excel/CSV
- ✅ Sales OS tenant: Lead Gen pod (Apollo/Clay/Firecrawl/Clearbit), Email SDR (Smartlead/Gmail-via-Composio), Demo scheduler (Cal.com via Composio), CRM writer (HubSpot + Salesforce via Composio)
- ✅ Mem0 per-user memory namespaces
- ✅ Langfuse traces on every agent + tool call
- ✅ Stytch auth + per-tenant RLS

### Should ship if time permits
- Vendor directory v1 (read-only) for Filmmaker tenant
- Call-sheet PDF generator
- Cross-jurisdiction budget comparison v1 (top 10 jurisdictions, static incentive table)
- Voice SDR (LiveKit + ElevenLabs + Deepgram + Twilio)

### Won't ship in MVP
- 14 of 18 Sean filmmaker tool integrations
- Marketplace with bidding
- Meta-agent (cross-tenant COO/CMO supervisor)
- Mobile apps
- Voice for Talent Agency / PARTNER

---

## 7. Architecture

### 7.1 Layered model

| Layer | Component | Responsibility |
|---|---|---|
| **Presentation** | Next.js 15 + CopilotKit | SPA shell, tenant switcher, chat surface, vertical workspaces |
| **Auth & Session** | Stytch + custom Supabase JWT bridge | Login, session, JWT mint with `tenant_id` claim |
| **Orchestration** | Claude Agent SDK | Per-tenant orchestrator agent + sub-agent routing + skills loader (from `wshobson/agents` foundation) |
| **Skills** | `SKILL.md` files | Loaded dynamically per agent invocation; sourced from `anthropics/skills`, `VoltAgent/awesome-agent-skills`, custom |
| **Tools** | Composio + LiveKit + custom | App actions (Gmail/Slack/CRM/Calendar) + voice/video + bespoke (FDX/MMB parsers) |
| **Memory** | Mem0 | Tenant + user + entity (lead/project/script) namespaces |
| **State** | Supabase Postgres + pgvector | Tenant-scoped tables, row-level security, embeddings |
| **Observability** | Langfuse | Traces, evals, PII filters, cost attribution per tenant |
| **Hosting** | Vercel (UI) + Render (Express stragglers) + Supabase (DB) | Multi-region later |

### 7.2 Tenant scoping

Every business table includes `tenant_id uuid NOT NULL` with RLS:
```sql
CREATE POLICY tenant_isolation ON {table}
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));
```

Stytch JWT bridge mints a Supabase JWT with `tenant_id` in claims. Auth middleware sets `current_setting('request.jwt.claims', true)`.

### 7.2.1 Tenant-aware connection pooling (Council recommendation)

Single Supabase project hosts all tenants; without pooling, RLS-heavy queries can saturate connections. Use:
- **PgBouncer** (Supabase native pooler) in transaction mode
- Per-tenant query labels via `set_config('request.tenant_id', ...)` for slow-query attribution in pg_stat_statements
- Connection budget per tenant (Sprint 4) to prevent noisy-neighbor saturation

### 7.2.2 Claude Agent SDK abstraction wrapper (Council contingency)

Wrap Claude Agent SDK behind an `AgentRuntime` interface. If SDK proves immature in production:
- Fallback path: direct Anthropic Messages API + custom router using same skill-loading + tool-call contract
- No callsite changes — only wrapper internals swap

```ts
// /apps/ai-chief/lib/agent/runtime.ts
export interface AgentRuntime {
  run(input: AgentInput): AsyncIterable<AgentEvent>;
}
// Default: ClaudeAgentSdkRuntime
// Fallback: DirectAnthropicRuntime
```

### 7.3 Agent runtime (per request)

```
User message
  → CopilotKit hook
  → Next.js API route /api/agent
  → Claude Agent SDK orchestrator (tenant-specific)
       ├─ load skills (per persona / phase)
       ├─ route to sub-agent
       │   ├─ tool call → Composio / custom adapter
       │   ├─ memory read/write → Mem0
       │   └─ DB read/write → Supabase (RLS-gated)
       └─ Langfuse trace emitted
  → Streaming response back to client
```

---

## 8. Tech Stack (locked from prior planning)

### Stage-1 Core
- **Next.js 15** + React 19 + TypeScript (strict)
- **CopilotKit** (UI)
- **Claude Agent SDK** (Python or TS — TS preferred for Next.js mono)
- **Anthropic API** (Claude Opus / Sonnet / Haiku)
- **OpenAI API** (web search Responses API + embeddings + fallback)
- **Composio** (250+ tool adapters, primary for Sales OS)
- **LiveKit** (voice/video)
- **ElevenLabs + Deepgram + Twilio** (voice agent stack)
- **Mem0** (memory)
- **Supabase** (Postgres + pgvector + Auth + Realtime + Storage)
- **Stytch** (auth provider — already wired)
- **Langfuse** (observability)

### Adopted open-source agents/skills
- **wshobson/agents** (MIT) — orchestrator + 184 sub-agents + 150 skills + 78 plugins foundation
- **msitarzewski/agency-agents** (MIT) — Sales 8 + Marketing 24 personalities for Sales OS
- **anthropics/skills** (Apache 2.0) — document handling skills (PDF/PPTX/XLSX/DOCX)
- **VoltAgent/awesome-agent-skills** (MIT) — 1000+ curated skills (Stripe, Linear, Resend, Sentry, Remotion, fal.ai)

### Filmmaker-specific
- **wildwinter/screenplay-tools** OR **screenplay-js** (npm) — FDX + Fountain parser
- **alexc-hollywood/screenplay-parser** — auto-breakdown reference

### Sales OS reference
- **MatthewDailey/open-sdr** — outbound automation patterns

### Frontend libs
- Tailwind 3.4 · shadcn/ui · Radix · Framer Motion · Lucide · @dnd-kit · date-fns · Zod · react-hot-toast

### Backend libs
- Next.js API Routes · Helmet · jsonwebtoken · Anthropic SDK · OpenAI SDK · Stytch SDK · Supabase JS · Resend

### DevOps
- Vercel · Render · GitHub Actions · Sentry · Playwright · Vitest · ESLint · Prettier · pnpm (monorepo)

### Skipped (decided)
- AutoGPT (license incompatible)
- Dify (competitor stack)
- LangGraph (Claude Agent SDK chosen)

---

## 9. Data Model (high-level)

### Core (AI Chief platform)
| Table | Purpose |
|---|---|
| `tenants` | id, slug, name, type ('media'\|'sales'\|...), settings jsonb |
| `memberships` | user_id, tenant_id, role ('owner'\|'admin'\|'member') |
| `profiles` | id (auth), stytch_user_id, email, default_tenant_id, goals jsonb, tools_used jsonb |
| `agent_runs` | id, tenant_id, user_id, agent_type, langfuse_trace_id, started_at, ended_at, cost_usd |
| `mem0_namespaces` | tenant_id, user_id, scope, mem0_collection_id |

### PARTNER AI tenant (Media)
| Table | Purpose |
|---|---|
| `personas` | tenant_id, user_id, persona_type, sub_persona_data jsonb |
| `projects` | tenant_id, user_id, persona, type, status, metadata jsonb |
| `pipeline_items` | project_id, stage, title, due_date, assignee |
| `chat_sessions` | tenant_id, user_id, title, last_message_at |
| `agent_chats` | session_id, role, content, created_at |
| `calendar_posts` | tenant_id, user_id, scheduled_at, channel, content |
| `back_office_invoices` / `_contracts` / `_payments` | tenant_id, user_id, ... |

### PARTNER AI Filmmaker
| Table | Purpose |
|---|---|
| `film_projects` | tenant_id, user_id, title, phase, script_id, budget_id |
| `film_scripts` | project_id, source_format ('fdx'\|'fountain'), parsed_json, characters[], locations[] |
| `film_budgets` | project_id, source ('mmb_csv'\|'manual'), line_items jsonb |
| `film_locations` | project_id, jurisdiction, name, contact, permitting, pricing |
| `film_vendors` | project_id, vendor_id, role, status |
| `film_call_sheets` | project_id, shoot_date, pdf_url, distributed_to[] |
| `film_assets` | project_id, dept, asset_type, path |

### Sales OS tenant
| Table | Purpose |
|---|---|
| `leads` | tenant_id, source, email, company, enrichment jsonb, intent_score |
| `outbound_messages` | lead_id, channel, status, scheduled_at, sent_at |
| `demos` | lead_id, scheduled_at, attendee_email, gong_recording_url |
| `crm_sync_log` | lead_id, target ('hubspot'\|'salesforce'), op, succeeded_at |

---

## 10. Key User Flows

### 10.1 New user → tenant pick → onboarding → workspace

1. Stytch sign-up
2. Bridge mints Supabase JWT + creates `profiles` row
3. **Tenant pick** screen — choose "PARTNER AI (Creative)" or "Sales OS (Sales)"
4. **Sean's 4Q onboarding** (PARTNER) or sales-tailored onboarding:
   1. About yourself
   2. Your work
   3. Your goals (free-text + AI refinement)
   4. Tools you already use (multi-select from curated catalog)
5. Orchestrator seeds 3–5 starter tasks based on answers
6. Land on tenant dashboard

### 10.2 PARTNER AI Filmmaker — script ingest → breakdown

1. Filmmaker uploads `.fdx` script
2. `screenplay-js` parses → characters[], locations[], scenes[]
3. Filmmaker-Producer sub-agent generates breakdown (DOOD, props, day count)
4. Memory: lead-level Mem0 namespace persists script context for follow-up chats
5. Saved to `film_scripts` + `film_projects`; visible in Pre-Production phase

### 10.3 Sales OS — lead → demo

1. Inbound lead lands (RB2B de-anon or webhook from form)
2. Prospector sub-agent enriches via Apollo + Clay (Composio)
3. Intent detector scores; if score > threshold → route to Email SDR
4. Email SDR drafts personalized email using lead context + Mem0; sends via Smartlead or Gmail (Composio)
5. Reply triggers Demo Scheduler → Cal.com booking link → calendar invite to AE
6. CRM Writer logs activity to HubSpot + Salesforce (both via Composio)
7. Langfuse trace shows full chain

### 10.4 Cross-tenant admin

1. AI Chief admin logs in → meta-tenant view
2. Sees all tenants, agent runs (last 24h), token spend, Langfuse error rate
3. Drills into tenant → sees that tenant's leads/projects/users
4. Can pause an agent or impersonate user (audit-logged)

---

## 11. Feature Spec by Tenant

### 11.1 PARTNER AI (Media tenant)

#### Common (all 9 personas)
- Onboarding: Sean's 4Q
- Persona-specific dashboard with KPIs (different per persona)
- Pipeline kanban (`@dnd-kit`)
- Calendar (posts, gigs, sessions)
- Back-office: invoices / contracts / payments
- Universal PARTNER chat (CopilotKit)
- Mem0 user memory: goals, tools_used, project context

#### Filmmaker-specific (5-phase shell)
| Phase | MVP features | Sprint |
|---|---|---|
| Development | Cards: market analytics ask, casting suggestions ask (agent prompts only) | MVP shell |
| Pre-Production | Script ingest (FDX/Fountain), auto breakdown, character + location list, budget CSV import (MMB), cross-jurisdiction budget compare v1 | MVP |
| Production | Call-sheet PDF generator, asset tracker stub, Wrapbook timecard pull | MVP |
| Post-Production | Cards: vendor invoice submission ask (deferred) | shell only |
| Distribution | Cards: marketing automation ask, audience analytics ask (deferred) | shell only |

#### Vendor directory v1 (Filmmaker)
- Read-only browse `/vertical/filmmaker/vendors`
- Filter by jurisdiction, category
- Sourced from seed data; Sprint 3 = full marketplace

### 11.2 Sales OS

| Pod | Sub-agent | Tools |
|---|---|---|
| Lead Gen | Prospector | Apollo, Clay, Firecrawl, Clearbit, ZoomInfo (via Composio + custom) |
| Lead Gen | Intent Detector | PostHog, Segment, 6sense, Bombora, RB2B |
| Outbound | Email SDR | Smartlead, Instantly, Gmail (Composio) |
| Outbound | SMS/WA SDR | Twilio, WATI |
| Outbound | Voice SDR (Sprint 1.5) | LiveKit + ElevenLabs + Deepgram + Twilio |
| Inbound | Website Concierge | CopilotKit on landing page + Stripe Checkout |
| Inbound | Demo Scheduler | Cal.com / Chili Piper / Google Calendar (Composio) |
| Conversion | Stripe billing | Stripe |
| CRM | CRM Writer | HubSpot + Salesforce (both via Composio) |

### 11.3 AI Chief admin (meta-tenant)

- Tenant list with health (last activity, error rate, MAU)
- Per-tenant Langfuse cost dashboard
- Audit log (impersonation, force-logout, agent pause)
- Tenant provisioning UI (creates tenant + first owner membership)

---

## 12. Integrations (MVP cut)

### Sean's filmmaker tools
| Tool | MVP? | Source | Notes |
|---|---|---|---|
| Final Draft (`.fdx`) | ✅ | `screenplay-js` npm | XML parse; characters + locations |
| Fountain | ✅ | `screenplay-js` npm | Highland + Slugline export |
| Movie Magic Budget | ✅ | Custom CSV ingest | User exports CSV from MMB |
| Wrapbook | ✅ | OAuth (custom) | Timecards + payroll read |
| Excel/CSV | ✅ | papa-parse | Generic ledger ingest |
| Other 14 (EP suite, Gorilla, Set Hero, Scriptation, Skarratt, ScriptE, Raccorder, ZoeLog, FadeIn, Celtx, payroll services) | ❌ | Sprint 3+ | Per Composio availability or custom |

### Composio adapters (MVP set)
- Gmail · Google Calendar · Slack · Linear · HubSpot · Salesforce · Stripe · Notion · Resend · Sentry · Apollo · Cal.com

### Already wired in current MulBros app (carry forward)
- Spotify (Music persona)
- OpenAI Responses API web_search_preview
- Apify (`trudax~reddit-scraper-lite`)
- Firecrawl
- Resend (transactional email)
- jsPDF (call-sheet)

---

## 13. Success Metrics (MVP)

### 13.1 Time-to-First-Value (TTFV) — primary outcome metric (Perplexity)
- **PARTNER Filmmaker:** time from signup → first script breakdown rendered ≤ 10 min
- **PARTNER non-Filmmaker:** time from signup → first persona-specific task seeded ≤ 5 min
- **Sales OS:** time from signup → first enriched lead + drafted email ≤ 5 min
- **Sales OS:** time from signup → first booked demo ≤ 24 hr

### 13.2 Activation
- Onboarding completion rate ≥ 70%
- Goals + tools_used captured for ≥ 80% of completed onboardings
- ≥ 3 starter tasks seeded per user (PARTNER)
- ≥ 1 tool connected via Composio in first session (Sales OS)

### 13.3 Engagement
- DAU / MAU ≥ 30% (SMB SaaS benchmark)
- Avg PARTNER chat sessions per user / week ≥ 3
- Tool integrations connected per user (median) ≥ 2
- Mem0 retrieval hit rate (chat references prior context) ≥ 40%

### 13.4 Reliability
- Agent run success rate ≥ 95%
- p95 agent response time < 10s (Council benchmark)
- Langfuse error rate < 2% (Council critical for SMB trust)
- HITL escalation rate < 15% (high → reduce; if escalating too often, agent untrusted)

### 13.5 Cost & efficiency
- Avg cost per agent run < $0.10 (PARTNER), < $0.25 (Sales OS — more tool calls)
- Cache hit rate on common agent states ≥ 30%
- Token spend per tenant tracked + visible to admin

### 13.6 Business
- 3 paying tenants (1 Media, 2 Sales) within 60 days of MVP launch
- Stripe MRR target: $5k by day 90 (Perplexity validates COO/CMO operator willingness-to-pay)
- Logo retention 90% at day 60

---

## 14. Milestones & Timeline

### 14.1 Team Configuration (Council recommendation)

| Role | Allocation | Focus |
|---|---|---|
| Senior Full-Stack Engineer | 1.0 FTE | Critical path: auth, RLS, agent runtime, tenant isolation |
| Frontend Specialist | 1.0 FTE | CopilotKit, complex UI, tenant switcher, dashboards |
| DevOps | 0.5 FTE | Vercel + Supabase + Render infra, monitoring, cost tracking |
| Product Manager | 1.0 FTE | Stakeholder alignment (Sean + Snehaal + tenants), spec, eval |

If team smaller — extend timeline proportionally; do NOT cut critical path (auth + RLS + monitoring).

### 14.2 30 / 60 / 90-Day Strategic Roadmap (Perplexity ODI framing)

| Window | Objective | Key deliverables |
|---|---|---|
| **Day 30 — Foundation** | Stable auth + tenant isolation + agent runtime spike | Stytch-Supabase JWT bridge production-stable · multi-tenant RLS verified by automated penetration tests · monorepo scaffolded · Sprint-0 contingency wrapper in place · CopilotKit shell live · Composio Gmail action working · Langfuse first traces |
| **Day 60 — Tenant Validation** | Both tenants running for pilot users | PARTNER AI live with 4Q onboarding + filmmaker 5-phase shell + 4 Tier-1 integrations · Sales OS lead-to-demo end-to-end · 3 invite-only pilot tenants onboarded · TTFV measured on real users |
| **Day 90 — Optimization & Scale** | Cost + performance + admin maturity | Meta-tenant admin UI shipped · Langfuse-driven prompt refinement (top 5 high-cost chains optimized) · token spend dashboards · agent caching layer hot · 3 paying tenants converted from pilot · MRR ≥ $5k |

### 14.3 Sprint Validation Checkpoints (Council mandatory gates)

| Gate | Pass criteria | Fail action |
|---|---|---|
| Sprint 0 complete | Auth bridge + RLS automated tests passing + tenant isolation verified | Block Sprint 1 — fix before any user data exists |
| Sprint 1 complete | One Sales OS demo booked end-to-end on real tools | Investigate Composio adapter coverage; consider custom for Gmail/HubSpot/Cal.com only |
| Sprint 2 complete | One filmmaker script processed FDX → breakdown → budget → vendor pull | Slip integrations to Sprint 3; ship shell-only for MVP |
| MVP launch | All 3 above checkpoints achieved + monitoring live + invite-only signup gated | Hold launch until checkpoints clear |

### 14.4 Sprint Plan

> Estimates assume 1 senior eng full-time + part-time PM. Adjust if team grows.

| Sprint | Weeks | Deliverable |
|---|---|---|
| **Sprint 0** — Scaffold | 1 | Greenfield Next.js repo, CopilotKit shell, Claude Agent SDK orchestrator demo, Composio Gmail action, Mem0 demo, Langfuse trace, multi-tenant DB schema |
| **Sprint 1** — Two tracks | 2 | Track A: Sales OS demo end-to-end. Track B: MulBros app gets Sean's PARTNER copy + 4Q onboarding + filmmaker 5-phase nav + route gating |
| **Sprint 2** — Migrate Media | 3 | Port PARTNER AI to AI Chief platform as Media tenant. Ship 4 filmmaker integrations (FDX, MMB CSV, Wrapbook, Excel). Migrate MulBros users. |
| **Sprint 3** — Depth + Marketplace | 4 | Filmmaker deep features (call-sheet, budget compare v1, location DB v1). Vendor marketplace v1 read-only. Voice SDR for Sales. |
| **Sprint 4** — Meta + remaining tools | 4 | AI Chief meta-tenant admin UI. 14 remaining filmmaker integrations. Cross-tenant analytics. |

**MVP launch target:** Sprint 2 complete (week 6).

---

## 14.5 HITL (Human-in-the-Loop) Fallback Policy (Perplexity)

High-stakes actions require explicit user approval until reliability proven (3-month track record minimum):

| Action class | HITL? | Approval UX |
|---|---|---|
| Outbound email send (Email SDR) | ✅ Yes for first 30 days per tenant | Draft + approve modal |
| CRM write (HubSpot / Salesforce) | ✅ Yes always for delete/update | Confirm dialog with diff |
| Calendar booking on user's behalf | ❌ Auto if user opted in | Slack/email confirmation post-fact |
| Filmmaker budget import (MMB / Excel) | ✅ Yes always | Preview before commit |
| Stripe charge / refund | ✅ Yes always | 2FA + reason required |
| Voice SDR call placement | ✅ Yes for first 60 days | Per-call enable toggle |
| Mem0 memory write | ❌ Auto | Visible in user memory page |
| Wrapbook timecard READ | ❌ Auto | Read-only, no approval needed |

After 30/60/90 days of < 5% error rate per action, HITL can be disabled with admin override.

---

## 15. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Claude Agent SDK + CopilotKit + Composio integration immature for production | HIGH | Sprint 0 spike validates end-to-end; fall back to direct Anthropic SDK if blocked |
| Composio missing adapters for Sean's filmmaker tools | MEDIUM | Custom adapters OK; tier-1 only needs FDX (parser) + Wrapbook (OAuth) |
| Stytch ↔ Supabase JWT bridge brittle (already burned by `auth.users` validation) | MEDIUM | Custom-fetch interceptor pattern shipped; Sprint 0 carries it forward |
| Multi-tenant RLS bug = data leak | CRITICAL | Mandatory test suite per migration; Supabase advisor in CI; manual audit Sprint 0 |
| Mem0 hosted vs self-hosted cost / latency | LOW | Start hosted; revisit if usage spikes |
| Langfuse retention costs | LOW | Sample non-production traces; full retention prod only |
| Sean's tool list (Movie Magic, Wrapbook) APIs lack sandbox | MEDIUM | Sean to confirm by Sprint 1 start; if blocked, slip to Sprint 3 |
| Rebuilding while running existing MulBros app — context split for solo dev | HIGH | Path C explicit: greenfield work in new repo, MulBros app gets only minimal pivot copy/onboarding |
| Sub-agent quality from `wshobson/agents` requires curation | MEDIUM | Cherry-pick + retest per tenant; not adopt-as-is |
| Sales OS — third-party tool quotas (Apollo, Clay, etc.) | MEDIUM | Free tiers for Sprint 1; paid quotas locked before paid tenants |

---

## 16. Decisions (Locked by Council 2026-04-27)

| # | Decision | Status |
|---|---|---|
| 1 | Repo strategy: **monorepo** with `pnpm` workspaces (`/apps/ai-chief`, `/apps/mulbros`) | LOCKED |
| 2 | AI Chief umbrella + PARTNER AI Media tenant brand stack | LOCKED |
| 3 | Mem0: **hosted** for MVP, revisit Sprint 4 | LOCKED |
| 4 | Langfuse: **Cloud** for MVP, self-host Sprint 4 if cost exceeds | LOCKED |
| 5 | Domain strategy: **path-based** (`aichief.com/media`, `aichief.com/sales`) for MVP — subdomains require SSL + DNS overhead | LOCKED |
| 6 | Tenant signup model: **invite-only** for MVP | LOCKED |
| 7 | Sprint validation gates mandatory (§14.3) | LOCKED |
| 8 | Monitoring infra in Sprint 1, not deferred | LOCKED |
| 9 | Claude Agent SDK behind abstraction wrapper (§7.2.2) | LOCKED |
| 10 | HITL fallback policy enforced (§14.5) | LOCKED |

## 16.1 Still Open

1. **Sales OS tenant brand name** — "AI Chief for Sales" / "Pipeline AI" / other?
2. **Composio paid tier** — upgrade trigger threshold TBD
3. **Wrapbook + Movie Magic API access** — Sean to confirm sandbox by Sprint 1 start
4. **Pricing model** — per-tenant flat vs per-seat vs per-agent-run — Snehaal decision
5. **Voice SDR scope** — Sprint 1.5 (text+voice in MVP) or Sprint 3 (text-only MVP)?
6. **Cost-attribution granularity** — per-agent-run vs per-tool-call (affects Langfuse export schema)

---

## 17. Glossary

| Term | Definition |
|---|---|
| **AI Chief** | The meta-platform brand. Multi-tenant, multi-OS. |
| **OS Tenant** | A domain-specific workspace under AI Chief (e.g., PARTNER AI, Sales OS). |
| **PARTNER AI** | The Media/Talent OS tenant. Sean's vision. |
| **Sub-agent** | Specialized agent invoked by tenant orchestrator (e.g., Email SDR, Filmmaker Producer). |
| **Skill** | A `SKILL.md` file with YAML frontmatter that teaches Claude how to do a specific task. Loaded dynamically. |
| **Connector / Adapter** | A tool integration (Gmail, HubSpot, FDX parser). Most via Composio; some custom. |
| **Stage-1 stack** | The shared infra: CopilotKit + Claude Agent SDK + Composio + LiveKit + Mem0 + Supabase + Langfuse. |
| **Mem0 namespace** | A scoped memory store (per tenant + user + entity). |
| **Persona** | One of Sean's 9 creative personas in PARTNER AI. |
| **Phase** | One of 5 filmmaker lifecycle phases (Development → Distribution). |

---

## 18. Appendix — Faithfulness Check

### Sean's email
- ✅ All 9 personas captured (8 modular + Filmmaker deep)
- ✅ 4Q onboarding (self / work / goals / tools)
- ✅ Goal refinement loop (orchestrator seeds tasks)
- ✅ Filmmaker 5-phase shell
- ✅ Every Development / Pre-Pro / Production / Post / Distribution wishlist item mapped to MVP or Sprint 3
- ✅ All 18 tool integrations on backlog (4 in MVP)
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

---

---

## 19. Changelog

### v1.1 — 2026-04-27 (post-review)
- Added §0 External Review Outcomes (Council + Perplexity)
- Added §5.1 Feature Priority/Impact/Complexity matrix (ODI framing)
- Added §7.2.1 Tenant-aware connection pooling (Council)
- Added §7.2.2 Claude Agent SDK abstraction wrapper for fallback
- Added §13.1 Time-to-First-Value as primary outcome metric
- Added §13.5 Cost & efficiency metrics
- Added §14.1 Team configuration
- Added §14.2 30/60/90-day strategic roadmap
- Added §14.3 Sprint validation checkpoints (mandatory gates)
- Added §14.5 HITL fallback policy
- Refactored §16 — locked vs still-open decisions table
- Marked PRD APPROVED WITH CONDITIONS

### v1.0 — 2026-04-27
- Initial PRD draft

---

**End of PRD.**
