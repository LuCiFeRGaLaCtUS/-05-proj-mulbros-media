import React, { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppContext } from '../../App';
import { Users, Film, Music, Piano, Camera, Drama, Loader2, ExternalLink } from 'lucide-react';
import { logger } from '../../lib/logger';
import toast from 'react-hot-toast';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const AmberBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-100 blur-xl rounded-full pointer-events-none" />
  </>
);

const StatLabel = ({ children, Icon }) => (
  <div style={{ fontFamily: 'var(--font-mono)' }}
    className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5">
    {Icon && <Icon size={10} />}
    {children}
  </div>
);

const StatNumber = ({ children }) => (
  <div style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
    className="text-[1.65rem] font-bold text-zinc-900 leading-none tabular-nums">
    {children}
  </div>
);

// Unified source loader
const useCrossLeads = (userId) => {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) { setRows([]); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [film, music, composer, crew, actor] = await Promise.all([
          supabase.from('film_pipeline').select('*').eq('user_id', userId),
          supabase.from('music_pipeline').select('*').eq('user_id', userId),
          supabase.from('composer_projects').select('*').eq('user_id', userId),
          supabase.from('crew_applications').select('*').eq('user_id', userId),
          supabase.from('actor_submissions').select('*').eq('user_id', userId),
        ]);
        if (cancelled) return;

        const unified = [];
        (film.data || []).forEach(r => unified.push({
          id: `film-${r.id}`, source: 'film',
          title: r.title, subtitle: r.company || '',
          stage: r.stage, budget: r.budget,
          link: '/vertical/filmmaker', ts: r.updated_at || r.created_at,
        }));
        (music.data || []).forEach(r => unified.push({
          id: `music-${r.id}`, source: 'music',
          title: r.title, subtitle: r.director || '',
          stage: r.stage, budget: r.budget || r.fee,
          link: '/vertical/musician', ts: r.updated_at || r.created_at,
        }));
        (composer.data || []).forEach(r => unified.push({
          id: `composer-${r.id}`, source: 'composer',
          title: r.title, subtitle: r.platform || r.genre || '',
          stage: r.status, budget: r.budget_range,
          link: '/vertical/composer', ts: r.created_at,
        }));
        (crew.data || []).forEach(r => unified.push({
          id: `crew-${r.id}`, source: 'crew',
          title: r.production_title, subtitle: r.role || '',
          stage: r.status, budget: r.union_status,
          link: '/vertical/crew', ts: r.applied_at,
        }));
        (actor.data || []).forEach(r => unified.push({
          id: `actor-${r.id}`, source: 'actor',
          title: r.project_title, subtitle: r.role || r.casting_director || '',
          stage: r.status, budget: r.rate ? `$${r.rate}` : null,
          link: '/vertical/actor', ts: r.created_at,
        }));

        unified.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
        setRows(unified);
      } catch (err) {
        logger.error('CRM.load.failed', err);
        toast.error('Could not load CRM data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { rows, loading };
};

const SOURCE_META = {
  film:     { label: 'Film',     Icon: Film,   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  music:    { label: 'Music',    Icon: Music,  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  composer: { label: 'Composer', Icon: Piano,  color: 'bg-purple-50 text-purple-700 border-purple-200' },
  crew:     { label: 'Crew',     Icon: Camera, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  actor:    { label: 'Actor',    Icon: Drama,  color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const CRMView = () => {
  const { profile, navigate } = useAppContext();
  const { rows, loading } = useCrossLeads(profile?.id);
  const [filter, setFilter] = useState('all');
  const [query, setQuery]   = useState('');

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== 'all') list = list.filter(r => r.source === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r => (r.title || '').toLowerCase().includes(q) || (r.subtitle || '').toLowerCase().includes(q));
    }
    return list;
  }, [rows, filter, query]);

  const counts = useMemo(() => ({
    all:      rows.length,
    film:     rows.filter(r => r.source === 'film').length,
    music:    rows.filter(r => r.source === 'music').length,
    composer: rows.filter(r => r.source === 'composer').length,
    crew:     rows.filter(r => r.source === 'crew').length,
    actor:    rows.filter(r => r.source === 'actor').length,
  }), [rows]);

  const activeCount = rows.filter(r => !['closed', 'Booked', 'Passed', 'Archived', 'Delivered'].includes(r.stage)).length;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden tile-pop bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-amber-100 blur-xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Users size={22} className="text-amber-600" />
            Unified CRM
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            All leads across every vertical — film pipeline, music sync pitches, composer projects, crew applications, actor submissions. Click any row to jump to its home vertical.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={Users}>Total Leads</StatLabel>
            <StatNumber>{counts.all}</StatNumber>
          </div>
        </div>
        {Object.entries(SOURCE_META).map(([key, m]) => (
          <div key={key} className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
            <AmberBg />
            <div className="relative z-10">
              <StatLabel Icon={m.Icon}>{m.label}</StatLabel>
              <StatNumber>{counts[key]}</StatNumber>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-zinc-500">
        <span className="font-mono font-bold text-amber-700">{activeCount}</span> active · {rows.length - activeCount} closed/archived
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search leads…"
          className="flex-1 min-w-[200px] text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
        <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
          {[{ k: 'all', l: 'All' }, { k: 'film', l: 'Film' }, { k: 'music', l: 'Music' }, { k: 'composer', l: 'Composer' }, { k: 'crew', l: 'Crew' }, { k: 'actor', l: 'Actor' }].map(t => (
            <button key={t.k} onClick={() => setFilter(t.k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === t.k ? 'bg-amber-500 text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="tile-pop relative bg-white rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 border-b border-zinc-200 bg-zinc-50/60">
                <th className="text-left py-2.5 px-4 font-medium">Source</th>
                <th className="text-left py-2.5 px-4 font-medium">Title</th>
                <th className="text-left py-2.5 px-4 font-medium">Context</th>
                <th className="text-left py-2.5 px-4 font-medium">Stage</th>
                <th className="text-left py-2.5 px-4 font-medium">Value</th>
                <th className="text-right py-2.5 px-4 font-medium">Open</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="py-6 text-center text-zinc-500"><Loader2 size={13} className="animate-spin inline mr-1" />Loading leads…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-zinc-500">No leads match. Add rows from each vertical's pipeline.</td></tr>
              )}
              {!loading && filtered.map(r => {
                const meta = SOURCE_META[r.source];
                return (
                  <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer" onClick={() => navigate?.(r.link)}>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
                        <meta.Icon size={10} /> {meta.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-zinc-900 truncate max-w-xs">{r.title}</td>
                    <td className="py-2.5 px-4 text-zinc-700 truncate max-w-xs">{r.subtitle || '—'}</td>
                    <td className="py-2.5 px-4 text-zinc-700">{r.stage || '—'}</td>
                    <td className="py-2.5 px-4 text-zinc-700 font-mono">{r.budget || '—'}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); navigate?.(r.link); }}
                        className="text-zinc-400 hover:text-amber-700 p-1" aria-label="Open"><ExternalLink size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
