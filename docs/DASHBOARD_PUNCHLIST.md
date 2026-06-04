# Dashboard punch list — TOMORROW MORNING START HERE

**Saved 2026-06-04 end-of-day. Last live commit:** `4095043` on `main`.

> Sprint 12 code is shipped. Everything below is dashboard-only (Sentry, Render, Supabase, GitHub repo secrets, Resend DNS, BetterUptime). ~75 min total. Do in order — later items depend on earlier.

---

## 🔴 P0 — Do first (~12 min, unblocks everything else)

### 1. Sentry (~10 min)

**Why:** Currently `[Sentry] DSN not set` in Render logs. Zero error tracking.

**Steps:**
1. Open https://sentry.io → Sign up (free, 5k errors/mo)
2. Create **2 projects**:
   - `ai-operator-server` · platform: **Node.js**
   - `ai-operator-client` · platform: **React**
3. Copy each project's **DSN** (looks like `https://abc@o123.ingest.us.sentry.io/456`)
4. Render dashboard → AI Operator service → **Environment** tab → Add:
   - `SENTRY_DSN` = server DSN (mark Secret)
   - `VITE_SENTRY_DSN` = client DSN (NOT secret — ships to bundle)
5. Save → Render auto-restarts
6. Verify: `curl https://mulbros-marketing-os.onrender.com/healthz` → `probes.sentry: configured`
7. Test error: open app → DevTools console → `throw new Error('sentry-test')` → check Sentry dashboard

### 2. NODE_ENV (~1 min)

**Why:** Prod CSP drops `unsafe-inline` only when `NODE_ENV === 'production'`. If unset, security regression.

**Steps:**
1. Render dashboard → Environment → check if `NODE_ENV` exists
2. If absent OR not `production` → set `NODE_ENV=production`
3. Save → restart
4. Verify: `curl -sI https://mulbros-marketing-os.onrender.com/ | grep "content-security-policy" | grep -o "script-src[^;]*"`
   - Expect: `script-src 'self'`
   - NOT: `script-src 'self' 'unsafe-inline'`

### 3. Render Health Check Path (~1 min)

**Why:** Render won't auto-restart on backend failure unless it's checking the right URL.

**Steps:**
1. Render dashboard → AI Operator service → **Settings**
2. Scroll to **Health & Alerts** section
3. **Health Check Path** field → set to: `/healthz`
4. Save

---

## 🟠 P1 — Webhook signatures (~15 min)

### 4. MUX_WEBHOOK_SECRET (~5 min)

**Why:** Without this, anyone who finds your Mux webhook URL can forge `video.asset.ready` events.

**Steps:**
1. https://dashboard.mux.com → **Settings** → **Webhooks**
2. Find webhook for `https://mulbros-marketing-os.onrender.com/api/webhooks/mux`
3. Click into it → **Signing Secret** → reveal/copy
4. Render env → add `MUX_WEBHOOK_SECRET` = (paste, mark Secret)
5. Save → restart
6. Verify in Render logs: no `[mux-webhook] *_HMAC_KEY not set` warnings on next boot

### 5. DOCUSIGN_HMAC_KEY (~5 min)

**Steps:**
1. DocuSign admin → **Integrations** → **Connect** → find your Connect listener
2. **HMAC Settings** → reveal/copy secret
3. Render env → add `DOCUSIGN_HMAC_KEY` (Secret)
4. Save → restart

### 6. STRIPE webhook secret (~5 min, only if Stripe webhooks active)

**Steps:**
1. https://dashboard.stripe.com → Developers → Webhooks
2. If webhook to `/api/webhooks/stripe` exists → copy signing secret → set `STRIPE_WEBHOOK_SECRET` on Render
3. If no Stripe webhook yet → skip

---

## 🟡 P2 — Cost protection (~15 min)

### 7. Deploy `cost-alert` Edge Function (~10 min)

**Why:** Daily $20 threshold alert. Without it, runaway tool-loop can burn $1000 overnight.

**Steps:**
```bash
cd "D:/MulBros Media/MulBros Media OS v2"
npm i -g supabase
supabase login
supabase link --project-ref ymkikosszdherismfckl
supabase functions deploy cost-alert
```

Supabase dashboard → **Edge Functions** → `cost-alert` → **Secrets**:
- `RESEND_API_KEY` = (existing Resend key)
- `COST_ALERT_TO` = `Arghya@fsztpartners.com`
- `COST_ALERT_FROM` = `AI Operator <onboarding@resend.dev>` (or custom after P4)
- `COST_ALERT_USD_THRESHOLD` = `20`

Test: Edge Functions UI → `cost-alert` → **Invoke** → expect `{"total_usd":...,"breached":false}`

### 8. Set service_role_key for pg_cron (~2 min)

```sql
-- Supabase SQL editor, one-time:
ALTER DATABASE postgres SET app.settings.service_role_key TO 'YOUR_SERVICE_ROLE_KEY';
```

Get key: Supabase → Settings → API → `service_role` secret.

### 9. Apply migration (~1 min)

```bash
supabase db push
```

Verify: `SELECT * FROM cron.job WHERE jobname='cost-alert-daily';` → 1 row.

---

## 🟢 P3 — Source maps for Sentry (~5 min)

### 10. Sentry CI secrets

**Why:** Without this, Sentry stack traces are minified gibberish.

**Steps:**
1. Sentry → **Settings** → **Organization Settings** → **Auth Tokens** → **Create New Token**
2. Scopes: `project:releases`, `org:read`
3. Copy token
4. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → New repo secret:
   - `SENTRY_AUTH_TOKEN` = paste
   - `SENTRY_ORG` = your-sentry-org-slug (URL: `sentry.io/organizations/<slug>/`)
   - `SENTRY_PROJECT` = `ai-operator-client`
5. Push any commit → CI uploads source maps → Sentry Releases tab shows commit SHA

---

## 🟢 P4 — Email deliverability (~10 min config + 24h propagation)

### 11. Resend DNS verification

**Why:** Currently `from: onboarding@resend.dev` → lands in spam.

**Steps:**
1. Pick domain — e.g. `keemakr.ai` or subdomain `mail.keemakr.ai`
2. https://resend.com/domains → **Add Domain** → enter domain
3. Resend shows 3 records:
   - **SPF** TXT: `@` → `v=spf1 include:_spf.resend.com ~all`
   - **DKIM** TXT: `resend._domainkey` → (long key)
   - **DMARC** TXT: `_dmarc` → `v=DMARC1; p=quarantine; rua=mailto:dmarc@keemakr.ai`
4. Add records in DNS provider (Cloudflare/Namecheap/GoDaddy)
5. Resend "Verify" → wait 5 min to 24h
6. Update `from` header in code: `noreply@keemakr.ai`
7. Test: send via /api/email → check inbox + spam classification

---

## 🟢 P5 — Uptime monitoring (~5 min)

### 12. Pick ONE:

**Option A — BetterUptime (external vendor, ~5 min)**
1. https://betterstack.com/better-uptime → Sign up (free tier 10 monitors)
2. **Monitors** → **Create monitor**
3. URL: `https://mulbros-marketing-os.onrender.com/healthz`
4. Frequency: 3 min · Expected status: 200 · Expected text: `"status":"ok"`
5. Recovery period: 5 min
6. Alert email: `Arghya@fsztpartners.com`
7. Save

**Option B — GitHub Actions cron (autonomous, free)**
Tell Claude: **"ship cron uptime"** → writes `.github/workflows/uptime.yml` that hits `/healthz` every 5 min, opens GH Issue if non-200, closes on recovery. Zero vendor account.

---

## 🟢 P6 — Smoke validation (~10 min)

### 13. Local — `.env.smoke` (~5 min)

1. Log into app as smoke test user
2. Browser DevTools → Application → Cookies → `https://mulbros-marketing-os.onrender.com` → copy `stytch_session_jwt` value
3. Supabase → Table Editor → `profiles` → filter by your test email → copy `id`
4. Locally:
```bash
cd "D:/MulBros Media/MulBros Media OS v2"
cp .env.smoke.example .env.smoke
# edit .env.smoke:
#   SMOKE_STYTCH_TOKEN=<paste cookie>
#   SMOKE_USER_ID=<paste profile uuid>
npm run smoke:prod
```
Expect: 5/5 PASS.

### 14. CI smoke — GitHub repo secrets (~5 min)

GitHub repo → Settings → Secrets → Actions → add each:
- `SMOKE_STYTCH_TOKEN`
- `SMOKE_USER_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`

After next push → Actions tab → smoke job runs against prod → green = E2E verified.

---

## 🟢 P7 — Disaster recovery drill (~30 min, one-time)

### 15. Backup restore drill

**Why:** First restore during real incident = panic. Practice on throwaway.

**Steps:**
1. Supabase dashboard → Database → **Branches** → **Create branch**
2. Get branch's connection string
3. `supabase db push --db-url <branch-conn-string>`
4. Insert test row in `auditions` table
5. Drop it via SQL editor (simulate accidental delete)
6. Use Supabase backup restore → confirm row reappears
7. Delete the branch project
8. Document exact button sequence in `docs/RUNBOOK.md`

---

## ✅ Final verify gate

```bash
# 1. /healthz fully configured
curl -s https://mulbros-marketing-os.onrender.com/healthz | python -m json.tool
# Expect: probes.supabase=ok, probes.langfuse=configured, probes.sentry=configured

# 2. Prod CSP strict
curl -sI https://mulbros-marketing-os.onrender.com/ | grep "content-security-policy" | grep -o "script-src[^;]*"
# Expect: script-src 'self' (no 'unsafe-inline')

# 3. Smoke 5/5
npm run smoke:prod

# 4. Cost alert
# Supabase → Edge Functions → cost-alert → Invoke → 200 response

# 5. Sentry capture
# https://mulbros-marketing-os.onrender.com → DevTools → throw new Error('test')
# Sentry dashboard receives event in <30s

# 6. Email deliverability (after P4 + 24h DNS)
# Send via /api/email → mail-tester.com → expect 10/10
```

**All green = production launch ready.**

---

## Quick decision matrix

| Time | Do |
|---|---|
| 10 min | P0 #1-3 — biggest impact |
| 30 min | P0 + P1 — all 🔴 critical |
| 1 hour | P0 + P1 + P2 + P3 — production-safe |
| 2 hours | All of above + P4-P7 — fully closed |

**Minimum before MulBros logs in:** P0 + P1 (~25 min). Rest can ship Day 2.

---

## When done

Tell Claude: **"dashboard done"** or **"start Sprint 13"** to proceed.

Sprint 13 candidates (when ready):
1. Memory layer on Supabase pgvector (1 day) — replaces supermemory
2. `statement.upload_pdf` via opendataloader-pdf (1-2 days)
3. `script.breakdown` tool for Productions vertical (2-3 days)
4. Pipecat voice surface (3-4 days)
5. PostHog re-attempt (after Snehaal call)
