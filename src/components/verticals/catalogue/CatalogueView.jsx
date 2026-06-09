import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc3, Music, Bot, AlertCircle, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useAppContext } from '../../../App';
import { useCatalogue } from '../../../hooks/useCatalogue';
import { useAskMO } from '../../../hooks/useAskMO';

const CARD_STYLE = {
  border:    '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const KpiCard = ({ label, value, accent = 'text-zinc-900' }) => (
  <div className="bg-white rounded-2xl p-4" style={CARD_STYLE}>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
      {label}
    </div>
    <div className={`text-2xl font-bold tabular-nums ${accent}`} style={{ fontFamily: 'var(--font-mono)' }}>
      {value}
    </div>
  </div>
);

const SplitPie = ({ splits, total }) => {
  const ok = total === 10000;
  const pct = total / 100;
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
      {pct.toFixed(2)}% {ok ? '✓' : '⚠️'}
    </span>
  );
};

const TrackRow = ({ track, splits, total }) => {
  const ok = total === 10000;
  return (
    <div className="px-5 py-3 border-t border-zinc-100">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="text-sm font-semibold text-zinc-900 flex items-center gap-2 min-w-0">
          {track.position != null && (
            <span className="text-xs text-zinc-400 font-mono tabular-nums">{String(track.position).padStart(2, '0')}.</span>
          )}
          <span className="truncate">{track.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {track.duration_sec != null && (
            <span className="text-xs text-zinc-500 font-mono tabular-nums">
              {Math.floor(track.duration_sec / 60)}:{String(track.duration_sec % 60).padStart(2, '0')}
            </span>
          )}
          <SplitPie splits={splits} total={total} />
        </div>
      </div>
      {splits.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {splits.map(s => (
            <span key={s.id} className="text-[11px] bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-md">
              {s.payee_name}
              <span className="text-zinc-400 ml-1">·</span>
              <span className="font-mono ml-1 text-zinc-700">{(s.share_bps / 100).toFixed(2)}%</span>
              {s.role && <span className="text-zinc-400 ml-1">· {s.role}</span>}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-xs text-zinc-400">No splits configured.</div>
      )}
      {!ok && splits.length > 0 && (
        <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> Splits sum to {(total / 100).toFixed(2)}%, not 100%.
        </div>
      )}
    </div>
  );
};

export const CatalogueView = () => {
  const navigate = useNavigate();
  const { profile } = useAppContext();
  const { releases, tracks, splits, tracksByRelease, splitsByTrack, splitTotalByTrack, loading } =
    useCatalogue(profile?.id);
  const askMO = useAskMO();

  const handleAskCatalogue = () => {
    askMO('Help me manage my catalogue — releases, tracks, and splits.', 'catalogue');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Disc3 className="text-fuchsia-600" size={20} />
            <h1 className="text-xl font-bold text-zinc-900">Catalogue</h1>
          </div>
          <p className="text-sm text-zinc-500">Releases · tracks · royalty splits in basis points</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/catalogue/statements')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-fuchsia-400 hover:text-fuchsia-600"
          >
            <FileText size={14} /> Statements
          </button>
          <button
            onClick={handleAskCatalogue}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-fuchsia-500 text-white text-sm font-semibold hover:bg-fuchsia-600 shadow-md shadow-fuchsia-500/20"
          >
            <Bot size={14} />
            Ask Catalogue Manager
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Releases" value={releases.length} />
        <KpiCard label="Tracks"   value={tracks.length} />
        <KpiCard label="Splits"   value={splits.length} />
        <KpiCard
          label="Tracks balanced"
          value={`${tracks.filter(t => (splitTotalByTrack[t.id] || 0) === 10000).length}/${tracks.length}`}
          accent="text-emerald-600"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-sm text-zinc-400" style={CARD_STYLE}>
          Loading catalogue…
        </div>
      ) : releases.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={CARD_STYLE}>
          <Music size={28} className="text-zinc-300 mx-auto mb-2" />
          <div className="text-sm font-semibold text-zinc-700">No releases yet</div>
          <div className="text-xs text-zinc-500 mt-1 mb-4">
            Ask the Catalogue Manager: <span className="font-mono text-fuchsia-600">/catalogue create a single called &ldquo;Western Pine&rdquo;</span>
          </div>
          <button
            onClick={handleAskCatalogue}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-500 text-white text-xs font-semibold hover:bg-fuchsia-600"
          >
            <Bot size={12} /> Add via Catalogue Manager
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map(rel => {
            const relTracks = tracksByRelease[rel.id] || [];
            return (
              <div key={rel.id} className="bg-white rounded-2xl overflow-hidden" style={CARD_STYLE}>
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-100 border border-fuchsia-200 flex items-center justify-center flex-shrink-0">
                      <Disc3 size={18} className="text-fuchsia-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-zinc-900 truncate">{rel.title}</div>
                      <div className="text-xs text-zinc-500">
                        {rel.type} · {rel.release_date || 'Release date TBD'} · {relTracks.length} tracks
                        {rel.isrc ? <span className="ml-1 font-mono">· ISRC {rel.isrc}</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
                {relTracks.length === 0 ? (
                  <div className="px-5 pb-5 text-xs text-zinc-400">No tracks. Ask the Catalogue Manager to add one.</div>
                ) : (
                  relTracks.map(t => (
                    <TrackRow
                      key={t.id}
                      track={t}
                      splits={splitsByTrack[t.id] || []}
                      total={splitTotalByTrack[t.id] || 0}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CatalogueView;
