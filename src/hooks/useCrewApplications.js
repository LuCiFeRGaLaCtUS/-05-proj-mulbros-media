import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const CREW_STAGES = ['Applied', 'Viewed', 'Interview', 'Booked', 'Passed'];

const emptyGrouped = () => Object.fromEntries(CREW_STAGES.map(s => [s, []]));

const groupRows = (rows) => {
  const grouped = emptyGrouped();
  rows.forEach(row => {
    if (grouped[row.status]) grouped[row.status].push(row);
  });
  return grouped;
};

export const useCrewApplications = (userId) => {
  const [applications, setApplications] = useState(emptyGrouped());
  const [loading, setLoading]           = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setApplications(emptyGrouped()); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('crew_applications')
      .select('*')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });
    if (error) {
      logger.error('useCrewApplications.load.failed', error);
      toast.error('Could not load your applications.');
      setApplications(emptyGrouped());
    } else {
      setApplications(groupRows(data || []));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const addApplication = useCallback(async (row) => {
    if (!userId) return;
    const payload = {
      user_id:          userId,
      production_title: row.production_title,
      role:             row.role,
      location:         row.location || null,
      union_status:     row.union_status || null,
      status:           'Applied',
      notes:            row.notes || null,
      metadata:         row.metadata || {},
    };
    const { data, error } = await supabase.from('crew_applications').insert(payload).select().single();
    if (error) {
      logger.error('useCrewApplications.insert.failed', error);
      toast.error('Could not save application.');
      return null;
    }
    setApplications(prev => ({ ...prev, Applied: [data, ...prev.Applied] }));
    return data;
  }, [userId]);

  const moveApplication = useCallback(async (appId, fromStatus, toStatus) => {
    if (!userId || fromStatus === toStatus) return;
    // Optimistic local move
    setApplications(prev => {
      const src  = [...(prev[fromStatus] || [])];
      const dest = [...(prev[toStatus]   || [])];
      const idx  = src.findIndex(a => a.id === appId);
      if (idx === -1) return prev;
      const [moved] = src.splice(idx, 1);
      dest.unshift({ ...moved, status: toStatus });
      return { ...prev, [fromStatus]: src, [toStatus]: dest };
    });
    const { error } = await supabase
      .from('crew_applications')
      .update({ status: toStatus })
      .eq('id', appId)
      .eq('user_id', userId);
    if (error) {
      logger.error('useCrewApplications.move.failed', error);
      toast.error('Could not update status. Reloading…');
      reload();
    }
  }, [userId, reload]);

  const deleteApplication = useCallback(async (appId) => {
    if (!userId) return;
    const { error } = await supabase
      .from('crew_applications')
      .delete()
      .eq('id', appId)
      .eq('user_id', userId);
    if (error) {
      logger.error('useCrewApplications.delete.failed', error);
      toast.error('Could not delete application.');
      return;
    }
    setApplications(prev => {
      const next = { ...prev };
      CREW_STAGES.forEach(s => { next[s] = (prev[s] || []).filter(a => a.id !== appId); });
      return next;
    });
  }, [userId]);

  return { applications, loading, addApplication, moveApplication, deleteApplication, reload };
};
