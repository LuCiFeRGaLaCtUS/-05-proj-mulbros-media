import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

/**
 * Spotify integration state for a given profile.
 * Returns:
 *   connected    — boolean (has user_integrations row)
 *   stats        — { profile, top_tracks, recently_played, connected_at } from /api/spotify/artist-stats
 *   loading      — initial connection check + stats fetch
 *   error        — last error message
 *   connect()    — redirects browser to /api/spotify/auth?profile_id=…
 *   disconnect() — deletes the integration row (local revoke; doesn't revoke server-side app grant)
 *   refreshStats() — re-fetch /api/spotify/artist-stats
 */
export const useSpotifyIntegration = (profileId) => {
  const [connected, setConnected] = useState(false);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchStats = useCallback(async () => {
    if (!profileId) return;
    try {
      const r = await fetch(`/api/spotify/artist-stats?profile_id=${encodeURIComponent(profileId)}`);
      if (r.status === 404) {
        setConnected(false); setStats(null); return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error?.message || `stats HTTP ${r.status}`);
      setStats(d); setConnected(true); setError(null);
    } catch (err) {
      logger.error('useSpotifyIntegration.stats.failed', err);
      setError(err.message);
    }
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;
    if (!profileId) {
      // Defer to microtask so React doesn't flag setState-in-effect
      Promise.resolve().then(() => { if (!cancelled) setLoading(false); });
      return;
    }

    // 1. Check Supabase for existence (cheap) then fetch live stats
    (async () => {
      setLoading(true);
      const { data, error: selErr } = await supabase
        .from('user_integrations')
        .select('id, created_at')
        .eq('user_id', profileId)
        .eq('service', 'spotify')
        .maybeSingle();

      if (cancelled) return;

      if (selErr) {
        logger.error('useSpotifyIntegration.check.failed', selErr);
        setError(selErr.message); setLoading(false); return;
      }
      if (!data) {
        setConnected(false); setStats(null); setLoading(false); return;
      }
      setConnected(true);
      await fetchStats();
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [profileId, fetchStats]);

  const connect = useCallback(() => {
    if (!profileId) return;
    window.location.href = `/api/spotify/auth?profile_id=${encodeURIComponent(profileId)}`;
  }, [profileId]);

  const disconnect = useCallback(async () => {
    if (!profileId) return;
    const { error: delErr } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', profileId)
      .eq('service', 'spotify');
    if (delErr) {
      logger.error('useSpotifyIntegration.disconnect.failed', delErr);
      setError(delErr.message);
      return;
    }
    setConnected(false); setStats(null);
  }, [profileId]);

  return { connected, stats, loading, error, connect, disconnect, refreshStats: fetchStats };
};
