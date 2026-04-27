import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

// External auth bridge: Stytch session → custom Supabase JWT (HS256, sub=profile.id).
// Stytch users have no auth.users row, so supabase.auth.setSession() fails its
// internal _getUser validation. PostgREST + Realtime only need the JWT in the
// Authorization header to enforce RLS. We inject it via a custom fetch that
// reads the current token at request time, plus realtime.setAuth() for sockets.
const tokenRef = { current: null };

export const setSupabaseAuth = (token) => {
  tokenRef.current = token || null;
  if (supabase?.realtime?.setAuth) {
    try { supabase.realtime.setAuth(token || null); } catch { /* noop */ }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // We manage auth ourselves via setSupabaseAuth — disable supabase-js's own
    // session storage to avoid conflicts.
    persistSession:     false,
    autoRefreshToken:   false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (input, init = {}) => {
      const headers = new Headers(init.headers || {});
      if (tokenRef.current) {
        headers.set('Authorization', `Bearer ${tokenRef.current}`);
      }
      return fetch(input, { ...init, headers });
    },
  },
});
