import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const AUDITION_STAGES = ['submitted', 'callback', 'booked', 'pass', 'no_response'];

export const AUDITION_STAGE_LABELS = {
  submitted:    'Submitted',
  callback:     'Callback',
  booked:       'Booked',
  pass:         'Pass',
  no_response:  'No response',
};

const emptyGrouped = () => Object.fromEntries(AUDITION_STAGES.map(s => [s, []]));

const groupRows = (rows) => {
  const grouped = emptyGrouped();
  rows.forEach(row => {
    if (grouped[row.status]) grouped[row.status].push(row);
  });
  return grouped;
};

export const useAuditions = (userId) => {
  const [auditions, setAuditions] = useState(emptyGrouped());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setAuditions(emptyGrouped()); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('auditions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      logger.error('useAuditions.load.failed', error);
      toast.error('Could not load auditions.');
      setAuditions(emptyGrouped());
    } else {
      setAuditions(groupRows(data || []));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const addAudition = useCallback(async (row) => {
    if (!userId) return null;
    const payload = {
      user_id:          userId,
      project_title:    row.project_title,
      role_name:        row.role_name || null,
      casting_director: row.casting_director || null,
      audition_type:    row.audition_type || 'self_tape',
      audition_at:      row.audition_at || null,
      status:           row.status || 'submitted',
      notes:            row.notes || null,
      source:           row.source || null,
      source_url:       row.source_url || null,
      paying_rate:      row.paying_rate || null,
      deadline:         row.deadline || null,
    };
    const { data, error } = await supabase.from('auditions').insert(payload).select().single();
    if (error) {
      logger.error('useAuditions.insert.failed', error);
      toast.error('Could not save audition.');
      return null;
    }
    setAuditions(prev => ({ ...prev, [data.status]: [data, ...(prev[data.status] || [])] }));
    return data;
  }, [userId]);

  const moveAudition = useCallback(async (id, from, to) => {
    if (!userId || from === to) return;
    setAuditions(prev => {
      const src  = [...(prev[from] || [])];
      const dest = [...(prev[to]   || [])];
      const idx  = src.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const [moved] = src.splice(idx, 1);
      dest.unshift({ ...moved, status: to });
      return { ...prev, [from]: src, [to]: dest };
    });
    const { error } = await supabase
      .from('auditions')
      .update({ status: to })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      logger.error('useAuditions.move.failed', error);
      toast.error('Could not update status. Reloading…');
      reload();
    }
  }, [userId, reload]);

  const deleteAudition = useCallback(async (id) => {
    if (!userId) return;
    const { error } = await supabase.from('auditions').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      logger.error('useAuditions.delete.failed', error);
      toast.error('Could not delete audition.');
      return;
    }
    setAuditions(prev => {
      const next = { ...prev };
      AUDITION_STAGES.forEach(s => { next[s] = (prev[s] || []).filter(x => x.id !== id); });
      return next;
    });
  }, [userId]);

  // Aggregate counts for dashboard
  const counts = {
    total:        AUDITION_STAGES.reduce((sum, s) => sum + (auditions[s]?.length || 0), 0),
    submitted:    auditions.submitted?.length || 0,
    callback:     auditions.callback?.length || 0,
    booked:       auditions.booked?.length || 0,
    pass:         auditions.pass?.length || 0,
    no_response:  auditions.no_response?.length || 0,
  };

  // Callback rate = callbacks + bookings / total submitted
  const callbackRate = counts.total > 0
    ? Math.round(((counts.callback + counts.booked) / counts.total) * 100)
    : 0;

  return { auditions, loading, counts, callbackRate, addAudition, moveAudition, deleteAudition, reload };
};
