import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

/**
 * Team chat: list channels visible to the signed-in user, load + subscribe
 * to a single channel's messages via Supabase Realtime.
 */
export const useTeamChannels = (userId) => {
  const [channels, setChannels] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setChannels([]); setLoading(false); return; }
    setLoading(true);
    try {
      // RLS filters to channels the user is owner_id OR ANY(member_ids).
      const { data, error } = await supabase
        .from('team_channels')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) logger.error('useTeamChannels.load', error);
      setChannels(data || []);
    } catch (err) {
      logger.error('useTeamChannels.exception', err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  return { channels, loading, reload };
};

export const useTeamMessages = (channelId, userId) => {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const subRef = useRef(null);

  // Load history
  useEffect(() => {
    if (!channelId) { setMessages([]); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('team_messages')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })
          .limit(500);
        if (cancelled) return;
        if (error) logger.error('useTeamMessages.load', error);
        setMessages(data || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [channelId]);

  // Realtime subscription
  useEffect(() => {
    if (!channelId) return undefined;
    const ch = supabase
      .channel(`team:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessages((prev) =>
            prev.find((m) => m.id === payload.new.id) ? prev : [...prev, payload.new],
          );
        },
      )
      .subscribe();
    subRef.current = ch;
    return () => {
      try { supabase.removeChannel(ch); } catch (e) { /* noop */ }
    };
  }, [channelId]);

  const send = useCallback(async (body) => {
    if (!channelId || !userId || !body?.trim()) return false;
    setSending(true);
    try {
      const { error } = await supabase.from('team_messages').insert({
        channel_id: channelId,
        sender_id:  userId,
        body:       body.trim(),
      });
      if (error) { logger.error('useTeamMessages.send', error); return false; }
      return true;
    } finally {
      setSending(false);
    }
  }, [channelId, userId]);

  return { messages, loading, sending, send };
};
