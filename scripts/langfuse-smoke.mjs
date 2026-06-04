#!/usr/bin/env node
/**
 * Langfuse connection smoke test.
 * Reads creds from .env.local, sends a tiny trace, flushes, reports.
 *
 * Run:
 *   node scripts/langfuse-smoke.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Langfuse } from 'langfuse';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local (where user dropped Langfuse keys)
const envFile = join(__dirname, '..', '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const PUBLIC = process.env.LANGFUSE_PUBLIC_KEY;
const SECRET = process.env.LANGFUSE_SECRET_KEY;
const HOST   = process.env.LANGFUSE_BASE_URL
            || process.env.LANGFUSE_HOST
            || 'https://us.cloud.langfuse.com';

if (!PUBLIC || !SECRET) {
  console.error('[langfuse-smoke] missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY in .env.local');
  process.exit(2);
}

console.log(`[langfuse-smoke] host=${HOST}`);
console.log(`[langfuse-smoke] publicKey=${PUBLIC.slice(0, 12)}...  secretKey=${SECRET.slice(0, 12)}...`);

const langfuse = new Langfuse({
  publicKey: PUBLIC,
  secretKey: SECRET,
  baseUrl:   HOST,
});

// Send a minimal trace that mimics /api/ai shape
const traceId = `smoke-${Date.now()}`;
console.log(`[langfuse-smoke] creating trace id=${traceId}`);

const trace = langfuse.trace({
  id:       traceId,
  name:     'connection.smoke',
  userId:   'smoke-user',
  metadata: { source: 'scripts/langfuse-smoke.mjs', test: true },
  input:    { hello: 'world' },
});

const gen = trace.generation({
  name:  'hop-0',
  model: 'gpt-4o',
  input: [{ role: 'user', content: 'ping' }],
});
gen.end({
  output: { role: 'assistant', content: 'pong' },
  usage:  { input: 1, output: 1 },
});

const span = trace.span({
  name:  'tool.smoke',
  input: { foo: 'bar' },
});
span.end({ output: { ok: true } });

trace.update({ output: 'completed' });

// flush — async, waits for HTTP send
console.log('[langfuse-smoke] flushing...');
try {
  await langfuse.shutdownAsync();
  console.log('[langfuse-smoke] OK — trace flushed to Langfuse');
  console.log(`[langfuse-smoke] view at: ${HOST}/project/_/traces?search=${traceId}`);
  process.exit(0);
} catch (err) {
  console.error('[langfuse-smoke] FAIL:', err.message);
  process.exit(1);
}
