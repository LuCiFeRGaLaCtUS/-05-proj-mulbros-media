# AI Operator (MulBros Media OS) — Demo Capture Storyboard

**Flow:** new-user journey — login → onboarding → dashboard/chat → full feature tour.
**URL:** https://mulbros-marketing-os.onrender.com · **Account:** fresh non-admin user (authentic empty states + onboarding).
**Visual:** clean **light** theme, green accent, "MO" branding (NOT dark/noir). No voiceover — on-screen captions only.
**Output:** screenshot + GIF pack per scene → silent MP4 (Remotion) with captions + transitions.

> Per scene — **SHOW:** screen/action · **CAPTION:** on-screen text.

---

### 1. Login experience
**SHOW:** Auth screen (signed out). Hold 2s on the branded login.
**CAPTION:** AI Operator — the OS for your career

### 2. Onboarding — pick your role
**SHOW:** Post-login onboarding. Role/persona selection (actor / agent / producer / musician). Complete it.
**CAPTION:** Tell it who you are — it reshapes around you

### 3. First dashboard / chat home
**SHOW:** Landing chat home. "Hi [name]. How can MO help today?", the "MO is observing · Day 1 of 7" bar, quick-prompt chips, the four stat cards at honest 0, and the "Unlocks Day 2/3" progressive cards.
**CAPTION:** One chat. Your whole career, managed.

### 4. MO acts (the wow moment)
**SHOW:** Type *"Log an audition for the Netflix pilot tomorrow 10am, casting director Jane Doe."* → MO's **tool-call card** fires → confirmation. Then *"What auditions do I have?"* → lists the real row back.
**CAPTION:** 43 real actions — driven by plain language

### 5. Sidebar / verticals tour
**SHOW:** Slow pan of the sidebar — Chats, Projects, Artifacts, Integrations · TALENT (Auditions, Self-Tape, Agent Inbox, Income, Industry Intel, Contracts, Touring, Catalogue, EPK, Team) · AGENCY (Roster, Casting Feed).
**CAPTION:** Built for talent · agency · film · music

### 6. Talent surfaces
**SHOW:** Click through: Auditions (now showing the logged row), Income, Contracts, Self-Tape, Industry Intel, Agent Inbox. ~1.5s each.
**CAPTION:** Auditions · income · contracts · self-tape

### 7. Touring
**SHOW:** Touring view. (Optional live: *"Create tour 'Summer Run 2026', add a hold at The Echoplex Aug 15"*.)
**CAPTION:** Plan tours by talking to it

### 8. Catalogue + royalties
**SHOW:** Catalogue view (releases / tracks / splits), then a royalty statement parse.
**CAPTION:** Catalogue, splits & royalty auditing

### 9. EPK builder + public page
**SHOW:** EPK view. Then open the public `/epk/:slug` page in a new tab — show click-to-reveal contact.
**CAPTION:** Build & publish a shareable press kit

### 10. Team chat
**SHOW:** Team view — real-time message.
**CAPTION:** Your team, in the loop in real time

### 11. Agency surfaces
**SHOW:** Roster, Casting Feed.
**CAPTION:** Roster & opportunity tracking

### 12. Integrations
**SHOW:** IntegrationsView — connectable services (Spotify live; Gmail/Calendar coming via Composio).
**CAPTION:** Connects to the tools you already use

### 13. Settings
**SHOW:** Settings (hide any keys). Integration toggles.
**CAPTION:** Yours to configure

### 14. Close
**SHOW:** Back to chat home. Slow pull-back. End card: logo + URL.
**CAPTION:** AI Operator · mulbros-marketing-os.onrender.com

---

## Verified route map (confirmed live 2026-06-09)

| Surface | Route / action | Notes |
|---|---|---|
| Login | `/` signed out | split hero + Sign in/Sign up |
| Onboarding | `/onboarding` | 4 steps: role (Creator/Talent/Agency/Both) → vertical (Actor/etc) → experience+market → representation+union → Complete |
| Dashboard / chat | `/` | observation bar "Day 1 of 7", quick-prompts, 4 stat cards, Audition funnel/Attention (unlock Day 2/3) |
| MO chat thread | send in chat bar → `/chat/:id` | MO asks clarifying Qs, then fires tool-call card (green ✅ + `audition.create` + JSON args) |
| Auditions | `/talent/auditions` | kanban SUBMITTED→CALLBACK→BOOKED→PASS→NO RESPONSE; "New Audition", "Ask Audition Tracker", "SMS Reminders" |
| Income & Tax | `/talent/income` | categorize, deductibles, quarterly tax, Plaid connect, "not legal advice" |
| Contract Reader | `/talent/contracts` | paste → summary + red flags + SAG-AFTRA scale compare |
| Self-Tape Coach | `/talent/self-tape` | Mux upload → AI framing/lighting/audio feedback |
| EPK | `/epk-builder` | "Build my EPK with MO" → public shareable profile |
| Roster | `/agency/roster` | Total/Active/Inactive/Dropped, "Sign Talent", "Ask Roster Manager" |
| Integrations | `/integrations` | 36 integrations / 16 skills; Backstage, Actors Access, Stripe Connect, etc. |
| Settings | `/settings` | Profile/General/API Keys/Integrations/Team/Notifications/Access tabs |
| Team | `/team` | realtime channels (Supabase Realtime) |
| Industry Intel / Agent Inbox / Casting Feed | chat-agents | routed through MO, no standalone page |

**Click tips:** chat input + send button — use the field/icon center (label "Send message"); MO over-asks before committing a tool-call, so confirm with "that's all, log it now" to force the write. Touring/Catalogue only appear for music verticals (not the Actor persona).

## Final-assembly options (pick one)
- **A — one clean screen-record (recommended for "professional"):** open each route above in order, do the audition tool-call live, record with ScreenStudio/Loom. ~10 min, real cursor motion. Routes are pre-verified so no fumbling.
- **B — I record per-feature GIFs:** I re-drive and export a short GIF per surface (each downloads to Downloads); you drop them into CapCut/DaVinci with title cards. I can start now.
- **C — I render a silent MP4 with captions:** install `ffmpeg` (`winget install Gyan.FFmpeg`) → I stitch the GIFs + title cards into one MP4 (node is available). Needs B first.

## Capture checklist
- [ ] Fresh non-admin account, just-onboarded.
- [ ] Brave Shields DOWN for the app domain (prevents broken assets).
- [ ] Do NOT capture credential entry (privacy).
- [ ] Live writes limited to internal records (audition/tour/release/EPK). No emails/SMS.
- [ ] Save each scene screenshot to disk; record GIFs for scenes 4, 7, 9.
- [ ] Assemble silent MP4 (Remotion) from saved frames + captions.
