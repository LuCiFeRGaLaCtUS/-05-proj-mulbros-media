# MulBros Media OS v2 — Session Memory Log

> This file is the persistent cross-session memory for Claude Code.  
> Last updated: 2026-04-17 (Day-1 of Hollywood Noir overhaul)

---

## Project Identity

| Field | Value |
|-------|-------|
| App name | MulBros Media OS v2 |
| Owner | Arghya Chowdhury (Arghya@fsztpartners.com) |
| Repo | https://github.com/LuCiFeRGaLaCtUS/-05-proj-mulbros-media |
| Branch | `main` |
| Stack | React 18 + Vite 5 + Tailwind CSS v3.4 + Express 4 proxy |
| Dev command | `npm run dev` (port 5173) |
| Build command | `npm run build` → `dist/` |
| Last clean build | `aa8e759` — zero errors, zero warnings |

---

## Design Language — Hollywood Noir (LOCKED)

This is the committed aesthetic. Never revert to generic dark/purple/Inter defaults.

### Palette
```
Background (body):      #060508  (warm obsidian — CSS var --surface-0)
Surface 1:              #09080c  (--surface-1)
Surface card:           #0d0b11  (--surface-card)
Accent primary:         #f59e0b  (amber — Tailwind amber-500)
Accent secondary:       #22d3ee  (cyan — Tailwind cyan-400)
Text primary:           rgba(240,240,242,0.87)
Text secondary:         rgba(240,240,242,0.55)
Text muted:             rgba(240,240,242,0.35)
```

### Typography
```
Display (editorial serif): Cormorant Garamond — weights 300/400/600/700 + italics
  CSS var:  --font-display
  Classes:  font-display (utility class in index.css)
  Used for: hero headlines, WelcomeMark banner

Data / HUD (monospace):    DM Mono — weights 300/400/500
  CSS var:  --font-mono
  Classes:  font-mono (utility class in index.css)
  Used for: stat numbers, recharts axes, time/date, sidebar MEDIA OS label

UI (sans):                 Inter — weights 400-900
  CSS var:  --font-sans
  Used for: everything else (body copy, nav, labels)
```
Fonts loaded via `<link>` in `index.html` (NOT CSS @import) — do not change this.

### Atmospheric Effects (all in `src/index.css`)
- **Film grain** — `body::before`, SVG feTurbulence fractalNoise, 3% opacity, `z-index: 9998`, animated @keyframes noise at 0.5s steps(1), 400% viewport size to prevent tiling
- **Cinematic vignette** — `body::after`, radial-gradient ellipse, `z-index: 9997`
- **Amber text selection** — `::selection { background: rgba(245,158,11,0.22); color: #fcd34d; }`
- **Lens flare** — `.lens-flare` utility class with `::before` diagonal streak
- **Brushed obsidian** — `.surface-obsidian` utility gradient

### Cursors (universal — never revert)
```
Default cursor: Camera viewfinder (44×44 SVG) — four L-bracket corners + amber center dot
  Selector: *, *::before, *::after { cursor: url(...) 22 22, crosshair !important; }

Pointer cursor: Film frame with sprocket holes (44×44 SVG) — rounded rect + amber dot
  Selector: button, a, [role="button"], select, summary,
            .cursor-pointer, [class*="cursor-pointer"]
  (covers all Tailwind cursor-pointer classes)

Preserved: input/textarea → text cursor; .cursor-grab/.cursor-grabbing → grab
```
**Critical**: Use `*, *::before, *::after` with `!important`. Element-specific selectors always miss things (span, p, li, etc.).

### Tile Hover Animation (`.tile-pop` class)
```css
/* Split curves — transform gets spring bounce, box-shadow gets smooth ease-out */
.tile-pop {
  transition:
    transform  0.32s cubic-bezier(0.34, 1.56, 0.64, 1),   /* spring bounce */
    box-shadow 0.32s cubic-bezier(0.22, 1, 0.36, 1);       /* ease-out — no overshoot */
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
**Applied to**: All card containers in Dashboard, FilmFinancingView, ProductionsView, MusicView.  
**Never use**: `rgba(255,255,255,0.07)` white ring (creates harsh afterglow flash).  
**Never add**: `!important` to the hover `box-shadow` (blocks per-tile neon color layering).

---

## File Map — What Each File Does

### Core files
| File | Purpose |
|------|---------|
| `src/index.css` | All global styles: CSS vars, film grain, vignette, cursors, tile-pop, fonts, recharts override, glass, lens-flare, surface-obsidian, hud-in animation |
| `src/index.html` | Google Fonts `<link>` (Cormorant Garamond + DM Mono + Inter) + preconnect |
| `src/App.jsx` | Root component, routing, ErrorBoundary |
| `src/components/layout/Sidebar.jsx` | Left nav: font-mono on MEDIA OS sub-label, tracking-[0.12em] on vertical sub-labels |
| `src/components/layout/TopBar.jsx` | Top bar: clock REMOVED (no useState for time, no setInterval, no Radio icon) |
| `src/components/dashboard/Dashboard.jsx` | Main dashboard: WelcomeHero (7/5 col split), StatCard, WelcomeMark, all tiles |
| `src/components/verticals/FilmFinancingView.jsx` | Film financing: all `bg-zinc-900 rounded-2xl` cards have `tile-pop` |
| `src/components/verticals/ProductionsView.jsx` | Productions: all `bg-zinc-900 rounded-2xl` cards have `tile-pop` |
| `src/components/verticals/MusicView.jsx` | Music: all `bg-zinc-900 rounded-2xl` cards + gradient AI Engine banner have `tile-pop` |
| `src/lib/verticalColors.js` | Consolidated color map for all verticals |
| `server/index.js` | Express proxy, helmet, basic auth, health endpoint at `/api/health` |
| `docs/superpowers/plans/2026-04-17-mulbros-os-v2-remediation.md` | 20-day remediation plan |

---

## Dashboard Layout

### WelcomeHero (hero panel + weather)
```
lg:grid-cols-12
  Welcome panel:  lg:col-span-7  (was 9 — compacted to free space)
  Weather widget: lg:col-span-5  (was 3 — enlarged)
  minHeight: 140 (was 180)
  padding: p-5 (was p-7)
```

### Hero Typography
```jsx
// "Welcome back," — Cormorant Garamond light italic
<h1 className="font-display font-light italic leading-[1.1]"
  style={{ color: 'rgba(240,240,242,0.72)', fontSize: '1.85rem', letterSpacing: '0.015em' }}>
  Welcome back,
</h1>

// "Arghya." — Cormorant Garamond semibold with amber→cyan gradient
<h1 className="font-display font-semibold leading-[1.05]"
  style={{
    background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 40%, #22d3ee 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontSize: '2.6rem',
    letterSpacing: '0.02em',
  }}>
  {firstName}.
</h1>
```

### StatCard
```jsx
// Background gradient (merged into single style prop — was a duplicate style bug, fixed in aa8e759)
style={{ background: 'linear-gradient(145deg, #100e15 0%, #0c0a10 60%, #0e0c13 100%)', '--accent': accentColor }}

// Stat title label
<p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2">

// Stat number
<p style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }} className="text-[1.65rem] font-bold text-zinc-100 leading-none mb-2 tabular-nums">
```

---

## Git History (reverse chronological)

| Hash | Message |
|------|---------|
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

## 20-Day Remediation Plan — Status

Full plan at: `docs/superpowers/plans/2026-04-17-mulbros-os-v2-remediation.md`

### Done ✅
- Day 1: ErrorBoundary, dead state removal, timeAgo(), sidebar agent count
- Day 2: (same as above — overlapping items)
- Day 5 (partial): verticalColors.js consolidated
- Day 6 (partial): ai.js updated, APIKeyManager save-on-blur
- Day 7 (partial): Settings IntegrationToggles persist
- Day 10: Kanban localStorage persistence, agent chat history sessionStorage
- Day 13 (partial): 17 dead files deleted
- Day 14: Dynamic jsPDF, FloatingChatbot AbortController, memoize system prompt
- Day 17: Mobile responsiveness

### Not Started ❌
- **Day 3**: Accessibility — `*:focus-visible` amber ring in index.css, `text-zinc-600` → `text-zinc-400`, `aria-current="page"` on sidebar active item, `role="tablist"/"tab"/aria-selected` on all tab bars
- **Day 4**: ESLint CI step verification, npm audit in CI, health check post-deploy
- **Day 5 (remaining)**: Shared `<Card>` component, `<CinematicBg>` component
- **Day 6 (remaining)**: Anthropic Claude endpoint wiring in ai.js, Settings isDirty for Notifications
- **Days 8–9**: Vitest bootstrap + test files
- **Days 11–12**: React Router v6 migration
- **Day 13 (remaining)**: Standardize remaining mock data
- **Day 16**: Split FilmFinancingView.jsx into smaller components
- **Days 18–20**: README, Playwright E2E, final verification

### Recommended Next Step
**Day 3 Accessibility** — highest-value unstarted item, pure CSS + small JSX changes:
1. Add to `src/index.css`: `*:focus-visible { outline: 2px solid #f59e0b; outline-offset: 2px; border-radius: 4px; }`
2. Global replace `text-zinc-600` → `text-zinc-400` across all components (contrast fix)
3. Add `aria-current="page"` to active sidebar item in `Sidebar.jsx`
4. Add `role="tablist"` / `role="tab"` / `aria-selected` to all tab bars
5. Add `aria-label` to remaining icon-only buttons

---

## Known Bugs Fixed (do not reintroduce)

| Bug | Root cause | Fix |
|-----|-----------|-----|
| White afterglow flash on tile hover | (1) `rgba(255,255,255,0.07)` white ring; (2) spring cubic-bezier on box-shadow causes overshoot | Split transition curves; replace white ring with amber |
| Cursor reverts to browser hand on some elements | Element-specific cursor selectors miss span, p, li etc.; Tailwind `.cursor-pointer` overrides | Use `*, *::before, *::after` with `!important`; explicitly target `.cursor-pointer` |
| Tiles on vertical pages had no hover glow | `tile-pop` class only applied in Dashboard.jsx | `replace_all` in FilmFinancingView, ProductionsView, MusicView |
| Duplicate style prop on StatCard button | Two separate `style={{}}` attributes — second silently overwrites first | Merged into single style object (fixed `aa8e759`) |
| TopBar showed clock | `useState` + `setInterval` for live time | Removed entirely from TopBar.jsx |

---

## Patterns & Conventions

### Adding a new vertical page
1. All card containers: `tile-pop bg-zinc-900 rounded-2xl p-5`
2. Import colors from `src/lib/verticalColors.js`
3. Stat numbers: `font-mono` + `tabular-nums` + `letterSpacing: '-0.03em'`
4. Section labels: `font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500`
5. No inline `cursor: pointer` — the universal CSS rule handles it

### Recharts customization
- Axis font: override in `index.css` via `.recharts-text { font-family: var(--font-mono) !important; }`
- Colors: use vertical accent from `verticalColors.js`

### Animation class: `animate-hud-in`
```css
/* Panel entrance — opacity + translateY + blur */
@keyframes hud-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.975); filter: blur(4px); }
  to   { opacity: 1; transform: translateY(0) scale(1);        filter: blur(0); }
}
.animate-hud-in { animation: hud-in 0.28s cubic-bezier(0.22,1,0.36,1) both; }
```

### Glass card
```css
.glass { backdrop-filter: blur(24px) saturate(200%) brightness(0.96); }
```

---

## Environment

- Node: check with `node -v`
- Package manager: npm
- OS: Windows (paths use backslashes, git uses LF→CRLF conversion)
- Vite dev server: `http://localhost:5173`
- Express proxy: `http://localhost:3001`
- Weather: hardcoded to Los Angeles, CA (OpenWeatherMap API — key in `.env`)

---

## Session Log Index

| Date | Work Done |
|------|-----------|
| 2026-04-17 (morning–afternoon) | Full Hollywood Noir UI overhaul: film grain, cinematic vignette, Cormorant Garamond + DM Mono typography, camera viewfinder + film frame cursors (universal), tile-pop on all vertical pages, compacted hero (7/5 col split), enlarged weather widget, TopBar clock removed, warm obsidian palette, amber tile hover glow, WelcomeMark Cormorant headline, duplicate style prop fix |
