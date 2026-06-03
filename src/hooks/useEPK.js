import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

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
 * Anonymous fetch of a published EPK by slug. Anonymous read allowed by RLS
 * when public = true.
 */
export const fetchPublicEPK = async (slug) => {
  if (!slug) return null;
  try {
    const { data, error } = await supabase
      .from('epk_kits')
      .select('slug, display_name, tagline, bio_md, hero_image_url, reel_mux_id, press_quotes, contact_email, public')
      .eq('slug', slug)
      .eq('public', true)
      .maybeSingle();
    if (error) { logger.error('fetchPublicEPK', error); return null; }
    return data || null;
  } catch (err) {
    logger.error('fetchPublicEPK.exception', err);
    return null;
  }
};
