import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

/**
 * Generic list+CRUD hook for a user-scoped table.
 * @param {string} table — Supabase table name
 * @param {string} userId — profile.id
 * @param {string} orderBy — column for ordering (default created_at desc)
 */
export const useUserTable = (table, userId, orderBy = 'created_at') => {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order(orderBy, { ascending: false });
    if (error) {
      logger.error(`useUserTable.${table}.load.failed`, error);
      toast.error(`Could not load ${table.replace('_', ' ')}.`);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, [table, userId, orderBy]);

  useEffect(() => { reload(); }, [reload]);

  const add = useCallback(async (row) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from(table)
      .insert({ ...row, user_id: userId })
      .select()
      .single();
    if (error) {
      logger.error(`useUserTable.${table}.insert.failed`, error);
      toast.error('Could not save.');
      return null;
    }
    setRows(prev => [data, ...prev]);
    return data;
  }, [table, userId]);

  const update = useCallback(async (id, patch) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) {
      logger.error(`useUserTable.${table}.update.failed`, error);
      toast.error('Could not update.');
      return null;
    }
    setRows(prev => prev.map(r => r.id === id ? data : r));
    return data;
  }, [table, userId]);

  const remove = useCallback(async (id) => {
    if (!userId) return;
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      logger.error(`useUserTable.${table}.delete.failed`, error);
      toast.error('Could not delete.');
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  }, [table, userId]);

  return { rows, loading, add, update, remove, reload };
};

export const useInvoices  = (userId) => useUserTable('invoices',  userId, 'created_at');
export const useContracts = (userId) => useUserTable('contracts', userId, 'created_at');
export const usePayments  = (userId) => useUserTable('payments',  userId, 'received_date');
