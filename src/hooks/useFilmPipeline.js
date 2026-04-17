import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { filmFinancingPipeline } from '../config/mockData';

const STAGES = ['discovery', 'contacted', 'qualified', 'negotiating', 'closed'];
const EMPTY  = Object.fromEntries(STAGES.map(s => [s, []]));

/** Rebuild grouped pipeline from Supabase rows */
const groupRows = (rows) => {
  const grouped = Object.fromEntries(STAGES.map(s => [s, []]));
  rows.forEach(row => {
    const card = { ...(row.card_data || {}), ...row };
    // strip Supabase-only fields from the rendered card (keep id for future updates)
    delete card.card_data;
    delete card.user_id;
    delete card.updated_at;
    if (grouped[row.stage]) grouped[row.stage].push(card);
  });
  return grouped;
};

/** Save entire pipeline to Supabase (delete + bulk insert) */
const syncToSupabase = async (userId, pipeline) => {
  const rows = [];
  STAGES.forEach(stage => {
    (pipeline[stage] || []).forEach((card, position) => {
      const { id, created_at, ...rest } = card; // strip managed fields
      rows.push({
        user_id:   userId,
        stage,
        position,
        title:     card.title   || 'Untitled',
        company:   card.company || card.director || null,
        signal:    card.signal  || null,
        budget:    card.budget  || null,
        contact:   card.contact || null,
        notes:     card.notes   || null,
        card_data: rest,          // preserve all extra fields
        ...(id ? { id } : {}),   // preserve Supabase UUID if present
      });
    });
  });
  await supabase.from('film_pipeline').delete().eq('user_id', userId);
  if (rows.length > 0) await supabase.from('film_pipeline').insert(rows);
};

export const useFilmPipeline = (userId) => {
  const [pipeline, _setPipeline] = useState(EMPTY);
  const [loading,  setLoading]   = useState(true);
  const syncTimer = useRef(null);

  // Load on mount
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('film_pipeline')
      .select('*')
      .eq('user_id', userId)
      .order('position')
      .then(({ data }) => {
        if (data && data.length > 0) {
          _setPipeline(groupRows(data));
        } else {
          // First run — seed from mockData
          _setPipeline(
            Object.fromEntries(
              Object.entries(filmFinancingPipeline).map(([k, v]) => [k, v.map(c => ({ ...c }))])
            )
          );
        }
        setLoading(false);
      });
  }, [userId]);

  // Debounced sync — fires 800ms after last update to avoid hammering DB on rapid drags
  const setPipeline = useCallback((updater) => {
    _setPipeline(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (userId) {
        clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => syncToSupabase(userId, next), 800);
      }
      return next;
    });
  }, [userId]);

  return { pipeline, setPipeline, loading };
};
