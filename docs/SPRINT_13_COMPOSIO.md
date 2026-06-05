# Sprint 13 — MO Chief-of-Staff via Composio

**Vision:** MO is aware of + acts across the user's Gmail, Google Calendar (Phase 1), then Slack + Notion (Phase 2). Not passive sync — MO reads/acts on these apps **when asked** (pull), with proactive triggers as a later phase.

**Decisions (locked):** Gmail + Google Calendar first · pull-only · Composio hosted cloud. Spotify stays hand-wired (already CSRF-hardened — don't migrate). This **supersedes** the native-calendar Track C — Composio's Google Calendar replaces it.

---

## Architecture — Composio tools merge into the existing loop

```
/api/ai loop (43 domain tools — governed: cost ledger, RLS, Langfuse, HITL)
        +  (only if user has connected Composio accounts)
Composio tools for THIS user_id (Gmail, Calendar — OAuth'd via Composio)
        ↓ model returns tool_calls
   tool in our TOOLS registry? → TOOL_HANDLERS (existing path, unchanged)
   else (composio tool)        → composio.provider.handleToolCalls(userId, response)
```

- `user_id` = `profile.id`. Composio stores each user's OAuth connection keyed to it.
- Composio tool names are UPPER_SNAKE (`GMAIL_SEND_EMAIL`, `GOOGLECALENDAR_CREATE_EVENT`) — never collide with our `domain.action` names, so origin routing is trivial: not in `TOOLS` → it's Composio's.
- **Everything gated on `COMPOSIO_API_KEY`.** Absent → `composio = null` → loop behaves exactly as today (the just-hardened path). Zero regression risk.

## SDK (verified June 2026)

```
npm i @composio/core @composio/openai
```
```js
import { Composio } from '@composio/core';
import { OpenAIProvider } from '@composio/openai';
const composio = process.env.COMPOSIO_API_KEY
  ? new Composio({ apiKey: process.env.COMPOSIO_API_KEY, provider: new OpenAIProvider() })
  : null;
```
- Fetch tools: `await composio.tools.get(profileId, { toolkits: ['gmail','googlecalendar'] })` → OpenAI tools array.
- Execute: `await composio.provider.handleToolCalls(profileId, openaiResponse)` → runs the calls, returns results to feed back.
- Connect: `composio.toolkits.authorize(profileId, 'gmail')` (or `connectedAccounts.initiate`) → `{ redirectUrl }`. Verify exact method against installed types — SDK API still settling.
- Status: `composio.connectedAccounts.list({ userIds: [profileId] })`.

## Files

**New:**
- `src/lib/composio.js` (server) — gated client init (`server.js` actually, or a small module imported there)
- `/api/integrations/composio/connect/:toolkit` — requireAuth → `authorize(profileId, toolkit)` → return `{ redirectUrl }`
- `/api/integrations/composio/connections` — requireAuth → list this user's connected toolkits
- `/api/integrations/composio/disconnect/:toolkit` — requireAuth → remove connection

**Modified:**
- `server.js` `/api/ai` loop — IF `composio` AND user has connections: fetch their Composio tools, merge into `tools` array. In the dispatch loop, route non-`TOOLS` calls to `composio.provider.handleToolCalls`. All gated — no key = untouched.
- `src/components/integrations/IntegrationsView.jsx` — "Connect Gmail / Google Calendar" cards: button → hit connect endpoint → `window.location = redirectUrl` → Composio OAuth → back. Show connected status.
- Helmet CSP `connectSrc` — add Composio API host (`https://backend.composio.dev` or per docs).

## Phasing

| Phase | Scope | Effort |
|---|---|---|
| **1** | Gmail + Calendar, pull-only, connect UI, loop merge | 3-4 days |
| **2** | Slack + Notion (just add toolkit slugs + cards) | 1-2 days |
| **3** | Proactive triggers — `/api/webhooks/composio` + `agent_events` table + "What MO noticed" feed + daily digest | 3-4 days |

## Governance note

Composio tool calls run through Composio's executor, so they bypass our cost_ledger / per-tool quotas. Mitigate: log a `cost_ledger` row (`provider='composio'`) per Composio call from the loop, and wrap them in the same Langfuse span pattern. Keeps observability parity.

## What the user provisions (BEFORE this can run)

1. Sign up composio.dev → create project → copy **API key**.
2. Hosted Composio provides default auth configs for Gmail + Google Calendar (no own Google Cloud project needed to start). Confirm in dashboard; if custom branding/scopes needed later, add own Google OAuth app.
3. Set `COMPOSIO_API_KEY` on Render (+ local `.env.local`).
4. In-app: IntegrationsView → Connect Gmail / Connect Calendar → OAuth.

## Verification

1. No key set → `/api/ai` behaves exactly as today (smoke 5/5, chat works). Confirms zero regression.
2. Key set + Gmail connected → chat "summarize my unread emails" → MO calls `GMAIL_FETCH_EMAILS` → returns real summary.
3. "add a meeting tomorrow 2pm with Sam" → `GOOGLECALENDAR_CREATE_EVENT` → event in user's real Google Calendar.
4. Composio calls appear in Langfuse + cost_ledger (`provider='composio'`).
5. Disconnect → tools disappear from the user's loop.

---

## Build status (this commit)

Scaffold built **gated on COMPOSIO_API_KEY** (dormant until provisioned):
- [ ] SDK installed
- [ ] gated client init
- [ ] connect / connections / disconnect endpoints
- [ ] /api/ai loop merge (origin-routed, gated)
- [ ] IntegrationsView connect cards
- [ ] CSP host

Until `COMPOSIO_API_KEY` is set, all of the above is inert — the app runs identically to `f22a172`.
