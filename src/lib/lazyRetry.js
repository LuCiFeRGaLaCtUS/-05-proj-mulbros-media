import { lazy } from 'react';

/**
 * Drop-in replacement for React.lazy that survives the classic
 * "Failed to fetch dynamically imported module" error.
 *
 * That error happens when a user has the SPA open during a new deploy:
 * index.html in memory references chunk hashes that no longer exist on the
 * server (the build replaced them). The lazy import then 404s.
 *
 * Strategy:
 *   1. Retry the import a few times (handles a transient network blip / the
 *      brief window mid-deploy when the new chunk isn't served yet).
 *   2. If it still fails, force ONE full reload — the fresh index.html points
 *      at the current chunk hashes. A sessionStorage guard prevents a reload
 *      loop if the chunk is genuinely broken (then it surfaces to the
 *      ErrorBoundary instead).
 */
const RELOAD_GUARD = 'lazyRetry.reloaded';

export function lazyRetry(factory, retries = 2) {
  return lazy(async () => {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const mod = await factory();
        // Success — clear the guard so a future deploy can reload again.
        try { sessionStorage.removeItem(RELOAD_GUARD); } catch { /* noop */ }
        return mod;
      } catch (err) {
        lastErr = err;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        }
      }
    }
    // Retries exhausted — almost always a stale chunk after a deploy.
    try {
      if (!sessionStorage.getItem(RELOAD_GUARD)) {
        sessionStorage.setItem(RELOAD_GUARD, String(Date.now()));
        window.location.reload();
        return new Promise(() => {}); // never resolves; the reload takes over
      }
    } catch { /* sessionStorage blocked — fall through to throw */ }
    throw lastErr;
  });
}
