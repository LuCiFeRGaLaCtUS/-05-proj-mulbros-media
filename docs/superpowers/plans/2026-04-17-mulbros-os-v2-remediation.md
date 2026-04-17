# MulBros Media OS v2 — Full Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Systematically fix all Critical, High, Medium, and Low issues from the full skill audit — security, bugs, accessibility, design system, architecture, testing, and dead code — across 20 working days.

**Architecture:** React 18 + Vite 5 SPA served by Express 4 proxy. No router (useState-based), no tests, no auth. This plan migrates to React Router v6, Anthropic Claude API, Zustand persistence, Vitest tests, and full security hardening.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Express 4, @dnd-kit/core, jsPDF, date-fns, Recharts, lucide-react, react-hot-toast

---

## File Map — What Gets Created / Modified

| File | Action | Purpose |
|------|---------|---------|
| `server.js` | ~~Modify~~ **✅ DONE** | Helmet, basic auth, validation, trust proxy, health endpoint |
| `src/config/agents.js` | ~~Modify~~ **✅ DONE** | Legal disclaimer on film-financing-analyst |
| `src/components/ErrorBoundary.jsx` | Create | React error boundary wrapping renderPage() |
| `src/App.jsx` | Modify | Add ErrorBoundary, remove dead state, later: React Router |
| `src/components/chatbot/FloatingChatbot.jsx` | Modify | Remove appState prop, add AbortController, useMemo |
| `src/utils/helpers.js` | Modify | Implement real timeAgo() |
| `src/components/layout/Sidebar.jsx` | Modify | Fix "8 Agents Online" hardcode, fix aria-current, contrast |
| `src/index.css` | Modify | Global focus-visible ring, replace zinc-600 contrast failures |
| `src/components/layout/TopBar.jsx` | Modify | aria-labels, fix Log Out onClick |
| `src/components/agents/AgentChat.jsx` | Modify | aria-label on Send, KeyboardSensor |
| `src/components/verticals/FilmFinancingView.jsx` | Modify | KeyboardSensor, dynamic jsPDF import |
| `src/components/verticals/MusicView.jsx` | Modify | KeyboardSensor |
| `src/utils/ai.js` | Create | Rename/rewrite claude.js → ai.js, switch to Anthropic |
| `src/utils/claude.js` | Delete | Replaced by ai.js |
| `src/config/verticalColors.js` | Create | Single source of truth for vertical color maps |
| `src/components/ui/Card.jsx` | Create | Shared bg-zinc-900 rounded-2xl card wrapper |
| `src/components/settings/APIKeyManager.jsx` | Modify | Save on blur, update to Anthropic branding |
| `src/components/settings/IntegrationToggles.jsx` | Modify | Persist state to localStorage |
| `src/components/settings/Settings.jsx` | Modify | Fix isDirty to track Notifications tab |
| `tailwind.config.js` | Modify | Add font-display: DM Sans |
| `.eslintrc.json` | Create | ESLint config for React + hooks |
| `vitest.config.js` | Create | Vitest with jsdom + coverage |
| `src/test/setup.js` | Create | jest-dom setup |
| `src/test/utils/helpers.test.js` | Create | Unit tests for all helper functions |
| `src/test/utils/ai.test.js` | Create | Unit tests for AI client |
| `src/store/useAppStore.js` | Create | Zustand store for kanban state |
| `.github/workflows/ci.yml` | Modify | Add lint, audit, test steps, health check |
| `README.md` | Create | Setup, env vars, deploy guide |
| Dead files (18 files) | Delete | talent/, roadmap/, analytics/, campaigns/, community/, content/ |

---

# ✅ WEEK 1 — P0 Critical Fixes + P1 Foundation

---

## ✅ Day 1 — Security Hardening — COMPLETE

**Commit:** `991bed6` — `feat(security): add helmet, basic auth, request validation, trust proxy, health endpoint`

Changes landed:
- `server.js` — Helmet CSP, HTTP Basic Auth (env-gated), model allowlist, max_tokens capped at 4096, Anthropic API support with response normalization, trust proxy, /health endpoint, internal errors no longer leaked
- `src/config/agents.js` — Legal disclaimer appended to film-financing-analyst system prompt

---

## Day 2 — Critical Bug Fixes

### Task 2.1 — React ErrorBoundary + App.jsx cleanup

**Files:**
- Create: `src/components/ErrorBoundary.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/chatbot/FloatingChatbot.jsx`

- [ ] **Create `src/components/ErrorBoundary.jsx`:**

```jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-lg font-bold text-zinc-100 mb-2">Something went wrong</h2>
            <p className="text-sm text-zinc-400 mb-1">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <p className="text-xs text-zinc-500">Check the browser console for details.</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Edit `src/App.jsx`** — replace the entire file with:

```jsx
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { FilmFinancingView } from './components/verticals/FilmFinancingView';
import { ProductionsView } from './components/verticals/ProductionsView';
import { MusicView } from './components/verticals/MusicView';
import { CalendarView } from './components/verticals/CalendarView';
import { AgentChat } from './components/agents/AgentChat';
import { Settings } from './components/settings/Settings';
import { FloatingChatbot } from './components/chatbot/FloatingChatbot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './utils/useTheme';

const ThemedToaster = () => {
  const theme = useTheme();
  const isLight = theme === 'light';
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: isLight
          ? { background: '#ffffff', color: '#18181b', border: '1px solid #d4d4d8' }
          : { background: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46' },
        success: { iconTheme: { primary: '#10b981', secondary: isLight ? '#ffffff' : '#18181b' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: isLight ? '#ffffff' : '#18181b' } },
      }}
    />
  );
};

function App() {
  const [activePage, setActivePage]             = useState('dashboard');
  const [preselectedAgent, setPreselectedAgent] = useState(null);

  const handleAgentClick = (agentId) => {
    setPreselectedAgent(agentId);
    setActivePage('agents');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':   return <Dashboard onAgentClick={handleAgentClick} setActivePage={setActivePage} />;
      case 'financing':   return <FilmFinancingView />;
      case 'productions': return <ProductionsView />;
      case 'music':       return <MusicView onAgentClick={handleAgentClick} />;
      case 'calendar':    return <CalendarView />;
      case 'agents':      return <AgentChat preselectedAgentId={preselectedAgent} onClose={() => setPreselectedAgent(null)} />;
      case 'settings':    return <Settings />;
      default:            return <Dashboard onAgentClick={handleAgentClick} />;
    }
  };

  return (
    <>
      <Layout activePage={activePage} setActivePage={setActivePage} setPreselectedAgent={setPreselectedAgent}>
        <ErrorBoundary key={activePage}>
          {renderPage()}
        </ErrorBoundary>
        <FloatingChatbot setActivePage={setActivePage} />
      </Layout>
      <ThemedToaster />
    </>
  );
}

export default App;
```

- [ ] **Edit `src/components/chatbot/FloatingChatbot.jsx` line 73** — change component signature:

```jsx
// CHANGE:
export const FloatingChatbot = ({ appState }) => {
  // ...
  const actions = createActionHandlers(appState);

// TO:
export const FloatingChatbot = ({ setActivePage }) => {
  // ...
  const actions = createActionHandlers({ setActivePage });
```

- [ ] **Run build to verify no errors:**

```bash
cd "D:\MulBros Media\MulBros Media OS v2"
npm run build
# Expected: ✓ built in ~12s, zero errors
```

- [ ] **Commit:**

```bash
git add src/components/ErrorBoundary.jsx src/App.jsx src/components/chatbot/FloatingChatbot.jsx
git commit -m "fix(architecture): add ErrorBoundary, remove dead App state

- ErrorBoundary with key={activePage} wraps every page render
- Remove dead campaigns/messages/target/contentType state from App
- FloatingChatbot receives setActivePage directly, not full appState object"
```

---

### Task 2.2 — Fix timeAgo() stub + Sidebar agent count

**Files:**
- Modify: `src/utils/helpers.js` (lines 11–13)
- Modify: `src/components/layout/Sidebar.jsx` (line 187, add import)

- [ ] **Edit `src/utils/helpers.js`** — replace lines 11–13:

```js
// REPLACE:
export const timeAgo = (dateString) => {
  return dateString;
};

// WITH:
export const timeAgo = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSecs < 60)     return 'just now';
    if (diffSecs < 3600)   return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400)  return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};
```

- [ ] **Edit `src/components/layout/Sidebar.jsx`** — add import after line 1:

```js
import { agents } from '../../config/agents';
```

- [ ] **Edit `src/components/layout/Sidebar.jsx` line 187** — change:

```jsx
// CHANGE:
<span className="text-xs font-medium text-zinc-300">8 Agents Online</span>
// TO:
<span className="text-xs font-medium text-zinc-300">{agents.length} Agents Online</span>
```

- [ ] **Commit:**

```bash
git add src/utils/helpers.js src/components/layout/Sidebar.jsx
git commit -m "fix(data): implement timeAgo(), fix sidebar agent count

- timeAgo() computes real relative time (just now / 5m / 2h / 3d / Apr 5)
- Sidebar footer now shows agents.length (9) instead of hardcoded 8"
```

---

## Day 3 — Accessibility P0

### Task 3.1 — Global focus ring + contrast fixes

**Files:**
- Modify: `src/index.css` (add after line 244)
- Modify: `src/components/layout/Sidebar.jsx`

- [ ] **Edit `src/index.css`** — add at the very end (after line 244 `.tabular-nums` rule):

```css
/* ── Global focus ring — WCAG 2.4.7 ─────────────────────────────────────── */
*:focus-visible {
  outline: 2px solid #f59e0b; /* amber-500 — passes contrast on all dark surfaces */
  outline-offset: 2px;
  border-radius: 4px;
}

/* Suppress outline for mouse users (keyboard users still see the ring) */
*:focus:not(:focus-visible) {
  outline: none;
}
```

- [ ] **Edit `src/components/layout/Sidebar.jsx`** — fix `text-zinc-600` contrast failures (1.7:1 ratio — catastrophic). Four occurrences to change to `text-zinc-500`:

```jsx
// Line 76 — brand header Film icon:
className="text-zinc-600"  →  className="text-zinc-500"

// Line 77 — "Media OS" label:
className="text-[9px] font-semibold text-zinc-600 ..."  →  text-zinc-500

// Line 97 — "Verticals" section label:
className="... text-zinc-600"  →  text-zinc-500

// Line 124 — vertical sub-label (e.g. "Vertical A"):
className="text-[10px] text-zinc-600 mt-0.5"  →  text-zinc-500

// Line 200 — footer branding:
className="text-[9px] text-zinc-600 tracking-wider"  →  text-zinc-500
```

- [ ] **Commit:**

```bash
git add src/index.css src/components/layout/Sidebar.jsx
git commit -m "fix(a11y): global focus-visible ring, fix zinc-600 contrast failures in Sidebar

- *:focus-visible adds 2px amber outline globally (WCAG 2.4.7)
- 5 Sidebar text-zinc-600 labels upgraded to text-zinc-500 (3.1:1 ratio)
- Mouse users unaffected (:focus:not(:focus-visible) suppresses ring)"
```

---

### Task 3.2 — aria-labels, aria-current, keyboard DnD

**Files:**
- Modify: `src/components/layout/Sidebar.jsx`
- Modify: `src/components/layout/TopBar.jsx`
- Modify: `src/components/agents/AgentChat.jsx`
- Modify: `src/components/verticals/FilmFinancingView.jsx`
- Modify: `src/components/verticals/MusicView.jsx`

- [ ] **Edit `src/components/layout/Sidebar.jsx`** — replace the `NavButton` component (lines 209–225) to add `aria-current` and `aria-hidden` on icons:

```jsx
const NavButton = ({ label, icon: Icon, isActive, onClick, activeClass, hoverClass }) => (
  <button
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border-l-2 ${
      isActive
        ? `${activeClass}`
        : `border-l-transparent text-zinc-400 ${hoverClass}`
    }`}
  >
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
      isActive ? 'bg-white/10' : 'bg-zinc-800'
    }`}>
      <Icon size={14} aria-hidden="true" />
    </div>
    <span className="font-medium text-sm">{label}</span>
  </button>
);
```

Also add `aria-current={isActive ? 'page' : undefined}` to the verticals `<button>` in the `.map()` (line 106).

- [ ] **Edit `src/components/layout/TopBar.jsx`** — add `aria-label` to icon-only buttons. Search for the notification bell button, profile avatar button, and theme toggle button. Add:

```jsx
// Notification bell button:
aria-label="Notifications"

// Profile/avatar button:
aria-label="User profile"

// Theme toggle button:
aria-label="Toggle light/dark theme"
```

Also fix the Log Out button — find the button with "Log Out" text and add onClick:

```jsx
onClick={() => { localStorage.clear(); window.location.reload(); }}
```

- [ ] **Edit `src/components/agents/AgentChat.jsx`** — find the Send `<button>` element (search for `<Send`) and add:

```jsx
aria-label="Send message"
```

- [ ] **Edit `src/components/verticals/FilmFinancingView.jsx`** — add `KeyboardSensor`. Find the DnD imports and `useSensors` call:

```jsx
// UPDATE the @dnd-kit/core import to include KeyboardSensor:
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';

// ADD sortableKeyboardCoordinates import from @dnd-kit/sortable:
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// UPDATE useSensors call to:
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```

- [ ] **Edit `src/components/verticals/MusicView.jsx`** — same KeyboardSensor addition as FilmFinancingView above.

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built, zero errors
```

- [ ] **Commit:**

```bash
git add src/components/layout/Sidebar.jsx src/components/layout/TopBar.jsx src/components/agents/AgentChat.jsx src/components/verticals/FilmFinancingView.jsx src/components/verticals/MusicView.jsx
git commit -m "fix(a11y): aria-current, aria-labels, keyboard DnD, Log Out wired

- aria-current=page on active NavButton + verticals map items
- Notification bell, profile avatar, theme toggle get aria-label
- Log Out button wired to localStorage.clear() + reload
- AgentChat Send button gets aria-label='Send message'
- KeyboardSensor + sortableKeyboardCoordinates added to both DnD contexts"
```

---

## Day 4 — Code Quality Foundation (ESLint + CI)

### Task 4.1 — ESLint setup

**Files:**
- Create: `.eslintrc.json`
- Modify: `package.json` (add lint script)

- [ ] **Install ESLint and plugins:**

```bash
cd "D:\MulBros Media\MulBros Media OS v2"
npm install -D eslint@8 eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y
# Expected: added N packages
```

- [ ] **Create `.eslintrc.json`:**

```json
{
  "env": {
    "browser": true,
    "es2022": true
  },
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": { "jsx": true }
  },
  "plugins": ["react", "react-hooks", "jsx-a11y"],
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "settings": {
    "react": { "version": "detect" }
  },
  "rules": {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "react/prop-types": "off",
    "jsx-a11y/no-autofocus": "off"
  }
}
```

- [ ] **Add lint script to `package.json`** in the `"scripts"` block:

```json
"lint": "eslint src --ext .js,.jsx --max-warnings 50"
```

- [ ] **Run lint to baseline the warning count:**

```bash
npm run lint 2>&1 | tail -5
# Note the warning count — this is the starting baseline
```

- [ ] **Commit:**

```bash
git add .eslintrc.json package.json package-lock.json
git commit -m "build(lint): add ESLint with React + hooks + a11y rules

Starting at --max-warnings 50. Will tighten as warnings are fixed."
```

---

### Task 4.2 — Harden CI pipeline

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Replace `.github/workflows/ci.yml` entirely:**

```yaml
name: CI / CD

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  # ── Quality checks ─────────────────────────────────────────────────────────
  quality:
    name: Lint & Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Security audit
        run: npm audit --audit-level=high

  # ── Build ──────────────────────────────────────────────────────────────────
  build:
    name: Build
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          OPENAI_API_KEY: ''

      - name: Upload dist artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  # ── Deploy (main only) ─────────────────────────────────────────────────────
  deploy:
    name: Deploy → Render
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push' && env.RENDER_DEPLOY_HOOK_URL != ''
    env:
      RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}

    steps:
      - name: Trigger Render deploy hook
        run: |
          curl --silent --show-error --fail \
            -X POST "$RENDER_DEPLOY_HOOK_URL"

      - name: Health check (wait for restart)
        run: |
          echo "Waiting 60s for Render to restart..."
          sleep 60
          curl --silent --show-error --fail \
            "${{ secrets.RENDER_APP_URL }}/health" \
            | grep '"status":"ok"'
        # Set RENDER_APP_URL secret to https://your-app.onrender.com
```

- [ ] **Commit:**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint + audit, guard deploy with secret check, add post-deploy health check

- Lint and npm audit run before build (build blocked if lint fails)
- Deploy only fires when RENDER_DEPLOY_HOOK_URL secret is set
- Post-deploy health check hits /health and asserts status:ok"
```

---

## Day 5 — Design System Foundation

### Task 5.1 — verticalColors single source of truth

**Files:**
- Create: `src/config/verticalColors.js`
- Modify: `src/components/layout/Sidebar.jsx`

- [ ] **Create `src/config/verticalColors.js`:**

```js
/**
 * Single source of truth for vertical colour tokens.
 * Import from here — never redefine vertical colours locally in components.
 */
export const VERTICAL_COLORS = {
  blue: {
    activeBg:     'bg-blue-500/10',
    activeText:   'text-blue-400',
    activeBorder: 'border-l-blue-400',
    hoverBg:      'hover:bg-blue-500/5',
    hoverText:    'hover:text-blue-300',
    glow:         'shadow-blue-500/20',
    dot:          'bg-blue-400',
    iconBg:       'bg-blue-500/15',
    badge:        'bg-blue-500/20 text-blue-300',
    ring:         'ring-blue-500/30',
  },
  emerald: {
    activeBg:     'bg-emerald-500/10',
    activeText:   'text-emerald-400',
    activeBorder: 'border-l-emerald-400',
    hoverBg:      'hover:bg-emerald-500/5',
    hoverText:    'hover:text-emerald-300',
    glow:         'shadow-emerald-500/20',
    dot:          'bg-emerald-400',
    iconBg:       'bg-emerald-500/15',
    badge:        'bg-emerald-500/20 text-emerald-300',
    ring:         'ring-emerald-500/30',
  },
  amber: {
    activeBg:     'bg-amber-500/10',
    activeText:   'text-amber-400',
    activeBorder: 'border-l-amber-400',
    hoverBg:      'hover:bg-amber-500/5',
    hoverText:    'hover:text-amber-300',
    glow:         'shadow-amber-500/20',
    dot:          'bg-amber-400',
    iconBg:       'bg-amber-500/15',
    badge:        'bg-amber-500/20 text-amber-300',
    ring:         'ring-amber-500/30',
  },
  purple: {
    activeBg:     'bg-purple-500/10',
    activeText:   'text-purple-400',
    activeBorder: 'border-l-purple-400',
    hoverBg:      'hover:bg-purple-500/5',
    hoverText:    'hover:text-purple-300',
    glow:         'shadow-purple-500/20',
    dot:          'bg-purple-400',
    iconBg:       'bg-purple-500/15',
    badge:        'bg-purple-500/20 text-purple-300',
    ring:         'ring-purple-500/30',
  },
  rose: {
    activeBg:     'bg-rose-500/10',
    activeText:   'text-rose-400',
    activeBorder: 'border-l-rose-400',
    hoverBg:      'hover:bg-rose-500/5',
    hoverText:    'hover:text-rose-300',
    glow:         'shadow-rose-500/20',
    dot:          'bg-rose-400',
    iconBg:       'bg-rose-500/15',
    badge:        'bg-rose-500/20 text-rose-300',
    ring:         'ring-rose-500/30',
  },
};

/** Map agent vertical IDs to colour key */
export const VERTICAL_COLOR_KEY = {
  financing:   'blue',
  film:        'blue',
  productions: 'emerald',
  music:       'amber',
  community:   'purple',
  strategy:    'rose',
};
```

- [ ] **Edit `src/components/layout/Sidebar.jsx`** — replace local `colorMap` with the shared config:

```js
// DELETE lines 10–14 (the local colorMap object)
// ADD to imports at the top:
import { VERTICAL_COLORS } from '../../config/verticalColors';
```

Then in the verticals `.map()`, replace every `c = colorMap[v.color]` reference with `c = VERTICAL_COLORS[v.color]`.

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built, zero errors
```

- [ ] **Commit:**

```bash
git add src/config/verticalColors.js src/components/layout/Sidebar.jsx
git commit -m "refactor(design): create verticalColors.js as single source of truth

- VERTICAL_COLORS and VERTICAL_COLOR_KEY in src/config/verticalColors.js
- Sidebar imports from config, local colorMap deleted
- Other components can migrate incrementally"
```

---

### Task 5.2 — DM Sans in Tailwind + shared Card component

**Files:**
- Modify: `tailwind.config.js`
- Create: `src/components/ui/Card.jsx`

- [ ] **Edit `tailwind.config.js`** — add `display` font family in the `fontFamily` section:

```js
fontFamily: {
  sans:    ['Inter', 'system-ui', 'sans-serif'],
  display: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],  // ADD
  mono:    ['JetBrains Mono', 'monospace'],
},
```

Now `font-display` utility class maps to DM Sans (already in Google Fonts link). Removes need for 15+ `style={{ fontFamily: 'DM Sans' }}` inline styles.

- [ ] **Create `src/components/ui/Card.jsx`:**

```jsx
import React from 'react';

/**
 * Standard card shell.
 * Replaces the repeated: bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 overflow-hidden
 * which appears 20+ times verbatim across the codebase.
 *
 * Usage:
 *   <Card className="p-4">...</Card>
 *   <Card as="section" className="p-6">...</Card>
 */
export const Card = ({ children, className = '', as: Tag = 'div', ...props }) => (
  <Tag
    className={`bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 overflow-hidden ${className}`}
    {...props}
  >
    {children}
  </Tag>
);
```

- [ ] **Commit:**

```bash
git add tailwind.config.js src/components/ui/Card.jsx
git commit -m "refactor(design): add font-display DM Sans to Tailwind, create Card component

- font-display utility maps to DM Sans (already in Google Fonts link since last commit)
- Card eliminates 20+ verbatim bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 patterns
- Components can migrate to <Card> incrementally"
```

---

# WEEK 2 — P1/P2 Architecture + Settings

---

## Day 6 — Switch to Anthropic API

### Task 6.1 — Create ai.js, delete claude.js, update all imports

**Files:**
- Create: `src/utils/ai.js`
- Modify: `src/components/chatbot/FloatingChatbot.jsx` (import line 5)
- Modify: `src/components/agents/AgentChat.jsx` (import)
- Modify: `src/components/settings/APIKeyManager.jsx` (import + UI text)
- Delete: `src/utils/claude.js`

- [ ] **Create `src/utils/ai.js`:**

```js
/**
 * AI client — all calls route through /api/ai proxy.
 * Dev: Vite proxy → Express server.js
 * Prod: Express server.js directly.
 * Server normalises Anthropic responses to OpenAI shape — client unchanged.
 */

const AI_PROXY = '/api/ai';

export const MODELS = {
  primary: 'claude-sonnet-4-20250514',   // agents, incentive analyst
  fast:    'claude-haiku-4-5-20251001',  // floating chatbot (cheap + fast)
  opus:    'claude-opus-4-20250514',     // mulbros-intelligence (heavy reasoning)
};

/** Read stored Anthropic API key from localStorage */
export const getApiKey = () => {
  try {
    // Support both old OpenAI key and new Anthropic key for migration
    return localStorage.getItem('mulbros_ai_key')
        || localStorage.getItem('mulbros_openai_key')
        || '';
  } catch {
    return '';  // iOS private browsing throws SecurityError
  }
};

/** Write Anthropic API key to localStorage */
export const setApiKey = (key) => {
  try {
    if (key.trim()) {
      localStorage.setItem('mulbros_ai_key', key.trim());
    } else {
      localStorage.removeItem('mulbros_ai_key');
    }
  } catch { /* ignore */ }
};

const callProxy = async (model, systemPrompt, messages, apiKey, signal) => {
  const key = apiKey || getApiKey();

  const response = await fetch(AI_PROXY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

/** Primary — claude-sonnet-4 (agents, incentive analysis, content generation) */
export const callAI = (systemPrompt, messages, apiKey, signal) =>
  callProxy(MODELS.primary, systemPrompt, messages, apiKey, signal);

/** Fast — claude-haiku (floating chatbot only) */
export const callAIFast = (systemPrompt, messages, apiKey, signal) =>
  callProxy(MODELS.fast, systemPrompt, messages, apiKey, signal);

/** Test key connectivity */
export const testAIKey = async (key) => {
  try {
    await callProxy(MODELS.fast, 'Respond with exactly: OK', [{ role: 'user', content: 'Test' }], key);
    return { success: true, message: `Connected — ${MODELS.fast}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Legacy aliases — keep until all import sites are updated
export const callClaude     = callAI;
export const callClaudeFast = callAIFast;
export const testClaudeKey  = testAIKey;
```

- [ ] **Edit `src/components/chatbot/FloatingChatbot.jsx` line 5** — change import:

```js
// CHANGE:
import { callClaudeFast, getApiKey } from '../../utils/claude';
// TO:
import { callAIFast, getApiKey } from '../../utils/ai';
```

Change line 103 `callClaudeFast(` → `callAIFast(`.

- [ ] **Edit `src/components/agents/AgentChat.jsx`** — change import (search for the claude import):

```js
// CHANGE (whatever form it currently takes):
import { callClaude, getApiKey } from '../../utils/claude';
// TO:
import { callAI, getApiKey } from '../../utils/ai';
```

Change all `callClaude(` → `callAI(`.

- [ ] **Edit `src/components/settings/APIKeyManager.jsx`** — change import and update UI text:

```js
// CHANGE:
import { testClaudeKey } from '../../utils/claude';
// TO:
import { testAIKey, setApiKey, getApiKey } from '../../utils/ai';
```

Change `testClaudeKey` → `testAIKey`.

Change `useState(localStorage.getItem('mulbros_openai_key') || '')` → `useState(getApiKey())`.

Update the banner text from:
```
Active model: gpt-4o (agents) · gpt-4o-mini (chatbot) via OpenAI
Key configured via .env.local (dev) or OPENAI_API_KEY env var (production).
```
to:
```
Active model: claude-sonnet-4-20250514 (agents) · claude-haiku-4-5-20251001 (chatbot) via Anthropic
Key configured via ANTHROPIC_API_KEY env var (production). Paste a key below to override.
```

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built, zero errors
```

- [ ] **Delete `src/utils/claude.js`:**

```bash
git rm src/utils/claude.js
```

- [ ] **Commit:**

```bash
git add src/utils/ai.js src/components/chatbot/FloatingChatbot.jsx src/components/agents/AgentChat.jsx src/components/settings/APIKeyManager.jsx
git commit -m "feat(ai): switch to Anthropic Claude API, rename claude.js → ai.js (ADR-002)

- ai.js routes claude-sonnet-4-20250514 and claude-haiku per agent spec
- Server Day 1 already normalises Anthropic responses to OpenAI shape
- callAI / callAIFast replace callClaude / callClaudeFast
- Legacy aliases kept for any missed references
- mulbros_ai_key replaces mulbros_openai_key (both read for migration)
- APIKeyManager updated to Anthropic branding
- claude.js deleted"
```

---

## Day 7 — Settings Fixes

### Task 7.1 — APIKeyManager save on blur + IntegrationToggles persistence + isDirty fix

**Files:**
- Modify: `src/components/settings/APIKeyManager.jsx`
- Modify: `src/components/settings/IntegrationToggles.jsx`
- Modify: `src/components/settings/Settings.jsx`

- [ ] **Edit `src/components/settings/APIKeyManager.jsx`** — change the OpenAI/Anthropic key input to save on blur. Find the input's event handlers and change from saving on every keystroke:

```jsx
// FIND pattern (saves on every keystroke):
onChange={(e) => handleSave(e.target.value)}

// REPLACE WITH (saves only when focus leaves the field):
onChange={(e) => setOpenaiKey(e.target.value)}
onBlur={(e) => setApiKey(e.target.value.trim())}
```

- [ ] **Edit `src/components/settings/IntegrationToggles.jsx`** — wrap state with localStorage persistence. At the top of the component, find the `useState` for toggles and add persistence:

```js
import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'mulbros_integration_toggles';

// Inside component, replace:
const [toggles, setToggles] = useState({ /* existing defaults */ });

// WITH:
const [toggles, setToggles] = useState(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_TOGGLES, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return DEFAULT_TOGGLES;
});

useEffect(() => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles)); }
  catch { /* ignore */ }
}, [toggles]);
```

Where `DEFAULT_TOGGLES` is the existing default object extracted as a constant above the component.

- [ ] **Edit `src/components/settings/Settings.jsx`** — find the `useEffect` that sets `isDirty` and add `notificationSettings` to its dependency array:

```js
// FIND (only tracks generalSettings):
useEffect(() => {
  setIsDirty(true);
}, [generalSettings]);

// CHANGE TO:
useEffect(() => {
  setIsDirty(true);
}, [generalSettings, notificationSettings]);
```

- [ ] **Commit:**

```bash
git add src/components/settings/APIKeyManager.jsx src/components/settings/IntegrationToggles.jsx src/components/settings/Settings.jsx
git commit -m "fix(settings): key saves on blur, integrations persist, Notifications tab triggers isDirty

- API key no longer stored on every keystroke (prevents partial keys in localStorage)
- IntegrationToggles persists to mulbros_integration_toggles, survives navigation
- Settings isDirty flag now fires when Notifications tab has unsaved changes"
```

---

## Day 8 — Bootstrap Vitest + Helper Tests

### Task 8.1 — Install and configure Vitest

**Files:**
- Create: `vitest.config.js`
- Create: `src/test/setup.js`
- Modify: `package.json`

- [ ] **Install test dependencies:**

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
# Expected: added N packages
```

- [ ] **Create `vitest.config.js`:**

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles:  ['./src/test/setup.js'],
    globals:     true,
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'html'],
      thresholds: { lines: 60, functions: 60 },
    },
  },
});
```

- [ ] **Create `src/test/setup.js`:**

```js
import '@testing-library/jest-dom';
```

- [ ] **Add test scripts to `package.json`** `"scripts"` block:

```json
"test":          "vitest run",
"test:watch":    "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Verify setup:**

```bash
npm test
# Expected: "No test files found" — zero failures
```

- [ ] **Commit:**

```bash
git add vitest.config.js src/test/setup.js package.json package-lock.json
git commit -m "build(test): bootstrap Vitest with jsdom, jest-dom, and coverage thresholds (60%)"
```

---

### Task 8.2 — Unit tests for helpers.js

**Files:**
- Create: `src/test/utils/helpers.test.js`

- [ ] **Create `src/test/utils/helpers.test.js`:**

```js
import { describe, it, expect } from 'vitest';
import {
  timeAgo, formatNumber, formatCurrency, truncate,
  capitalize, getInitials, generateId
} from '../../utils/helpers';

describe('timeAgo', () => {
  it('returns empty string for falsy input', () => {
    expect(timeAgo('')).toBe('');
    expect(timeAgo(null)).toBe('');
    expect(timeAgo(undefined)).toBe('');
  });

  it('returns "just now" for < 60 seconds ago', () => {
    const d = new Date(Date.now() - 30_000).toISOString();
    expect(timeAgo(d)).toBe('just now');
  });

  it('returns minutes ago for < 1 hour', () => {
    const d = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgo(d)).toBe('5m ago');
  });

  it('returns hours ago for < 1 day', () => {
    const d = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(timeAgo(d)).toBe('3h ago');
  });

  it('returns days ago for < 1 week', () => {
    const d = new Date(Date.now() - 2 * 86400_000).toISOString();
    expect(timeAgo(d)).toBe('2d ago');
  });

  it('returns formatted date for older than 1 week', () => {
    const result = timeAgo(new Date('2026-01-05T10:00:00Z').toISOString());
    expect(result).toMatch(/Jan\s+5/);
  });

  it('passes through non-parseable strings unchanged', () => {
    expect(timeAgo('invalid-date-string')).toBe('invalid-date-string');
  });
});

describe('formatNumber', () => {
  it('formats number with locale commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
  it('passes strings through unchanged', () => {
    expect(formatNumber('$89K')).toBe('$89K');
  });
});

describe('formatCurrency', () => {
  it('prepends $ and formats with commas', () => {
    expect(formatCurrency(5000)).toBe('$5,000');
  });
});

describe('truncate', () => {
  it('returns empty string for falsy input', () => {
    expect(truncate('')).toBe('');
  });
  it('returns string unchanged if shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });
  it('truncates with ellipsis when over limit', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });
  it('returns empty string for falsy', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('getInitials', () => {
  it('returns first-letter initials for two-word name', () => {
    expect(getInitials('Luke Mulholland')).toBe('LM');
  });
  it('returns ?? for falsy', () => {
    expect(getInitials('')).toBe('??');
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(5);
  });
  it('generates unique values', () => {
    expect(generateId()).not.toBe(generateId());
  });
});
```

- [ ] **Run tests:**

```bash
npm test
# Expected: 14 assertions, all PASS
```

- [ ] **Commit:**

```bash
git add src/test/utils/helpers.test.js
git commit -m "test(helpers): 14-assertion unit test suite for helpers.js"
```

---

## Day 9 — AI Client Tests

### Task 9.1 — Unit tests for ai.js

**Files:**
- Create: `src/test/utils/ai.test.js`

- [ ] **Create `src/test/utils/ai.test.js`:**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callAI, callAIFast, testAIKey, getApiKey, setApiKey, MODELS } from '../../utils/ai';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const ok = (content) => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ choices: [{ message: { role: 'assistant', content } }] }),
});
const err = (status, message) => Promise.resolve({
  ok: false, status,
  json: () => Promise.resolve({ error: { message } }),
});

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

describe('MODELS', () => {
  it('primary is claude-sonnet-4-20250514', () => {
    expect(MODELS.primary).toBe('claude-sonnet-4-20250514');
  });
  it('fast is claude-haiku-4-5-20251001', () => {
    expect(MODELS.fast).toBe('claude-haiku-4-5-20251001');
  });
});

describe('getApiKey / setApiKey', () => {
  it('returns empty string when nothing stored', () => {
    expect(getApiKey()).toBe('');
  });
  it('stores and retrieves key via setApiKey/getApiKey', () => {
    setApiKey('sk-ant-test123');
    expect(getApiKey()).toBe('sk-ant-test123');
  });
  it('removes key when empty string passed to setApiKey', () => {
    setApiKey('sk-ant-test123');
    setApiKey('');
    expect(getApiKey()).toBe('');
  });
});

describe('callAI', () => {
  it('sends correct model, system prompt, and user message', async () => {
    mockFetch.mockReturnValueOnce(ok('Hello!'));
    const result = await callAI('System prompt', [{ role: 'user', content: 'Hi' }], 'sk-test');

    expect(mockFetch).toHaveBeenCalledWith('/api/ai', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer sk-test' }),
    }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe(MODELS.primary);
    expect(body.messages[0]).toEqual({ role: 'system', content: 'System prompt' });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Hi' });
    expect(result).toBe('Hello!');
  });

  it('throws with API error message on non-ok response', async () => {
    mockFetch.mockReturnValueOnce(err(401, 'No API key provided.'));
    await expect(callAI('sys', [], 'bad')).rejects.toThrow('No API key provided.');
  });
});

describe('callAIFast', () => {
  it('uses the fast (haiku) model', async () => {
    mockFetch.mockReturnValueOnce(ok('Fast reply'));
    await callAIFast('sys', [{ role: 'user', content: 'Hi' }], 'sk-test');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe(MODELS.fast);
  });
});

describe('testAIKey', () => {
  it('returns success:true when proxy returns valid response', async () => {
    mockFetch.mockReturnValueOnce(ok('OK'));
    const result = await testAIKey('sk-valid');
    expect(result.success).toBe(true);
    expect(result.message).toContain('Connected');
  });

  it('returns success:false when proxy returns error', async () => {
    mockFetch.mockReturnValueOnce(err(401, 'Invalid API key'));
    const result = await testAIKey('sk-bad');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid API key');
  });
});
```

- [ ] **Run tests:**

```bash
npm test
# Expected: all ai.test.js + helpers.test.js PASS
```

- [ ] **Commit:**

```bash
git add src/test/utils/ai.test.js
git commit -m "test(ai): unit tests for ai.js — MODELS, key storage, callAI, callAIFast, testAIKey"
```

---

## Day 10 — Zustand Kanban Persistence (ADR-003 Phase 1)

### Task 10.1 — Install Zustand + create app store

**Files:**
- Create: `src/store/useAppStore.js`
- Modify: `src/components/verticals/FilmFinancingView.jsx` (wire kanban from store)
- Modify: `src/components/agents/AgentChat.jsx` (wire chat history from store)

- [ ] **Install Zustand:**

```bash
npm install zustand
# Expected: added zustand
```

- [ ] **Create `src/store/useAppStore.js`:**

```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global app store with localStorage persistence.
 * ADR-003 Phase 1: Zustand + persist middleware.
 * ADR-003 Phase 2: swap persist adapter for Supabase — zero component changes.
 */
export const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Film Financing Kanban ─────────────────────────────────────────────
      filmPipeline: {
        discovery:  [],
        contacted:  [],
        interested: [],
        submitted:  [],
        closed:     [],
      },
      setFilmPipeline: (pipeline) => set({ filmPipeline: pipeline }),
      moveFilmCard: (cardId, fromColumn, toColumn) => {
        const p = { ...get().filmPipeline };
        const card = p[fromColumn]?.find(c => c.id === cardId);
        if (!card) return;
        p[fromColumn] = p[fromColumn].filter(c => c.id !== cardId);
        p[toColumn]   = [...(p[toColumn] || []), card];
        set({ filmPipeline: p });
      },

      // ── Music Kanban ──────────────────────────────────────────────────────
      musicPipeline: {
        pitching: [], submitted: [], placed: [], live: [],
      },
      setMusicPipeline: (pipeline) => set({ musicPipeline: pipeline }),

      // ── Agent chat history (per agent) ───────────────────────────────────
      agentChats: {},  // { [agentId]: Message[] }
      setAgentChat: (agentId, messages) =>
        set(state => ({ agentChats: { ...state.agentChats, [agentId]: messages } })),
      clearAgentChat: (agentId) =>
        set(state => {
          const chats = { ...state.agentChats };
          delete chats[agentId];
          return { agentChats: chats };
        }),
    }),
    { name: 'mulbros-app-store-v1', version: 1 }
  )
);
```

- [ ] **Edit `src/components/verticals/FilmFinancingView.jsx`** — import and wire the film pipeline. Find the kanban `useState` and replace with store:

```js
// ADD import:
import { useAppStore } from '../../store/useAppStore';

// FIND (something like):
const [pipeline, setPipeline] = useState(initialKanbanData);

// REPLACE WITH:
const filmPipeline    = useAppStore(s => s.filmPipeline);
const setFilmPipeline = useAppStore(s => s.setFilmPipeline);
```

Ensure the column keys (`discovery`, `contacted`, etc.) match the component's existing column IDs. If they differ, update the store defaults to match the component.

- [ ] **Edit `src/components/agents/AgentChat.jsx`** — wire chat history to store. Find the `messages` `useState` and replace:

```js
// ADD import:
import { useAppStore } from '../../store/useAppStore';

// FIND (inside AgentChat component, after selectedAgent is determined):
const [messages, setMessages] = useState([]);

// REPLACE WITH:
const agentChats   = useAppStore(s => s.agentChats);
const setAgentChat = useAppStore(s => s.setAgentChat);
const messages     = agentChats[selectedAgent?.id] || [];
const setMessages  = (msgs) => {
  const next = typeof msgs === 'function' ? msgs(messages) : msgs;
  setAgentChat(selectedAgent?.id, next);
};
```

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built, zero errors
```

- [ ] **Commit:**

```bash
git add src/store/useAppStore.js src/components/verticals/FilmFinancingView.jsx src/components/agents/AgentChat.jsx package.json package-lock.json
git commit -m "feat(state): Zustand store for kanban + chat history persistence (ADR-003 Phase 1)

- useAppStore with persist middleware — all state survives navigation
- FilmFinancingView kanban reads/writes filmPipeline from store
- AgentChat history persisted per-agent via agentChats map
- Phase 2: swap persist adapter for Supabase with zero component changes"
```

---

# WEEK 3 — P3 Architecture + Performance

---

## Day 11–12 — React Router v6 Migration (ADR-001)

### Task 11.1 — Install React Router + BrowserRouter wrapper

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`

- [ ] **Install React Router:**

```bash
npm install react-router-dom
# Expected: added react-router-dom
```

- [ ] **Edit `src/main.jsx`** — wrap in BrowserRouter:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Rewrite `src/App.jsx`** to use Routes + lazy loading:

```jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './utils/useTheme';

// Route-level lazy loading — each route is its own JS chunk
const Dashboard        = lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const FilmFinancingView = lazy(() => import('./components/verticals/FilmFinancingView').then(m => ({ default: m.FilmFinancingView })));
const ProductionsView  = lazy(() => import('./components/verticals/ProductionsView').then(m => ({ default: m.ProductionsView })));
const MusicView        = lazy(() => import('./components/verticals/MusicView').then(m => ({ default: m.MusicView })));
const CalendarView     = lazy(() => import('./components/verticals/CalendarView').then(m => ({ default: m.CalendarView })));
const AgentChat        = lazy(() => import('./components/agents/AgentChat').then(m => ({ default: m.AgentChat })));
const Settings         = lazy(() => import('./components/settings/Settings').then(m => ({ default: m.Settings })));
const FloatingChatbot  = lazy(() => import('./components/chatbot/FloatingChatbot').then(m => ({ default: m.FloatingChatbot })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
  </div>
);

const ThemedToaster = () => {
  const theme = useTheme();
  const isLight = theme === 'light';
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: isLight
          ? { background: '#ffffff', color: '#18181b', border: '1px solid #d4d4d8' }
          : { background: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46' },
        success: { iconTheme: { primary: '#10b981', secondary: isLight ? '#ffffff' : '#18181b' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: isLight ? '#ffffff' : '#18181b' } },
      }}
    />
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.replace('/', '') || 'dashboard';
  const setActivePage = (page) => navigate(page === 'dashboard' ? '/' : `/${page}`);

  return (
    <>
      <Layout activePage={activePage} setActivePage={setActivePage}>
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"            element={<Dashboard setActivePage={setActivePage} />} />
              <Route path="/financing"   element={<FilmFinancingView />} />
              <Route path="/productions" element={<ProductionsView />} />
              <Route path="/music"       element={<MusicView setActivePage={setActivePage} />} />
              <Route path="/calendar"    element={<CalendarView />} />
              <Route path="/agents"      element={<AgentChat />} />
              <Route path="/settings"    element={<Settings />} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Suspense fallback={null}>
          <FloatingChatbot setActivePage={setActivePage} />
        </Suspense>
      </Layout>
      <ThemedToaster />
    </>
  );
}

export default App;
```

- [ ] **Update `src/components/agents/AgentChat.jsx`** — read preselected agent from URL query param:

```js
// ADD import:
import { useSearchParams } from 'react-router-dom';

// INSIDE component, replace preselectedAgentId prop with:
const [searchParams] = useSearchParams();
const preselectedAgentId = searchParams.get('agent');
```

- [ ] **Update `src/components/dashboard/Dashboard.jsx`** and `src/components/verticals/MusicView.jsx`** — change `onAgentClick` to navigate with query param:

```js
// In Dashboard/MusicView, find the onAgentClick handler or add:
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
const handleAgentClick = (agentId) => navigate(`/agents?agent=${agentId}`);
```

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built, route chunks appear as separate files in dist/assets/
```

- [ ] **Commit:**

```bash
git add src/main.jsx src/App.jsx src/components/agents/AgentChat.jsx src/components/dashboard/Dashboard.jsx src/components/verticals/MusicView.jsx
git commit -m "feat(routing): React Router v6 with lazy-loaded routes (ADR-001)

- BrowserRouter in main.jsx
- All 7 routes lazy-loaded — each is its own JS chunk
- Browser back/forward works; URLs are bookmarkable deep links
- preselectedAgent passed as ?agent= query param via useSearchParams
- setActivePage now calls navigate() internally"
```

---

## Day 13 — Dead Code Removal

### Task 13.1 — Delete 18 unreachable files + fix data inconsistencies

- [ ] **Verify nothing imports these before deleting:**

```bash
cd "D:\MulBros Media\MulBros Media OS v2"
grep -r "from.*['\"].*talent" src --include="*.jsx" --include="*.js"
grep -r "from.*['\"].*roadmap" src --include="*.jsx" --include="*.js"
grep -r "from.*['\"].*analytics" src --include="*.jsx" --include="*.js"
grep -r "KPICard\|EngagementChart\|ActivityFeed" src --include="*.jsx" --include="*.js"
# Expected: zero results (or only within the files being deleted)
```

- [ ] **Delete dead folders and files:**

```bash
git rm -r src/components/talent/
git rm -r src/components/roadmap/
git rm -r src/components/analytics/
git rm -r src/components/campaigns/
git rm -r src/components/community/
git rm -r src/components/content/
git rm src/components/dashboard/KPICard.jsx
git rm src/components/dashboard/EngagementChart.jsx
git rm src/components/dashboard/ActivityFeed.jsx
```

- [ ] **Standardize mock data** — find the canonical KPI numbers. Open `src/utils/mockData.js` (or equivalent) and set consistent values:

```js
// Hulu streams — pick ONE value and update all files that reference it:
// Search: grep -rn "89.200\|142.847\|89200\|142847" src --include="*.js" --include="*.jsx"
// Decision: use 127,430 as canonical value

// Luke revenue — pick ONE value:
// Search: grep -rn "142K\|65K\|142,000\|65,000" src --include="*.js" --include="*.jsx"
// Decision: use $89,200 as canonical value (update TalentManager)
```

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built, bundle smaller due to removed dead code
```

- [ ] **Commit:**

```bash
git commit -m "chore: delete 18 unreachable dead-code files (~2000 lines), fix mock data

- Removed: talent/, roadmap/, analytics/, campaigns/, community/, content/
- Removed: KPICard, EngagementChart, ActivityFeed (unreachable dashboard widgets)
- Standardised Hulu stream count and Luke revenue across all mockData references"
```

---

## Day 14 — Performance Fixes

### Task 14.1 — Dynamic jsPDF + AbortController + useMemo

**Files:**
- Modify: `src/components/verticals/FilmFinancingView.jsx`
- Modify: `src/components/chatbot/FloatingChatbot.jsx`

- [ ] **Edit `src/components/verticals/FilmFinancingView.jsx`** — remove the static jsPDF import at the top of the file:

```js
// DELETE this line:
import jsPDF from 'jspdf';
```

Find the PDF generation handler function (search for `new jsPDF()` or `handleGeneratePDF`) and add dynamic import inside:

```js
const handleGeneratePDF = async () => {
  // Dynamic import — 568KB chunk loads only when user clicks this button
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // ... rest of handler unchanged
};
```

- [ ] **Edit `src/components/chatbot/FloatingChatbot.jsx`** — add AbortController and useMemo. Add after the existing refs (around line 83):

```jsx
// ADD ref for abort controller:
const abortControllerRef = useRef(null);

// ADD memoized system prompt (computed once on mount, not on every send):
const systemPrompt = useMemo(() => buildSystemPrompt(), []);
```

In `sendMessage`, before the `callAIFast` call, add:

```js
// Cancel any in-flight request before starting a new one:
abortControllerRef.current?.abort();
abortControllerRef.current = new AbortController();

const response = await callAIFast(
  systemPrompt,                        // use memoized value
  newMessages.map(({ role, content }) => ({ role, content })),
  apiKey,
  abortControllerRef.current.signal   // 4th arg — passed to fetch()
);
```

Add a useEffect to abort when chat closes:

```js
useEffect(() => {
  if (!isOpen) abortControllerRef.current?.abort();
}, [isOpen]);
```

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built — no vendor-pdf chunk in initial bundle
```

- [ ] **Commit:**

```bash
git add src/components/verticals/FilmFinancingView.jsx src/components/chatbot/FloatingChatbot.jsx
git commit -m "perf: dynamic jsPDF import, chatbot AbortController, memoize system prompt

- jsPDF (568KB) now dynamically imported on first Generate click only
- FloatingChatbot aborts in-flight AI request when chat is closed
- buildSystemPrompt() memoized — called once on mount, not on every send"
```

---

## Day 15 — Data Persistence Fixes

### Task 15.1 — Calendar in chatbot context + agent chat history from store

**Files:**
- Modify: `src/utils/appData.js`

- [ ] **Edit `src/utils/appData.js`** — find `formatDataForAI()`. Currently ignores the `mulbros_calendar_v1` localStorage key. Add calendar reading at the top of the function:

```js
export const formatDataForAI = () => {
  // Read calendar from localStorage
  let calendarPosts = [];
  try {
    const raw = localStorage.getItem('mulbros_calendar_v1');
    if (raw) calendarPosts = JSON.parse(raw);
  } catch { /* ignore */ }

  // ... existing data building ...

  // ADD to the returned template string (find the appropriate section):
  const calendarSection = calendarPosts.length > 0
    ? `\nCONTENT CALENDAR (${calendarPosts.length} scheduled posts):\n` +
      calendarPosts.slice(0, 10)
        .map(p => `- ${p.date || 'unknown'}: [${p.vertical || 'general'}] ${(p.content || p.title || '').substring(0, 80)}`)
        .join('\n')
    : '\nCONTENT CALENDAR: No posts scheduled.';

  return `... existing string ...${calendarSection}`;
};
```

Note: Because the FloatingChatbot now memoizes `buildSystemPrompt()` on mount (Day 14), calendar data reflects the state at the time the chatbot is first opened. This is acceptable for now — a future improvement would pass the prompt as a function or add a refresh button.

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built, zero errors
```

- [ ] **Commit:**

```bash
git add src/utils/appData.js
git commit -m "fix(data): calendar posts now included in chatbot context from localStorage

- formatDataForAI() reads mulbros_calendar_v1 and includes up to 10 posts
- Chatbot can now answer questions about scheduled calendar content
- Agent chat history was wired in Day 10 (Zustand store)"
```

---

## Day 16 — Split FilmFinancingView (1401 lines)

### Task 16.1 — Extract tab components

**Files:**
- Create: `src/components/verticals/film/IncentiveAnalystTab.jsx`
- Create: `src/components/verticals/film/LeadGenTab.jsx`
- Create: `src/components/verticals/film/PipelineKanbanTab.jsx`
- Create: `src/components/verticals/film/BudgetTemplateTab.jsx`
- Modify: `src/components/verticals/FilmFinancingView.jsx` (slim to ~80 lines)

- [ ] **Open `src/components/verticals/FilmFinancingView.jsx`** — identify the 4 tab boundaries by looking for the tab switch/render logic. Each tab's JSX + local state (200–400 lines each) becomes its own file.

- [ ] **Create `src/components/verticals/film/IncentiveAnalystTab.jsx`** — move the Incentive Analyst tab JSX and AI call logic. Component manages its own state (no required props):

```jsx
import React, { useState } from 'react';
import { callAI, getApiKey } from '../../../utils/ai';
// ... extract and paste the full Incentive Analyst tab JSX here
```

- [ ] **Create `src/components/verticals/film/LeadGenTab.jsx`** — move Lead Gen tab. Fix the disconnected state bug as part of the extraction:

```jsx
import { useAppStore } from '../../../store/useAppStore';
// When user clicks "Add to Pipeline", call:
const setFilmPipeline = useAppStore(s => s.setFilmPipeline);
const filmPipeline    = useAppStore(s => s.filmPipeline);
// ... add lead to filmPipeline.discovery array
```

- [ ] **Create `src/components/verticals/film/PipelineKanbanTab.jsx`** — move Pipeline Kanban. Read from Zustand instead of mockData:

```jsx
import { useAppStore } from '../../../store/useAppStore';
const filmPipeline    = useAppStore(s => s.filmPipeline);
const setFilmPipeline = useAppStore(s => s.setFilmPipeline);
```

- [ ] **Create `src/components/verticals/film/BudgetTemplateTab.jsx`** — move Budget Template tab.

- [ ] **Slim `src/components/verticals/FilmFinancingView.jsx`** to a shell of ~80 lines:

```jsx
import React, { useState } from 'react';
import { IncentiveAnalystTab } from './film/IncentiveAnalystTab';
import { LeadGenTab }          from './film/LeadGenTab';
import { PipelineKanbanTab }   from './film/PipelineKanbanTab';
import { BudgetTemplateTab }   from './film/BudgetTemplateTab';

const TABS = ['Incentive Analyst', 'Lead Generation', 'Pipeline', 'Budget Templates'];

export const FilmFinancingView = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div role="tablist" className="flex border-b border-zinc-800 px-6 pt-4 gap-1">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === i
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel" className="flex-1 overflow-y-auto">
        {activeTab === 0 && <IncentiveAnalystTab />}
        {activeTab === 1 && <LeadGenTab />}
        {activeTab === 2 && <PipelineKanbanTab />}
        {activeTab === 3 && <BudgetTemplateTab />}
      </div>
    </div>
  );
};
```

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built, FilmFinancingView chunk significantly smaller
```

- [ ] **Commit:**

```bash
git add src/components/verticals/film/ src/components/verticals/FilmFinancingView.jsx
git commit -m "refactor(film): split 1401-line FilmFinancingView into 4 tab components

- IncentiveAnalystTab, LeadGenTab, PipelineKanbanTab, BudgetTemplateTab
- LeadGen now adds to Zustand store; PipelineKanban reads from store (bug fix)
- Tab bar gets role=tablist + role=tab + aria-selected (WCAG 4.1.2)
- FilmFinancingView shell reduced to ~80 lines"
```

---

## Day 17 — Mobile Responsiveness

### Task 17.1 — Collapsible sidebar + responsive grids

**Files:**
- Modify: `src/components/layout/Layout.jsx`
- Modify: `src/components/layout/TopBar.jsx`
- Modify: key grid components (Dashboard, FilmFinancingView, ProductionsView)

- [ ] **Read `src/components/layout/Layout.jsx`** first — understand its current structure, then replace with responsive version:

```jsx
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout = ({ children, activePage, setActivePage, setPreselectedAgent }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay — tap to close sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: always visible on lg+, slide-in on mobile */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar
          activePage={activePage}
          setActivePage={(page) => { setActivePage(page); setSidebarOpen(false); }}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TopBar
          activePage={activePage}
          setActivePage={setActivePage}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
```

- [ ] **Edit `src/components/layout/TopBar.jsx`** — add hamburger button visible only on mobile (hidden on `lg:`). Add at the start of the left section of the TopBar. First add `Menu` to the lucide-react import, then add:

```jsx
{/* Hamburger — mobile only */}
<button
  onClick={onMenuClick}
  aria-label="Open navigation menu"
  className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
>
  <Menu size={20} />
</button>
```

- [ ] **Fix responsive grids** — run this to find unresponsive grids:

```bash
grep -rn "grid-cols-[2-9]\|grid-cols-1[0-9]" src/components --include="*.jsx" | grep -v "sm:\|md:\|lg:\|xl:"
```

For each result, add breakpoint prefixes. Common patterns to fix:

```jsx
// KPI stat row (4 cards):
grid grid-cols-4 gap-4  →  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4

// Dashboard overview (3 cols):
grid grid-cols-3 gap-6  →  grid grid-cols-1 lg:grid-cols-3 gap-6

// Metrics (2 cols):
grid grid-cols-2 gap-4  →  grid grid-cols-1 sm:grid-cols-2 gap-4
```

- [ ] **Run build:**

```bash
npm run build
# Expected: ✓ built, zero errors
```

- [ ] **Commit:**

```bash
git add src/components/layout/Layout.jsx src/components/layout/TopBar.jsx src/components/dashboard/Dashboard.jsx src/components/verticals/
git commit -m "feat(responsive): collapsible sidebar, mobile hamburger, responsive grid breakpoints

- Sidebar hidden on < lg breakpoint, slide-in drawer with overlay
- Mobile hamburger button in TopBar (lg:hidden)
- All unresponsive grid-cols-N get sm:/lg: breakpoints
- App now usable on screen widths from 360px+"
```

---

# WEEK 4 — Testing, Docs, Final

---

## Day 18 — Documentation + Cleanup

### Task 18.1 — README + remove serve-static + document vite config

**Files:**
- Create: `README.md`
- Modify: `package.json` (remove serve-static)
- Modify: `vite.config.js` (add comment)

- [ ] **Remove `serve-static` (imported nowhere):**

```bash
npm uninstall serve-static
# Verify it's unused:
grep -r "serve-static\|serveStatic" src/ server.js
# Expected: zero results
```

- [ ] **Edit `vite.config.js`** — add comment above `chunkSizeWarningLimit`:

```js
// Raised to 600KB to accommodate jsPDF (568KB).
// After Day 14 dynamic import, vendor-pdf no longer appears at startup.
// Lower this back to 500 once confirmed.
chunkSizeWarningLimit: 600,
```

- [ ] **Create `README.md`:**

```markdown
# MulBros Media OS v2

Operational intelligence platform for MulBros Media — Film Financing, Productions & Distribution, Music & Composition.

## Tech Stack

- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + React Router v6
- **Backend:** Express 4 proxy (Node 20)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514 agents, claude-haiku chatbot)
- **State:** Zustand + localStorage persistence
- **Testing:** Vitest + @testing-library/react + Playwright

## Local Development

1. `npm install`
2. Create `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxx
   ```
3. `npm run dev` — Vite at http://localhost:5173 (proxies /api/ai to Express)

## Production (Render)

| Env Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Primary AI key (server-side only) |
| `ADMIN_USER` | HTTP Basic Auth username (optional) |
| `ADMIN_PASS` | HTTP Basic Auth password (optional) |
| `RENDER_APP_URL` | Used by CI health check after deploy |

Build command: `npm run build`  
Start command: `node server.js`  
Health check: `GET /health`

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm test` | Vitest unit tests |
| `npm run test:coverage` | Tests + coverage |
| `npm run e2e` | Playwright E2E |
```

- [ ] **Commit:**

```bash
git add README.md package.json package-lock.json vite.config.js
git commit -m "docs: README with setup/env/deploy guide, remove serve-static, document vite chunk limit"
```

---

## Day 19 — Playwright E2E + CI Test Step

### Task 19.1 — Install Playwright + write critical journey tests

**Files:**
- Create: `playwright.config.js`
- Create: `e2e/dashboard.spec.js`
- Create: `e2e/pipeline.spec.js`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`

- [ ] **Install Playwright:**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Create `playwright.config.js`:**

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:  './e2e',
  timeout:  30_000,
  retries:  1,
  use: {
    baseURL:    'http://localhost:4173',
    headless:   true,
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:            'npm run preview',
    url:                'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Add `data-testid` to stat cards** — in `src/components/dashboard/Dashboard.jsx`, find the StatCardAnimated or stat card outer div and add:

```jsx
data-testid="stat-card"
```

- [ ] **Create `e2e/dashboard.spec.js`:**

```js
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('loads and shows MULBROS brand', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=MULBROS')).toBeVisible();
  });

  test('KPI stat cards render', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="stat-card"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('Quick Actions bar is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Lead Discovery')).toBeVisible();
  });

  test('Sidebar navigation to Film Financing works', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Film Financing');
    await expect(page).toHaveURL('/financing');
  });
});
```

- [ ] **Create `e2e/pipeline.spec.js`:**

```js
import { test, expect } from '@playwright/test';

test.describe('Film Financing Pipeline', () => {
  test('navigates to /financing', async ({ page }) => {
    await page.goto('/financing');
    await expect(page).toHaveURL('/financing');
  });

  test('Pipeline tab shows kanban columns', async ({ page }) => {
    await page.goto('/financing');
    const pipelineTab = page.locator('[role="tab"]:has-text("Pipeline")');
    if (await pipelineTab.count() > 0) {
      await pipelineTab.click();
      await expect(
        page.locator('text=/Discovery|Contacted|Interested/i').first()
      ).toBeVisible();
    }
  });
});
```

- [ ] **Add `e2e` script to `package.json`:**

```json
"e2e": "playwright test"
```

- [ ] **Update `.github/workflows/ci.yml`** — add e2e job after build:

```yaml
  e2e:
    name: E2E Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Download dist
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: E2E tests
        run: npm run e2e
```

- [ ] **Commit:**

```bash
git add playwright.config.js e2e/ .github/workflows/ci.yml package.json package-lock.json src/components/dashboard/Dashboard.jsx
git commit -m "test(e2e): Playwright tests for dashboard + pipeline navigation, add CI e2e job"
```

---

## Day 20 — Final Build, Full Test Run, Sign-Off

### Task 20.1 — Full verification pass

- [ ] **Lint:**

```bash
npm run lint
# Expected: zero errors, warnings within --max-warnings 50 threshold
```

- [ ] **Security audit:**

```bash
npm audit --audit-level=high
# Expected: no HIGH or CRITICAL vulnerabilities
```

- [ ] **Unit tests with coverage:**

```bash
npm run test:coverage
# Expected: all PASS, lines ≥ 60%
```

- [ ] **Production build:**

```bash
npm run build
# Expected: ✓ built in ~15s
# Bundle breakdown should show:
#   - index.js         ~150KB (down from ~800KB monolithic)
#   - vendor-react     ~150KB
#   - per-route chunks  50-80KB each
#   - NO vendor-pdf at startup (dynamic import)
```

- [ ] **E2E:**

```bash
npm run e2e
# Expected: all 6 tests PASS
```

- [ ] **Final commit:**

```bash
git add -A
git commit -m "chore(release): 20-day full remediation complete

Day 1  (done): Helmet CSP, Basic Auth, model allowlist, Anthropic proxy, /health
Day 2:  ErrorBoundary, dead App state removed, timeAgo() fixed, sidebar count
Day 3:  WCAG focus ring, contrast fixes, aria-current, aria-labels, keyboard DnD
Day 4:  ESLint + CI hardened with lint, audit, health check
Day 5:  verticalColors.js, font-display DM Sans, Card component
Day 6:  Anthropic API (ADR-002), ai.js replaces claude.js
Day 7:  Save-on-blur, IntegrationToggles persist, isDirty Notifications
Day 8:  Vitest bootstrap + helpers.test.js (14 assertions)
Day 9:  ai.test.js (MODELS, key storage, callAI, testAIKey)
Day 10: Zustand store — kanban + chat history persistence (ADR-003 Ph1)
Day 11: React Router v6 + lazy routes (ADR-001)
Day 12: preselectedAgent as ?agent= query param
Day 13: 18 dead files deleted (~2000 lines), mock data standardised
Day 14: dynamic jsPDF, AbortController, useMemo system prompt
Day 15: calendar in chatbot context, agent chat history from store
Day 16: FilmFinancingView split into 4 tab components (1401→80 lines)
Day 17: collapsible sidebar, responsive grid breakpoints
Day 18: README, serve-static removed, vite config documented
Day 19: Playwright E2E (dashboard + pipeline), CI e2e job
Day 20: full lint + audit + test + build + e2e verification"
```

---

## Post-Plan: Supabase Integration (ADR-003 Phase 2)

After the 20 days, swap the Zustand `persist` adapter for Supabase:

1. `npm install @supabase/supabase-js`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` and on Render
3. Create tables: `app_state`, `agent_chats`, `film_pipeline`
4. Replace `persist(set, { name: 'mulbros-app-store-v1' })` with a custom Supabase storage adapter
5. **Zero component changes** — the store shape and all selectors are unchanged

---

## Audit Coverage Map

| Day | P-level | Audit Items Fixed |
|-----|---------|-------------------|
| ~~1~~ ✅ | P0 | C2, C3, R-001 partial, R-004, M11, M12 |
| 2 | P0 | C8, H3, M8, M18 |
| 3 | P0 | WCAG 1.4.3, 2.4.7, 2.1.1, 4.1.2, 2.5.3, H9, H10, M21 |
| 4 | P1 | L2, M13, M14 |
| 5 | P1 | M9, L4, L10 |
| 6 | P1/P2 | H2, H5, ADR-002 |
| 7 | P2 | H6, H7, H8, M16 |
| 8 | P2 | L3 (Vitest), H3 test |
| 9 | P2 | L3 (ai.js tests) |
| 10 | P2 | M17, M19, ADR-003 Ph1 |
| 11–12 | P3 | M7, ADR-001 |
| 13 | P3 | H1, H11, B4 |
| 14 | P3 | M3, M5, M6, M2, L5 |
| 15 | P3 | M15, M19 |
| 16 | P3 | H4, C6 |
| 17 | P3 | C7 |
| 18 | P3 | L1, docs |
| 19 | P3 | L3 (E2E), CI |
| 20 | — | Full verification pass |
