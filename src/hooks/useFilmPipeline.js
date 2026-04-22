import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { filmFinancingPipeline } from '../config/mockData';
import { logger } from '../lib/logger';
import { UI } from '../constants';

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
  // Snapshot current DB rows so we can restore on failure.
  const { data: snapshot, error: snapErr } = await supabase
    .from('film_pipeline').select('*').eq('user_id', userId);
  if (snapErr) throw snapErr;

  const { error: delErr } = await supabase.from('film_pipeline').delete().eq('user_id', userId);
  if (delErr) throw delErr;

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('film_pipeline').insert(rows);
    if (insErr) {
      // Rollback: best-effort restore of prior snapshot so data is not lost.
      if (snapshot && snapshot.length > 0) {
        await supabase.from('film_pipeline').insert(snapshot).then(() => {}, () => {});
      }
      throw insErr;
    }
  }
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
      .then(({ data, error }) => {
        if (error) {
          logger.error('useFilmPipeline.load.failed', error);
          toast.error('Could not load your film pipeline. Showing starter data.');
        }
        if (data && data.length > 0) {
          _setPipeline(groupRows(data));
        } else {
          // First run (or error) — seed from mockData
          _setPipeline(
            Object.fromEntries(
              Object.entries(filmFinancingPipeline).map(([k, v]) => [k, v.map(c => ({ ...c }))])
            )
          );
        }
        setLoading(false);
      });
  }, [userId]);

  // Debounced sync — fires after UI.pipelineSyncMs to avoid hammering DB on rapid drags.
  const setPipeline = useCallback((updater) => {
    _setPipeline(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (userId) {
        clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(async () => {
          try {
            await syncToSupabase(userId, next);
          } catch (err) {
            logger.error('useFilmPipeline.sync.failed', err);
            toast.error('Could not save pipeline changes. Your local copy is intact.');
          }
        }, UI.pipelineSyncMs);
      }
      return next;
    });
  }, [userId]);

  return { pipeline, setPipeline, loading };
};
