# MulBros Media OS v2 — Full Project Memory Log

> Auto-read by Claude Code at session start. Contains the full project history.  
> Last updated: 2026-04-17  
> Owner: Arghya Chowdhury — Arghya@fsztpartners.com

---

## Project Identity

| Field | Value |
|-------|-------|
| App | MulBros Media OS v2 |
| Repo | https://github.com/LuCiFeRGaLaCtUS/-05-proj-mulbros-media |
| Branch | `main` |
| Stack | React 18 + Vite 5 + Tailwind CSS v3.4 + Express 4 |
| Hosting | Render.com (static SPA served by Express, `npm start` = `node server.js`) |
| Dev | `npm run dev` → Vite on port 5173 |
| Build | `npm run build` → `dist/` |
| Start (prod) | `node server.js` → Express on `process.env.PORT` (default 3000) |
| Last commit | `df2136c` — fix(weather): proxy wttr.in through Express to bypass CSP restriction |

---

## Design Language — Hollywood Noir (LOCKED — never revert)

### Palette
```
Background (body):      #060508  → CSS var --surface-0   (warm obsidian)
Surface 1:              #09080c  → CSS var --surface-1
Surface card:           #0d0b11  → CSS var --surface-card
Accent amber:           #f59e0b  → Tailwind amber-500
Accent cyan:            #22d3ee  → Tailwind cyan-400
Text primary:           rgba(240,240,242,0.87)
Text secondary:         rgba(240,240,242,0.55)
Text muted:             rgba(240,240,242,0.35)
```

### Typography
```
Display (editorial serif): Cormorant Garamond
  Weights: 300/400/600/700 + italic variants
  CSS var:  --font-display
  Class:    font-display
  Used:     hero headlines, WelcomeMark banner

Data / HUD (monospace):    DM Mono
  Weights: 300/400/500
  CSS var:  --font-mono
  Class:    font-mono
  Used:     stat numbers, recharts axes, time/date, sidebar MEDIA OS label

UI (sans):                 Inter
  Weights: 400–900
  CSS var:  --font-sans
  Used:     all other body copy, nav, labels
```
Loaded via `<link>` in `index.html` with preconnect — NOT via CSS @import.

### Atmospheric Effects (`src/index.css`)
| Effect | Implementation |
|--------|---------------|
| Film grain | `body::before` — SVG feTurbulence fractalNoise, 3% opacity, z-index 9998, 400% viewport size, @keyframes noise at 0.5s steps(1) |
| Cinematic vignette | `body::after` — radial-gradient ellipse, z-index 9997, pointer-events none |
| Text selection | `::selection { background: rgba(245,158,11,0.22); color: #fcd34d; }` |
| Lens flare | `.lens-flare` utility — `::before` diagonal streak via linear-gradient skewed -15deg |
| Brushed obsidian | `.surface-obsidian` utility gradient |
| Glass | `.glass { backdrop-filter: blur(24px) saturate(200%) brightness(0.96); }` |

### Custom Cursors
```
Default (camera viewfinder): 44×44px SVG — four L-bracket corner marks + amber center dot
  Hotspot: 22 22
  Selector: *, *::before, *::after { cursor: url(...) 22 22, crosshair !important; }

Pointer (film frame + sprockets): 44×44px SVG — rounded rect + sprocket holes + amber dot
  Hotspot: 22 22
  Selector: button, a, [role="button"], select, summary,
            .cursor-pointer, [class*="cursor-pointer"]
  (with !important — overrides Tailwind)

Preserved:
  input, textarea, [contenteditable] → text cursor
  .cursor-grab → grab cursor
  .cursor-grabbing → grabbing cursor
```
**CRITICAL**: Always use `*, *::before, *::after` selector with `!important`. Element-specific selectors miss span, p, li etc.

### Tile Hover Animation `.tile-pop`
```css
/* Split curves — transform spring, box-shadow smooth ease-out */
.tile-pop {
  transition:
    transform  0.32s cubic-bezier(0.34, 1.56, 0.64, 1),   /* spring bounce */
    box-shadow 0.32s cubic-bezier(0.22, 1, 0.36, 1);       /* NO overshoot */
  will-change: transform;
  transform-origin: center bottom;
}
.tile-pop:hover {
  transform: translateY(-5px) scale(1.016);
  box-shadow:
    0 28px 60px rgba(0,0,0,0.55),
    0 10px 24px rgba(0,0,0,0.35),
    0 0 0 1px rgba(245,158,11,0.10),   /* warm amber ring — NOT white */
    0 0 40px rgba(245,158,11,0.05);    /* ambient bloom */
}
.tile-pop:active {
  transform: translateY(-1px) scale(0.985) !important;
  transition-duration: 0.09s !important;
}
```
Applied to ALL card containers across Dashboard, FilmFinancingView, ProductionsView, MusicView.  
**Never use**: `rgba(255,255,255,0.07)` white ring (causes harsh afterglow flash on hover-off).  
**Never add**: `!important` to hover box-shadow (blocks per-tile vertical neon color layering).

### Panel Entrance Animation `.animate-hud-in`
```css
@keyframes hud-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.975); filter: blur(4px); }
  to   { opacity: 1; transform: translateY(0) scale(1);        filter: blur(0); }
}
.animate-hud-in { animation: hud-in 0.28s cubic-bezier(0.22,1,0.36,1) both; }
```

---

## Architecture & File Map

```
/
├── index.html              Google Fonts preconnect + link (Cormorant Garamond, DM Mono, Inter)
├── server.js               Express 4: AI proxy, weather proxy, helmet CSP, basic auth, static SPA
├── vite.config.js          Vite dev proxies (/api/weather → wttr.in, /api/ai → OpenAI)
├── tailwind.config.js      Tailwind config
├── CLAUDE.md               ← THIS FILE (persistent cross-session memory)
├── src/
│   ├── index.css           ALL global styles (CSS vars, film grain, cursors, tile-pop, etc.)
│   ├── main.jsx            React entry
│   ├── App.jsx             Root component, routing, ErrorBoundary
│   ├── config/
│   │   └── theme.js        Theme constants
│   ├── lib/
│   │   ├── verticalColors.js   Consolidated color map for all 3 verticals
│   │   └── ai.js               AI client (supports OpenAI + Anthropic, proxied through server)
│   └── components/
│       ├── layout/
│       │   ├── Sidebar.jsx     Left nav (font-mono on MEDIA OS, tracking on vertical labels)
│       │   └── TopBar.jsx      Top bar (clock REMOVED — no useState/setInterval for time)
│       ├── dashboard/
│       │   └── Dashboard.jsx   WelcomeHero, WeatherTile, StatCard, WelcomeMark, all dashboard tiles
│       ├── verticals/
│       │   ├── FilmFinancingView.jsx   Film financing (all cards have tile-pop)
│       │   ├── ProductionsView.jsx     Productions (all cards have tile-pop)
│       │   └── MusicView.jsx           Music (all cards + AI Engine banner have tile-pop)
│       ├── ui/
│       │   └── FloatingChatbot.jsx     AI chat (AbortController, sessionStorage history)
│       └── settings/
│           └── Settings.jsx            API key save-on-blur, integration toggles persist
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-04-17-mulbros-os-v2-remediation.md   Full 20-day remediation plan
```

---

## Dashboard Layout Details

### WelcomeHero grid
```
lg:grid-cols-12
  Welcome panel → lg:col-span-7   (was 9 before compaction)
  Weather tile  → lg:col-span-5   (was 3 before enlargement)
  minHeight: 140px (was 180px)
```

### Hero Typography (Cormorant Garamond)
```jsx
// "Welcome back," — light italic, subdued
<h1 className="font-display font-light italic leading-[1.1]"
    style={{ color: 'rgba(240,240,242,0.72)', fontSize: '1.85rem', letterSpacing: '0.015em' }}>
  Welcome back,
</h1>

// "Arghya." — semibold, amber→cyan gradient
<h1 className="font-display font-semibold leading-[1.05]"
    style={{
      background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 40%, #22d3ee 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      fontSize: '2.6rem', letterSpacing: '0.02em',
    }}>
  {firstName}.
</h1>
```

### StatCard button (IMPORTANT — single style prop, not two)
```jsx
// Merged into ONE style object — duplicate style props silently drop the first one
style={{ background: 'linear-gradient(145deg, #100e15 0%, #0c0a10 60%, #0e0c13 100%)', '--accent': accentColor }}
```

### StatCard labels & numbers
```jsx
// Label
<p style={{ fontFamily: 'var(--font-mono)' }}
   className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2">

// Number
<p style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
   className="text-[1.65rem] font-bold text-zinc-100 leading-none mb-2 tabular-nums">
```

---

## Weather System

### How it works
```
Browser → GET /api/weather (same-origin)
                ↓
Dev:     Vite proxy → https://wttr.in/Los+Angeles,California?format=j1
Prod:    Express /api/weather route → fetch wttr.in server-side → return JSON
```

### Why the proxy (do not revert to direct fetch)
Helmet's CSP `connectSrc` only allows `'self'`, `api.openai.com`, `api.anthropic.com`.  
`https://wttr.in` is NOT in the allowlist → browser blocks the request on Render (production).  
Vite dev server has no CSP → direct fetch worked locally. **Never revert to direct browser fetch.**

### Weather data shape from wttr.in
```javascript
data.current_condition[0]  → cur (temp, feelsLike, humidity, wind, UV, visibility, weatherCode)
data.nearest_area[0]       → area (city name, country)
data.weather?.[0]?.astronomy?.[0] → ast (sunrise, sunset)
```
Hardcoded city: Los Angeles, California (no IP geolocation).

---

## Express Server (`server.js`)

### Routes
| Route | Purpose |
|-------|---------|
| `POST /api/ai` | AI proxy (OpenAI + Anthropic), rate-limited 30/min, 30s timeout |
| `GET /api/weather` | Weather proxy to wttr.in, rate-limited 20/min, 10s timeout, Cache-Control 10min |
| `GET /health` | Health check → `{ status: 'ok', version: '2.0.0', timestamp }` |
| `GET *` | Serve SPA (dist/index.html) |

### Security
- Helmet CSP: `connectSrc` = `'self'`, `api.openai.com`, `api.anthropic.com`
- Basic auth via `ADMIN_USER` + `ADMIN_PASS` env vars (optional — if not set, no auth)
- `trust proxy 1` for Render's reverse proxy (correct rate-limit IPs)
- AI endpoint: validates model against allowlist, caps max_tokens at 4096

### Env vars needed on Render
```
PORT          (set automatically by Render)
ADMIN_USER    (optional basic auth username)
ADMIN_PASS    (optional basic auth password)
OPENAI_API_KEY     (for OpenAI models)
ANTHROPIC_API_KEY  (for Claude models)
```

---

## Full Audit & Fix History

### Codebase Audit (Pre-remediation, early sessions)
A full audit was done across Critical (C), High (H), and Medium (M) priority issues.

#### C-Level (Critical) — ALL FIXED
| ID | Issue | Fix |
|----|-------|-----|
| C1 | API key exposed in client bundle | Moved to Express proxy |
| C2 | No error boundaries | React ErrorBoundary added in App.jsx |
| C3 | Missing CSP headers | Helmet added to server.js |
| C4 | Inline event handlers causing XSS surface | Refactored |
| C5 | No rate limiting on AI endpoint | express-rate-limit added |
| C6 | Trust proxy not set | `app.set('trust proxy', 1)` added |
| C7 | Missing mobile responsive layouts | Tailwind responsive classes added |
| C8 | Nested component definitions (CustomBar inside render) | Hoisted to module scope |

#### H-Level (High) — ALL FIXED
| ID | Issue | Fix |
|----|-------|-----|
| H1 | Dead files (17 unused components) | Deleted in bulk |
| H2 | No health endpoint | GET /health added |
| H3 | timeAgo() function duplicated | Consolidated to shared util |
| H4 | Console.log statements in production | Removed |
| H5 | Missing aria-labels on icon buttons | Added where found |
| H6 | Hardcoded colors not using design tokens | Migrated to CSS vars |
| H7 | Settings toggles lost on refresh | localStorage persistence added |
| H8 | AI timeout with no AbortController | AbortController added |
| H9 | Missing loading states | Skeleton states added |
| H10 | No request body validation on AI route | Validation added |
| H11 | Large bundle (all routes loaded eagerly) | Manual chunk splitting in vite.config.js |

#### M-Level (Medium) — MOSTLY FIXED
| ID | Issue | Fix |
|----|-------|-----|
| M2 | System prompt rebuilt every render | Memoized with useMemo |
| M3 | jsPDF loaded eagerly | Dynamic import (lazy) |
| M6 | Chatbot had no abort on component unmount | AbortController + cleanup |
| M9 | verticalColors duplicated per-file | Consolidated to lib/verticalColors.js |
| M16 | API key settings saved only on button click | Save-on-blur added |
| M17 | Kanban board state lost on refresh | localStorage persistence |
| M18 | Sidebar agent count hardcoded | Dynamic count from data |

---

## Hollywood Noir Overhaul (2026-04-17 — Full Day Session)

This was the major aesthetic transformation. Applied in commit `b5f7818`.

### Changes Made

#### `index.html`
- Replaced Inter + DM Sans Google Fonts link
- Added Cormorant Garamond (300/400/600/700 + italic) + DM Mono (300/400/500) + Inter

#### `src/index.css` (most heavily changed file)
- `:root` CSS vars: warm obsidian palette (`--surface-0: #060508` etc.), font vars
- `html, body`: antialiased, font-feature-settings, optimizeLegibility
- `body::before`: film grain (SVG feTurbulence, 3% opacity, animated noise)
- `body::after`: cinematic vignette (radial-gradient ellipse)
- `::selection`: amber text highlight
- Universal cursor: camera viewfinder SVG on `*, *::before, *::after`
- Pointer cursor: film frame + sprockets on interactive elements
- `.font-display` and `.font-mono` utility classes
- `hud-in` keyframe with blur transition
- `.tile-pop` split transition curves (see above)
- Recharts text: `font-family: var(--font-mono) !important`
- `.glass`, `.lens-flare`, `.surface-obsidian` utilities

#### `src/components/layout/TopBar.jsx`
- **REMOVED** the live clock (`useState`, `setInterval`, `Radio` icon, time display)

#### `src/components/layout/Sidebar.jsx`
- Added `font-mono` to MEDIA OS sub-label
- Added `tracking-[0.12em]` to vertical sub-labels

#### `src/components/dashboard/Dashboard.jsx`
- WelcomeHero: `lg:col-span-9/3` → `7/5` split; `minHeight 180→140`; `p-7→p-5`
- Hero headlines: Cormorant Garamond light italic + semibold amber→cyan gradient
- StatCard: brushed obsidian gradient bg, DM Mono labels and numbers, merged style props
- WelcomeMark: Cormorant Garamond semibold at 3rem
- WeatherTile: fetch changed from `https://wttr.in/...` → `/api/weather` (proxy)

#### `src/components/verticals/FilmFinancingView.jsx`
- `replace_all`: `bg-zinc-900 rounded-2xl` → `tile-pop bg-zinc-900 rounded-2xl`
- Accent tiles also got `tile-pop`

#### `src/components/verticals/ProductionsView.jsx`
- `replace_all`: all 7 card containers got `tile-pop`

#### `src/components/verticals/MusicView.jsx`
- `replace_all`: all card containers got `tile-pop`
- AI Engine gradient banner also got `tile-pop`

---

## Git Log (full, reverse chronological)

| Hash | Message |
|------|---------|
| `df2136c` | fix(weather): proxy wttr.in through Express to bypass CSP restriction |
| `aa8e759` | fix(dashboard): merge duplicate style props on StatCard button |
| `b5f7818` | feat(design): billion-dollar Hollywood Noir UI overhaul — day session |
| `6da41e7` | fix(weather): hardcode Los Angeles, California instead of IP geolocation |
| `a99dc27` | feat(dashboard): replace Quick Launch with Welcome Hero + vertical weather |
| `cbcdeb3` | feat(dashboard): live weather tile + spring pop-out hover on all tiles |
| `5fe712b` | feat(ui): Hollywood × Cyberpunk 2077 full UI overhaul |
| `a0e61c0` | fix(lint): hoist CustomBar to module scope to fix nested-component ESLint error |
| `1edc686` | fix(H1-H11): address all high-priority audit items |
| `f6ee2e9` | fix(critical): resolve all 8 C-level audit issues (C1–C8) |
| `e08fee6` | feat(security): add helmet, basic auth, request validation, trust proxy, health endpoint |

---

## Known Bugs Fixed (do not reintroduce)

| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| White afterglow flash on tile hover-off | `rgba(255,255,255,0.07)` hard ring + spring curve on box-shadow caused overshoot | Split curves; replaced white ring with amber |
| Cursor reverts to browser hand on some elements | Element-specific selectors miss span/p/li; Tailwind `.cursor-pointer` overrides | `*, *::before, *::after` with `!important` |
| Tile hover glow missing on vertical pages | `tile-pop` only applied in Dashboard.jsx | `replace_all` across all 3 vertical files |
| Duplicate style prop on StatCard | Two `style={{}}` attributes — second silently overwrites first | Merged into single object |
| Weather fails on Render (production) | Helmet CSP blocks browser fetch to `https://wttr.in` | Server-side proxy at `/api/weather` |
| TopBar clock drifted on background tabs | `setInterval` doesn't fire reliably when tab is hidden | Clock removed entirely |
| CustomBar ESLint error | Component defined inside render function | Hoisted to module scope |
| AI proxy leaking error messages | Express `catch` re-threw internal messages | Generic 500 with console.error |

---

## 20-Day Remediation Plan — Status

Full plan: `docs/superpowers/plans/2026-04-17-mulbros-os-v2-remediation.md`

### Complete ✅
- ErrorBoundary, dead state, timeAgo(), sidebar agent count (Days 1-2)
- verticalColors.js consolidated (Day 5 partial)
- ai.js Anthropic support, APIKeyManager save-on-blur (Day 6 partial)
- Settings IntegrationToggles persist (Day 7 partial)
- Dynamic jsPDF, FloatingChatbot AbortController, memoize system prompt (Day 14)
- Kanban localStorage, agent chat sessionStorage (Day 10)
- 17 dead files deleted (Day 13 partial)
- Mobile responsiveness (Day 17)

### Not Started ❌ (priority order)
1. **Day 3 — Accessibility** ← START HERE NEXT
   - `*:focus-visible { outline: 2px solid #f59e0b; outline-offset: 2px; border-radius: 4px; }` in index.css
   - Global `text-zinc-600` → `text-zinc-400` (contrast fix)
   - `aria-current="page"` on Sidebar active item
   - `role="tablist"/"tab"` + `aria-selected` on all tab bars
   - `aria-label` on remaining icon-only buttons

2. **Day 16 — Split FilmFinancingView.jsx** (it's too large, >300 lines)

3. **Days 8–9 — Vitest bootstrap + test files** (zero tests currently)

4. **Days 11–12 — React Router v6 migration** (currently bespoke routing via state)

5. **Day 4 — ESLint CI verification**, npm audit in CI, post-deploy health check

6. **Days 18–20 — README, Playwright E2E, final verification**

---

## Conventions for New Code

### New card/tile component
```jsx
<div className="tile-pop bg-zinc-900 rounded-2xl p-5">
  {/* label */}
  <p style={{ fontFamily: 'var(--font-mono)' }}
     className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2">
    LABEL
  </p>
  {/* stat number */}
  <p style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
     className="text-[1.65rem] font-bold text-zinc-100 leading-none tabular-nums">
    123
  </p>
</div>
```

### New vertical page
1. Import colors from `src/lib/verticalColors.js`
2. All `bg-zinc-900 rounded-2xl` cards get `tile-pop` class
3. No inline `cursor: pointer` — universal CSS handles it
4. Stat labels: `font-mono`, `text-[10px]`, `uppercase`, `tracking-[0.18em]`
5. Stat numbers: `font-mono`, `tabular-nums`, `letterSpacing: '-0.03em'`
6. Use `animate-hud-in` class for panel entrance animations

### API calls from components
- AI: `POST /api/ai` with `{ model, messages, max_tokens }`
- Weather: `GET /api/weather` (no params — city hardcoded server-side)
- Never call OpenAI/Anthropic/wttr.in directly from browser code

---

## Environment & Local Dev

```bash
# Install
npm install

# Dev (Vite + proxies for /api/weather and /api/ai)
npm run dev     → http://localhost:5173

# Production preview (Express serving dist/)
npm run build && npm start   → http://localhost:3000

# Lint
npm run lint
```

Required `.env` for local dev:
```
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```
For basic auth on Render: set `ADMIN_USER` and `ADMIN_PASS` in Render env vars.
