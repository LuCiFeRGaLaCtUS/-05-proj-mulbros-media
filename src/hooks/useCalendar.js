import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/** Normalize a Supabase row to the shape CalendarView expects */
const normalize = (row) => ({
  ...row,
  date:          row.post_date  || row.date          || null,
  scheduledTime: row.post_time  || row.scheduledTime || null,
});

/** Map CalendarView post shape → Supabase column names */
const toRow = (post, userId) => ({
  user_id:   userId,
  talent:    post.talent,
  platform:  post.platform,
  status:    post.status   || 'draft',
  content:   post.content  || null,
  post_date: post.date     || post.post_date  || null,
  post_time: post.scheduledTime || post.post_time || null,
});

export const useCalendar = (userId) => {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('calendar_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
      .then(({ data }) => {
        setPosts((data || []).map(normalize));
        setLoading(false);
      });
  }, [userId]);

  const addPost = useCallback(async (post) => {
    const { data, error } = await supabase
      .from('calendar_posts')
      .insert(toRow(post, userId))
      .select()
      .single();
    if (!error && data) setPosts(prev => [...prev, normalize(data)]);
    return { data: data ? normalize(data) : null, error };
  }, [userId]);

  const updatePost = useCallback(async (id, changes) => {
    const dbChanges = {
      ...(changes.status    !== undefined && { status:    changes.status }),
      ...(changes.content   !== undefined && { content:   changes.content }),
      ...(changes.date      !== undefined && { post_date: changes.date }),
      ...(changes.post_date !== undefined && { post_date: changes.post_date }),
      ...(changes.scheduledTime !== undefined && { post_time: changes.scheduledTime }),
      ...(changes.post_time !== undefined && { post_time: changes.post_time }),
    };
    const { data, error } = await supabase
      .from('calendar_posts')
      .update(dbChanges)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) setPosts(prev => prev.map(p => p.id === id ? normalize(data) : p));
    return { data: data ? normalize(data) : null, error };
  }, []);

  const deletePost = useCallback(async (id) => {
    const { error } = await supabase.from('calendar_posts').delete().eq('id', id);
    if (!error) setPosts(prev => prev.filter(p => p.id !== id));
    return { error };
  }, []);

  const cycleStatus = useCallback(async (id, nextStatus) => {
    return updatePost(id, { status: nextStatus });
  }, [updatePost]);

  return { posts, loading, addPost, updatePost, deletePost, cycleStatus };
};
