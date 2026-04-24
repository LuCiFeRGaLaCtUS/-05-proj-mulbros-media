import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const ACTOR_STAGES = ['Submitted', 'Audition Scheduled', 'Callback', 'Booked', 'Passed'];

const emptyGrouped = () => Object.fromEntries(ACTOR_STAGES.map(s => [s, []]));

const groupRows = (rows) => {
  const grouped = emptyGrouped();
  rows.forEach(row => {
    if (grouped[row.status]) grouped[row.status].push(row);
  });
  return grouped;
};

export const useActorSubmissions = (userId) => {
  const [submissions, setSubmissions] = useState(emptyGrouped());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setSubmissions(emptyGrouped()); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('actor_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      logger.error('useActorSubmissions.load.failed', error);
      toast.error('Could not load submissions.');
      setSubmissions(emptyGrouped());
    } else {
      setSubmissions(groupRows(data || []));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const addSubmission = useCallback(async (row) => {
    if (!userId) return null;
    const payload = {
      user_id:            userId,
      project_title:      row.project_title,
      role:               row.role || null,
      casting_director:   row.casting_director || null,
      production_company: row.production_company || null,
      audition_date:      row.audition_date || null,
      format:             row.format || 'self-tape',
      status:             row.status || 'Submitted',
      rate:               row.rate || null,
      notes:              row.notes || null,
      platform:           row.platform || null,
    };
    const { data, error } = await supabase.from('actor_submissions').insert(payload).select().single();
    if (error) {
      logger.error('useActorSubmissions.insert.failed', error);
      toast.error('Could not save submission.');
      return null;
    }
    setSubmissions(prev => ({ ...prev, [data.status]: [data, ...(prev[data.status] || [])] }));
    return data;
  }, [userId]);

  const moveSubmission = useCallback(async (id, from, to) => {
    if (!userId || from === to) return;
    setSubmissions(prev => {
      const src  = [...(prev[from] || [])];
      const dest = [...(prev[to]   || [])];
      const idx  = src.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const [moved] = src.splice(idx, 1);
      dest.unshift({ ...moved, status: to });
      return { ...prev, [from]: src, [to]: dest };
    });
    const { error } = await supabase
      .from('actor_submissions')
      .update({ status: to })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      logger.error('useActorSubmissions.move.failed', error);
      toast.error('Could not update status. Reloading…');
      reload();
    }
  }, [userId, reload]);

  const deleteSubmission = useCallback(async (id) => {
    if (!userId) return;
    const { error } = await supabase.from('actor_submissions').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      logger.error('useActorSubmissions.delete.failed', error);
      toast.error('Could not delete submission.');
      return;
    }
    setSubmissions(prev => {
      const next = { ...prev };
      ACTOR_STAGES.forEach(s => { next[s] = (prev[s] || []).filter(x => x.id !== id); });
      return next;
    });
  }, [userId]);

  return { submissions, loading, addSubmission, moveSubmission, deleteSubmission, reload };
};
