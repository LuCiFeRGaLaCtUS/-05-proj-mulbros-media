import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

/**
 * Tours + shows for the signed-in user.
 * Loads in parallel; exposes counts + nearest-show helper.
 */
export const useTours = (userId) => {
  const [tours,   setTours]   = useState([]);
  const [shows,   setShows]   = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setTours([]); setShows([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        supabase.from('tours').select('*').eq('user_id', userId).order('start_date', { ascending: false, nullsFirst: false }),
        supabase.from('shows').select('*').eq('user_id', userId).order('show_date',  { ascending: true,  nullsFirst: true  }),
      ]);
      if (t.error) logger.error('useTours.load.tours', t.error);
      if (s.error) logger.error('useTours.load.shows', s.error);
      setTours(t.data || []);
      setShows(s.data || []);
    } catch (err) {
      logger.error('useTours.load.exception', err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const counts = {
    tours:     tours.length,
    holds:     shows.filter(s => s.status === 'hold').length,
    confirmed: shows.filter(s => s.status === 'confirmed').length,
    complete:  shows.filter(s => s.status === 'complete').length,
    cancelled: shows.filter(s => s.status === 'cancelled').length,
  };

  const upcoming = shows
    .filter(s => s.show_date && new Date(s.show_date) >= new Date() && s.status !== 'cancelled')
    .slice(0, 10);

  const grossOfferTotal = shows
    .filter(s => s.status === 'confirmed' && s.gross_offer != null)
    .reduce((sum, s) => sum + Number(s.gross_offer), 0);

  return { tours, shows, loading, counts, upcoming, grossOfferTotal, reload };
};
