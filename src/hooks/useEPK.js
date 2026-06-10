import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { getStytchAuthHeaders } from '../lib/stytch';

/**
 * EPK kit for the signed-in user. Single row per user (user_id unique-ish).
 */
export const useEPK = (userId) => {
  const [kit,     setKit]     = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setKit(null); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('epk_kits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) logger.error('useEPK.load', error);
      setKit(data || null);
    } catch (err) {
      logger.error('useEPK.exception', err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  return { kit, loading, reload };
};

/**
 * Fetch an EPK by slug for the public page. Hits /api/epk/:slug, which returns
 * the kit when it is published OR when the (optionally authenticated) caller
 * owns it — so a signed-in owner can preview their own unpublished kit, while
 * anonymous visitors only ever see published kits. Returns the kit plus an
 * `owner` flag, or null if not found / private to others.
 */
export const fetchPublicEPK = async (slug) => {
  if (!slug) return null;
  try {
    const res = await fetch(`/api/epk/${encodeURIComponent(slug)}`, {
      headers: { ...getStytchAuthHeaders() },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    logger.error('fetchPublicEPK.exception', err);
    return null;
  }
};
