# AI Operator — Alignment Audit + Gap Plan (2026-05)

> Source-of-truth: Dr. Mulholland meeting transcript · MBE Micro Playbook · Vendor Evidence Deck v2.2 · AI Microdrama doc · AI Gaming Hybrid doc · Sean's email (Talent Agency wishlist) · Snehaal architecture diagrams + Slack notes.
> Rule: **no hardcoded KPIs, no mock data shipped to customer-0.** Real data or honest empty state only.

---

## 1. BUILT + LIVE (verified)

**Foundation**
- Auth: Stytch email/password **+** phone SMS OTP · Supabase JWT bridge (HS256, sub=profile.id) · per-row RLS on all tables
- Chat-first shell: ChatShell · ChatHome · ChatThread · ChatBar · SlashMenu · MOAvatar (persona states)
- personaRouter: 21 agents, slash-commands → sub-agent
- Onboarding: role pick → vertical → 4 questions; persona personalization (3 personas: actor/director/musician) drives sidebar
- Platform Admin + super_admin tier + admin request/approval flow (Settings → request → badge → approve)

**Talent pack** — Auditions · Self-Tape (Mux upload) · Agent Inbox · Income · Industry Intel · Contract Reader
**Agency pack** — Roster · Casting Feed · Submissions (HITL) · Commissions · Contracts (HITL) · Comms Relay · Agency Admin
**Verticals (6)** — Filmmaker · Productions · Musician · Composer · Actor · Crew
**Integrations view** — 35-tool catalog + 14-skill map, live status from user_integrations
**Sprint-4 adapters (mock-fallback)** — Mux · Stripe Connect · DocuSign · Plaid · Twilio
**Sprint-5 ops** — Sentry (FE+BE) · cost ledger (real spend logged) · Mux webhook · DocuSign webhook · Plaid exchange+sync · eval harness (14 fixtures) · Playwright E2E
**Real integrations wired** — Spotify OAuth · OpenAI · Anthropic · Firecrawl · Apify · Resend · Supabase · Stytch

---

## 2. GAPS — what's missing, by source

### 2A. Sean's email (Talent Agency wishlist) — HIGH priority
| Item | State | Gap |
|---|---|---|
| Backstage casting feed | catalog = 'planned' | No live API. Casting Feed view shows empty. **Priority 1.** |
| Actors Access / Casting Networks / Breakdown Services | 'planned' | No ingest |
| Self-tape coach (LLM feedback: lighting/audio/framing/perf) | Mux upload wired | **LLM feedback not built** — upload only |
| DocuSign signing flow | adapter + webhook | No end-to-end send→sign→status UI in Contracts view |
| Stripe Connect commission splits/payouts | onboard link wired | **Payout/transfer split not end-to-end** |
| Plaid 1099 prep / Section 162 deductibles | exchange+sync wired | Income view lacks tax-prep UI |
| Gmail relay (agent comms archive) | 'planned' | Not built |
| Google Calendar sync (auditions/bookings/shoots) | 'planned' | Not built |
| Twilio booking confirmations | adapter wired | No booking→SMS trigger flow |
| IMDb Pro lookup (credit verify/comp) | 'planned' | Not built |
| SAG-AFTRA scale awareness (minimums/residuals) | 'planned' | Not built |

### 2B. Snehaal Slack — Q2/Q3 2026
- **Talent SDR/BDR agents** (automated social outreach) — not built
- **Social media mgmt agents** (IG + TikTok auto-comms, CTA build) — not built
- CSM module (artist success) — Q4, not built
- HR module — Q4, not built
- Bookkeeping module — Q4, not built
- Multi-language (ES/PT/TH/Saudi-AR/ZH) — Q1 2027, not built

### 2C. Mulholland strategic
- Multi-customer-surface: AI Operator chat over SMS/WhatsApp/iMessage/Slack/Line — not built
- TikTok paid CTA for talent acquisition — not built
- Worldwide multi-language rollout — tied to 2B

### 2D. Architecture (Snehaal Stage-1 stack)
| Tool | Status | Plan |
|---|---|---|
| Langfuse (LLM observability + cost) | Sentry partial; cost_ledger covers spend | Phase 1.5 — add Langfuse traces |
| Mem0 (cross-session agent memory) | none | Phase 2 |
| Claude Agent SDK (sub-agent orchestration) | custom personaRouter | Phase 2 |
| Composio (unify Gmail/Slack/Linear OAuth) | direct adapters | Phase 2 — replaces piecemeal OAuth |
| LiveKit (voice agents) | none | Phase 3 |
| CopilotKit UI | not used | Defer — current shell works |

### 2E. 3 Media products (Mulholland)
- **AI Operator for Media** = THIS app ✅
- **Micro Drama App** (Muvi-licensed Spanish OTT) — separate codebase, not started
- **AI-Generated Micro Drama** (AI-native OTT + gaming overlay) — separate codebase, not started

### 2F. Data integrity — REMAINING MOCK to kill
- **Dashboard FunnelCard + ChurnCard** = mock arrays (shipped as Day-locked placeholders). **Must wire real or remove before customer use.**
- CrossSellCard / ContentCard (in legacy Dashboard) = mock
- film MOCK_RESULTS / MOCK_BENCHMARK = now labeled "Sample" (acceptable interim)
- Multi-tenant infra absent (tenants + memberships) — blocks Y2 external customers

---

## 3. STEP-BY-STEP PLAN (priority order, real-data-first)

### Sprint 7 — Kill mock + core talent value (1.5 wk)
1. **FunnelCard/ChurnCard → real or remove.** Wire to real talent/agency aggregates (auditions funnel: submitted→callback→booked; churn = stale auditions). If no real signal, remove card. **No mock.**
2. **Self-tape LLM coach.** Mux playback → frame sample → OpenAI vision → feedback (lighting/audio/framing/performance). Store in self_tapes.feedback.
3. **Backstage casting feed (live).** Paid sandbox API → ingest into casting feed table → Casting Feed view real rows. Opportunity Scout agent consumes.

### Sprint 8 — Money flows e2e (1.5 wk)
4. **Stripe Connect payouts.** Commission → transfer split to talent connected account. CommissionsView shows settlement state.
5. **Plaid 1099 / deductibles.** income_records → tax-year rollup + Section 162 categorization UI in IncomeView.
6. **DocuSign signing UI.** Contracts view: send envelope → track status (webhook already updates DB) → signed badge.

### Sprint 9 — Comms surface (1 wk)
7. **Composio adapter** replaces direct OAuth; wire **Gmail relay** + **Google Calendar sync** through it.
8. **Twilio booking flow.** Booking created → auto SMS confirmation + callback reminder.

### Sprint 10 — Growth agents (1.5 wk)
9. Talent SDR/BDR agents (social outreach) + Social media mgmt agents (IG/TikTok). New agents in config + views.
10. TikTok paid CTA module.

### Sprint 11 — Stage-1 stack (1 wk)
11. Langfuse traces on /api/ai + /api/ai-search. Mem0 for persona memory. Evaluate Claude Agent SDK migration for personaRouter.

### Backlog (Y2 / 2027)
- CSM · HR · Bookkeeping modules
- Multi-language (5 langs)
- Multi-customer-surface (WhatsApp/iMessage/Slack/Line)
- Micro Drama App + AI Micro Drama App (separate codebases)
- Multi-tenant scaffold (tenants + memberships + tenant_id) before any external customer

---

## 4. IMMEDIATE (next sprint, do first)
1. Wire or remove Funnel/Churn mock cards — **highest integrity risk** (fabricated metrics on home).
2. Self-tape LLM coach — biggest unbuilt talent value from Sean's email.
3. Backstage live feed — unblocks Agency Casting Feed (currently empty).

## Verification standard (every item)
- Real data from Supabase/real API, or honest empty state. Never hardcoded numbers.
- `npm run build` green · `npm test` green · headless screenshot check · commit + push + Render deploy.
