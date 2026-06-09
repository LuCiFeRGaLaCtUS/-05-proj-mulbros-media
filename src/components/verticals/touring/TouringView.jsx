import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, Bot, Plus, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../../App';
import { useTours } from '../../../hooks/useTours';
import { useAskMO } from '../../../hooks/useAskMO';

const CARD_STYLE = {
  border:    '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const STATUS_COLORS = {
  hold:      { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  dot: 'bg-amber-500' },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',   dot: 'bg-rose-500' },
  complete:  { bg: 'bg-zinc-50',    text: 'text-zinc-600',    border: 'border-zinc-200',   dot: 'bg-zinc-400' },
};

const usd = (n) => `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

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

const ShowRow = ({ show }) => {
  const color = STATUS_COLORS[show.status] || STATUS_COLORS.hold;
  const dateStr = show.show_date
    ? new Date(show.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-zinc-50 transition-colors">
      <span className={`w-2 h-2 rounded-full ${color.dot} flex-shrink-0`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-zinc-900 truncate">{show.venue_name}</div>
        <div className="text-xs text-zinc-500 truncate">
          {show.city || '—'}{show.country ? `, ${show.country}` : ''} · {dateStr}
        </div>
      </div>
      {show.gross_offer != null && (
        <span className="text-xs text-zinc-600 font-mono tabular-nums mr-2">{usd(show.gross_offer)}</span>
      )}
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${color.bg} ${color.text} ${color.border} uppercase tracking-wider`}>
        {show.status}
      </span>
    </div>
  );
};

export const TouringView = () => {
  const navigate = useNavigate();
  const askMO = useAskMO();
  const { profile } = useAppContext();
  const { tours, shows, counts, upcoming, grossOfferTotal, loading } = useTours(profile?.id);
  const [filter, setFilter] = useState('all');

  const filteredShows = useMemo(() => {
    if (filter === 'all') return shows;
    return shows.filter(s => s.status === filter);
  }, [shows, filter]);

  const handleAskTourManager = () => {
    askMO('Help me manage my tour — routing, holds, and logistics.', 'tour');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="text-emerald-600" size={20} />
            <h1 className="text-xl font-bold text-zinc-900">Touring</h1>
          </div>
          <p className="text-sm text-zinc-500">Tours · venue holds · confirmed shows · day-of-show logistics</p>
        </div>
        <button
          onClick={handleAskTourManager}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
        >
          <Bot size={14} />
          Ask Tour Manager
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Tours"        value={counts.tours} />
        <KpiCard label="Holds"        value={counts.holds}     accent="text-amber-600" />
        <KpiCard label="Confirmed"    value={counts.confirmed} accent="text-emerald-600" />
        <KpiCard label="Complete"     value={counts.complete}  accent="text-zinc-600" />
        <KpiCard label="Confirmed $"  value={usd(grossOfferTotal)} accent="text-zinc-900" />
      </div>

      {/* Tours list */}
      {tours.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            Tours
          </div>
          <div className="space-y-2">
            {tours.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">{t.name}</div>
                  <div className="text-xs text-zinc-500">
                    {t.start_date || '—'} → {t.end_date || '—'} · {shows.filter(s => s.tour_id === t.id).length} shows
                  </div>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shows */}
      <div className="bg-white rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Calendar size={14} className="text-zinc-500" />
            Shows
          </div>
          <div className="flex items-center gap-1.5">
            {['all', 'hold', 'confirmed', 'complete', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors ${
                  filter === f
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">Loading shows…</div>
        ) : filteredShows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MapPin size={28} className="text-zinc-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-zinc-700">No shows yet</div>
            <div className="text-xs text-zinc-500 mt-1">
              Ask the Tour Manager: <span className="font-mono text-emerald-600">/tour add a hold for The Echoplex LA on Aug 15</span>
            </div>
            <button
              onClick={handleAskTourManager}
              className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600"
            >
              <Plus size={12} /> Add via Tour Manager
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {filteredShows.map(s => <ShowRow key={s.id} show={s} />)}
          </div>
        )}
      </div>

      {/* Upcoming preview */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            Next up
          </div>
          <div className="space-y-2">
            {upcoming.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center justify-between py-1">
                <div className="text-sm text-zinc-700">
                  <span className="font-semibold">{s.venue_name}</span>
                  <span className="text-zinc-500"> · {s.city || '—'}</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono tabular-nums">
                  {s.show_date ? new Date(s.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TouringView;
