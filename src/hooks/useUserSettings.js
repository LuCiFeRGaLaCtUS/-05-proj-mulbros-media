import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULTS = {
  settings: {
    organization:   'Mulbros Entertainment LLC',
    engagementType: 'AI-Native Multi-Agent System',
    vendor:         'FSZT Partners LLC',
    methodology:    '4D Framework (Diagnose, Design, Deploy, Defend)',
  },
  notifications: {
    inApp: true, email: false, slack: false,
    dailyDigest: true, agentErrors: true, campaignMilestones: true,
  },
};

export const useUserSettings = (userId) => {
  const [settings,      setSettings]      = useState(DEFAULTS.settings);
  const [notifications, setNotifications] = useState(DEFAULTS.notifications);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_settings')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettings({
            organization:   data.organization   || DEFAULTS.settings.organization,
            engagementType: data.engagement_type || DEFAULTS.settings.engagementType,
            vendor:         data.vendor          || DEFAULTS.settings.vendor,
            methodology:    data.methodology     || DEFAULTS.settings.methodology,
          });
          if (data.notifications && Object.keys(data.notifications).length > 0) {
            setNotifications(data.notifications);
          }
        }
        setLoading(false);
      });
  }, [userId]);

  const saveSettings = useCallback(async (newSettings, newNotifications) => {
    const payload = {
      id:                  userId,
      organization:        newSettings.organization,
      engagement_type:     newSettings.engagementType,
      vendor:              newSettings.vendor,
      methodology:         newSettings.methodology,
      notifications:       newNotifications,
      updated_at:          new Date().toISOString(),
    };
    const { error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'id' });
    return { error };
  }, [userId]);

  return { settings, setSettings, notifications, setNotifications, loading, saveSettings };
};
