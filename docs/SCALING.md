# AI Operator — scaling notes

Single-dyno baseline. Track over time so we know when to add a second instance.

## Load test history

Run via `npm run load` (local) or `npm run load:prod`.

| When (UTC) | Env | Conns | Dur | RPS avg | p50 ms | p99 ms | Errors | Timeouts |
|---|---|---|---|---|---|---|---|---|
| 2026-06-04 11:00:29 | prod | 20 | 15s | 47 | 365 | 1355 | 0 | 0 |

## Interpretation

- Target = `/healthz` (deep probe: Express middleware stack + Supabase REST roundtrip)
- Does **NOT** include `/api/ai` (paid OpenAI tokens — would burn $)
- Single Render dyno, free tier
- ~47 RPS sustained with p50 ≈ 365ms is dominated by Supabase REST latency
- ~80kb/s output throughput

## Scale-up thresholds

Add a second dyno + Redis-backed rate limiters when:

| Signal | Threshold | Why |
|---|---|---|
| Sustained RPS | > 80% of last baseline (~38 RPS here) | Headroom for spikes |
| p99 latency | > 3000ms on /healthz | Supabase pool saturated or dyno CPU-bound |
| Render dyno restarts | > 1/day | Memory leak or OOM |
| /api/ai timeouts | > 1% of requests | Tool-call loop holding event-loop too long |
| Concurrent active users | > 50 | In-memory rate limiter state hits limits |

## Recommended next steps when triggered

1. Upgrade Render plan to multi-instance
2. Swap `express-rate-limit` in-memory store → `rate-limit-redis` (Upstash free tier)
3. Add session affinity (sticky cookies) only if Supabase Realtime team chat shows reconnect storms
4. Pre-warm second dyno on deploy hook to avoid cold-start tax during rollouts

## Out of scope (until scale forces it)

- Multi-region replication
- Read replicas (Supabase Pro)
- CDN tier (Cloudflare in front of Render)
- Job queue for webhooks (Mux + DocuSign currently sync)

## How to re-run

```bash
# Lightweight (safe for free tier)
LOAD_CONNECTIONS=20 LOAD_DURATION=15 npm run load:prod

# Full baseline (50 conns × 30s — only on a Render plan that can absorb it)
LOAD_CONNECTIONS=50 LOAD_DURATION=30 npm run load:prod
```

Each run appends one row to the table above.
