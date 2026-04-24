import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const useNotifications = (userId) => {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const unreadCount = items.filter(n => !n.read_at).length;

  const reload = useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) { logger.error('useNotifications.load.failed', error); setItems([]); }
    else setItems(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  // Realtime subscription — new inserts prepend to list
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setItems(prev => [payload.new, ...prev].slice(0, 30));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markRead = useCallback(async (id) => {
    if (!userId) return;
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    setItems(prev => prev.map(n => n.read_at ? n : { ...n, read_at: now }));
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null);
  }, [userId]);

  return { items, unreadCount, loading, markRead, markAllRead, reload };
};
