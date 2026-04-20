import React, { useState } from 'react';
import {
  Clapperboard, Music2, Piano, Drama, ScrollText,
  Camera, Palette, BookOpen, Building2, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { VERTICALS } from '../../config/verticals';

const ICON_MAP = {
  Clapperboard, Music2, Piano, Drama, ScrollText,
  Camera, Palette, BookOpen, Building2,
};

// Tailwind color config per vertical (safe-listed classes)
const COLOR_CONFIG = {
  emerald: {
    border: 'border-emerald-400', bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100', iconText: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  amber: {
    border: 'border-amber-400', bg: 'bg-amber-50',
    iconBg: 'bg-amber-100', iconText: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  violet: {
    border: 'border-violet-400', bg: 'bg-violet-50',
    iconBg: 'bg-violet-100', iconText: 'text-violet-600',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  rose: {
    border: 'border-rose-400', bg: 'bg-rose-50',
    iconBg: 'bg-rose-100', iconText: 'text-rose-600',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  orange: {
    border: 'border-orange-400', bg: 'bg-orange-50',
    iconBg: 'bg-orange-100', iconText: 'text-orange-600',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  slate: {
    border: 'border-slate-400', bg: 'bg-slate-50',
    iconBg: 'bg-slate-100', iconText: 'text-slate-600',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  pink: {
    border: 'border-pink-400', bg: 'bg-pink-50',
    iconBg: 'bg-pink-100', iconText: 'text-pink-600',
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  teal: {
    border: 'border-teal-400', bg: 'bg-teal-50',
    iconBg: 'bg-teal-100', iconText: 'text-teal-600',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  indigo: {
    border: 'border-indigo-400', bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100', iconText: 'text-indigo-600',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
};

export const VerticalSelect = ({ onSelect }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F7FA' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-8 pb-6 text-center max-w-3xl mx-auto w-full">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-zinc-950"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 0 16px rgba(245,158,11,0.30)' }}
          >
            M
          </div>
          <span
            className="text-sm font-black tracking-[0.22em]"
            style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}
          >
            MULBROS
          </span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-amber-500/30">
            1
          </div>
          <div className="w-14 h-0.5 bg-zinc-200 rounded-full" />
          <div className="w-7 h-7 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-400 text-xs font-bold">
            2
          </div>
        </div>

        <h1
          className="font-display font-semibold leading-tight mb-3"
          style={{ fontSize: '2.4rem', color: '#18181B', letterSpacing: '0.01em' }}
        >
          What best describes your work?
        </h1>
        <p className="text-zinc-500 text-base leading-relaxed">
          Choose your primary field. You can unlock additional verticals later.
        </p>
      </div>

      {/* ── 3-column vertical grid ─────────────────────────────────────── */}
      <div className="flex-1 px-4 sm:px-6 pb-28 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VERTICALS.map(v => {
            const Icon = ICON_MAP[v.icon] || Clapperboard;
            const c = COLOR_CONFIG[v.color] || COLOR_CONFIG.emerald;
            const isSelected = selected === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelected(v.id)}
                className={`tile-pop relative flex flex-col gap-3 p-5 rounded-2xl text-left transition-all duration-200 ${
                  isSelected
                    ? `${c.bg} border-2 ${c.border}`
                    : 'bg-white border border-zinc-200 hover:border-zinc-300'
                }`}
                style={isSelected ? {
                  boxShadow: `0 0 0 4px ${v.neon}1A, 0 4px 20px rgba(0,0,0,0.08)`,
                } : {
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {/* Check mark when selected */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 size={18} style={{ color: v.neon }} />
                  </div>
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
                  <Icon size={20} className={c.iconText} />
                </div>

                {/* Label + badge */}
                <div>
                  <div className="font-semibold text-zinc-900 text-sm leading-snug pr-6">{v.label}</div>
                  <span
                    className={`inline-flex mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-[0.15em] ${c.badge}`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {v.sub}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-500 leading-relaxed">{v.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sticky bottom CTA bar ──────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-zinc-200"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {selected
              ? (
                <span>
                  Selected:{' '}
                  <span className="font-semibold text-zinc-800">
                    {VERTICALS.find(v => v.id === selected)?.label}
                  </span>
                </span>
              )
              : 'Select your vertical to continue'}
          </p>
          <button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              selected
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
