import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const COMMISSION_STATUS = ['pending', 'invoiced', 'collected', 'overdue', 'written_off'];

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const bucketize = (commissions) => {
  // Receivables aging buckets — only for pending / invoiced / overdue
  const buckets = { current: 0, b30: 0, b60: 0, b90: 0, b90plus: 0 };
  commissions.forEach(c => {
    if (c.status === 'collected' || c.status === 'written_off') return;
    const age = c.due_date ? daysSince(c.due_date) : 0;
    const outstanding = (c.amount_due || 0) - (c.amount_collected || 0);
    if (age <= 0)       buckets.current  += outstanding;
    else if (age <= 30) buckets.b30      += outstanding;
    else if (age <= 60) buckets.b60      += outstanding;
    else if (age <= 90) buckets.b90      += outstanding;
    else                buckets.b90plus  += outstanding;
  });
  return buckets;
};

export const useCommissions = (userId) => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setCommissions([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('commissions')
      .select('*, bookings(project_title), roster(talent_name)')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    if (error) {
      logger.error('useCommissions.load.failed', error);
      toast.error('Could not load commissions.');
      setCommissions([]);
    } else {
      setCommissions(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const addCommission = useCallback(async (row) => {
    if (!userId) return null;
    const payload = {
      user_id:          userId,
      booking_id:       row.booking_id,
      talent_id:        row.talent_id || null,
      amount_due:       row.amount_due,
      amount_collected: row.amount_collected || 0,
      due_date:         row.due_date || null,
      status:           row.status || 'pending',
      notes:            row.notes || null,
    };
    const { data, error } = await supabase.from('commissions').insert(payload).select().single();
    if (error) {
      logger.error('useCommissions.insert.failed', error);
      toast.error('Could not add commission.');
      return null;
    }
    setCommissions(prev => [data, ...prev]);
    return data;
  }, [userId]);

  const updateCommission = useCallback(async (id, updates) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('commissions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) {
      logger.error('useCommissions.update.failed', error);
      toast.error('Could not update commission.');
      return null;
    }
    setCommissions(prev => prev.map(c => c.id === id ? data : c));
    return data;
  }, [userId]);

  const deleteCommission = useCallback(async (id) => {
    if (!userId) return;
    const { error } = await supabase.from('commissions').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      logger.error('useCommissions.delete.failed', error);
      toast.error('Could not delete commission.');
      return;
    }
    setCommissions(prev => prev.filter(c => c.id !== id));
  }, [userId]);

  // Aggregations
  const totals = commissions.reduce((acc, c) => {
    const due = c.amount_due || 0;
    const col = c.amount_collected || 0;
    acc.totalDue     += due;
    acc.totalCollected += col;
    acc.totalOutstanding += (c.status === 'collected' || c.status === 'written_off') ? 0 : (due - col);
    return acc;
  }, { totalDue: 0, totalCollected: 0, totalOutstanding: 0 });

  const aging = bucketize(commissions);
  const overdueCount = commissions.filter(c => {
    if (c.status === 'collected' || c.status === 'written_off') return false;
    return c.due_date && daysSince(c.due_date) > 30;
  }).length;

  return {
    commissions, loading, totals, aging, overdueCount,
    addCommission, updateCommission, deleteCommission, reload,
  };
};
