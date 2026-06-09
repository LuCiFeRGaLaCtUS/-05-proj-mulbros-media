# Sprint 14 Backlog — Multi-Role Tracking (Rahul feedback)

**Source:** Rahul Iyer feedback session on the AI Talent Manager demo (CEO connect, 2026-06-08).

**Ask (verbatim):** "more comprehensive tracking for multi-role entertainment professionals, such as endorsements and side projects."

**Theme:** A multi-hyphenate (actor-producer-musician) wears many hats. The app currently makes the user pick ONE persona and filters everything to it — there's no way to see endorsements, side projects, or a combined cross-role picture. `profiles.roles` is already an array (multi-role at the data layer); the gap is UI + missing entity types.

**Status:** Deferred from CEO-connect day. Build after Sprint 13 (Composio chief-of-staff). NOT started.

---

## Scope decision (when picked up)

Chosen direction TBD — three tiers offered, user backlogged the whole thing. Default recommended path = MVP first, then view, then dashboard.

| Tier | Adds | Effort |
|---|---|---|
| MVP (chat-first) | tables + RLS + 6 tools + agent wiring + `income.summary` feed | ~1 day |
| + Portfolio view | `/portfolio` view (cards: endorsements + side projects w/ status) | +1 day |
| + Multi-role dashboard | unified cross-role income aggregation + multi-persona active at once | +1.5-2 days |

---

## Build spec (fits existing touring/catalogue sprint pattern)

### New migrations (timestamped, RLS `user_id = auth.uid()`)

`endorsements`:
- `id`, `user_id`, `brand_name`, `deal_type` (sponsorship | ambassador | affiliate | one_off), `value_usd`, `currency`, `start_date`, `end_date`, `status` (negotiating | active | delivered | paid | expired), `deliverables` (jsonb/text), `notes`, `created_at`

`side_projects`:
- `id`, `user_id`, `title`, `project_type` (film | music | podcast | book | startup | other), `role_on_project`, `status` (idea | in_progress | launched | archived), `collaborators` (jsonb), `revenue_usd`, `links` (jsonb), `notes`, `created_at`

Index every `user_id` + `created_at` (matches existing convention).

### New tools (`src/config/tools.js` — `domain.action`, encode/decode `.`↔`__` at OpenAI boundary)
- `endorsement.create` / `endorsement.list` / `endorsement.update_status`
- `sideproject.create` / `sideproject.list` / `sideproject.update_status`

Server handlers in `TOOL_HANDLERS` (server.js) via `supabaseServiceSelect()` / service-JWT writes, same as read/write tools added in Track B.

### Agent wiring (`src/config/agentTools.js`)
- Add endorsement + sideproject tools to talent agents (e.g. `talent-marketing-assistant`, `talent-income-tax`).
- MO gets them automatically (null = all tools).

### Income integration (the multi-role payoff)
- `income.summary` handler aggregates: primary-role income + endorsement `value_usd` (paid) + side-project `revenue_usd`. ONE income picture across all hats. This is the core value Rahul is pointing at.

### UI (tier 2+)
- `/portfolio` view — chat-first product, so keep it light: two card sections (Endorsements, Side Projects) with status chips. Reuse `tile-pop` + `font-mono` stat conventions from CLAUDE.md.
- Tier 3: cross-role dashboard — combined income chart (recharts), multi-persona toggle instead of single-persona lock.

### Verification
- Smoke-harness cases: `endorsement.create` → row appears; `sideproject.create` → row appears; `income.summary` reflects both.
- RLS test: user A cannot read user B's endorsements.
