import { StytchUIClient } from '@stytch/vanilla-js';

export const stytch = new StytchUIClient(import.meta.env.VITE_STYTCH_PUBLIC_TOKEN);

// Expose on window in non-SSR contexts so browser DevTools can inspect session.
// Enables quick diagnostics:
//   window.stytch.session.getTokens()
if (typeof window !== 'undefined') {
   
  window.stytch = stytch;
}

// Cookie reader fallback — Stytch stores non-httpOnly cookies named
// `stytch_session` and `stytch_session_jwt` that our server can also read.
const readCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
};

/**
 * Returns auth headers for protected proxy endpoints.
 * Tries multiple access paths because @stytch/vanilla-js exposes session
 * differently across versions.
 */
export const getStytchAuthHeaders = () => {
  // Path 1: canonical vanilla-js API
  try {
    const tokens = stytch.session?.getTokens?.();
    if (tokens?.session_jwt)   return { 'X-Stytch-Session-Jwt':   tokens.session_jwt };
    if (tokens?.session_token) return { 'X-Stytch-Session-Token': tokens.session_token };
  } catch { /* noop */ }

  // Path 2: session object direct fields (older/newer SDK variants)
  try {
    const s = stytch.session;
    const jwt = s?.session_jwt   || s?.getInfo?.()?.session_jwt;
    const tok = s?.session_token || s?.getInfo?.()?.session_token;
    if (jwt) return { 'X-Stytch-Session-Jwt': jwt };
    if (tok) return { 'X-Stytch-Session-Token': tok };
  } catch { /* noop */ }

  // Path 3: cookie fallback (Stytch sets these non-httpOnly by default)
  const cookieJwt   = readCookie('stytch_session_jwt');
  const cookieToken = readCookie('stytch_session');
  if (cookieJwt)   return { 'X-Stytch-Session-Jwt':   cookieJwt };
  if (cookieToken) return { 'X-Stytch-Session-Token': cookieToken };

  return {};
};
