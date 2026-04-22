import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Optimistic rows need a stable local id so React keys don't collide before the
// real DB row comes back. tempId is replaced with row.id after insert.
const genTempId = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useAgentChats = (userId, agentId) => {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!userId || !agentId) return;
    setLoading(true);
    setMessages([]);
    supabase
      .from('agent_chats')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) {
          logger.error('useAgentChats.load.failed', error);
          toast.error('Could not load chat history.');
        }
        setMessages(
          (data || []).map(row => ({
            role:      row.role,
            content:   row.content,
            timestamp: formatTime(row.created_at),
            _id:       row.id,
          }))
        );
        setLoading(false);
      });
  }, [userId, agentId]);

  const addMessage = useCallback(async (role, content) => {
    const tempId = genTempId();
    const optimistic = {
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      _id:       tempId,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { data, error } = await supabase
        .from('agent_chats')
        .insert({ user_id: userId, agent_id: agentId, role, content })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setMessages(prev => prev.map(m => (m._id === tempId ? { ...m, _id: data.id } : m)));
      }
    } catch (err) {
      logger.error('useAgentChats.insert.failed', err);
      toast.error('Message not saved — may be lost on refresh.');
    }
  }, [userId, agentId]);

  const clearHistory = useCallback(async () => {
    try {
      const { error } = await supabase.from('agent_chats').delete().eq('user_id', userId).eq('agent_id', agentId);
      if (error) throw error;
      setMessages([]);
    } catch (err) {
      logger.error('useAgentChats.clear.failed', err);
      toast.error('Could not clear history.');
    }
  }, [userId, agentId]);

  return { messages, loading, addMessage, clearHistory };
};
