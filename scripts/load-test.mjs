#!/usr/bin/env node
/**
 * Baseline load test against /healthz (cheap deep probe, exercises full
 * middleware stack: requestId → CORS → Helmet → Supabase REST roundtrip).
 *
 * Does NOT hit /api/ai (paid OpenAI tokens per request, would burn $).
 *
 * Usage:
 *   node scripts/load-test.mjs              # local http://localhost:3000
 *   node scripts/load-test.mjs --prod       # https://mulbros-marketing-os.onrender.com
 *   node scripts/load-test.mjs --url https://other.example.com
 *
 * Output: JSON summary to stdout + appends row to docs/SCALING.md.
 */
import autocannon from 'autocannon';
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const urlIdx = args.indexOf('--url');
const url    = urlIdx >= 0 ? args[urlIdx + 1]
             : isProd       ? 'https://mulbros-marketing-os.onrender.com/healthz'
             :                'http://localhost:3000/healthz';

const connections = Number(process.env.LOAD_CONNECTIONS || 50);
const duration    = Number(process.env.LOAD_DURATION    || 30);
const pipelining  = Number(process.env.LOAD_PIPELINING  || 1);

console.log(`[load] target=${url}`);
console.log(`[load] connections=${connections} duration=${duration}s pipelining=${pipelining}`);

const result = await autocannon({
  url,
  connections,
  duration,
  pipelining,
  headers: { 'Accept': 'application/json' },
});

// Compact summary
const summary = {
  url,
  connections,
  duration_s:        duration,
  pipelining,
  requests_total:    result.requests.total,
  rps_avg:           Math.round(result.requests.average),
  rps_p99:           result.requests.p99,
  latency_p50_ms:    result.latency.p50,
  latency_p90_ms:    result.latency.p90,
  latency_p99_ms:    result.latency.p99,
  latency_max_ms:    result.latency.max,
  errors:            result.errors,
  timeouts:          result.timeouts,
  status_2xx:        result['2xx'],
  status_non_2xx:    result.non2xx,
  bytes_per_sec_avg: Math.round(result.throughput.average),
};

console.log('\n[load] summary:');
console.log(JSON.stringify(summary, null, 2));

// Append a row to docs/SCALING.md for historical record
const scalingPath = join(__dirname, '..', 'docs', 'SCALING.md');
const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
const row = `| ${stamp} | ${isProd ? 'prod' : 'local'} | ${connections} | ${duration}s | ${summary.rps_avg} | ${summary.latency_p50_ms} | ${summary.latency_p99_ms} | ${summary.errors} | ${summary.timeouts} |\n`;

const header = `# AI Operator — scaling notes

Single-dyno baseline. Track over time so we know when to add a second instance.

## Load test history

Run via \`npm run load\` (local) or \`npm run load:prod\`.

| When (UTC) | Env | Conns | Dur | RPS avg | p50 ms | p99 ms | Errors | Timeouts |
|---|---|---|---|---|---|---|---|---|
`;

if (!existsSync(scalingPath)) writeFileSync(scalingPath, header);
appendFileSync(scalingPath, row);
console.log(`\n[load] appended row to docs/SCALING.md`);

// Exit non-zero if any errors or non-2xx
process.exit((summary.errors + summary.status_non_2xx + summary.timeouts) > 0 ? 1 : 0);
