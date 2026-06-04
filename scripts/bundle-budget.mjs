#!/usr/bin/env node
/**
 * Bundle size budget gate. Runs after vite build in CI.
 *
 * Asserts:
 *   total JS + CSS in dist/assets ≤ BUDGET_TOTAL_MB
 *   single largest chunk         ≤ BUDGET_CHUNK_MB
 *
 * Override via env:
 *   BUDGET_TOTAL_MB=3.5
 *   BUDGET_CHUNK_MB=1.2
 *
 * Exits non-zero (fail CI) when either budget exceeded.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS    = join(__dirname, '..', 'dist', 'assets');

const TOTAL_MB = Number(process.env.BUDGET_TOTAL_MB || '3.5');
const CHUNK_MB = Number(process.env.BUDGET_CHUNK_MB || '1.2');

const files = readdirSync(ASSETS)
  .filter((f) => /\.(js|css)$/.test(f))
  .map((f) => ({ name: f, bytes: statSync(join(ASSETS, f)).size }))
  .sort((a, b) => b.bytes - a.bytes);

const totalBytes = files.reduce((s, f) => s + f.bytes, 0);
const totalMb    = totalBytes / (1024 * 1024);
const largest    = files[0];
const largestMb  = largest.bytes / (1024 * 1024);

console.log(`[bundle-budget] total=${totalMb.toFixed(2)}MB / ${TOTAL_MB}MB · largest=${largest.name} ${largestMb.toFixed(2)}MB / ${CHUNK_MB}MB`);
console.log('[bundle-budget] top 5:');
for (const f of files.slice(0, 5)) {
  console.log(`  ${(f.bytes / 1024).toFixed(0).padStart(6)} KB  ${f.name}`);
}

let failed = false;
if (totalMb > TOTAL_MB) {
  console.error(`[bundle-budget] FAIL — total ${totalMb.toFixed(2)}MB exceeds budget ${TOTAL_MB}MB`);
  failed = true;
}
if (largestMb > CHUNK_MB) {
  console.error(`[bundle-budget] FAIL — largest chunk ${largest.name} ${largestMb.toFixed(2)}MB exceeds budget ${CHUNK_MB}MB`);
  failed = true;
}

process.exit(failed ? 1 : 0);
