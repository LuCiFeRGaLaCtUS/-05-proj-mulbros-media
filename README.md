# MulBros Media OS v2

Production-grade internal SaaS tool for entertainment companies managing film, artist, and composer assets. Features AI-powered content generation, campaign management, CRM, and a global chatbot assistant.

## Quick start

```bash
npm install
npm run dev     # Vite on http://localhost:5173
npm run build   # production bundle → dist/
npm start       # Express serves dist/ + API proxies on $PORT
```

## Environment variables

Create `.env.local` (gitignored) for local development:

| Name | Scope | Purpose |
|---|---|---|
| `VITE_STYTCH_PUBLIC_TOKEN` | client | Stytch UI public token |
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | Supabase publishable key |
| `VITE_APP_URL` | client | Dev redirect base for magic links |
| `OPENAI_API_KEY` | server | Used by `/api/ai` when model is OpenAI. Optional — users can paste their own key in Settings. |
| `ANTHROPIC_API_KEY` | server | Used by `/api/ai` for Claude models. Optional. |
| `FIRECRAWL_API_KEY` | server | Required for `/api/firecrawl-search`. |
| `APIFY_API_TOKEN` | server | Required for `/api/apify-reddit`. |
| `Resend_API` | server | Required for `/api/email`. |
| **`STYTCH_PROJECT_ID`** | server | **Required for protected endpoints.** Get from Stytch dashboard. |
| **`STYTCH_SECRET`** | server | **Required for protected endpoints.** Get from Stytch dashboard. |
| `STYTCH_ENV` | server | `test` (default) or `live`. |
| `ADMIN_USER` / `ADMIN_PASS` | server | Optional HTTP Basic Auth gate. |

### About the protected endpoints

`/api/email`, `/api/firecrawl-search`, and `/api/apify-reddit` require a valid Stytch session. The client attaches it automatically via `X-Stytch-Session-Jwt` / `X-Stytch-Session-Token` headers. If `STYTCH_PROJECT_ID` / `STYTCH_SECRET` are not set on the server, these endpoints return **503** — they fail closed so anonymous traffic can never burn paid quota.

Per-user hourly quotas on protected endpoints (in-memory, single-instance):

- `/api/email` — 30/hr
- `/api/firecrawl-search` — 60/hr
- `/api/apify-reddit` — 15/hr

## Security notes

- `.env` and `.env.local` are gitignored. Never commit secrets.
- `/api/email` validates recipient format and rejects CRLF header injection.
- Email body caps: subject 200 chars, html 200 KB, text 50 KB, ≤10 recipients.
- All client fetches use `fetchWithTimeout` (`src/utils/http.js`). Default 15 s; AI proxy 30 s; Apify 75 s.
- Error surface: every failure path routes through `src/lib/logger.js` + `react-hot-toast`.

## Architecture

- **Client:** React 18 + Vite 8. Entry `src/main.jsx` → `src/App.jsx`.
- **Server:** Express 4 (`server.js`) — SPA static + `/api/*` proxies.
- **Auth:** Stytch magic links (client) + server-side session verification (`requireAuth` middleware).
- **DB:** Supabase. Profiles keyed by `stytch_user_id`. Pipelines in `film_pipeline` / `music_pipeline`; chats in `agent_chats`.
- **Styling:** Tailwind + CSS custom properties. Per-vertical neon palettes in `src/config/verticalColors.js`.

## Layout

```
src/
├── main.jsx, App.jsx
├── config/        # constants: colors, agents, mock data, jurisdictions
├── lib/           # stytch, supabase, logger
├── utils/         # ai (proxy client), http (fetchWithTimeout), helpers
├── hooks/         # useAuth, useProfile, useAgentChats, useFilmPipeline, useMusicPipeline, useCalendar, useUserSettings
├── components/
│   ├── auth/      # LoginPage (magic-link + password reset)
│   ├── dashboard/ # Dashboard
│   ├── verticals/ # FilmFinancingView, MusicView, ProductionsView, CalendarView
│   ├── agents/    # AgentChat, AgentSelector, ChatMessage
│   ├── chatbot/   # FloatingChatbot
│   ├── layout/    # Sidebar, TopBar
│   ├── settings/  # Settings page, APIKeyManager, IntegrationToggles
│   ├── onboarding/
│   └── ui/
├── constants.js   # storage keys, timeouts, UI magic numbers
```

## Open follow-ups

See `docs/superpowers/plans/` for the full remediation roadmap. Highest-priority deferred items:

1. Split monolith components: `FilmFinancingView.jsx` (1450 LOC), `Dashboard.jsx` (1319 LOC).
2. Bootstrap Vitest + Playwright — zero test coverage today.
3. Production CSP nonces (drop `'unsafe-inline'` on scripts).
4. Move Calendar state from `localStorage` to Supabase.
