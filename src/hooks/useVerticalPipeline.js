import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

/**
 * Generic per-user Kanban pipeline hook.
 * Works for any table with (id, user_id, status, created_at) columns.
 */
export const useVerticalPipeline = (table, stages, userId, orderBy = 'created_at') => {
  const emptyGrouped = () => Object.fromEntries(stages.map(s => [s, []]));
  const [rows, setRows] = useState(emptyGrouped());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setRows(emptyGrouped()); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order(orderBy, { ascending: false });
    if (error) {
      logger.error(`useVerticalPipeline.${table}.load.failed`, error);
      toast.error(`Could not load ${table.replace('_', ' ')}.`);
      setRows(emptyGrouped());
    } else {
      const grouped = emptyGrouped();
      (data || []).forEach(r => { if (grouped[r.status]) grouped[r.status].push(r); });
      setRows(grouped);
    }
    setLoading(false);
  }, [table, userId, orderBy]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { reload(); }, [reload]);

  const add = useCallback(async (row) => {
    if (!userId) return null;
    const payload = { ...row, user_id: userId, status: row.status || stages[0] };
    const { data, error } = await supabase.from(table).insert(payload).select().single();
    if (error) {
      logger.error(`useVerticalPipeline.${table}.insert.failed`, error);
      toast.error('Could not save.');
      return null;
    }
    setRows(prev => ({ ...prev, [data.status]: [data, ...(prev[data.status] || [])] }));
    return data;
  }, [userId, table, stages]);

  const move = useCallback(async (id, from, to) => {
    if (!userId || from === to) return;
    setRows(prev => {
      const src  = [...(prev[from] || [])];
      const dest = [...(prev[to]   || [])];
      const idx  = src.findIndex(r => r.id === id);
      if (idx === -1) return prev;
      const [moved] = src.splice(idx, 1);
      dest.unshift({ ...moved, status: to });
      return { ...prev, [from]: src, [to]: dest };
    });
    const { error } = await supabase.from(table).update({ status: to }).eq('id', id).eq('user_id', userId);
    if (error) {
      logger.error(`useVerticalPipeline.${table}.move.failed`, error);
      toast.error('Could not update status.');
      reload();
    }
  }, [userId, table, reload]);

  const remove = useCallback(async (id) => {
    if (!userId) return;
    const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId);
    if (error) { toast.error('Could not delete.'); return; }
    setRows(prev => {
      const next = { ...prev };
      stages.forEach(s => { next[s] = (prev[s] || []).filter(r => r.id !== id); });
      return next;
    });
  }, [userId, table, stages]);

  return { rows, loading, add, move, remove, reload };
};
