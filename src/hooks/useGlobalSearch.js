import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

/**
 * Cross-table global search (client-side Supabase queries).
 * Searches agent_chats (content ilike), film_pipeline/music_pipeline/composer_projects/crew_applications/actor_submissions (title ilike).
 * Returns flat array of { type, id, title, snippet, link, timestamp } sorted by recency.
 */
export const useGlobalSearch = (query, userId) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = (query || '').trim();
    if (!q || q.length < 2 || !userId) {
      setResults([]); setLoading(false); return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      const ilike = `%${q}%`;

      try {
        const [chats, film, music, composer, crew, actor] = await Promise.all([
          supabase.from('agent_chats').select('id, agent_id, role, content, created_at')
            .eq('user_id', userId).ilike('content', ilike).order('created_at', { ascending: false }).limit(8),
          supabase.from('film_pipeline').select('id, title, company, stage, updated_at')
            .eq('user_id', userId).ilike('title', ilike).limit(5),
          supabase.from('music_pipeline').select('id, title, director, stage, updated_at')
            .eq('user_id', userId).ilike('title', ilike).limit(5),
          supabase.from('composer_projects').select('id, title, platform, status, created_at')
            .eq('user_id', userId).ilike('title', ilike).limit(5),
          supabase.from('crew_applications').select('id, production_title, role, status, applied_at')
            .eq('user_id', userId).ilike('production_title', ilike).limit(5),
          supabase.from('actor_submissions').select('id, project_title, role, status, created_at')
            .eq('user_id', userId).ilike('project_title', ilike).limit(5),
        ]);

        const all = [];
        (chats.data || []).forEach(r => all.push({
          type: 'chat', id: r.id,
          title: `Chat: ${r.role} @ ${r.agent_id}`,
          snippet: r.content?.slice(0, 140) || '',
          link: '/agents', timestamp: r.created_at,
        }));
        (film.data || []).forEach(r => all.push({
          type: 'film', id: r.id,
          title: r.title, snippet: `${r.company || ''} · ${r.stage}`.trim(),
          link: '/vertical/filmmaker', timestamp: r.updated_at,
        }));
        (music.data || []).forEach(r => all.push({
          type: 'music', id: r.id,
          title: r.title, snippet: `${r.director || ''} · ${r.stage}`.trim(),
          link: '/vertical/musician', timestamp: r.updated_at,
        }));
        (composer.data || []).forEach(r => all.push({
          type: 'composer', id: r.id,
          title: r.title, snippet: `${r.platform || ''} · ${r.status}`.trim(),
          link: '/vertical/composer', timestamp: r.created_at,
        }));
        (crew.data || []).forEach(r => all.push({
          type: 'crew', id: r.id,
          title: r.production_title, snippet: `${r.role || ''} · ${r.status}`.trim(),
          link: '/vertical/crew', timestamp: r.applied_at,
        }));
        (actor.data || []).forEach(r => all.push({
          type: 'actor', id: r.id,
          title: r.project_title, snippet: `${r.role || ''} · ${r.status}`.trim(),
          link: '/vertical/actor', timestamp: r.created_at,
        }));

        all.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        setResults(all);
      } catch (err) {
        logger.error('useGlobalSearch.failed', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [query, userId]);

  return { results, loading };
};
