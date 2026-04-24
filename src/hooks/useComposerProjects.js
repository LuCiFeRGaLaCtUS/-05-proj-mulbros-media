import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { COMPOSER_PROJECT_STAGES } from '../config/composerOpportunitiesMock';

const emptyGrouped = () => Object.fromEntries(COMPOSER_PROJECT_STAGES.map(s => [s, []]));

const groupRows = (rows) => {
  const grouped = emptyGrouped();
  rows.forEach(row => {
    if (grouped[row.status]) grouped[row.status].push(row);
  });
  return grouped;
};

export const useComposerProjects = (userId) => {
  const [projects, setProjects] = useState(emptyGrouped());
  const [loading, setLoading]   = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setProjects(emptyGrouped()); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('composer_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      logger.error('useComposerProjects.load.failed', error);
      toast.error('Could not load your projects.');
      setProjects(emptyGrouped());
    } else {
      setProjects(groupRows(data || []));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const addProject = useCallback(async (row) => {
    if (!userId) return null;
    const payload = {
      user_id:      userId,
      title:        row.title,
      director:     row.director || null,
      platform:     row.platform || null,
      genre:        row.genre || null,
      budget_range: row.budget_range || null,
      status:       row.status || 'Pitching',
      notes:        row.notes || null,
      metadata:     row.metadata || {},
    };
    const { data, error } = await supabase.from('composer_projects').insert(payload).select().single();
    if (error) {
      logger.error('useComposerProjects.insert.failed', error);
      toast.error('Could not save project.');
      return null;
    }
    setProjects(prev => ({ ...prev, [data.status]: [data, ...(prev[data.status] || [])] }));
    return data;
  }, [userId]);

  const moveProject = useCallback(async (projectId, fromStatus, toStatus) => {
    if (!userId || fromStatus === toStatus) return;
    setProjects(prev => {
      const src  = [...(prev[fromStatus] || [])];
      const dest = [...(prev[toStatus]   || [])];
      const idx  = src.findIndex(p => p.id === projectId);
      if (idx === -1) return prev;
      const [moved] = src.splice(idx, 1);
      dest.unshift({ ...moved, status: toStatus });
      return { ...prev, [fromStatus]: src, [toStatus]: dest };
    });
    const { error } = await supabase
      .from('composer_projects')
      .update({ status: toStatus })
      .eq('id', projectId)
      .eq('user_id', userId);
    if (error) {
      logger.error('useComposerProjects.move.failed', error);
      toast.error('Could not update status. Reloading…');
      reload();
    }
  }, [userId, reload]);

  const deleteProject = useCallback(async (projectId) => {
    if (!userId) return;
    const { error } = await supabase
      .from('composer_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);
    if (error) {
      logger.error('useComposerProjects.delete.failed', error);
      toast.error('Could not delete project.');
      return;
    }
    setProjects(prev => {
      const next = { ...prev };
      COMPOSER_PROJECT_STAGES.forEach(s => { next[s] = (prev[s] || []).filter(p => p.id !== projectId); });
      return next;
    });
  }, [userId]);

  return { projects, loading, addProject, moveProject, deleteProject, reload };
};
