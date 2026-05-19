import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const CONTACT_TYPES = [
  { id: 'casting_director', label: 'Casting Director' },
  { id: 'producer',         label: 'Producer' },
  { id: 'director',         label: 'Director' },
  { id: 'agent',            label: 'Agent' },
  { id: 'manager',          label: 'Manager' },
  { id: 'scout',            label: 'Scout' },
  { id: 'other',            label: 'Other' },
];

export const useIndustryContacts = (userId) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setContacts([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('industry_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      logger.error('useIndustryContacts.load.failed', error);
      toast.error('Could not load contacts.');
      setContacts([]);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const addContact = useCallback(async (row) => {
    if (!userId) return null;
    const payload = {
      user_id:      userId,
      name:         row.name,
      contact_type: row.contact_type || 'other',
      email:        row.email || null,
      phone:        row.phone || null,
      company:      row.company || null,
      notes:        row.notes || null,
    };
    const { data, error } = await supabase.from('industry_contacts').insert(payload).select().single();
    if (error) {
      logger.error('useIndustryContacts.insert.failed', error);
      toast.error('Could not save contact.');
      return null;
    }
    setContacts(prev => [data, ...prev]);
    return data;
  }, [userId]);

  const deleteContact = useCallback(async (id) => {
    if (!userId) return;
    const { error } = await supabase.from('industry_contacts').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      logger.error('useIndustryContacts.delete.failed', error);
      toast.error('Could not delete contact.');
      return;
    }
    setContacts(prev => prev.filter(c => c.id !== id));
  }, [userId]);

  return { contacts, loading, addContact, deleteContact, reload };
};
