// Supabase Edge Function: cost-alert
//
// Runs daily via pg_cron (see supabase/migrations/20260805_cost_alert_cron.sql).
// Sums cost_ledger.usd_cost for the last 24h. Emails Arghya@fsztpartners.com
// via Resend if the total exceeds COST_ALERT_USD_THRESHOLD (default $20).
//
// Per-user breakdown also computed so the alert email shows which account is
// driving spend.
//
// Required env (set in Supabase Edge Function secrets):
//   RESEND_API_KEY                — same key the app uses
//   COST_ALERT_TO                 — destination email (Arghya@fsztpartners.com)
//   COST_ALERT_FROM               — sender; must be verified in Resend
//   COST_ALERT_USD_THRESHOLD      — number, default 20
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
//
// Manual test: curl with the function's invoke URL + supabase JWT.

// Deno globals are available in Supabase Edge runtime.
// deno-lint-ignore-file no-explicit-any

const SUPA_URL  = Deno.env.get('SUPABASE_URL') ?? '';
const SUPA_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND    = Deno.env.get('RESEND_API_KEY') ?? '';
const TO_EMAIL  = Deno.env.get('COST_ALERT_TO')   ?? 'Arghya@fsztpartners.com';
const FROM      = Deno.env.get('COST_ALERT_FROM') ?? 'AI Operator <onboarding@resend.dev>';
const THRESHOLD = Number(Deno.env.get('COST_ALERT_USD_THRESHOLD') ?? '20');

interface LedgerRow {
  user_id:    string | null;
  provider:   string | null;
  model:      string | null;
  usd_cost:   number | null;
  created_at: string;
}

const supaGet = async (path: string) => {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!r.ok) throw new Error(`supa ${path} → ${r.status}`);
  return r.json();
};

const sendEmail = async (subject: string, html: string) => {
  if (!RESEND) {
    console.warn('RESEND_API_KEY missing — alert NOT sent');
    return;
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [TO_EMAIL], subject, html }),
  });
  if (!r.ok) console.error('Resend send failed:', r.status, await r.text());
};

Deno.serve(async (_req) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rows: LedgerRow[] = await supaGet(
      `cost_ledger?created_at=gte.${since}&select=user_id,provider,model,usd_cost,created_at&limit=10000`,
    );

    const total = rows.reduce((s, r) => s + (Number(r.usd_cost) || 0), 0);
    const byUser: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    for (const row of rows) {
      const uid   = row.user_id ?? 'anon';
      const model = row.model   ?? 'unknown';
      byUser[uid]   = (byUser[uid]   || 0) + (Number(row.usd_cost) || 0);
      byModel[model] = (byModel[model] || 0) + (Number(row.usd_cost) || 0);
    }

    const result = {
      window_hours: 24,
      total_usd:    Number(total.toFixed(4)),
      threshold:    THRESHOLD,
      breached:     total > THRESHOLD,
      top_users:    Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 5)
                          .map(([id, usd]) => ({ id, usd: Number(usd.toFixed(4)) })),
      top_models:   Object.entries(byModel).sort((a, b) => b[1] - a[1]).slice(0, 5)
                          .map(([model, usd]) => ({ model, usd: Number(usd.toFixed(4)) })),
      row_count:    rows.length,
      generated_at: new Date().toISOString(),
    };

    if (result.breached) {
      const userRows = result.top_users.map((u) =>
        `<tr><td style="padding:4px 12px;font-family:monospace">${u.id.slice(0, 18)}</td><td style="padding:4px 12px;text-align:right">$${u.usd}</td></tr>`,
      ).join('');
      const modelRows = result.top_models.map((m) =>
        `<tr><td style="padding:4px 12px;font-family:monospace">${m.model}</td><td style="padding:4px 12px;text-align:right">$${m.usd}</td></tr>`,
      ).join('');
      const html = `
        <h2 style="color:#b91c1c">AI Operator — daily cost alert</h2>
        <p>Spend in the last 24h crossed your threshold.</p>
        <table style="border-collapse:collapse;font-size:14px">
          <tr><td><b>Window</b></td><td>${result.window_hours}h</td></tr>
          <tr><td><b>Total</b></td><td><b>$${result.total_usd}</b></td></tr>
          <tr><td><b>Threshold</b></td><td>$${result.threshold}</td></tr>
          <tr><td><b>Calls logged</b></td><td>${result.row_count}</td></tr>
        </table>
        <h3>Top users by spend</h3>
        <table style="border-collapse:collapse;font-size:13px">${userRows}</table>
        <h3>Top models by spend</h3>
        <table style="border-collapse:collapse;font-size:13px">${modelRows}</table>
        <p style="color:#666;font-size:12px">Generated at ${result.generated_at}.</p>
      `;
      await sendEmail(`[AI Operator] Cost alert: $${result.total_usd} in last 24h (limit $${THRESHOLD})`, html);
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('cost-alert failed:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
