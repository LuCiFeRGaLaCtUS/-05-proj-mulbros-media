import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useProfile = (user) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data);
        setLoading(false);
      });
  }, [user?.id]);

  const updateProfile = async (updates) => {
    if (!user) return { data: null, error: new Error('No user') };
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  };

  return { profile, loading, updateProfile, setProfile };
};
