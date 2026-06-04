# AI Operator — Production Runbook

Last updated: 2026-06-04

Single source of truth for on-call response. Read this before touching prod.

---

## Service map

| Component | Provider | Where |
|---|---|---|
| Web + API | Render | https://mulbros-marketing-os.onrender.com |
| Database + Auth | Supabase | https://supabase.com/dashboard/project/ymkikosszdherismfckl |
| Session auth | Stytch | https://stytch.com/dashboard |
| LLM | OpenAI + Anthropic | api.openai.com / api.anthropic.com |
| LLM observability | Langfuse | https://us.cloud.langfuse.com |
| Error tracking | Sentry (DSN required) | https://sentry.io |
| Email | Resend | https://resend.com/dashboard |
| Video | Mux | https://dashboard.mux.com |
| Payments | Stripe + Plaid | https://dashboard.stripe.com |
| Source | GitHub | https://github.com/LuCiFeRGaLaCtUS/-05-proj-mulbros-media |

---

## Health endpoints

```bash
# Shallow — process alive
curl https://mulbros-marketing-os.onrender.com/health
# {"status":"ok","version":"2.0.0","timestamp":"..."}

# Deep — Supabase reachable, integrations configured
curl https://mulbros-marketing-os.onrender.com/healthz
# {"status":"ok","probes":{"supabase":"ok","langfuse":"configured","sentry":"configured"}}
```

`/healthz` returns **503** when status is `down`. Wire uptime monitor to this path, not `/health`.

---

## Incident response — first 5 minutes

1. **Check status:** `curl https://mulbros-marketing-os.onrender.com/healthz`
2. **Tail logs:** Render → Logs tab → last 15 min
3. **Recent deploys:** GitHub → Actions → most recent green commit on `main`
4. **If broken < 30 min after deploy:** revert (see Rollback below)
5. **If Supabase down:** check https://status.supabase.com
6. **If Stytch auth failing:** check https://status.stytch.com

---

## Rollback to previous commit

```bash
# Find last good SHA
git log --oneline main | head -10

# Option A — Render dashboard
#   Render → Deployments → previous SHA → "Rollback to this deploy"

# Option B — git revert + push
git checkout main
git pull
git revert HEAD --no-edit
git push origin main
# Render auto-deploys the revert
```

After rollback, post-mortem: open GitHub issue with `incident-` prefix.

---

## Secret rotation

Treat these as compromised by default if ever printed in chat/screenshot/logs.

| Secret | Where stored | How to rotate |
|---|---|---|
| `OPENAI_API_KEY` | Render env | OpenAI dashboard → API keys → revoke + create new → update Render env → save (triggers redeploy) |
| `ANTHROPIC_API_KEY` | Render env | console.anthropic.com → API keys → same flow |
| `STYTCH_PROJECT_ID` + `STYTCH_SECRET` | Render env | stytch.com → API keys → rotate → update Render |
| `SUPABASE_JWT_SECRET` | Render env | Supabase dashboard → Settings → API → regenerate JWT secret. **Note:** invalidates all signed-in users — they re-auth via Stytch which re-mints. |
| `VITE_SUPABASE_ANON_KEY` | Render env + bundled to client | Supabase dashboard → Settings → API → regenerate anon key → update Render → redeploy (rebuilds client bundle) |
| `RESEND_API_KEY` | Render env | resend.com/api-keys → revoke + new → update Render |
| `STRIPE_SECRET_KEY` | Render env | dashboard.stripe.com → API keys → roll → update Render |
| `LANGFUSE_SECRET_KEY` | Render env | us.cloud.langfuse.com → Settings → API Keys → delete + create → update Render |
| `RENDER_DEPLOY_HOOK_URL` | GitHub Secret | Render → Settings → Deploy Hooks → revoke + create → update GitHub repo secret |

After rotating any secret: `curl https://.../healthz` to confirm app still healthy + tail Render logs for 5 min.

---

## Database

### Backups
- Supabase auto-backs up daily — 7-day retention on free tier
- Manual on-demand backup: Supabase dashboard → Database → Backups → "Backup now"

### Point-in-time restore
- Free tier: no PITR. Restores only from last daily snapshot.
- Pro tier: PITR with 7-day window.

### Restore procedure
1. Supabase dashboard → Database → Backups → select backup → "Restore"
2. Restores to **new project** (Supabase pattern) — you swap connection strings
3. Update `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` + `SUPABASE_JWT_SECRET` on Render to point at restored project
4. `curl /healthz` → confirm `probes.supabase = ok`
5. Smoke: `npm run smoke:prod` → confirm 5/5 PASS

### Apply migration manually
```bash
# Migrations are in supabase/migrations/*.sql
# Apply via Supabase MCP (Claude Code) or psql:
psql "$DATABASE_URL" -f supabase/migrations/20260704_epk_team.sql
```

---

## Observability

### Find a slow / failed AI request
1. Grab the `X-Request-Id` from the user's browser network tab (response header on `/api/ai`)
2. Langfuse → Traces → search that ID — full hop + tool breakdown with token usage + USD cost
3. If Langfuse shows the trace but client says error, check Sentry for the same `requestId` (when Sentry is wired)
4. Cross-check `cost_ledger` row in Supabase: `SELECT * FROM cost_ledger WHERE metadata->>'request_id' = '<id>'`

### Find a slow tool call
- Langfuse trace → expand the relevant `tool.<name>` span → see input/output/latency
- If it's `statement.parse`, the LLM-call duration dominates. If it's `audition.create`, suspect Supabase REST latency.

### Spike in cost
- Langfuse dashboard → Costs → sort by user → identify high-spend user
- Cross-check `cost_ledger_today` view: `SELECT user_id, SUM(usd_cost) FROM cost_ledger WHERE created_at::date = CURRENT_DATE GROUP BY 1 ORDER BY 2 DESC LIMIT 10`

---

## Uptime monitoring

### Render built-in
Render dashboard → Settings → Health Check Path → set to `/healthz` (not `/health`).
Render will restart the dyno if `/healthz` returns 5xx 3 times in a row.

### External monitor (recommended)
Free tier: BetterUptime (10 monitors free at https://betterstack.com/better-uptime).

Setup:
1. Sign up → Create monitor
2. URL: `https://mulbros-marketing-os.onrender.com/healthz`
3. Method: GET, Expected status: 200, Frequency: 3 min
4. Alert email: `Arghya@fsztpartners.com`
5. Optional: SMS via Twilio (uses existing Twilio account)

---

## Email deliverability

Resend sends from `onboarding@resend.dev` by default (no DNS needed but lands in spam).

To send from a custom domain (e.g. `noreply@keemakr.ai`):
1. Resend dashboard → Domains → Add domain `keemakr.ai`
2. Add the 3 DNS records Resend shows you:
   - **SPF** TXT: `v=spf1 include:_spf.resend.com ~all`
   - **DKIM** TXT: `resend._domainkey` → key Resend provides
   - **DMARC** TXT: `_dmarc` → `v=DMARC1; p=quarantine; rua=mailto:dmarc@keemakr.ai`
3. Wait ~24h for DNS to propagate
4. Resend dashboard shows "Verified" green check
5. Update Resend `from` header in `server.js` `/api/email` and `resend.email` tool handler

Test deliverability: https://www.mail-tester.com → send a test email → expect 10/10

---

## Common failure modes

| Symptom | Likely cause | First check |
|---|---|---|
| All requests 503 | Render dyno down / out of memory | Render Logs |
| All requests 401 from `/api/*` | Stytch creds rotated, app not redeployed | Check `STYTCH_PROJECT_ID` on Render |
| AI calls fail | OpenAI key revoked / over quota | OpenAI dashboard → Usage |
| Database queries slow | Supabase free tier connection cap (60) | Supabase dashboard → Database → Pool monitor |
| Tool calls return `{ok:false, error:"Profile resolution failed"}` | Stytch user has no Supabase profile yet | Check `profiles` table for `stytch_user_id` column match |
| Langfuse traces missing | Lang env vars not set OR shutdown didn't flush | Render logs for `[Langfuse] initialized` |
| Smoke fails on `/api/ai` 504 | Tool-call loop > 30s | Reduce `MAX_TOOL_HOPS` or check upstream OpenAI status |

---

## Contact

- Primary: Arghya Chowdhury — Arghya@fsztpartners.com
- Backup: Snehaal — (add when known)
- Render account: linked to GitHub `LuCiFeRGaLaCtUS`
- Supabase project owner: `keemakr.ai` workspace

---

## Sprint state

- **Branch model:** `sprint-N/feature` → squash-merge to `main` → Render auto-deploy
- **Smoke after deploy:** `npm run smoke:prod` (requires `.env.smoke` populated)
- **Verify Day 1 of Sprint 12 live:** see `understand-the-codebase-you-quirky-newt.md` Addendum 4
