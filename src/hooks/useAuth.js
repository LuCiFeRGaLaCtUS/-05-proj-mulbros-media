import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── Detect password recovery from the URL immediately on page load ────────────
// Supabase implicit flow: hash contains #access_token=...&type=recovery
// Supabase PKCE flow:     query contains ?code=...  (type detected via event)
// We check the hash first so the reset form shows before any state resolves.
const getInitialAuthEvent = () => {
  try {
    const hash   = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const search = new URLSearchParams(window.location.search);
    if (hash.get('type') === 'recovery' || search.get('type') === 'recovery') {
      return 'PASSWORD_RECOVERY';
    }
  } catch { /* SSR guard */ }
  return null;
};

export const useAuth = () => {
  const [session,   setSession]   = useState(null);
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  // Initialised from URL so recovery is detected synchronously on first render
  const [authEvent, setAuthEvent] = useState(getInitialAuthEvent);

  useEffect(() => {
    // onAuthStateChange is the single source of truth.
    // Supabase v2 fires INITIAL_SESSION immediately on subscribe, so we do NOT
    // call getSession() — that caused a race where getSession resolved first
    // (setting loading=false without authEvent) before PASSWORD_RECOVERY fired.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthEvent(event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthEvent(null);
    [
      'mulbros_openai_key',
      'mulbros_settings',
      'mulbros_notifications',
      'mulbros_integration_toggles',
      'mulbros_theme',
    ].forEach(k => localStorage.removeItem(k));
  };

  return { session, user, loading, signOut, authEvent };
};
