import { StytchUIClient } from '@stytch/vanilla-js';

export const stytch = new StytchUIClient(import.meta.env.VITE_STYTCH_PUBLIC_TOKEN);

/**
 * Returns auth headers for protected proxy endpoints.
 * Empty object if no active session — callers that require auth should surface a
 * toast when the server responds 401.
 */
export const getStytchAuthHeaders = () => {
  try {
    const tokens = stytch.session?.getTokens?.();
    if (tokens?.session_jwt)   return { 'X-Stytch-Session-Jwt':   tokens.session_jwt };
    if (tokens?.session_token) return { 'X-Stytch-Session-Token': tokens.session_token };
  } catch {
    /* no session */
  }
  return {};
};
