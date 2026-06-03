import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const useRoyaltyStatements = (userId) => {
  const [statements, setStatements] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setStatements([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('royalty_statements')
        .select('*')
        .eq('user_id', userId)
        .order('period_end', { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) logger.error('useRoyaltyStatements.load', error);
      setStatements(data || []);
    } catch (err) {
      logger.error('useRoyaltyStatements.exception', err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const totals = statements.reduce((acc, s) => {
    acc.gross += Number(s.gross_usd || 0);
    acc.net   += Number(s.net_usd   || 0);
    acc.anomalies += (Array.isArray(s.anomalies) ? s.anomalies.length : 0);
    return acc;
  }, { gross: 0, net: 0, anomalies: 0 });

  return { statements, loading, totals, reload };
};
