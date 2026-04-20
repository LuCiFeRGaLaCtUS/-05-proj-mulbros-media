import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [session,   setSession]   = useState(null);
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  // null = not yet resolved; 'PASSWORD_RECOVERY' = reset link clicked; other = normal event
  const [authEvent, setAuthEvent] = useState(null);

  useEffect(() => {
    // onAuthStateChange fires immediately for the current session (including
    // SIGNED_IN from a recovery / verification link in the URL), so we
    // subscribe first and use getSession only as a fallback for environments
    // where the subscription doesn't fire synchronously.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthEvent(event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Fallback: covers edge cases where onAuthStateChange fires after a tick
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(prev => (prev !== undefined ? prev : session));
      setUser(prev    => (prev !== undefined ? prev : session?.user ?? null));
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
