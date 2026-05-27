import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, setSupabaseAuth } from '../lib/supabase';
import { getStytchAuthHeaders } from '../lib/stytch';
import { logger } from '../lib/logger';
import { setSentryUser } from '../lib/sentry';

/**
 * Bridges Stytch session → Supabase JWT session AND owns the profile.
 *
 * Flow:
 * 1. Stytch user present → POST /api/auth/supabase-token with auth headers
 * 2. Server verifies Stytch session, looks up/creates profile, mints HS256 JWT
 *    (sub=profile.id, role=authenticated) and returns { access_token, profile }
 * 3. Client installs JWT via custom fetch interceptor in lib/supabase.js
 * 4. Subsequent Supabase queries pass RLS: auth.uid() = profile.id
 * 5. Auto-refresh 5 min before expiry
 */
export const useSupabaseSession = (stytchUser) => {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [profileError, setProfileError] = useState(null);

  const refreshTimerRef = useRef(null);
  // Guards against duplicate in-flight token mints when the effect re-runs
  // (fetchAndSet identity change / re-render) before the first resolves.
  const inFlightRef     = useRef(false);
  // Stable ref to latest fetchAndSet — used by the refresh timer so it
  // always calls the current closure without being a dep of useCallback.
  const fetchAndSetRef  = useRef(null);
  // Stable ref to latest profile — lets updateProfile read the current id
  // without recreating the callback on every profile state change.
  const profileRef      = useRef(null);

  const fetchAndSet = useCallback(async () => {
    // POST with 8s timeout; retry once on timeout/network failure before
    // surfacing an error. Prevents infinite FullScreenLoader if the
    // token-mint endpoint stalls.
    const postOnce = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const headers = { 'Content-Type': 'application/json', ...getStytchAuthHeaders() };
        const email   = stytchUser?.emails?.[0]?.email ?? null;
        return await fetch('/api/auth/supabase-token', {
          method: 'POST',
          headers,
          body:   JSON.stringify({ email }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    };

    // Skip if a mint is already running — avoids the duplicate
    // /api/auth/supabase-token POST seen on initial load.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      let res;
      try {
        res = await postOnce();
      } catch (firstErr) {
        logger.warn?.('useSupabaseSession.fetch.retry', { reason: firstErr?.name || 'error' });
        await new Promise(r => setTimeout(r, 1500));
        res = await postOnce();
      }
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

      setSupabaseAuth(data.access_token);
      setProfile(data.profile);
      setSentryUser(data.profile);
      setProfileError(null);
      setLoading(false);

      // Schedule re-auth 5 min before expiry; use ref so timer always
      // calls the latest version of fetchAndSet without circular deps.
      const refreshIn = Math.max((data.expires_in - 300) * 1000, 60_000);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(
        () => fetchAndSetRef.current?.(),
        refreshIn,
      );
    } catch (err) {
      logger.error('useSupabaseSession.exception', err);
      setProfileError('Session bridge error.');
      setLoading(false);
    } finally {
      inFlightRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stytchUser?.user_id, stytchUser?.emails]);

  // Sync refs inside effects — not during render — to satisfy React Compiler.
  useEffect(() => { fetchAndSetRef.current = fetchAndSet; });
  useEffect(() => { profileRef.current = profile; });

  useEffect(() => {
    if (!stytchUser) {
      setProfile(null);
      setSentryUser(null);
      setLoading(false);
      setProfileError(null);
      setSupabaseAuth(null);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stytchUser?.user_id, fetchAndSet]);

  // updateProfile — stable identity; reads current profile.id via ref.
  const updateProfile = useCallback(async (updates) => {
    const id = profileRef.current?.id;
    if (!id) return { data: null, error: new Error('No profile') };
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  }, []); // stable — reads profile.id from ref at call time

  return { profile, loading, profileError, updateProfile, setProfile };
};
