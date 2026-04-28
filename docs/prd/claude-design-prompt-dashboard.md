# Prompt for Claude — Interactive Dashboard for AI Chief Platform

> Paste this entire block into Claude (claude.ai canvas / Claude Code / claude.design) to generate a fully interactive HTML/React dashboard mockup. Includes context, design system, screen specs, sample data, and acceptance criteria.

---

## ROLE

You are a senior product designer + frontend engineer building a high-fidelity, **fully interactive** dashboard mockup for a multi-tenant AI agent platform called **AI Chief**. Output a single self-contained React + Tailwind file (or HTML+inline JS if React unavailable) that runs in a browser preview without external dependencies beyond a CDN. All buttons, toggles, sidebars, tabs, and modals must work. No backend — use in-memory mock data.

## PRODUCT CONTEXT

**AI Chief** is a multi-tenant agent OS hosting domain-specific workspaces ("OS tenants"). MVP ships with 2 tenants:

1. **PARTNER AI** (Media tenant) — personalized AI business companion for 9 creative personas: Musician, Composer, Actor, Visual Artist, Writer, Screenwriter, Film Crew, Arts Org, **Filmmaker** (deep 5-phase lifecycle: Development → Pre-Production → Production → Post-Production → Distribution).
2. **Sales OS** — autonomous SDR platform: Lead Gen → Outbound (Email/SMS/Voice SDR) → Inbound (Concierge + Demo Scheduler) → CRM Writer.

**Positioning:**
- Snehaal (platform): *"Every SMB owner needs two people they can't afford: a world-class COO to run it, and a world-class CMO to grow it. AI Chief is both, in one operator."*
- Sean (PARTNER AI): *"PARTNER AI — A personalized AI team that takes care of your business, so you can take care of your art. PARTNER doesn't make art, it gives artists the freedom they need to make art."*

**Stack hint** (for visual references): CopilotKit chat UI · Claude Agent SDK orchestrator · Composio tool actions · Mem0 memory · Langfuse observability · Multi-tenant RLS isolation. Stack details inform UX, not implementation.

## DESIGN SYSTEM

### Visual direction
**Hollywood-noir-meets-cyberpunk-operator-console.** Editorial typography meets HUD-precision data. Warm obsidian dark surfaces with amber accents and cyan data points. NOT another "purple gradient SaaS dashboard" — must look like a $50/month tool an indie filmmaker AND an SMB sales lead would both feel at home in.

### Palette
```
--bg-0:        #060508   (deep warm obsidian)
--bg-1:        #09080c   (panel)
--bg-card:     #0d0b11   (card)
--accent-amber:#f59e0b   (primary action / brand)
--accent-cyan: #22d3ee   (data / live state)
--text-hi:     rgba(240,240,242,0.87)
--text-mid:    rgba(240,240,242,0.55)
--text-low:    rgba(240,240,242,0.35)
--border:      rgba(245,158,11,0.12)
--success:     #10b981
--warn:        #f59e0b
--danger:      #ef4444
```

### Typography
- **Display (headlines, hero):** Cormorant Garamond — light + italic + semibold
- **Mono (data, numbers, labels, agent traces):** DM Mono — 300/400/500
- **UI (body, nav):** Inter — 400–700

Load via Google Fonts CDN.

### Atmosphere
- Subtle film grain overlay (`body::before` SVG feTurbulence noise, 3% opacity, animated 0.5s steps(1))
- Cinematic vignette (`body::after` radial gradient)
- Custom cursor: 44×44 SVG camera viewfinder (4 L-bracket corners + amber center dot)
- Pointer cursor: SVG film frame with sprocket holes on `button, a, [role="button"]`

### Components

- **Tile-pop hover:**
  ```css
  transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  &:hover { transform: translateY(-5px) scale(1.016);
            box-shadow: 0 28px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(245,158,11,.10), 0 0 40px rgba(245,158,11,.05); }
  ```
- **Stat card:** mono labels uppercased letter-spaced 0.18em, numbers in DM Mono with `font-feature-settings: "tnum"` (tabular-nums), -0.03em letter-spacing
- **Chat composer:** rounded-2xl, glass blur background, amber send button, search-mode chip (Off / Reddit / Web)
- **Agent trace pill:** monospace, cyan border, amber dot pulse on active
- **HUD panel entrance:** `@keyframes hud-in` — opacity + translateY(-8px) + scale(0.975) + blur(4px) → 0 over 0.28s

## SCREENS TO BUILD (all interactive, all navigable)

### 1. Landing / Tenant Picker (after login simulated)
- Hero with platform brand "AI Chief"
- Two large cards:
  - **PARTNER AI** (Media) — Sean's tagline, Cormorant Garamond hero, 9-persona icon grid preview
  - **Sales OS** — Snehaal's COO+CMO tagline, lead-funnel preview
- Click either → enters that tenant's workspace

### 2. PARTNER AI — Onboarding (4 questions per Sean's email)
4-step wizard:
1. **About you** — name, location, bio
2. **Your work** — persona picker (9 personas as tile grid)
3. **Your goals** — open text + "Refine with PARTNER" button (mock AI response refines goals into 3 concrete objectives)
4. **Tools you use** — multi-select chips for: Spotify, DistroKid, Final Draft, Movie Magic, Wrapbook, Notion, Cal.com, Stripe, Adobe Suite, Pro Tools, Logic Pro, etc. + free-text

Final screen: PARTNER seeds 5 starter tasks visible in pipeline.

### 3. PARTNER AI — Dashboard (Filmmaker persona example)
- Sidebar (left, 240px): Tenant switcher · Filmmaker phases (5) · Calendar · Back-office · Vendors · Agents · Settings
- TopBar: persona chip · breadcrumbs · global search · notification bell · user avatar
- Hero: Cormorant Garamond "Welcome back, [Name]." + amber→cyan gradient on first name
- Weather/HUD tile: shooting-day countdown for next call sheet
- 4 KPI stat cards (DM Mono numbers): Active Projects · Days to Wrap · Pipeline Value · Vendors Confirmed
- Active project card with 5-phase progress bar
- "Today's PARTNER suggestions" — 3 agent-suggested actions with HITL approval gates
- Bottom-center: floating CopilotKit-style chat with PARTNER

### 4. PARTNER AI — Filmmaker 5-Phase Workspace
URL pattern: `/media/filmmaker/{phase}` — switching phases is instant tab swap, NOT page reload.

**Development tab:**
- Card: "Generate market analytics for this project" → button opens agent prompt modal
- Card: "Suggest cast based on script + historical sales" → button opens agent prompt modal
- Empty state: cinematic placeholder asking for script upload

**Pre-Production tab:**
- Script ingest dropzone — accepts `.fdx`, `.fountain`, `.pdf`
- After mock upload: extracted character + location lists in two columns
- Budget compare table — 5 jurisdictions × net cost (Georgia / Louisiana / NM / Vancouver / Budapest)
- Action: "Generate breakdown" with HITL approval modal

**Production tab:**
- Asset tracker (kanban: Props / Wardrobe / SFX / Camera)
- Daily cost tracker (DM Mono table with departments × budget × actual × variance)
- Call-sheet generator — date picker + "Generate PDF" button (simulate download)
- Wrapbook timecard pull (mock data: 12 crew × hours × rates)

**Post-Production tab:**
- Empty cards: "VFX vendor invoice submission — coming soon", "Editorial change tracking — coming soon"
- Subscribe-for-update toggles

**Distribution tab:**
- Empty cards: "Audience analytics", "Waterfall payouts", "Residuals tracking"

### 5. PARTNER AI — Universal Chat (PARTNER agent)
- ChatGPT-style sessions sidebar (240px) with create / rename / delete
- Conversation pane with messages, agent name "PARTNER" (amber chip + ONLINE pulse)
- AIPromptBox composer: rounded-2xl, search-mode chip (Off/Reddit/Web), attach button, send button
- Right rail (collapsible): Agent Plan tree showing PARTNER's reasoning steps
- Inject 3 sample conversations: (a) "Find me film tax incentives for 2026", (b) "Draft a query letter for my agent", (c) "Summarize my Wrapbook payroll this week"

### 6. Sales OS — Dashboard
- Sidebar: Tenant switcher · Lead Gen · Outbound · Inbound · CRM · Pipeline · Agents · Settings
- 4 KPI cards: New Leads (today) · Demos Booked · Reply Rate · MRR Pipeline
- Lead funnel visual: Sources → Lead Gen pod → Outbound pod → Inbound pod → Conversion
- Recent activity feed (Langfuse-style trace pills): "Prospector enriched lead [Acme Corp] · 2 min ago" · "Email SDR drafted reply for [john@example.com] · 5 min ago" · "Demo Scheduler booked Tue 3pm with [Sarah Lin]"
- HITL approval queue: 3 pending email drafts awaiting user approval

### 7. Sales OS — Lead Detail
- Lead profile (left): name, company, title, intent score (0–100), enrichment data
- Activity timeline (right): every agent action + tool call + Langfuse trace
- Actions: Approve email · Schedule demo · Pause cadence · Escalate to human

### 8. AI Chief Admin — Cross-tenant View
- Top stats: Active tenants · Agent runs (24h) · Token spend (24h) · Error rate
- Tenant cards (one per OS tenant): health pill · MAU · cost · last activity
- Drill-in to per-tenant Langfuse trace explorer
- Audit log table: impersonations · paused agents · policy changes
- "Operator pitches" section (cross-OS upsell opportunities)

## INTERACTION REQUIREMENTS

- All routes must be navigable via sidebar — use React Router OR a single-page state machine
- All buttons must do something (open modal · toggle state · simulate API · show toast)
- Tenant switcher in sidebar swaps the entire workspace between PARTNER AI and Sales OS instantly
- Onboarding wizard advances through 4 steps, persists answers in component state, shows final state with seeded tasks
- Chat composer accepts input, on submit appends user message + simulated agent reply (use a 1-second delay + typing indicator)
- HITL approval modals show diff/preview, Approve / Reject / Edit buttons
- Filmmaker phase tabs swap content instantly, never reload
- Notification bell shows 3 mock notifications with read/unread state
- Settings page has functional toggles (sandbox mode · email notifications · API key visibility · theme)

## SAMPLE DATA TO SEED

### PARTNER AI Filmmaker user "Arghya Chowdhury"
- Active project: "Last County" (feature, $2.4M budget, Pre-Production phase)
- Script: 110 pages, 24 characters, 18 locations parsed from a Final Draft .fdx
- 4 vendors confirmed (DP, Sound, Wardrobe, SFX)
- Wrapbook crew: 12 (Director $5k/wk, DP $4k/wk, etc.)
- Today's tasks: 3 from PARTNER's seed

### Sales OS user "Sarah at Acme Corp"
- 47 leads in pipeline (12 new today)
- 3 demos booked this week
- Email reply rate: 18%
- Pending HITL: 3 email drafts (Email SDR), 1 calendar booking (Demo Scheduler)

### AI Chief admin
- 2 tenants: acme-test (fintech, sandbox) + mulbros-media (Filmmaker, sandbox-OFF)
- 1,247 agent runs in last 24h
- $14.20 token spend
- 1.2% error rate
- 5 unread operator pitches (cross-OS upsell candidates)

## ACCEPTANCE CRITERIA

- [ ] All 8 screens navigable from a single page load via sidebar/buttons
- [ ] Tenant switcher swaps between PARTNER AI and Sales OS without losing state
- [ ] Onboarding 4-step wizard works end-to-end with state persistence
- [ ] Filmmaker 5-phase tabs all render distinct content
- [ ] Chat composer simulates agent replies with typing indicator
- [ ] HITL approval modal shows preview + 3 actions
- [ ] Sample data feels lived-in (real names, real budgets, real lead companies)
- [ ] Visual style matches Hollywood-noir + cyberpunk-operator description, not generic SaaS
- [ ] Cormorant Garamond + DM Mono + Inter all visible in correct contexts
- [ ] Tile-pop hover animation on every card
- [ ] Custom cursor active across the page
- [ ] Film grain + vignette atmosphere visible
- [ ] Mobile-responsive: sidebar collapses to bottom nav under 768px
- [ ] Dark theme only — do NOT add a light theme
- [ ] Code is a single self-contained file with React via CDN OR vanilla HTML+JS — no build step needed

## OUTPUT FORMAT

Single artifact: an HTML file with embedded React (via esm.sh CDN), Tailwind CDN, and inline `<script type="module">` block. No external repos. No `npm install`. Save as `ai-chief-dashboard.html`. Open in browser, everything works.

## TONE OF COPY

- PARTNER AI surfaces: warm, encouraging, artist-respectful. Sean's verbatim positioning quotes verbatim.
- Sales OS surfaces: precise, operator-mode, COO+CMO authority. Snehaal's tagline verbatim.
- AI Chief admin: terse, mono-typography-heavy, HUD aesthetic.

## CRITICAL — DO NOT

- Use purple gradients
- Use generic stock SaaS dashboard layout (sidebar + cards + chart, all uniform spacing)
- Use Material UI / Bootstrap / shadcn defaults without restyling
- Add a light-mode toggle
- Use rounded buttons larger than 12px radius
- Add emoji except in user-content sample data
- Use placeholder images — use SVG icons (Lucide via CDN) or empty states with mono-typography
- Skip the cinematic atmosphere (grain + vignette + cursor are mandatory)
- Make any button non-functional

## START

Generate the full file now. No commentary before or after. One artifact, ready to preview.
