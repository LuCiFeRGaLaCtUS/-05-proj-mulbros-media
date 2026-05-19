import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const SUBMISSION_STATUS = ['draft', 'pending_approval', 'sent', 'viewed', 'responded', 'no_response'];

export const SUBMISSION_STATUS_LABELS = {
  draft:            'Draft',
  pending_approval: 'Pending approval',
  sent:             'Sent',
  viewed:           'Viewed',
  responded:        'Responded',
  no_response:      'No response',
};

export const useSubmissions = (userId) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setSubmissions([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*, roster(talent_name), industry_contacts(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      logger.error('useSubmissions.load.failed', error);
      toast.error('Could not load submissions.');
      setSubmissions([]);
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const addSubmission = useCallback(async (row) => {
    if (!userId) return null;
    const payload = {
      user_id:             userId,
      talent_id:           row.talent_id || null,
      casting_director_id: row.casting_director_id || null,
      project_title:       row.project_title,
      role_name:           row.role_name || null,
      source:              row.source || null,
      source_url:          row.source_url || null,
      draft_content:       row.draft_content || null,
      status:              row.status || 'draft',
    };
    const { data, error } = await supabase.from('submissions').insert(payload).select().single();
    if (error) {
      logger.error('useSubmissions.insert.failed', error);
      toast.error('Could not save submission.');
      return null;
    }
    setSubmissions(prev => [data, ...prev]);
    return data;
  }, [userId]);

  const updateSubmission = useCallback(async (id, updates) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('submissions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) {
      logger.error('useSubmissions.update.failed', error);
      toast.error('Could not update submission.');
      return null;
    }
    setSubmissions(prev => prev.map(s => s.id === id ? data : s));
    return data;
  }, [userId]);

  const approveSubmission = useCallback(async (id) => {
    return updateSubmission(id, {
      status:           'sent',
      hitl_approved_at: new Date().toISOString(),
      sent_at:          new Date().toISOString(),
    });
  }, [updateSubmission]);

  const deleteSubmission = useCallback(async (id) => {
    if (!userId) return;
    const { error } = await supabase.from('submissions').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      logger.error('useSubmissions.delete.failed', error);
      toast.error('Could not delete submission.');
      return;
    }
    setSubmissions(prev => prev.filter(s => s.id !== id));
  }, [userId]);

  const counts = {
    total:           submissions.length,
    draft:           submissions.filter(s => s.status === 'draft').length,
    pendingApproval: submissions.filter(s => s.status === 'pending_approval').length,
    sent:            submissions.filter(s => s.status === 'sent').length,
    responded:       submissions.filter(s => s.status === 'responded').length,
  };

  return { submissions, loading, counts, addSubmission, updateSubmission, approveSubmission, deleteSubmission, reload };
};
