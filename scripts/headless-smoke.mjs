#!/usr/bin/env node
/**
 * AI Operator — headless smoke test.
 *
 * Sends real prompts to /api/ai with a long-lived Stytch session token for a
 * dedicated test user, asserts the expected tool_call fires AND the row lands
 * in Supabase, then cleans up.
 *
 * Required env (set in .env.smoke or shell):
 *   SMOKE_BASE              http://localhost:3000  (or prod URL)
 *   SMOKE_STYTCH_TOKEN      a Stytch session JWT or opaque token for a test user
 *   SMOKE_USER_ID           the profile.id of that test user
 *   VITE_SUPABASE_URL       same as server env
 *   VITE_SUPABASE_ANON_KEY  same as server env
 *   SUPABASE_JWT_SECRET     same as server env (for minting service JWT to read/clean rows)
 *
 * Usage:
 *   npm run smoke            (local)
 *   npm run smoke:prod       (deployed)
 *
 * Exit code 0 if all cases pass. Non-zero otherwise.
 */
import crypto from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (avoids a dependency). Loads .env first (shared), then
// .env.smoke (smoke-specific overrides). Existing process.env wins so CI/Render
// env vars take priority.
const loadEnvFile = (path) => {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
};
loadEnvFile(join(__dirname, '..', '.env'));
loadEnvFile(join(__dirname, '..', '.env.smoke'));

const IS_PROD     = process.argv.includes('--prod');
const BASE        = process.env.SMOKE_BASE
                 || (IS_PROD ? 'https://mulbros-marketing-os.onrender.com' : 'http://localhost:3000');
const TOKEN       = process.env.SMOKE_STYTCH_TOKEN;
const USER_ID     = process.env.SMOKE_USER_ID;
const SUPA_URL    = process.env.VITE_SUPABASE_URL;
const SUPA_ANON   = process.env.VITE_SUPABASE_ANON_KEY;
const JWT_SECRET  = process.env.SUPABASE_JWT_SECRET;

if (!TOKEN || !USER_ID || !SUPA_URL || !SUPA_ANON || !JWT_SECRET) {
  console.error('[smoke] missing required env. Need: SMOKE_STYTCH_TOKEN, SMOKE_USER_ID, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET');
  process.exit(2);
}

// Mint a service-role JWT (same algorithm server uses) for direct Supabase reads/cleanup.
const mintServiceJwt = () => {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    role: 'service_role',
    aud:  'authenticated',
    iss:  'supabase',
    iat:  now,
    exp:  now + 600,
  })).toString('base64url');
  const data = `${header}.${payload}`;
  const sig  = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
};
const SVC_JWT = mintServiceJwt();

const supaHeaders = () => ({
  apikey:         SUPA_ANON,
  Authorization:  `Bearer ${SVC_JWT}`,
  'Content-Type': 'application/json',
});

const supaGet = async (path) => {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: supaHeaders() });
  if (!r.ok) throw new Error(`supaGet ${path} → ${r.status} ${await r.text()}`);
  return r.json();
};
const supaDelete = async (path) => {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, { method: 'DELETE', headers: supaHeaders() });
  if (!r.ok && r.status !== 204) throw new Error(`supaDelete ${path} → ${r.status} ${await r.text()}`);
};

const callAi = async (prompt) => {
  const r = await fetch(`${BASE}/api/ai`, {
    method: 'POST',
    headers: {
      'Content-Type':            'application/json',
      'x-stytch-session-token':  TOKEN,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a tool-calling agent. Always call the relevant tool — never just describe what you would do.' },
        { role: 'user',   content: prompt },
      ],
      temperature: 0.2,
      max_tokens:  600,
    }),
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: r.status, body: json };
};

const cases = [
  {
    label:    'audition.create',
    prompt:   'Log an audition for "AI Operator Smoke Test" tomorrow 10am, casting director Smoke McTest.',
    table:    'auditions',
    match:    (row) => row.project_title === 'AI Operator Smoke Test',
  },
  {
    label:    'tour.create',
    prompt:   'Create a tour called "Smoke Run 2026" starting 2026-07-01 ending 2026-08-15.',
    table:    'tours',
    match:    (row) => row.name === 'Smoke Run 2026',
  },
  {
    label:    'show.create',
    prompt:   'Add a hold for "Smoke Venue Test" in Los Angeles on 2026-08-15.',
    table:    'shows',
    match:    (row) => row.venue_name === 'Smoke Venue Test',
  },
  {
    label:    'release.create',
    prompt:   'Create a single called "Smoke Test Release" releasing 2026-09-01.',
    table:    'releases',
    match:    (row) => row.title === 'Smoke Test Release',
  },
  {
    label:    'epk.upsert',
    prompt:   'Build my EPK with display name "Smoke Tester EPK" and tagline "automated artist".',
    table:    'epk_kits',
    match:    (row) => row.display_name === 'Smoke Tester EPK',
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0;

console.log(`[smoke] BASE=${BASE}  USER_ID=${USER_ID}`);

for (const c of cases) {
  const t0 = Date.now();
  process.stdout.write(`[smoke] ${c.label.padEnd(18)} `);
  try {
    const { status, body } = await callAi(c.prompt);
    if (status !== 200) throw new Error(`/api/ai ${status} ${JSON.stringify(body).slice(0, 200)}`);
    const calls = body._tool_calls || [];
    const hit = calls.find((tc) => tc.name === c.label);
    if (!hit) throw new Error(`no ${c.label} in _tool_calls (got: ${calls.map((x) => x.name).join(',') || 'none'})`);
    if (hit.result && hit.result.ok === false) throw new Error(`tool returned !ok: ${hit.result.error}`);

    // Allow Supabase eventual consistency
    await sleep(800);
    const rows = await supaGet(`${c.table}?user_id=eq.${USER_ID}&order=created_at.desc&limit=5`);
    const row  = rows.find(c.match);
    if (!row) throw new Error(`row not in supabase (last 5 by created_at): ${JSON.stringify(rows.map((r) => Object.fromEntries(Object.entries(r).slice(0, 3))))}`);

    // Cleanup
    await supaDelete(`${c.table}?id=eq.${row.id}`);

    const dt = Date.now() - t0;
    console.log(`PASS  (${dt}ms)`);
    pass++;
  } catch (err) {
    const dt = Date.now() - t0;
    console.log(`FAIL  (${dt}ms)  ${err.message}`);
    fail++;
  }
}

// Cost-ledger sanity — any 'tool' provider rows from the last 60s?
try {
  const since = new Date(Date.now() - 60_000).toISOString();
  const ledger = await supaGet(`cost_ledger?user_id=eq.${USER_ID}&provider=eq.tool&created_at=gte.${since}&select=endpoint,model,created_at`);
  console.log(`[smoke] cost_ledger tool entries in last 60s: ${ledger.length}`);
} catch (err) {
  console.log(`[smoke] cost_ledger probe failed: ${err.message}`);
}

console.log(`\n[smoke] ${pass} pass · ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
