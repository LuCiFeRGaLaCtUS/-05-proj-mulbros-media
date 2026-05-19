#!/usr/bin/env node
/**
 * MulBros Media OS — Eval Harness
 *
 * Usage:
 *   node evals/run.js                     # run all fixtures
 *   node evals/run.js audition_tracker    # run one
 *
 * Each fixture is a JSON file in evals/fixtures/ with shape:
 *   {
 *     "agent":           "<key>",
 *     "model":           "gpt-4o-mini",
 *     "system":          "<system prompt>",
 *     "user":            "<user message>",
 *     "must_contain":    ["regex1", "regex2"],
 *     "must_not_contain":["regex_bad"]
 *   }
 *
 * Output: per-fixture PASS / FAIL and final summary.
 * Process exits 1 on any FAIL so CI can gate.
 *
 * Calls OpenAI directly with OPENAI_API_KEY — no server required.
 */

import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname    = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, 'fixtures');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY not set. Aborting.');
  process.exit(2);
}

const filter = process.argv[2]; // optional fixture name filter

const runOne = async (fix) => {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body:    JSON.stringify({
      model:      fix.model || 'gpt-4o-mini',
      max_tokens: 600,
      messages: [
        { role: 'system', content: fix.system },
        { role: 'user',   content: fix.user },
      ],
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    return { ok: false, reason: `HTTP ${r.status}: ${err.slice(0, 200)}` };
  }
  const data    = await r.json();
  const content = data.choices?.[0]?.message?.content || '';

  const failures = [];
  for (const p of (fix.must_contain || [])) {
    if (!new RegExp(p, 'i').test(content)) failures.push(`missing pattern: /${p}/i`);
  }
  for (const p of (fix.must_not_contain || [])) {
    if (new RegExp(p, 'i').test(content))  failures.push(`forbidden pattern: /${p}/i`);
  }
  return failures.length === 0
    ? { ok: true,  response: content.slice(0, 200) }
    : { ok: false, reason: failures.join(' · '), response: content.slice(0, 200) };
};

const main = async () => {
  const all = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.json'));
  const targets = filter ? all.filter(f => f.includes(filter)) : all;
  if (targets.length === 0) {
    console.error(`No fixtures matched filter: ${filter}`);
    process.exit(1);
  }

  console.log(`Running ${targets.length} fixture(s)…\n`);
  let passed = 0;
  let failed = 0;
  for (const fname of targets) {
    const fix = JSON.parse(readFileSync(join(FIXTURES_DIR, fname), 'utf8'));
    const t0  = Date.now();
    let result;
    try {
      result = await runOne(fix);
    } catch (err) {
      result = { ok: false, reason: `exception: ${err.message}` };
    }
    const ms  = Date.now() - t0;
    const tag = result.ok ? 'PASS' : 'FAIL';
    console.log(`[${tag}] ${fix.agent.padEnd(32)} (${ms}ms)`);
    if (!result.ok) {
      console.log(`   reason: ${result.reason}`);
      if (result.response) console.log(`   response: ${result.response}…`);
      failed++;
    } else {
      passed++;
    }
  }
  console.log(`\nSummary: ${passed} passed · ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('Eval harness crashed:', err);
  process.exit(2);
});
