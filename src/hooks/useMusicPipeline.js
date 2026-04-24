import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { lukePipeline } from '../config/mockData';
import { logger } from '../lib/logger';
import { UI } from '../constants';

const STAGES = ['prospecting', 'pitched', 'negotiating', 'closed'];
const EMPTY  = Object.fromEntries(STAGES.map(s => [s, []]));

const groupRows = (rows) => {
  const grouped = Object.fromEntries(STAGES.map(s => [s, []]));
  rows.forEach(row => {
    const card = { ...(row.card_data || {}), ...row };
    delete card.card_data;
    delete card.user_id;
    delete card.updated_at;
    if (grouped[row.stage]) grouped[row.stage].push(card);
  });
  return grouped;
};

const syncToSupabase = async (userId, pipeline) => {
  const rows = [];
  STAGES.forEach(stage => {
    (pipeline[stage] || []).forEach((card, position) => {
      const { id, created_at, ...rest } = card;
      rows.push({
        user_id:  userId,
        stage,
        position,
        title:    card.title    || 'Untitled',
        director: card.director || null,
        budget:   card.budget   || null,
        fee:      card.fee || card.proposedFee || null,
        card_data: rest,
        ...(id ? { id } : {}),
      });
    });
  });

  const { data: snapshot, error: snapErr } = await supabase
    .from('music_pipeline').select('*').eq('user_id', userId);
  if (snapErr) throw snapErr;

  const { error: delErr } = await supabase.from('music_pipeline').delete().eq('user_id', userId);
  if (delErr) throw delErr;

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('music_pipeline').insert(rows);
    if (insErr) {
      logger.error('useMusicPipeline.insert.failed', insErr);
      if (snapshot && snapshot.length > 0) {
        const restore = await supabase.from('music_pipeline').insert(snapshot);
        if (restore.error) logger.error('useMusicPipeline.rollback.failed', restore.error);
      }
      throw insErr;
    }
  }
};

export const useMusicPipeline = (userId) => {
  const [pipeline, _setPipeline] = useState(EMPTY);
  const [loading,  setLoading]   = useState(true);
  const syncTimer = useRef(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('music_pipeline')
      .select('*')
      .eq('user_id', userId)
      .order('position')
      .then(({ data, error }) => {
        if (error) {
          logger.error('useMusicPipeline.load.failed', error);
          toast.error('Could not load your music pipeline. Showing starter data.');
        }
        if (data && data.length > 0) {
          _setPipeline(groupRows(data));
        } else {
          _setPipeline(
            Object.fromEntries(
              Object.entries(lukePipeline).map(([k, v]) => [k, v.map(c => ({ ...c }))])
            )
          );
        }
        setLoading(false);
      });
  }, [userId]);

  const setPipeline = useCallback((updater) => {
    _setPipeline(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (userId) {
        clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(async () => {
          try {
            await syncToSupabase(userId, next);
          } catch (err) {
            logger.error('useMusicPipeline.sync.failed', err);
            toast.error('Could not save pipeline changes. Your local copy is intact.');
          }
        }, UI.pipelineSyncMs);
      }
      return next;
    });
  }, [userId]);

  return { pipeline, setPipeline, loading };
};
