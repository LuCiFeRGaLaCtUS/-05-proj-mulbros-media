# Claude Cowork prompt — AI Operator dashboard punch list

> Paste this into a fresh Claude Cowork session AFTER you've signed up + logged into the dashboards listed in the prerequisites.
>
> Cowork has browser automation but no memory of our prior sessions. This prompt is self-contained.

---

## PROMPT FOR COWORK (copy everything below into Cowork)

```
You are operating as a hands-on assistant for Arghya Chowdhury (Arghya@fsztpartners.com), the operator of the AI Operator app deployed at https://mulbros-marketing-os.onrender.com.

Project: MulBros Media OS v2 — a chat-first AI operating system for talent/agency/music verticals. Stack: React + Vite + Express + Supabase + Stytch + OpenAI + Anthropic + Langfuse + Mux + Stripe + Plaid + Resend.

Your job today: complete a 7-priority dashboard configuration sweep across Sentry, Render, Supabase, Mux, DocuSign, GitHub, BetterUptime, and Resend. The app's code is already shipped — only dashboard settings remain. The full punch list is in the repo at `docs/DASHBOARD_PUNCHLIST.md` for reference; the most current version of these instructions follow.

GROUND RULES
1. Do tasks in numbered order. Do NOT skip ahead.
2. Confirm each step by reading the UI back to me before clicking destructive buttons (Save, Delete, Submit).
3. If you hit an OTP, email-verification, captcha, or 2FA challenge, PAUSE and ask me to complete it manually before continuing.
4. Never paste raw secrets into chat. When you copy a DSN / token / signing secret, mask the middle (e.g. "https://abc...***...@o123.ingest.us.sentry.io/456") in your status updates.
5. After every task that changes a deployed setting, verify with the verification step provided.
6. If anything blocks, document the exact error + which step you stopped at, and tell me before retrying.

PREREQUISITES — confirm before starting
Verify these tabs are open and I am logged in:
- https://sentry.io (a paid or free account; I'll have already signed up)
- https://dashboard.render.com (logged into AI Operator service)
- https://supabase.com/dashboard/project/ymkikosszdherismfckl
- https://dashboard.mux.com
- DocuSign admin (if I use DocuSign in this app)
- https://github.com/LuCiFeRGaLaCtUS/-05-proj-mulbros-media (logged in as repo admin)
- https://betterstack.com/better-uptime (if I'm using BetterUptime)
- https://resend.com/dashboard

If any of these are not logged in, ask me to log in before continuing.

────────────────────────────────────────────────────────────
TASK 1 — Sentry: create 2 projects + capture DSNs
────────────────────────────────────────────────────────────
1. Go to https://sentry.io → ensure you're in my org workspace
2. Click "Projects" sidebar → "Create Project"
3. Project A:
   - Platform: Node.js
   - Set alert frequency: "On every new issue"
   - Project name: ai-operator-server
   - Team: my default team
   - Create
   - On the success page, copy the DSN (format: https://...@o....ingest.us.sentry.io/...)
   - Save it as VAR_SENTRY_DSN_SERVER (do not print full value to me; only show first 12 chars then "***" then last 8)
4. Project B:
   - Platform: React
   - Project name: ai-operator-client
   - Create
   - Copy DSN as VAR_SENTRY_DSN_CLIENT (same masking)
5. Verify: Sentry sidebar shows both projects in the list

REPORT BACK: "Sentry projects created. Two DSNs captured (masked)."

────────────────────────────────────────────────────────────
TASK 2 — Sentry: create CI auth token
────────────────────────────────────────────────────────────
1. Sentry → top-right user menu → User Auth Tokens
   (or Settings → Account → User Auth Tokens; OR
    Settings → Organization Settings → Auth Tokens — pick whichever org-level option you find)
2. Click "Create New Token" or "Create New Authentication Token"
3. Scopes to enable:
   - project:read
   - project:releases
   - org:read
4. Description: "AI Operator CI source-map upload"
5. Create
6. Copy token (format: sntrys_...) — save as VAR_SENTRY_AUTH_TOKEN (masked)
7. Also note from URL: my Sentry org slug (the slug in sentry.io/organizations/<slug>/) → save as VAR_SENTRY_ORG

REPORT BACK: "Sentry auth token created. Org slug captured."

────────────────────────────────────────────────────────────
TASK 3 — Render: set Sentry env vars + NODE_ENV + Health Check Path
────────────────────────────────────────────────────────────
1. Render dashboard → AI Operator service (named something like "mulbros-marketing-os")
2. Left sidebar → "Environment" tab
3. Click "Add Environment Variable" for each (use the "Secret" toggle where noted):
   - Name: SENTRY_DSN | Value: <VAR_SENTRY_DSN_SERVER> | Secret: YES
   - Name: VITE_SENTRY_DSN | Value: <VAR_SENTRY_DSN_CLIENT> | Secret: NO (must ship to client bundle)
4. Check if NODE_ENV already exists:
   - If absent OR not equal to "production" → add/edit:
     Name: NODE_ENV | Value: production | Secret: NO
   - If already "production" → skip
5. Click "Save Changes" → Render will auto-restart (takes 1-2 min)
6. While that happens, go to Render → "Settings" tab
7. Scroll to "Health & Alerts" → "Health Check Path" field
8. Set value to: /healthz
9. Save
10. Wait for the service to be live again (top right shows "Live")

VERIFICATION:
- Run in this exact form, paste output back to me:
  Open new tab → https://mulbros-marketing-os.onrender.com/healthz
  The JSON response should contain: "probes":{"supabase":"ok","langfuse":"configured","sentry":"configured"}
- If sentry shows "disabled" → SENTRY_DSN env var didn't save correctly; redo step 3.

REPORT BACK: "Render env vars set. /healthz shows probes.sentry=configured."

────────────────────────────────────────────────────────────
TASK 4 — Mux: copy webhook signing secret
────────────────────────────────────────────────────────────
1. https://dashboard.mux.com → Settings → Webhooks
2. Find the webhook with URL "https://mulbros-marketing-os.onrender.com/api/webhooks/mux"
3. If it does NOT exist, ask me before creating one
4. If it exists, click it → "Signing Secret" → reveal → copy
5. Save as VAR_MUX_WEBHOOK_SECRET (masked)

REPORT BACK: "Mux signing secret captured."

────────────────────────────────────────────────────────────
TASK 5 — DocuSign: copy HMAC key
────────────────────────────────────────────────────────────
1. DocuSign admin console → Integrations → Connect
2. Find the Connect listener pointing at our app's webhook
   (likely "https://mulbros-marketing-os.onrender.com/api/webhooks/docusign")
3. If it does not exist, ask me before creating
4. Open it → "HMAC Settings" section → reveal/copy HMAC key
5. Save as VAR_DOCUSIGN_HMAC_KEY (masked)

REPORT BACK: "DocuSign HMAC key captured (or marked N/A if no DocuSign use)."

────────────────────────────────────────────────────────────
TASK 6 — Render: add webhook secrets
────────────────────────────────────────────────────────────
1. Back to Render → AI Operator service → Environment
2. Add (Secret = YES on both):
   - Name: MUX_WEBHOOK_SECRET | Value: <VAR_MUX_WEBHOOK_SECRET>
   - Name: DOCUSIGN_HMAC_KEY | Value: <VAR_DOCUSIGN_HMAC_KEY>  (skip if Task 5 was N/A)
3. Save → Render restarts
4. Wait for "Live"

VERIFICATION:
- Render → Logs tab → look at the latest startup lines (top)
- Confirm you NO LONGER see "[startup] MUX_WEBHOOK_SECRET not set" warning
- Confirm you NO LONGER see "[startup] DOCUSIGN_HMAC_KEY not set" warning (if you set it)

REPORT BACK: "Webhook secrets set. Startup warnings cleared."

────────────────────────────────────────────────────────────
TASK 7 — Supabase: deploy cost-alert Edge Function
────────────────────────────────────────────────────────────
This needs a terminal. If you have terminal access:
1. Open a terminal in the project directory: "D:/MulBros Media/MulBros Media OS v2"
2. Run: supabase login
   - If a browser opens for OAuth, complete it
3. Run: supabase link --project-ref ymkikosszdherismfckl
   - May prompt for DB password — ask me if it does
4. Run: supabase functions deploy cost-alert
   - Should output: "Deployed Function cost-alert at https://ymkikosszdherismfckl.functions.supabase.co/cost-alert"

If you don't have terminal access:
- STOP this task and tell me to run those 3 commands manually
- Resume after I confirm

REPORT BACK: "cost-alert function deployed."

────────────────────────────────────────────────────────────
TASK 8 — Supabase: set cost-alert function secrets
────────────────────────────────────────────────────────────
1. https://supabase.com/dashboard/project/ymkikosszdherismfckl
2. Left sidebar → Edge Functions → cost-alert
3. Tab: "Secrets" (or "Manage Secrets")
4. Add 4 secrets:
   - RESEND_API_KEY = (ask me — I'll paste the value)
   - COST_ALERT_TO = Arghya@fsztpartners.com
   - COST_ALERT_FROM = AI Operator <onboarding@resend.dev>
   - COST_ALERT_USD_THRESHOLD = 20
5. Save
6. Click the function name → "Invoke" button → empty body → Run
7. Expect JSON response with `"total_usd": <number>, "breached": false`

VERIFICATION:
- Response status: 200
- JSON includes "breached": false (assuming we're under $20/day)

REPORT BACK: "cost-alert function tested. Response OK."

────────────────────────────────────────────────────────────
TASK 9 — Supabase: set service_role_key for pg_cron
────────────────────────────────────────────────────────────
1. Supabase dashboard → Settings → API → reveal the "service_role" secret → copy
   (it's a JWT, very long)
2. Save as VAR_SUPABASE_SERVICE_ROLE_KEY (masked)
3. Navigate to SQL Editor in the Supabase sidebar
4. New query — paste this (replace YOUR_KEY with the actual key):

   ALTER DATABASE postgres SET app.settings.service_role_key TO 'YOUR_KEY';

5. Run
6. Verify: in the same SQL editor:

   SELECT * FROM cron.job WHERE jobname='cost-alert-daily';

   Expect: 1 row with schedule '0 9 * * *'

REPORT BACK: "pg_cron service_role_key set. cost-alert-daily job confirmed."

────────────────────────────────────────────────────────────
TASK 10 — GitHub: add CI secrets for Sentry source-map upload
────────────────────────────────────────────────────────────
1. https://github.com/LuCiFeRGaLaCtUS/-05-proj-mulbros-media → Settings → Secrets and variables → Actions
2. Click "New repository secret" for each:
   - Name: SENTRY_AUTH_TOKEN | Value: <VAR_SENTRY_AUTH_TOKEN>
   - Name: SENTRY_ORG | Value: <VAR_SENTRY_ORG>
   - Name: SENTRY_PROJECT | Value: ai-operator-client
3. Save each

VERIFICATION:
- The secrets list shows all 3 names (values are hidden — that's normal)

REPORT BACK: "GitHub Sentry CI secrets added."

────────────────────────────────────────────────────────────
TASK 11 — BetterUptime: create monitor (skip if I'm using GitHub Actions cron instead)
────────────────────────────────────────────────────────────
Ask me first: "Do you want BetterUptime monitor, or should we use the GitHub Actions cron alternative? I'll pause."

If BetterUptime:
1. https://betterstack.com/better-uptime → Monitors → Create monitor
2. Fill:
   - URL: https://mulbros-marketing-os.onrender.com/healthz
   - HTTP Method: GET
   - Expected status code: 200
   - Frequency: 3 minutes
   - Request timeout: 10 seconds
   - Recovery period: 5 minutes
   - Required keyword: "status":"ok"
   - Alert email: Arghya@fsztpartners.com
3. Save
4. After ~3 min the monitor should show "Up"

REPORT BACK: "BetterUptime monitor live."

────────────────────────────────────────────────────────────
TASK 12 — Resend: add domain for email deliverability
────────────────────────────────────────────────────────────
1. https://resend.com/domains → Add Domain
2. Enter sending domain — ask me which to use (keemakr.ai or mail.keemakr.ai)
3. Resend will show 3 DNS records:
   - SPF (TXT)
   - DKIM (TXT, with the resend._domainkey selector)
   - DMARC (TXT)
4. PAUSE here. Tell me the 3 records exactly. I need to paste them into my DNS provider myself.
5. After I confirm DNS is added, return to Resend → "Verify" button
6. Verification can take 5 min to 24h

REPORT BACK: "Resend domain DNS records captured. Awaiting Arghya's DNS provider update."

────────────────────────────────────────────────────────────
TASK 13 — Final verify
────────────────────────────────────────────────────────────
Run these checks and report each:

1. https://mulbros-marketing-os.onrender.com/healthz
   - Expect: status=ok, probes.supabase=ok, probes.langfuse=configured, probes.sentry=configured

2. View https://mulbros-marketing-os.onrender.com/ in browser → open DevTools → Console
   - Type: throw new Error('cowork-sentry-test')
   - Wait 30s → switch to Sentry dashboard → ai-operator-client project → Issues
   - Confirm one new issue titled "cowork-sentry-test"

3. Render → Logs → confirm latest boot shows:
   [Sentry] initialized — server-side error tracking active
   [Langfuse] initialized — LLM tracing active
   No [startup] warnings about MUX_WEBHOOK_SECRET / DOCUSIGN_HMAC_KEY / SENTRY_DSN

4. GitHub → Actions tab → trigger any push or re-run latest workflow → confirm the "Upload source maps to Sentry" step ran (gated on SENTRY_AUTH_TOKEN)

FINAL REPORT
Produce a single summary:
- Task 1-13 status: ✅ / ⏳ / ❌
- Any blocked tasks + reason
- Any secrets you captured locally that I need to verify (just the variable names, not values)
- Any tasks that need my manual follow-up (DNS, payment, 2FA-blocked, etc.)

END.
```

---

## How to use

1. Open Claude Cowork in a Chrome browser (or via the Claude Chrome extension)
2. Log into all the dashboards listed under "PREREQUISITES" — leave them as open tabs
3. Have terminal ready at `D:/MulBros Media/MulBros Media OS v2` if you want Task 7 done autonomously (otherwise Cowork will pause and ask)
4. Paste the prompt above into Cowork
5. Watch it execute. It will pause when it needs you (DNS records, OAuth completion, RESEND_API_KEY value, etc.)

## Time estimate

| Phase | Wall-clock |
|---|---|
| Your pre-prep (signups + logins) | ~10 min |
| Cowork executing | ~25-30 min |
| Your gap fills (DNS records, secret pastes) | ~5 min |
| **Total** | **~45 min** |

## What still needs you after Cowork finishes

| Item | Why |
|---|---|
| DNS records for Resend | Cowork can READ them, you must PASTE into your DNS provider |
| Pasting `RESEND_API_KEY` value | Cowork should not see prod secrets |
| Backup restore drill | Destructive — keep you in the loop |
| `.env.smoke` populate + smoke run | Wants test-user Stytch session — easier you do this 5-min ritual locally |
