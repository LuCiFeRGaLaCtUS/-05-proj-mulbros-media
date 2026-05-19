import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry on app boot. Safe to call multiple times — only first wins.
 * Mock mode if VITE_SENTRY_DSN unset.
 */
let initialized = false;

export const initSentry = () => {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    // Mock mode — no DSN configured
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release:     import.meta.env.VITE_APP_VERSION || 'dev',
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText:    true,
        blockAllMedia:  true,
      }),
    ],
    replaysSessionSampleRate: 0.0,  // Only capture replays on error
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Scrub auth tokens from error context
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers['x-stytch-session-jwt'];
        delete event.request.headers['x-stytch-session-token'];
      }
      return event;
    },
  });
  initialized = true;
};

/**
 * Tag the active Sentry scope with the current user (profile.id).
 * Called from useSupabaseSession after profile resolves.
 */
export const setSentryUser = (profile) => {
  if (!initialized) return;
  if (!profile) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id:       profile.id,
    email:    profile.email,
    username: profile.display_name || profile.email,
  });
};

export const captureError = (err, context = {}) => {
  if (!initialized) {
    // eslint-disable-next-line no-console
    console.error('[Sentry mock]', err, context);
    return;
  }
  Sentry.captureException(err, { extra: context });
};

export { Sentry };
