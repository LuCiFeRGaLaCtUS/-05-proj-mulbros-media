# Sales OS — specifics

OS-specific rules. Loaded by Claude Code on top of [/CLAUDE.md](../../../CLAUDE.md), [/platform/CLAUDE.md](../../CLAUDE.md), and [/platform/oses/CLAUDE.md](../CLAUDE.md). Read those first — this file is an addendum, not a replacement.

Follow the per-OS 5-section template (orchestrator responsibility → roster → contracts → anti-patterns → pointers).

## 1. Orchestrator responsibility

Routes prospecting / scoring / outreach / inbound briefs across the Sales OS specialists, owns lead memory via Mem0, escalates to humans via `request_approval`. Cross-cutting only — channel-level decisions delegate to [channel_picker.py](channel_picker.py), not the orchestrator.

Code: [orchestrator.py](orchestrator.py).

## 2. Subagent roster

| Subagent | Status | Responsibility |
|---|---|---|
| [`lead_sourcer`](agents/lead_sourcer/) | shipped | Sourcing prospects via Apollo, LinkedIn Sales Nav |
| [`lead_enricher`](agents/lead_enricher/) | shipped (planned: enrichment waterfall) | Enrich leads with firmographic + technographic data |
| [`lead_scorer`](agents/lead_scorer/) | shipped | ICP fit + intent scoring → status: `scored` |
| [`bdr_outbound`](agents/bdr_outbound/) | shipped (planned: WhatsApp, ElevenLabs, Smartlead extensions) | Outbound outreach across email / SMS / voice / (WhatsApp) — channel chosen deterministically by [channel_picker.py](channel_picker.py) |
| [`sdr_inbound`](agents/sdr_inbound/) | shipped | Reply qualification → status updates |
| `meeting_booker` | planned (Wave A) | Demo scheduler — Google Calendar via Composio, later Cal.com round-robin |
| `intent_detector` | planned (Wave C) | PostHog/Segment events, RB2B de-anon, 6sense/Bombora intent |
| `call_processor` | planned (Wave B) | Post-call: LiveKit/Twilio recording → Deepgram transcript → mem0 → next-best-action |
| `website_concierge` | planned (Wave D) | Inbound chat (CopilotKit on Next.js), qualification, Stripe checkout handoff |

The diagram's "Email SDR / SMS-WhatsApp SDR / Voice SDR" pictograms are **channel personas of `bdr_outbound`**, not three separate agents. Don't split them.

## 3. OS-specific contracts

These are non-negotiable. Code review rejects PRs that violate them.

### 3.1 Channel selection is deterministic

Channel choice for outbound goes through [channel_picker.py](channel_picker.py). Do NOT hard-code a channel inside an agent prompt or tool. Add new channels by registering them in `channel_picker.py` and exposing a corresponding tool in [outbound_tools.py](outbound_tools.py).

### 3.2 Suppression check before every send

Once Wave A lands, every outbound send (email, SMS, WhatsApp, voice) goes through the suppression check inside [outbound_tools.py](outbound_tools.py) **before** the SaaS call. No bypass paths.

### 3.3 AI disclosure on every outbound message

Every email/SMS template includes the per-tenant `ai_disclosure_line` from tenant config. The disclosure is injected by the relevant skill (`cold-email-first-touch`, `sms-outreach`, etc.), not by the tool. Skills updated in Wave A.

### 3.4 Lead state transitions go through `internal_tools`

Lead status (`new` → `enriched` → `scored` → `contacted` / `disqualified` / `meeting_booked`) is updated **only** via [internal_tools.update_lead](internal_tools.py). Direct SQL writes from a route or a script are rejected.

### 3.5 Sandbox redirect is preserved

Sandbox-redirected sends preserve `original_to` in audit. Policy checks operate on `original_to`, not the redirected address — sandbox cannot be a way to bypass governance.

## 4. Sales-OS-specific anti-patterns

- ❌ Bypassing `bdr_outbound` to send from a route, a script, or another subagent. Outbound is `bdr_outbound`'s exclusive responsibility.
- ❌ Adding a 6th channel (today: email/SMS/voice; planned: WhatsApp) without registering it in [channel_picker.py](channel_picker.py).
- ❌ Calling Apollo, LinkedIn, or HubSpot from outside `lead_sourcer` / `lead_enricher`. They are these subagents' connectors.
- ❌ Writing branching outreach logic ("if cold lead, use template A; if warm, B") into [outbound_tools.py](outbound_tools.py). That's judgment — put it in a skill with `applies_to: [bdr_outbound]`.
- ❌ Bypassing [channel_picker.py](channel_picker.py) by passing an explicit `channel="email"` from the orchestrator. Channel choice is data-driven.
- ❌ Editing a shipped agent's `prompts/v1.md`. Bump to `v2.md` and update `PROMPT_VERSION`.
- ❌ Direct `mem0ai` imports anywhere in Sales OS. Use [shared/memory/mem0.py](../../shared/memory/mem0.py).
- ❌ Persisting outreach copy in templates inside code. Templates are skills.

## 5. Pointers

- **Subagent code**: [agents/](agents/)
- **Orchestrator**: [orchestrator.py](orchestrator.py)
- **Channel picker (the contract)**: [channel_picker.py](channel_picker.py)
- **Internal tools** (DB writes, mem0): [internal_tools.py](internal_tools.py)
- **Outbound tools** (Gmail, SMS, voice): [outbound_tools.py](outbound_tools.py)
- **Inbound webhooks**: [inbound.py](inbound.py)
- **Migrations**: [migrations/](migrations/)
- **Sales-applicable skills** (`applies_to` includes a Sales OS subagent): see [/platform/skills/](../../skills/) — every skill's frontmatter declares its subagents
- **Connectors used by Sales OS**: [tools/composio.py](../../tools/composio.py) (Gmail, Apollo, LinkedIn, Slack, Calendar, HubSpot), [tools/twilio.py](../../tools/twilio.py) (SMS), [tools/livekit.py](../../tools/livekit.py) (voice)
- **Live status**: [/platform/STATUS.md](../../STATUS.md)

## When you're about to write something new

Run through this micro-checklist:

1. Which existing subagent owns this? (Check the roster above.)
2. If none → propose a new subagent with a name + 1-line responsibility before writing code.
3. Is it judgment or action? Skill or tool?
4. If a SaaS is involved — Composio first, direct adapter only if no Composio toolkit covers it.
5. Wrap the new tool with `@governed`, register in [config/policies.yaml](../../config/policies.yaml).
6. Update this file's roster table when adding/promoting a subagent.
