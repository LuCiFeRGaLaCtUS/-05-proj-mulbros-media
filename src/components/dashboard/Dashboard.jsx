import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  DollarSign, Users, Music, Film, Clapperboard,
  TrendingUp, TrendingDown, ArrowRight, Star,
  Award, Radio, Mic, Play, Zap, Clock, CheckCircle2,
  ExternalLink
} from 'lucide-react';

const C = {
  gold:    '#f59e0b',
  blue:    '#3b82f6',
  emerald: '#10b981',
  purple:  '#8b5cf6',
  red:     '#ef4444',
  rose:    '#f43f5e',
};

const REVENUE_DATA = [
  { month: 'Oct', financing: 12000, music: 4500,  productions: 8000  },
  { month: 'Nov', financing: 18000, music: 6200,  productions: 11000 },
  { month: 'Dec', financing: 15000, music: 8000,  productions: 14000 },
  { month: 'Jan', financing: 24000, music: 9500,  productions: 18000 },
  { month: 'Feb', financing: 28000, music: 12000, productions: 22000 },
  { month: 'Mar', financing: 30000, music: 14000, productions: 25000 },
];
const PLATFORM_DATA = [
  { name: 'Spotify', value: 85230 },
  { name: 'TikTok',  value: 45800 },
  { name: 'Apple',   value: 34100 },
  { name: 'YouTube', value: 12400 },
];
const PLATFORM_COLORS = [C.gold, C.purple, C.rose, C.blue];

// ══════════════════════════════════════════════════════════════════════════════
// THEMATIC BACKGROUNDS  — all opacity values use valid Tailwind modifiers only
// (/10 /15 /20 /25 /30 etc.) — NO /12 /08 or non-standard values
// ══════════════════════════════════════════════════════════════════════════════

const BgRevenue = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-zinc-900 to-zinc-950 pointer-events-none" />
    {/* glow — use opacity-10 (valid) and blur-xl (not blur-2xl) to avoid white-circle artefact */}
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
    {/* reel rings — all use /10 or /15 (valid) */}
    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-blue-500/10 pointer-events-none" />
    <div className="absolute right-12 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-blue-500/15 pointer-events-none" />
    <div className="absolute right-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-blue-500/20 pointer-events-none" />
    {/* ticket perforations bottom */}
    <div className="absolute bottom-2 left-4 right-4 flex justify-around pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-blue-400/10" />)}
    </div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(59,130,246,0.07),transparent_60%)] pointer-events-none" />
  </>
);

const BgStreams = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
    {/* equalizer bars */}
    <div className="absolute right-4 bottom-4 flex items-end gap-[3px] pointer-events-none opacity-10">
      {[14, 22, 10, 26, 18, 30, 16, 24, 12, 20].map((h, i) => (
        <div key={i} className="w-1.5 rounded-t-sm bg-amber-400" style={{ height: h }} />
      ))}
    </div>
    {/* sound-wave arcs — /10 and /15 only */}
    <div className="absolute right-14 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-amber-500/10 pointer-events-none" />
    <div className="absolute right-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-amber-500/15 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,158,11,0.07),transparent_60%)] pointer-events-none" />
  </>
);

const BgDeals = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
    {/* clapperboard stripes */}
    <div className="absolute top-0 right-0 w-20 h-8 overflow-hidden rounded-bl-lg pointer-events-none opacity-10">
      {[0,1,2,3,4].map(i => (
        <div key={i} className="absolute h-16 w-3 bg-emerald-400"
          style={{ left: i * 8 - 4, top: -4, transform: 'rotate(-30deg)', transformOrigin: 'top' }} />
      ))}
    </div>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none opacity-10">
      {[0,1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />)}
    </div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(16,185,129,0.07),transparent_60%)] pointer-events-none" />
  </>
);

const BgCommunity = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
    <div className="absolute right-2 top-2 pointer-events-none opacity-10">
      {[[0,0],[14,6],[28,0],[7,14],[21,14],[0,22],[14,20],[28,18],[7,28],[21,26]].map(([x, y], i) => (
        <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-purple-400" style={{ left: x, top: y }} />
      ))}
    </div>
    <svg className="absolute right-2 top-2 opacity-[0.06] pointer-events-none" width="44" height="36" viewBox="0 0 44 36">
      <line x1="7" y1="3" x2="21" y2="9" stroke="#a78bfa" strokeWidth="0.5" />
      <line x1="21" y1="9" x2="35" y2="3" stroke="#a78bfa" strokeWidth="0.5" />
      <line x1="14" y1="17" x2="28" y2="17" stroke="#a78bfa" strokeWidth="0.5" />
      <line x1="7" y1="3" x2="14" y2="17" stroke="#a78bfa" strokeWidth="0.5" />
      <line x1="35" y1="3" x2="28" y2="17" stroke="#a78bfa" strokeWidth="0.5" />
    </svg>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.07),transparent_60%)] pointer-events-none" />
  </>
);

const BgAudienceScore = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-950/35 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(245,158,11,0.10),transparent_65%)] pointer-events-none" />
    {[[10,8],[80,12],[25,72],[70,68],[50,18],[15,50],[88,50]].map(([x, y], i) => (
      <div key={i} className="absolute pointer-events-none opacity-10"
        style={{ left: `${x}%`, top: `${y}%` }}>
        <Star size={i % 2 === 0 ? 8 : 5} className="text-amber-400" fill="#f59e0b" />
      </div>
    ))}
    <svg className="absolute bottom-0 right-0 opacity-[0.05] pointer-events-none" width="80" height="80" viewBox="0 0 100 100">
      <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
        fill="none" stroke="#f59e0b" strokeWidth="2" />
    </svg>
    <div className="absolute inset-0 bg-[conic-gradient(from_200deg_at_50%_70%,rgba(245,158,11,0.05)_0deg,transparent_40deg)] pointer-events-none" />
  </>
);

const BgDealFlow = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(16,185,129,0.09),transparent_60%)] pointer-events-none" />
    <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" viewBox="0 0 200 200" preserveAspectRatio="xMaxYMax slice">
      <path d="M180 20 L160 20 L160 60 L140 60 L140 100 L160 100 L160 140 L180 140" fill="none" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="160" cy="20" r="3" fill="#10b981" />
      <circle cx="160" cy="60" r="3" fill="#10b981" />
      <circle cx="140" cy="100" r="3" fill="#10b981" />
      <circle cx="160" cy="140" r="3" fill="#10b981" />
    </svg>
    <div className="absolute top-3 right-3 space-y-1.5 pointer-events-none opacity-[0.08]">
      {[28, 20, 24, 16, 22].map((w, i) => (
        <div key={i} className="h-0.5 rounded-full bg-emerald-400" style={{ width: w }} />
      ))}
    </div>
  </>
);

const BgRevenueChart = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/15 via-zinc-900 to-zinc-900 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(59,130,246,0.05),transparent_60%)] pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,158,11,0.04),transparent_50%)] pointer-events-none" />
    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl font-black text-blue-400/[0.03] select-none pointer-events-none leading-none">$</div>
  </>
);

const BgPlatformChart = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-950/15 via-zinc-900 to-zinc-900 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(245,158,11,0.05),transparent_55%)] pointer-events-none" />
    <svg className="absolute bottom-0 left-0 right-0 opacity-[0.04] pointer-events-none" viewBox="0 0 300 60" preserveAspectRatio="none" height="60">
      <path d="M0 30 Q15 10 30 30 Q45 50 60 30 Q75 10 90 30 Q105 50 120 30 Q135 10 150 30 Q165 50 180 30 Q195 10 210 30 Q225 50 240 30 Q255 10 270 30 Q285 50 300 30"
        fill="none" stroke="#f59e0b" strokeWidth="2" />
    </svg>
    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl font-black text-amber-400/[0.04] select-none pointer-events-none leading-none">♪</div>
  </>
);

const BgFilmFrame = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/25 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-emerald-500/10 blur-lg pointer-events-none" />
    {[['top-2 left-2','border-t border-l'],['top-2 right-2','border-t border-r'],
      ['bottom-2 left-2','border-b border-l'],['bottom-2 right-2','border-b border-r']].map(([pos, border], i) => (
      <div key={i} className={`absolute ${pos} w-4 h-4 ${border} border-emerald-500/20 pointer-events-none rounded-sm`} />
    ))}
    <div className="absolute left-0 top-0 bottom-0 w-3 flex flex-col justify-around py-2 pointer-events-none opacity-10">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="mx-0.5 h-2 bg-emerald-400 rounded-[1px]" />)}
    </div>
  </>
);

const BgMusicStaff = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-950/25 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-amber-500/10 blur-lg pointer-events-none" />
    <div className="absolute inset-0 flex flex-col justify-center gap-[5px] px-3 pointer-events-none opacity-[0.06]">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-px bg-amber-400 w-full" />)}
    </div>
    <div className="absolute right-3 bottom-2 text-5xl font-black text-amber-400/[0.07] select-none pointer-events-none leading-none">♩</div>
  </>
);

const BgPipeline = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/25 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-blue-500/10 blur-lg pointer-events-none" />
    <div className="absolute right-4 bottom-3 flex gap-1 pointer-events-none opacity-10">
      {[20, 16, 18, 14, 16].map((w, i) => (
        <div key={i} className="h-2 rounded-full bg-blue-400" style={{ width: w }} />
      ))}
    </div>
    <div className="absolute right-3 top-2 text-4xl font-black text-blue-400/[0.07] select-none pointer-events-none leading-none">$</div>
  </>
);

const BgEmail = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-950/25 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-purple-500/10 blur-lg pointer-events-none" />
    <div className="absolute right-3 top-1 text-5xl font-black text-purple-400/[0.08] select-none pointer-events-none leading-none">@</div>
    <div className="absolute bottom-3 right-3 pointer-events-none opacity-10">
      <div className="w-12 h-12 rounded-full border border-purple-400" />
      <div className="absolute inset-2 rounded-full border border-purple-400" />
    </div>
  </>
);

const BgProjectsTable = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 to-zinc-900 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(245,158,11,0.04),transparent_50%)] pointer-events-none" />
    <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden pointer-events-none">
      <div className="flex h-full">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-amber-500/30' : 'bg-zinc-700/30'}`} />
        ))}
      </div>
    </div>
    <div className="absolute left-0 top-12 bottom-0 w-3 flex flex-col gap-4 py-4 pointer-events-none opacity-[0.08]">
      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="mx-0.5 h-3 bg-zinc-400 rounded-[1px]" />)}
    </div>
  </>
);

const BgTimeline = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 to-zinc-900 pointer-events-none" />
    <div className="absolute inset-0 bg-[conic-gradient(from_230deg_at_90%_0%,rgba(245,158,11,0.06)_0deg,transparent_30deg)] pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(245,158,11,0.05),transparent_40%)] pointer-events-none" />
    <div className="absolute top-0 right-0 h-full w-3 flex flex-col justify-around py-3 pointer-events-none opacity-[0.07]">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="mx-0.5 h-3 bg-zinc-200 rounded-[1px]" />)}
    </div>
    <div className="absolute bottom-3 left-5 right-5 text-[9px] font-black tracking-[0.35em] text-zinc-500/20 select-none pointer-events-none uppercase">Hollywood</div>
  </>
);

// ══════════════════════════════════════════════════════════════════════════════
// ROW 1 — Interactive Stat Cards
// ══════════════════════════════════════════════════════════════════════════════
const StatCard = ({ title, value, change, changeUp, sub, Icon, iconBg, iconColor, accentColor, Bg, onClick, linkLabel }) => (
  <button
    onClick={onClick}
    className="relative w-full text-left bg-zinc-900 rounded-2xl p-5 ring-1 ring-zinc-800 hover:ring-zinc-600 transition-all overflow-hidden shadow-xl shadow-black/30 group cursor-pointer active:scale-[0.98]"
    style={{ '--accent': accentColor }}
  >
    <Bg />
    <div className="relative z-10 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">{title}</p>
        <p className="text-[1.65rem] font-black text-zinc-100 leading-none mb-2">{value}</p>
        <div className="flex items-center gap-1.5">
          {changeUp
            ? <TrendingUp size={10} className="text-emerald-400 flex-shrink-0" />
            : <TrendingDown size={10} className="text-red-400 flex-shrink-0" />}
          <span className={`text-xs font-bold ${changeUp ? 'text-emerald-400' : 'text-red-400'}`}>{change}</span>
          {sub && <span className="text-xs text-zinc-600 ml-0.5">{sub}</span>}
        </div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} className={iconColor} />
      </div>
    </div>
    {/* hover reveal link hint */}
    <div className="relative z-10 flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <ExternalLink size={10} className="text-zinc-500" />
      <span className="text-[10px] text-zinc-500">{linkLabel}</span>
    </div>
  </button>
);

// ══════════════════════════════════════════════════════════════════════════════
// ROW 2 — Welcome Banner
// ══════════════════════════════════════════════════════════════════════════════
const WelcomeMark = ({ onGoToAgents }) => (
  <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 overflow-hidden shadow-2xl shadow-black/50 h-full" style={{ minHeight: 290 }}>
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-blue-950/50 to-zinc-950 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_-10%,rgba(59,130,246,0.18),transparent)] pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_90%,rgba(245,158,11,0.09),transparent_60%)] pointer-events-none" />
    <div className="absolute inset-0 bg-[conic-gradient(from_240deg_at_55%_55%,rgba(245,158,11,0.06)_0deg,transparent_50deg)] pointer-events-none" />
    <div className="absolute left-0 top-0 bottom-0 w-7 flex flex-col justify-around py-2 opacity-[0.14] pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="mx-1 h-4 bg-white rounded-[2px]" />)}
    </div>
    <div className="absolute right-0 top-0 bottom-0 w-7 flex flex-col justify-around py-2 opacity-[0.14] pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="mx-1 h-4 bg-white rounded-[2px]" />)}
    </div>
    <div className="absolute right-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/[0.04] pointer-events-none" />
    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-amber-500/10 pointer-events-none" />
    <div className="relative z-10 px-10 py-8 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Film size={13} className="text-amber-400" />
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.22em]">Studio Command Center</span>
        </div>
        <p className="text-zinc-400 text-sm mb-1 font-medium">Welcome back,</p>
        <h2 className="text-4xl font-black text-white mb-3 tracking-tight leading-none">MulBros Media</h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
          Your AI-powered Hollywood OS is live.<br />
          <span className="text-amber-400 font-semibold">4 agents</span> active ·{' '}
          <span className="text-blue-400 font-semibold">$214K</span> pipeline ·{' '}
          <span className="text-emerald-400 font-semibold">3 verticals</span>
        </p>
      </div>
      <button onClick={onGoToAgents}
        className="self-start inline-flex items-center gap-2 mt-6 text-sm font-bold text-white bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 rounded-xl px-5 py-2.5 transition-all group/btn active:scale-95">
        <Play size={13} className="text-amber-400 group-hover/btn:scale-110 transition-transform" />
        Open Agent Hub
        <ArrowRight size={13} className="text-amber-400 group-hover/btn:translate-x-0.5 transition-transform" />
      </button>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ROW 2 — Audience Score
// ══════════════════════════════════════════════════════════════════════════════
const AudienceScore = ({ onClick }) => {
  const r = 52, circ = 2 * Math.PI * r, dash = circ * 0.95;
  return (
    <button onClick={onClick}
      className="relative w-full text-left bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 hover:ring-amber-500/30 p-5 shadow-xl shadow-black/30 h-full flex flex-col overflow-hidden cursor-pointer transition-all group active:scale-[0.99]">
      <BgAudienceScore />
      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Audience Score</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Across all releases</p>
        </div>
        <ExternalLink size={12} className="text-zinc-600 group-hover:text-amber-400 transition-colors mt-0.5" />
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center py-2">
        <div className="absolute w-32 h-32 rounded-full bg-amber-500/[0.06] blur-2xl pointer-events-none" />
        <div className="relative">
          <svg width="144" height="144" viewBox="0 0 140 140" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#1f1f23" strokeWidth="9" />
            <circle cx="70" cy="70" r={r} fill="none" strokeWidth="9" stroke="url(#scoreGrad)"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Star size={15} className="text-amber-400" fill="#f59e0b" />
            <span className="text-2xl font-black text-white leading-none">95%</span>
            <span className="text-[10px] text-zinc-500">rating</span>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-3 pt-3 border-t border-zinc-800/60 grid grid-cols-3 text-center">
        <div><p className="text-[10px] text-zinc-600">Low</p><p className="text-xs font-bold text-zinc-500">0%</p></div>
        <div><p className="text-[10px] text-zinc-500">Based on</p><p className="text-xs font-bold text-amber-400">likes</p></div>
        <div><p className="text-[10px] text-zinc-600">High</p><p className="text-xs font-bold text-zinc-500">100%</p></div>
      </div>
    </button>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROW 2 — Deal Flow
// ══════════════════════════════════════════════════════════════════════════════
const DealFlow = ({ onClick }) => {
  const r = 36, circ = 2 * Math.PI * r, dash = circ * 0.70;
  return (
    <button onClick={onClick}
      className="relative w-full text-left bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 hover:ring-emerald-500/30 p-5 shadow-xl shadow-black/30 h-full flex flex-col overflow-hidden cursor-pointer transition-all group active:scale-[0.99]">
      <BgDealFlow />
      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Deal Flow</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Luke composer pipeline</p>
        </div>
        <ExternalLink size={12} className="text-zinc-600 group-hover:text-emerald-400 transition-colors mt-0.5" />
      </div>
      <div className="relative z-10 grid grid-cols-2 gap-2 mb-4">
        {[{ label: 'Active Leads', value: '14' }, { label: 'Confirmed $', value: '$30K' }].map(({ label, value }) => (
          <div key={label} className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/30 hover:border-emerald-500/20 transition-colors">
            <p className="text-[10px] text-zinc-500 mb-1">{label}</p>
            <p className="text-lg font-black text-zinc-100">{value}</p>
          </div>
        ))}
      </div>
      <div className="relative z-10 flex items-center gap-4 flex-1">
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r={r} fill="none" stroke="#1f1f23" strokeWidth="7" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={C.emerald} strokeWidth="7"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-white leading-none">9.3</span>
            <span className="text-[9px] text-zinc-500 mt-0.5">score</span>
          </div>
        </div>
        <div className="space-y-2">
          <div><p className="text-[10px] text-zinc-500">Pipeline health</p><p className="text-sm font-bold text-emerald-400">Strong ↑</p></div>
          <div><p className="text-[10px] text-zinc-500">Echo Valley</p><p className="text-xs font-bold text-zinc-300">$35K negotiating</p></div>
          <div><p className="text-[10px] text-zinc-500">Saltwater</p><p className="text-xs font-bold text-zinc-300">$12K in progress</p></div>
        </div>
      </div>
      <div className="relative z-10 mt-3 pt-3 border-t border-zinc-800/60 flex justify-between text-[10px] text-zinc-600">
        <span>0%</span>
        <span className="text-emerald-400 font-bold text-xs">70% closed</span>
        <span>100%</span>
      </div>
    </button>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROW 3 — Revenue Area Chart (interactive series toggle)
// ══════════════════════════════════════════════════════════════════════════════
const RevenueChart = ({ onClick }) => {
  const LINES = [
    { key: 'financing',   label: 'Film Financing', color: C.blue    },
    { key: 'music',       label: 'Music & Comp.',  color: C.gold    },
    { key: 'productions', label: 'Productions',    color: C.emerald },
  ];
  const [active, setActive] = useState(LINES.map(l => l.key));
  const toggle = (key) => setActive(p => p.includes(key) ? (p.length > 1 ? p.filter(k => k !== key) : p) : [...p, key]);

  return (
    <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 hover:ring-zinc-700 shadow-xl shadow-black/30 overflow-hidden transition-all group">
      <BgRevenueChart />
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800/60">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Revenue Pipeline</h3>
          <p className="text-xs text-zinc-500 mt-0.5">6-month forecast · click legend to toggle</p>
        </div>
        <div className="flex items-center gap-4">
          {LINES.map(l => (
            <button key={l.key} onClick={() => toggle(l.key)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95 ${active.includes(l.key) ? 'opacity-100' : 'opacity-25'}`}>
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-zinc-400">{l.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative z-10 h-56 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <defs>
              {LINES.map(l => (
                <linearGradient key={l.key} id={`rev-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={l.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={l.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="month" stroke="#3f3f46" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#3f3f46" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => `$${v / 1000}K`} width={44} />
            <Tooltip
              content={({ active: a, payload, label }) => a && payload?.length
                ? <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-xl p-3 shadow-2xl backdrop-blur-sm text-xs">
                    <p className="text-zinc-400 font-semibold mb-2">{label}</p>
                    {payload.map((e, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="text-zinc-500">{e.name}:</span>
                        <span className="text-zinc-100 font-mono font-semibold">${e.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div> : null}
              cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            {LINES.map(l => active.includes(l.key) && (
              <Area key={l.key} type="monotone" dataKey={l.key} name={l.label}
                stroke={l.color} strokeWidth={2.5} fillOpacity={1} fill={`url(#rev-${l.key})`}
                dot={false} activeDot={{ r: 5, fill: l.color, strokeWidth: 0 }} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROW 3 — Platform Bar Chart
// ══════════════════════════════════════════════════════════════════════════════
const PlatformChart = ({ onClick }) => {
  const CustomBar = ({ x, y, width, height, index }) => {
    const color = PLATFORM_COLORS[index % PLATFORM_COLORS.length];
    const id = `pb-${index}`;
    return (
      <g>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.9} />
            <stop offset="100%" stopColor={color} stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <rect x={x} y={y} width={width} height={height} rx={5} fill={`url(#${id})`} />
      </g>
    );
  };
  return (
    <button onClick={onClick}
      className="relative w-full text-left bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 hover:ring-amber-500/30 shadow-xl shadow-black/30 overflow-hidden cursor-pointer transition-all group active:scale-[0.99]">
      <BgPlatformChart />
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800/60">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Talise — Platform Reach</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Monthly audience by platform</p>
        </div>
        <ExternalLink size={12} className="text-zinc-600 group-hover:text-amber-400 transition-colors" />
      </div>
      <div className="relative z-10 h-56 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PLATFORM_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#3f3f46" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#3f3f46" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} width={36} />
            <Tooltip
              content={({ active: a, payload, label }) => a && payload?.length
                ? <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-xl p-3 shadow-2xl text-xs">
                    <p className="text-zinc-400 font-semibold mb-1">{label}</p>
                    <p className="text-zinc-100 font-mono font-bold">{payload[0].value.toLocaleString()}</p>
                  </div> : null}
              cursor={{ fill: 'rgba(255,255,255,0.025)' }}
            />
            <Bar dataKey="value" shape={<CustomBar />} maxBarSize={44}>
              {PLATFORM_DATA.map((_, i) => <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </button>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROW 4 — Progress Metric Cards
// ══════════════════════════════════════════════════════════════════════════════
const ProgressCard = ({ Icon, iconBg, iconColor, title, value, pct, color, sub, Bg, onClick, hoverRing }) => (
  <button onClick={onClick}
    className={`relative w-full text-left bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 ${hoverRing} p-5 shadow-xl shadow-black/20 overflow-hidden cursor-pointer transition-all group active:scale-[0.98]`}>
    <Bg />
    <div className="relative z-10 flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{title}</p>
        <p className="text-lg font-black text-zinc-100 leading-tight">{value}</p>
      </div>
      <ExternalLink size={11} className="text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
    </div>
    <div className="relative z-10 space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-600">{sub}</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
    </div>
  </button>
);

// ══════════════════════════════════════════════════════════════════════════════
// ROW 5 — Projects Table (clickable rows)
// ══════════════════════════════════════════════════════════════════════════════
const ProjectsTable = ({ onRowClick }) => {
  const projects = [
    { name: 'Last County (Hulu)',  role: 'Distribution', progress: 78, status: 'Active',      color: C.emerald, page: 'productions' },
    { name: 'Saltwater',          role: 'Composer',     progress: 55, status: 'In Progress', color: C.gold,    page: 'financing'   },
    { name: 'Echo Valley',        role: 'Composer',     progress: 20, status: 'Negotiating', color: C.blue,    page: 'financing'   },
    { name: 'Talise — Growth',    role: 'Music',        progress: 85, status: 'Active',      color: C.gold,    page: 'music'       },
    { name: 'Community Campaign', role: 'Marketing',    progress: 40, status: 'Active',      color: C.purple,  page: 'music'       },
  ];
  const badge = {
    'Active':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Negotiating': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 shadow-xl shadow-black/20 overflow-hidden">
      <BgProjectsTable />
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Active Projects</h3>
          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-emerald-400" />
            3 projects delivered this quarter
          </p>
        </div>
        <span className="text-xs text-zinc-600 bg-zinc-800 px-3 py-1 rounded-full">{projects.length} total</span>
      </div>
      <div className="relative z-10 px-4 py-2">
        <div className="grid grid-cols-12 gap-3 px-2 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-zinc-800/60 mb-1">
          <span className="col-span-4">Project</span>
          <span className="col-span-2">Vertical</span>
          <span className="col-span-3">Progress</span>
          <span className="col-span-3">Status</span>
        </div>
        {projects.map((p) => (
          <button key={p.name} onClick={() => onRowClick?.(p.page)}
            className="w-full grid grid-cols-12 gap-3 items-center px-2 py-3 rounded-xl hover:bg-zinc-800/40 active:bg-zinc-800/60 transition-colors border-b border-zinc-800/20 last:border-0 cursor-pointer group text-left">
            <div className="col-span-4">
              <p className="text-sm text-zinc-200 font-semibold group-hover:text-white transition-colors truncate">{p.name}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-zinc-500">{p.role}</p>
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all group-hover:opacity-80" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
              </div>
              <span className="text-xs font-mono text-zinc-500 w-7 text-right flex-shrink-0">{p.progress}%</span>
            </div>
            <div className="col-span-3 flex items-center justify-between">
              <span className={`inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge[p.status]}`}>
                {p.status}
              </span>
              <ArrowRight size={11} className="text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROW 5 — Activity Timeline (clickable items)
// ══════════════════════════════════════════════════════════════════════════════
const ActivityTimeline = ({ onItemClick }) => {
  const events = [
    { Icon: Award,  color: C.gold,    label: 'Last County hit 142,847 streams on Hulu',     time: 'Today, 9:14 AM',     page: 'productions' },
    { Icon: Mic,    color: C.emerald, label: 'Luke — Saltwater delivery confirmed ($12K)',   time: 'Yesterday, 3:20 PM', page: 'financing'   },
    { Icon: Film,   color: C.blue,    label: 'Echo Valley pitched at $35K — negotiating',   time: 'Apr 14, 11:00 AM',   page: 'financing'   },
    { Icon: Radio,  color: C.purple,  label: 'Talise TikTok crossed 45,800 followers',      time: 'Apr 13, 2:45 PM',    page: 'music'       },
    { Icon: Zap,    color: C.gold,    label: 'New lead: indie director sourced via Stage32', time: 'Apr 12, 6:00 PM',    page: 'financing'   },
    { Icon: Star,   color: C.emerald, label: 'Community milestone — 2,847 fans reached',    time: 'Apr 11, 10:30 AM',   page: 'music'       },
  ];
  return (
    <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 shadow-xl shadow-black/20 overflow-hidden">
      <BgTimeline />
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Studio Activity</h3>
          <p className="text-xs mt-0.5 flex items-center gap-1.5">
            <TrendingUp size={11} className="text-emerald-400" />
            <span className="text-emerald-400 font-bold">+28%</span>
            <span className="text-zinc-500">activity this month</span>
          </p>
        </div>
      </div>
      <div className="relative z-10 px-4 py-2">
        {events.map(({ Icon, color, label, time, page }, i) => (
          <button key={i} onClick={() => onItemClick?.(page)}
            className="w-full flex gap-4 py-2.5 px-1 rounded-xl hover:bg-zinc-800/30 active:bg-zinc-800/50 transition-colors cursor-pointer group text-left">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={13} style={{ color }} />
              </div>
              {i < events.length - 1 && <div className="w-px bg-zinc-800 mt-1" style={{ height: 14 }} />}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-xs text-zinc-300 leading-snug group-hover:text-white transition-colors">{label}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock size={9} className="text-zinc-600 flex-shrink-0" />
                <span className="text-[10px] text-zinc-600">{time}</span>
              </div>
            </div>
            <ArrowRight size={11} className="text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all mt-2 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export const Dashboard = ({ onAgentClick, setActivePage }) => {
  const nav = (page) => setActivePage?.(page);

  return (
    <div className="space-y-5">

      {/* Row 1 — 4 interactive themed stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Box Office Revenue" value="$30,000" change="+12.4%" changeUp   sub="confirmed"
          Icon={DollarSign}  iconBg="bg-blue-500/20"    iconColor="text-blue-400"
          accentColor={C.blue} Bg={BgRevenue}
          onClick={() => nav('financing')} linkLabel="View Film Financing →" />

        <StatCard title="Monthly Streams"    value="85,230"  change="+8.2%"  changeUp   sub="Talise"
          Icon={Music}        iconBg="bg-amber-500/20"   iconColor="text-amber-400"
          accentColor={C.gold} Bg={BgStreams}
          onClick={() => nav('music')} linkLabel="View Music & Composition →" />

        <StatCard title="Active Deals"       value="14"      change="+3"     changeUp   sub="pipeline"
          Icon={Clapperboard} iconBg="bg-emerald-500/20" iconColor="text-emerald-400"
          accentColor={C.emerald} Bg={BgDeals}
          onClick={() => nav('financing')} linkLabel="View Deal Pipeline →" />

        <StatCard title="Fan Community"      value="2,847"   change="-2.1%"  changeUp={false} sub="members"
          Icon={Users}        iconBg="bg-purple-500/20"  iconColor="text-purple-400"
          accentColor={C.purple} Bg={BgCommunity}
          onClick={() => nav('music')} linkLabel="View Community →" />
      </div>

      {/* Row 2 — WelcomeMark (6) + AudienceScore (3) + DealFlow (3) */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: 290 }}>
        <div className="col-span-6"><WelcomeMark onGoToAgents={() => nav('agents')} /></div>
        <div className="col-span-3"><AudienceScore onClick={() => nav('music')} /></div>
        <div className="col-span-3"><DealFlow onClick={() => nav('financing')} /></div>
      </div>

      {/* Row 3 — Revenue AreaChart (7) + Platform BarChart (5) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7"><RevenueChart onClick={() => nav('financing')} /></div>
        <div className="col-span-5"><PlatformChart onClick={() => nav('music')} /></div>
      </div>

      {/* Row 4 — 4 progress metric cards */}
      <div className="grid grid-cols-4 gap-4">
        <ProgressCard Icon={Film}       iconBg="bg-emerald-500/20" iconColor="text-emerald-400"
          title="Last County Streams" value="142,847" pct={71} color={C.emerald} sub="Target: 200K"
          Bg={BgFilmFrame} hoverRing="hover:ring-emerald-500/25" onClick={() => nav('productions')} />

        <ProgressCard Icon={Music}      iconBg="bg-amber-500/20"   iconColor="text-amber-400"
          title="Talise Growth"      value="85,230"  pct={85} color={C.gold}    sub="Target: 100K"
          Bg={BgMusicStaff} hoverRing="hover:ring-amber-500/25" onClick={() => nav('music')} />

        <ProgressCard Icon={DollarSign} iconBg="bg-blue-500/20"    iconColor="text-blue-400"
          title="Pipeline Value"     value="$65K"    pct={65} color={C.blue}    sub="Target: $100K"
          Bg={BgPipeline} hoverRing="hover:ring-blue-500/25" onClick={() => nav('financing')} />

        <ProgressCard Icon={Users}      iconBg="bg-purple-500/20"  iconColor="text-purple-400"
          title="Email Subscribers"  value="847"     pct={85} color={C.purple}  sub="Target: 1,000"
          Bg={BgEmail} hoverRing="hover:ring-purple-500/25" onClick={() => nav('music')} />
      </div>

      {/* Row 5 — Projects table (7) + Activity timeline (5) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7"><ProjectsTable onRowClick={(page) => nav(page)} /></div>
        <div className="col-span-5"><ActivityTimeline onItemClick={(page) => nav(page)} /></div>
      </div>

    </div>
  );
};
