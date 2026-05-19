import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const ROSTER_STATUS = ['active', 'inactive', 'dropped'];

export const UNION_OPTIONS = [
  { id: '',           label: 'Non-union / Unspecified' },
  { id: 'SAG-AFTRA',  label: 'SAG-AFTRA' },
  { id: 'Equity',     label: 'Equity (AEA)' },
  { id: 'ACTRA',      label: 'ACTRA (Canada)' },
  { id: 'AFM',        label: 'AFM (musicians)' },
  { id: 'Non-union',  label: 'Non-union (declared)' },
];

export const useRoster = (userId) => {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setRoster([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('roster')
      .select('*')
      .eq('user_id', userId)
      .order('signed_at', { ascending: false });
    if (error) {
      logger.error('useRoster.load.failed', error);
      toast.error('Could not load roster.');
      setRoster([]);
    } else {
      setRoster(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const addTalent = useCallback(async (row) => {
    if (!userId) return null;
    const payload = {
      user_id:         userId,
      talent_name:     row.talent_name,
      email:           row.email || null,
      phone:           row.phone || null,
      union_status:    row.union_status || null,
      disciplines:     row.disciplines || [],
      skills:          row.skills || [],
      availability:    row.availability || null,
      headshot_url:    row.headshot_url || null,
      reel_url:        row.reel_url || null,
      bio:             row.bio || null,
      imdb_url:        row.imdb_url || null,
      status:          row.status || 'active',
      commission_rate: row.commission_rate != null ? row.commission_rate : 10.00,
    };
    const { data, error } = await supabase.from('roster').insert(payload).select().single();
    if (error) {
      logger.error('useRoster.insert.failed', error);
      toast.error('Could not add talent.');
      return null;
    }
    setRoster(prev => [data, ...prev]);
    return data;
  }, [userId]);

  const updateTalent = useCallback(async (id, updates) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('roster')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) {
      logger.error('useRoster.update.failed', error);
      toast.error('Could not update talent.');
      return null;
    }
    setRoster(prev => prev.map(t => t.id === id ? data : t));
    return data;
  }, [userId]);

  const deleteTalent = useCallback(async (id) => {
    if (!userId) return;
    const { error } = await supabase.from('roster').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      logger.error('useRoster.delete.failed', error);
      toast.error('Could not delete talent.');
      return;
    }
    setRoster(prev => prev.filter(t => t.id !== id));
  }, [userId]);

  // Aggregations
  const counts = {
    total:    roster.length,
    active:   roster.filter(t => t.status === 'active').length,
    inactive: roster.filter(t => t.status === 'inactive').length,
    dropped:  roster.filter(t => t.status === 'dropped').length,
  };

  return { roster, loading, counts, addTalent, updateTalent, deleteTalent, reload };
};
