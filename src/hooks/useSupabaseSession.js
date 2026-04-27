import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getStytchAuthHeaders } from '../lib/stytch';
import { logger } from '../lib/logger';

/**
 * Bridges Stytch session → Supabase JWT session AND owns the profile.
 *
 * Flow:
 * 1. Stytch user present → POST /api/auth/supabase-token with auth headers
 * 2. Server verifies Stytch session, looks up/creates profile, mints HS256 JWT
 *    (sub=profile.id, role=authenticated) and returns { access_token, profile }
 * 3. Client installs JWT via supabase.auth.setSession → auth.uid()=profile.id
 * 4. Subsequent Supabase queries pass RLS policies of form `user_id = auth.uid()`
 * 5. Auto-refresh 5 min before expiry
 *
 * Replaces direct Supabase reads/writes in useProfile (which fail under
 * tightened RLS where anon role has no policies).
 */
export const useSupabaseSession = (stytchUser) => {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [profileError, setProfileError] = useState(null);
  const refreshTimerRef = useRef(null);

  const fetchAndSet = useCallback(async () => {
    try {
      const headers = { 'Content-Type': 'application/json', ...getStytchAuthHeaders() };
      const email   = stytchUser?.emails?.[0]?.email ?? null;
      const res = await fetch('/api/auth/supabase-token', {
        method: 'POST',
        headers,
        body:   JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.text();
        logger.error('useSupabaseSession.fetch.failed', { status: res.status, body });
        setProfileError('Could not establish session. Please refresh.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!data?.access_token || !data?.profile?.id) {
        setProfileError('Invalid session response.');
        setLoading(false);
        return;
      }

      // Stytch users have no auth.users row, so supabase.auth.setSession()
      // fails its internal _getUser check. PostgREST + Realtime only need the
      // JWT claims (sub, role) to enforce RLS — install Authorization header
      // directly on the underlying clients instead.
      try {
        const bearer = `Bearer ${data.access_token}`;
        // PostgREST: mutate headers map (public field on PostgrestClient)
        if (supabase.rest && supabase.rest.headers) {
          supabase.rest.headers.Authorization = bearer;
        }
        // Storage: same pattern
        if (supabase.storage && supabase.storage.headers) {
          supabase.storage.headers.Authorization = bearer;
        }
        // Realtime: official setAuth API
        if (supabase.realtime && typeof supabase.realtime.setAuth === 'function') {
          supabase.realtime.setAuth(data.access_token);
        }
      } catch (err) {
        logger.error('useSupabaseSession.headerInstall.failed', err);
        setProfileError('Could not install Supabase session.');
        setLoading(false);
        return;
      }

      setProfile(data.profile);
      setProfileError(null);
      setLoading(false);

      // Schedule refresh
      const refreshIn = Math.max((data.expires_in - 300) * 1000, 60_000);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(fetchAndSet, refreshIn);
    } catch (err) {
      logger.error('useSupabaseSession.exception', err);
      setProfileError('Session bridge error.');
      setLoading(false);
    }
  }, [stytchUser?.user_id, stytchUser?.emails]);

  useEffect(() => {
    if (!stytchUser) {
      setProfile(null);
      setLoading(false);
      setProfileError(null);
      // Clear injected Authorization headers
      try {
        if (supabase.rest?.headers) delete supabase.rest.headers.Authorization;
        if (supabase.storage?.headers) delete supabase.storage.headers.Authorization;
        if (supabase.realtime?.setAuth) supabase.realtime.setAuth(null);
      } catch { /* noop */ }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }
    setLoading(true);
    fetchAndSet();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [stytchUser?.user_id, fetchAndSet]);

  // Profile updates go through Supabase under authenticated session
  const updateProfile = useCallback(async (updates) => {
    if (!profile?.id) return { data: null, error: new Error('No profile') };
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  }, [profile?.id]);

  return { profile, loading, profileError, updateProfile, setProfile };
};
