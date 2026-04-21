import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// user is a Stytch user object — identifier is user.user_id
// Profiles are stored in Supabase, looked up by stytch_user_id column.
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
      .eq('stytch_user_id', user.user_id)
      .single()
      .then(async ({ data, error }) => {
        if (data) {
          setProfile(data);
          setLoading(false);
        } else {
          // First login — profile doesn't exist yet, create it automatically
          const email = user.emails?.[0]?.email ?? null;
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              stytch_user_id: user.user_id,
              email,
              onboarding_complete: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (newProfile) setProfile(newProfile);
          if (insertError) console.error('useProfile: failed to create profile', insertError);
          setLoading(false);
        }
      });
  }, [user?.user_id]);

  const updateProfile = async (updates) => {
    if (!user) return { data: null, error: new Error('No user') };
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('stytch_user_id', user.user_id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  };

  return { profile, loading, updateProfile, setProfile };
};
