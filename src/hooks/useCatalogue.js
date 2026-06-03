import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

/**
 * Releases + tracks + royalty_splits for the signed-in user.
 * Loads in parallel. Exposes per-track split totals + warnings when
 * splits don't sum to 10000 bps.
 */
export const useCatalogue = (userId) => {
  const [releases, setReleases] = useState([]);
  const [tracks,   setTracks]   = useState([]);
  const [splits,   setSplits]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setReleases([]); setTracks([]); setSplits([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [r, t, s] = await Promise.all([
        supabase.from('releases').select('*').eq('user_id', userId).order('release_date', { ascending: false, nullsFirst: false }),
        supabase.from('tracks').select('*').eq('user_id', userId).order('position',     { ascending: true, nullsFirst: true }),
        supabase.from('royalty_splits').select('*').eq('user_id', userId),
      ]);
      if (r.error) logger.error('useCatalogue.releases', r.error);
      if (t.error) logger.error('useCatalogue.tracks',   t.error);
      if (s.error) logger.error('useCatalogue.splits',   s.error);
      setReleases(r.data || []);
      setTracks(t.data || []);
      setSplits(s.data || []);
    } catch (err) {
      logger.error('useCatalogue.exception', err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  // Per-track split sum + balance warning (must total 10000 bps).
  const splitTotalByTrack = splits.reduce((acc, s) => {
    acc[s.track_id] = (acc[s.track_id] || 0) + (s.share_bps || 0);
    return acc;
  }, {});

  const tracksByRelease = tracks.reduce((acc, t) => {
    (acc[t.release_id] = acc[t.release_id] || []).push(t);
    return acc;
  }, {});
  const splitsByTrack = splits.reduce((acc, s) => {
    (acc[s.track_id] = acc[s.track_id] || []).push(s);
    return acc;
  }, {});

  return {
    releases, tracks, splits, loading,
    tracksByRelease, splitsByTrack, splitTotalByTrack,
    reload,
  };
};
