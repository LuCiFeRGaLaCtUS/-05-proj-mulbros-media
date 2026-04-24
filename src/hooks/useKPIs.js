import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Parse budget strings like "$1.2M", "$500K", "$8,000" into numeric USD.
const parseBudget = (raw) => {
  if (raw == null) return 0;
  if (typeof raw === 'number') return raw;
  const s = String(raw).trim().replace(/[$,\s]/g, '');
  if (!s) return 0;
  const m = s.match(/^(\d+(?:\.\d+)?)([KkMmBb])?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const suffix = (m[2] || '').toLowerCase();
  if (suffix === 'k') return n * 1_000;
  if (suffix === 'm') return n * 1_000_000;
  if (suffix === 'b') return n * 1_000_000_000;
  return n;
};

const startOfMonthISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

/**
 * Live KPI data for the Dashboard.
 * Returns:
 *   leadCount       — count of non-closed pipeline rows across film + music
 *   aiInteractions  — count of agent_chats (role='user') this month
 *   contentPieces   — count of user_activity where event_type='content_generated' this month
 *   pipelineValue   — sum of budget across all pipeline rows (numeric USD)
 *   loading, error
 */
export const useKPIs = (profileId) => {
  const [state, setState] = useState({
    leadCount:      null,
    aiInteractions: null,
    contentPieces:  null,
    pipelineValue:  null,
    loading:        true,
    error:          null,
  });

  useEffect(() => {
    if (!profileId) {
      setState({ leadCount: 0, aiInteractions: 0, contentPieces: 0, pipelineValue: 0, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    const monthStart = startOfMonthISO();

    const loadFilmPipeline = supabase
      .from('film_pipeline')
      .select('stage, budget')
      .eq('user_id', profileId);

    const loadMusicPipeline = supabase
      .from('music_pipeline')
      .select('stage, budget, fee')
      .eq('user_id', profileId);

    const loadAgentChats = supabase
      .from('agent_chats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profileId)
      .eq('role', 'user')
      .gte('created_at', monthStart);

    const loadContent = supabase
      .from('user_activity')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profileId)
      .eq('event_type', 'content_generated')
      .gte('created_at', monthStart);

    Promise.all([loadFilmPipeline, loadMusicPipeline, loadAgentChats, loadContent])
      .then(([film, music, chats, content]) => {
        if (cancelled) return;

        const firstErr = film.error || music.error || chats.error || content.error;
        if (firstErr) {
          console.error('[useKPIs] query failed', firstErr);
          setState({ leadCount: 0, aiInteractions: 0, contentPieces: 0, pipelineValue: 0, loading: false, error: firstErr });
          return;
        }

        const filmRows  = film.data  || [];
        const musicRows = music.data || [];

        const activeLeads =
          filmRows.filter(r => (r.stage || '').toLowerCase() !== 'closed').length +
          musicRows.filter(r => (r.stage || '').toLowerCase() !== 'closed').length;

        const pipelineValue =
          filmRows.reduce((sum, r)  => sum + parseBudget(r.budget), 0) +
          musicRows.reduce((sum, r) => sum + parseBudget(r.budget || r.fee), 0);

        setState({
          leadCount:      activeLeads,
          aiInteractions: chats.count || 0,
          contentPieces:  content.count || 0,
          pipelineValue,
          loading:        false,
          error:          null,
        });
      })
      .catch(err => {
        if (cancelled) return;
        console.error('[useKPIs] threw', err);
        setState({ leadCount: 0, aiInteractions: 0, contentPieces: 0, pipelineValue: 0, loading: false, error: err });
      });

    return () => { cancelled = true; };
  }, [profileId]);

  return state;
};
