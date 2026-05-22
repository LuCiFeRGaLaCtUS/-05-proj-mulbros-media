import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Dashboard day counter — drives card unlock progression (Day 1-7).
 * Persisted in profiles.dashboard_day. Defaults to 1.
 */

export const MAX_DAY = 7;

export const getDashboardDay = (profile) => {
  if (!profile) return 1;
  const d = Number(profile.dashboard_day);
  if (Number.isNaN(d) || d < 1) return 1;
  return Math.min(d, MAX_DAY);
};

export const advanceDashboardDay = async (profileId, currentDay) => {
  if (!profileId) return null;
  const next = currentDay >= MAX_DAY ? 1 : currentDay + 1;
  const { data, error } = await supabase
    .from('profiles')
    .update({ dashboard_day: next, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select('dashboard_day')
    .single();
  if (error) {
    logger.error('dashboardDay.advance.failed', error);
    return null;
  }
  return data?.dashboard_day ?? next;
};
