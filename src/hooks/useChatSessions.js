import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const useChatSessions = (userId) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setSessions([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(100);
    if (error) {
      logger.error('useChatSessions.load.failed', error);
      setSessions([]);
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const createSession = useCallback(async (title = 'New chat') => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title, last_message_at: new Date().toISOString() })
      .select()
      .single();
    if (error) {
      logger.error('useChatSessions.create.failed', error);
      toast.error('Could not create chat');
      return null;
    }
    setSessions(prev => [data, ...prev]);
    return data;
  }, [userId]);

  const renameSession = useCallback(async (id, title) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
    await supabase.from('chat_sessions').update({ title }).eq('id', id).eq('user_id', userId);
  }, [userId]);

  const touchSession = useCallback(async (id) => {
    const now = new Date().toISOString();
    setSessions(prev => {
      const next = prev.map(s => s.id === id ? { ...s, last_message_at: now } : s);
      next.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
      return next;
    });
    await supabase.from('chat_sessions').update({ last_message_at: now }).eq('id', id).eq('user_id', userId);
  }, [userId]);

  const deleteSession = useCallback(async (id) => {
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id).eq('user_id', userId);
    if (error) { toast.error('Could not delete chat'); return; }
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [userId]);

  return { sessions, loading, createSession, renameSession, touchSession, deleteSession, reload };
};
