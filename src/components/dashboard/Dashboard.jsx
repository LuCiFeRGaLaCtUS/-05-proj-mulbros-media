import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  DollarSign, Users, Music, Film, Clapperboard,
  TrendingUp, TrendingDown, ArrowRight, Star,
  Award, Radio, Mic, Play, Zap, Clock, CheckCircle2,
  ExternalLink, Sparkles,
  Wind, Droplets, Eye, Thermometer, MapPin, RefreshCw, Sunrise, Sunset,
  Music2, Piano, Drama, ScrollText, Camera, Palette, BookOpen, Building2,
  Layers, ChevronRight, Sparkles as SparklesIcon,
} from 'lucide-react';
import { AgentStatusGrid } from './AgentStatusGrid';
import { useAppContext } from '../../App';
import { VERTICALS } from '../../config/verticals';

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

// ── Count-up animation hook ────────────────────────────────────────────────────
const useCountUp = (target, duration = 1400, delay = 0) => {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        setCount(Math.floor(eased * target));
        if (t < 1) rafRef.current = requestAnimationFrame(step);
        else setCount(target);
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);
  return count;
};

// ── Section Label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ label, sub }) => (
  <div className="flex items-center gap-3 pt-1">
    <span className="text-[11px] font-extrabold tracking-[0.22em] text-zinc-400 uppercase flex-shrink-0"
      style={{ fontFamily: 'var(--font-sans)' }}>
      {label}
    </span>
    {sub && <span className="text-[11px] text-zinc-400 flex-shrink-0">· {sub}</span>}
    <div className="flex-1 h-px bg-zinc-200" />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// WELCOME HERO
// ══════════════════════════════════════════════════════════════════════════════
const WelcomeHero = ({ user, profile }) => {
  const [liveNow, setLiveNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setLiveNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const greeting = () => {
    const h = liveNow.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dateStr = liveNow.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const timeStr = liveNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  // Stytch user: name lives in user.name.first_name, email in user.emails[0].email
  const stytchFirstName = user?.name?.first_name?.trim();
  const emailPrefix     = (user?.emails?.[0]?.email || '').split('@')[0].split('.')[0];
  const rawFirst        = stytchFirstName || emailPrefix || 'there';
  const firstName       = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

      {/* ── Left: welcome panel ─────────────────────────────────────────────── */}
      <div className="lg:col-span-7 relative rounded-2xl overflow-hidden tile-pop"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(245,158,11,0.15)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          minHeight: 220,
        }}>

        {/* Ambient glows */}
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-10 right-20 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)' }} />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.45) 35%, rgba(34,211,238,0.2) 65%, transparent)' }} />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid opacity-50 pointer-events-none" />

        <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: 220 }}>

          {/* Top row: greeting text + live clock */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Status tag */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full online-dot"
                  style={{ color: '#22d3ee', background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.8)' }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.24em]"
                  style={{ color: 'rgba(34,211,238,0.75)', fontFamily: 'var(--font-sans)' }}>
                  {greeting()} · Studio Active
                </span>
              </div>

              {/* Main headline */}
              <h1 className="font-display leading-[1.15] mb-0"
                style={{
                  color: 'rgba(12,10,9,0.70)',
                  fontSize: '2.6rem',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  letterSpacing: '0.005em',
                }}>
                Welcome back,
              </h1>
              <h1 className="font-display leading-[1.0]"
                style={{
                  background: 'linear-gradient(105deg, #d97706 0%, #f59e0b 40%, #fbbf24 70%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: '4.8rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                }}>
                {firstName}.
              </h1>
            </div>

            {/* Live clock + date */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
              <div className="px-3 py-2 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#22d3ee', boxShadow: '0 0 5px rgba(34,211,238,0.9)' }} />
                <span className="font-mono text-xl font-black tabular-nums"
                  style={{ color: 'rgba(8,145,178,0.9)', letterSpacing: '-0.02em' }}>
                  {timeStr}
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: 'rgba(0,0,0,0.30)', letterSpacing: '-0.01em' }}>
                {dateStr}
              </span>
            </div>
          </div>

          {/* Bottom: status pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {(() => {
              const vertInfo = profile?.vertical
                ? VERTICALS.find(v => v.id === profile.vertical)
                : null;
              return [
                { label: 'Studio Online',                                    color: '#22d3ee' },
                { label: '9 Agents Active',                                  color: '#34d399' },
                { label: '$214K Pipeline',                                   color: '#f59e0b' },
                { label: vertInfo ? `${vertInfo.label} · Active`
                                  : '3 Verticals Live',                      color: vertInfo?.neon || '#a78bfa' },
              ];
            })().map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: `${color}0d`,
                  border: `1px solid ${color}28`,
                }}>
                <div className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                <span className="text-[12px] font-semibold tracking-wide"
                  style={{ color: `${color}ee`, fontFamily: 'var(--font-sans)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: weather tile ─────────────────────────────────────────────── */}
      <div className="lg:col-span-5">
        <WeatherTile />
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// THEMATIC BACKGROUND DECORATIONS (light-theme variants)
// ══════════════════════════════════════════════════════════════════════════════

const BgRevenue = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />
    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-blue-400/10 pointer-events-none" />
    <div className="absolute right-12 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-blue-400/15 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(59,130,246,0.05),transparent_60%)] pointer-events-none" />
  </>
);

const BgStreams = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
    <div className="absolute right-4 bottom-4 flex items-end gap-[3px] pointer-events-none opacity-[0.07]">
      {[14, 22, 10, 26, 18, 30, 16, 24, 12, 20].map((h, i) => (
        <div key={i} className="w-1.5 rounded-t-sm bg-amber-500" style={{ height: h }} />
      ))}
    </div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,158,11,0.06),transparent_60%)] pointer-events-none" />
  </>
);

const BgDeals = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none opacity-[0.08]">
      {[0,1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />)}
    </div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(16,185,129,0.05),transparent_60%)] pointer-events-none" />
  </>
);

const BgCommunity = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-purple-400/10 blur-xl pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.05),transparent_60%)] pointer-events-none" />
  </>
);

const BgAudienceScore = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(245,158,11,0.07),transparent_65%)] pointer-events-none" />
    {[[10,8],[80,12],[25,72],[70,68],[50,18],[15,50],[88,50]].map(([x, y], i) => (
      <div key={i} className="absolute pointer-events-none opacity-[0.07]"
        style={{ left: `${x}%`, top: `${y}%` }}>
        <Star size={i % 2 === 0 ? 8 : 5} className="text-amber-400" fill="#f59e0b" />
      </div>
    ))}
  </>
);

const BgDealFlow = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(16,185,129,0.07),transparent_60%)] pointer-events-none" />
    <div className="absolute top-3 right-3 space-y-1.5 pointer-events-none opacity-[0.06]">
      {[28, 20, 24, 16, 22].map((w, i) => (
        <div key={i} className="h-0.5 rounded-full bg-emerald-500" style={{ width: w }} />
      ))}
    </div>
  </>
);

const BgRevenueChart = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(59,130,246,0.04),transparent_60%)] pointer-events-none" />
    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl font-black text-blue-400/[0.04] select-none pointer-events-none leading-none">$</div>
  </>
);

const BgPlatformChart = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(245,158,11,0.04),transparent_55%)] pointer-events-none" />
    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl font-black text-amber-400/[0.05] select-none pointer-events-none leading-none">♪</div>
  </>
);

const BgFilmFrame = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-emerald-400/08 blur-lg pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(16,185,129,0.05),transparent_60%)] pointer-events-none" />
  </>
);

const BgMusicStaff = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-amber-400/08 blur-lg pointer-events-none" />
    <div className="absolute right-3 bottom-2 text-5xl font-black text-amber-400/[0.06] select-none pointer-events-none leading-none">♩</div>
  </>
);

const BgPipeline = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-blue-400/08 blur-lg pointer-events-none" />
    <div className="absolute right-3 top-2 text-4xl font-black text-blue-400/[0.06] select-none pointer-events-none leading-none">$</div>
  </>
);

const BgEmail = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-purple-400/08 blur-lg pointer-events-none" />
    <div className="absolute right-3 top-1 text-5xl font-black text-purple-400/[0.06] select-none pointer-events-none leading-none">@</div>
  </>
);

const BgProjectsTable = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/60 to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(245,158,11,0.04),transparent_50%)] pointer-events-none" />
    <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden pointer-events-none">
      <div className="flex h-full">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-amber-400/20' : 'bg-zinc-300/20'}`} />
        ))}
      </div>
    </div>
  </>
);

const BgTimeline = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(245,158,11,0.04),transparent_40%)] pointer-events-none" />
  </>
);

// ══════════════════════════════════════════════════════════════════════════════
// ROW 1 — Interactive Stat Cards with count-up animation
// ══════════════════════════════════════════════════════════════════════════════
const StatCardAnimated = ({ title, value, numericValue, formatter, change, changeUp, sub, Icon, iconBg, iconColor, accentColor, Bg, onClick, linkLabel, delay = 0, cardBg }) => {
  const counted = useCountUp(numericValue, 1400, delay);
  const display = formatter ? formatter(counted) : counted.toLocaleString();

  return (
    <button
      onClick={onClick}
      className="tile-pop relative w-full text-left rounded-2xl p-5 overflow-hidden group cursor-pointer"
      style={{
        background: cardBg || '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        '--accent': accentColor,
      }}
    >
      <Bg />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2"
            style={{ fontFamily: 'var(--font-mono)' }}>{title}</p>
          <p className="text-[1.65rem] font-bold text-zinc-900 leading-none mb-2 tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>{display}</p>
          <div className="flex items-center gap-1.5">
            {changeUp
              ? <TrendingUp size={10} className="text-emerald-500 flex-shrink-0" />
              : <TrendingDown size={10} className="text-red-500 flex-shrink-0" />}
            <span className={`text-xs font-bold ${changeUp ? 'text-emerald-600' : 'text-red-500'}`}>{change}</span>
            {sub && <span className="text-xs text-zinc-400 ml-0.5">{sub}</span>}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ExternalLink size={10} className="text-zinc-400" />
        <span className="text-[10px] text-zinc-400">{linkLabel}</span>
      </div>
    </button>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROW 2 — Welcome Banner
// ══════════════════════════════════════════════════════════════════════════════
const WelcomeMark = ({ onGoToAgents }) => (
  <div className="tile-pop relative bg-white rounded-2xl overflow-hidden h-full"
    style={{
      minHeight: 290,
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    }}>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-amber-50/30 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_-10%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
    <div className="absolute left-0 top-0 bottom-0 w-7 flex flex-col justify-around py-2 opacity-[0.06] pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="mx-1 h-4 bg-zinc-400 rounded-[2px]" />)}
    </div>
    <div className="absolute right-0 top-0 bottom-0 w-7 flex flex-col justify-around py-2 opacity-[0.06] pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="mx-1 h-4 bg-zinc-400 rounded-[2px]" />)}
    </div>

    <div className="relative z-10 px-10 py-8 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Film size={13} className="text-amber-500" />
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.20em]"
            style={{ fontFamily: 'var(--font-sans)' }}>Studio Command Center</span>
        </div>
        <p className="text-zinc-700 text-base mb-0.5 font-medium" style={{ letterSpacing: '-0.01em' }}>Welcome back,</p>
        <h2 className="font-display font-extrabold leading-[0.95] mb-3"
          style={{
            fontSize: '3.2rem',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #18181b 0%, #f59e0b 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          MulBros Media
        </h2>
        <p className="text-zinc-600 text-sm leading-relaxed max-w-xs">
          Your AI-powered Hollywood OS is live.<br />
          <span className="text-amber-600 font-semibold">9 agents</span> active ·{' '}
          <span className="text-blue-600 font-semibold">$214K</span> pipeline ·{' '}
          <span className="text-emerald-600 font-semibold">3 verticals</span>
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        {[
          { label: 'Film Financing', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Productions',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Music & Comp.', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        ].map(({ label, color }) => (
          <span key={label} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${color}`}
            style={{ fontFamily: 'var(--font-sans)' }}>{label}</span>
        ))}
      </div>

      <button onClick={onGoToAgents}
        className="self-start inline-flex items-center gap-2 mt-5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl px-5 py-2.5 transition-all group/btn active:scale-95 shadow-sm shadow-amber-500/20"
        style={{ fontFamily: 'var(--font-sans)' }}>
        <Play size={13} className="group-hover/btn:scale-110 transition-transform" />
        Open Agent Hub
        <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
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
      className="tile-pop relative w-full text-left rounded-2xl p-5 h-full flex flex-col overflow-hidden cursor-pointer group"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fffdf5 45%, #ffffff 75%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <BgAudienceScore />
      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Audience Score</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Across all releases</p>
        </div>
        <ExternalLink size={12} className="text-zinc-400 group-hover:text-amber-500 transition-colors mt-0.5" />
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center py-2">
        <div className="absolute w-32 h-32 rounded-full bg-amber-400/[0.06] blur-2xl pointer-events-none" />
        <div className="relative">
          <svg width="144" height="144" viewBox="0 0 140 140" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="9" />
            <circle cx="70" cy="70" r={r} fill="none" strokeWidth="9" stroke="url(#scoreGrad)"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Star size={15} className="text-amber-500" fill="#f59e0b" />
            <span className="text-2xl font-black text-zinc-900 leading-none" style={{ fontFamily: 'var(--font-sans)' }}>95%</span>
            <span className="text-[10px] text-zinc-500">rating</span>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-3 pt-3 border-t border-zinc-100 grid grid-cols-3 text-center">
        <div><p className="text-[10px] text-zinc-400">Low</p><p className="text-xs font-bold text-zinc-400">0%</p></div>
        <div><p className="text-[10px] text-zinc-500">Based on</p><p className="text-xs font-bold text-amber-600">likes</p></div>
        <div><p className="text-[10px] text-zinc-400">High</p><p className="text-xs font-bold text-zinc-400">100%</p></div>
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
      className="tile-pop relative w-full text-left rounded-2xl p-5 h-full flex flex-col overflow-hidden cursor-pointer group"
      style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f4fdf9 45%, #ffffff 75%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <BgDealFlow />
      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Deal Flow</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Luke composer pipeline</p>
        </div>
        <ExternalLink size={12} className="text-zinc-400 group-hover:text-emerald-500 transition-colors mt-0.5" />
      </div>
      <div className="relative z-10 grid grid-cols-2 gap-2 mb-4">
        {[{ label: 'Active Leads', value: '14' }, { label: 'Confirmed $', value: '$30K' }].map(({ label, value }) => (
          <div key={label} className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 hover:border-emerald-300 transition-colors">
            <p className="text-[10px] text-zinc-500 mb-1">{label}</p>
            <p className="text-lg font-black text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="relative z-10 flex items-center gap-4 flex-1">
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={C.emerald} strokeWidth="7"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-zinc-900 leading-none" style={{ fontFamily: 'var(--font-sans)' }}>9.3</span>
            <span className="text-[9px] text-zinc-500 mt-0.5">score</span>
          </div>
        </div>
        <div className="space-y-2">
          <div><p className="text-[10px] text-zinc-500">Pipeline health</p><p className="text-sm font-bold text-emerald-600">Strong ↑</p></div>
          <div><p className="text-[10px] text-zinc-500">Echo Valley</p><p className="text-xs font-bold text-zinc-700">$35K negotiating</p></div>
          <div><p className="text-[10px] text-zinc-500">Saltwater</p><p className="text-xs font-bold text-zinc-700">$12K in progress</p></div>
        </div>
      </div>
      <div className="relative z-10 mt-3 pt-3 border-t border-zinc-100 flex justify-between text-[10px] text-zinc-400">
        <span>0%</span>
        <span className="text-emerald-600 font-bold text-xs">70% closed</span>
        <span>100%</span>
      </div>
    </button>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROW 3 — Revenue Area Chart
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
    <div className="tile-pop relative rounded-2xl overflow-hidden group"
      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f8faff 40%, #ffffff 70%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <BgRevenueChart />
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Revenue Pipeline</h3>
          <p className="text-xs text-zinc-500 mt-0.5">6-month forecast · click legend to toggle</p>
        </div>
        <div className="flex items-center gap-4">
          {LINES.map(l => (
            <button key={l.key} onClick={() => toggle(l.key)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95 ${active.includes(l.key) ? 'opacity-100' : 'opacity-30'}`}>
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-zinc-600">{l.label}</span>
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
                  <stop offset="5%"  stopColor={l.color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={l.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="month" stroke="#d4d4d8" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#d4d4d8" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => `$${v / 1000}K`} width={44} />
            <Tooltip
              content={({ active: a, payload, label }) => a && payload?.length
                ? <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-lg text-xs">
                    <p className="text-zinc-600 font-semibold mb-2">{label}</p>
                    {payload.map((e, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="text-zinc-500">{e.name}:</span>
                        <span className="text-zinc-900 font-mono font-semibold">${e.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div> : null}
              cursor={{ stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 4' }}
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
const CustomBar = ({ x, y, width, height, index }) => {
  const color = PLATFORM_COLORS[index % PLATFORM_COLORS.length];
  const id = `pb-${index}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} rx={5} fill={`url(#${id})`} />
    </g>
  );
};

const PlatformChart = ({ onClick }) => {
  return (
    <button onClick={onClick}
      className="tile-pop relative w-full text-left rounded-2xl overflow-hidden cursor-pointer group"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fffdf5 40%, #ffffff 70%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <BgPlatformChart />
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Talise — Platform Reach</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Monthly audience by platform</p>
        </div>
        <ExternalLink size={12} className="text-zinc-400 group-hover:text-amber-500 transition-colors" />
      </div>
      <div className="relative z-10 h-56 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PLATFORM_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="name" stroke="#d4d4d8" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#d4d4d8" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} width={36} />
            <Tooltip
              content={({ active: a, payload, label }) => a && payload?.length
                ? <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-lg text-xs">
                    <p className="text-zinc-600 font-semibold mb-1">{label}</p>
                    <p className="text-zinc-900 font-mono font-bold">{payload[0].value.toLocaleString()}</p>
                  </div> : null}
              cursor={{ fill: 'rgba(0,0,0,0.025)' }}
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
const ProgressCard = ({ Icon, iconBg, iconColor, title, value, pct, color, sub, Bg, onClick, hoverRing, cardBg }) => (
  <button onClick={onClick}
    className={`tile-pop relative w-full text-left rounded-2xl ${hoverRing} p-5 overflow-hidden cursor-pointer group`}
    style={{ background: cardBg || '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
    <Bg />
    <div className="relative z-10 flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{title}</p>
        <p className="text-lg font-black text-zinc-900 leading-tight"
          style={{ fontFamily: 'var(--font-sans)' }}>{value}</p>
      </div>
      <ExternalLink size={11} className="text-zinc-300 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
    </div>
    <div className="relative z-10 space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">{sub}</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
    </div>
  </button>
);

// ══════════════════════════════════════════════════════════════════════════════
// ROW 5 — Projects Table
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
    'Active':      'bg-emerald-50 text-emerald-700 border-emerald-200',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
    'Negotiating': 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <div className="tile-pop relative rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #fafaf8 0%, #ffffff 50%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <BgProjectsTable />
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Active Projects</h3>
          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-emerald-500" />
            3 projects delivered this quarter
          </p>
        </div>
        <span className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">{projects.length} total</span>
      </div>
      <div className="relative z-10 px-4 py-2">
        <div className="grid grid-cols-12 gap-3 px-2 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 mb-1">
          <span className="col-span-4">Project</span>
          <span className="col-span-2">Vertical</span>
          <span className="col-span-3">Progress</span>
          <span className="col-span-3">Status</span>
        </div>
        {projects.map((p) => (
          <button key={p.name} onClick={() => onRowClick?.(p.page)}
            className="w-full grid grid-cols-12 gap-3 items-center px-2 py-3 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors border-b border-zinc-50 last:border-0 cursor-pointer group text-left">
            <div className="col-span-4">
              <p className="text-sm text-zinc-700 font-semibold group-hover:text-zinc-900 transition-colors truncate">{p.name}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-zinc-500">{p.role}</p>
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all group-hover:opacity-80" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
              </div>
              <span className="text-xs font-mono text-zinc-500 w-7 text-right flex-shrink-0">{p.progress}%</span>
            </div>
            <div className="col-span-3 flex items-center justify-between">
              <span className={`inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge[p.status]}`}>
                {p.status}
              </span>
              <ArrowRight size={11} className="text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROW 5 — Activity Timeline
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
    <div className="tile-pop relative rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #fafaf8 0%, #ffffff 50%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <BgTimeline />
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Studio Activity</h3>
          <p className="text-xs mt-0.5 flex items-center gap-1.5">
            <TrendingUp size={11} className="text-emerald-500" />
            <span className="text-emerald-600 font-bold">+28%</span>
            <span className="text-zinc-500">activity this month</span>
          </p>
        </div>
      </div>
      <div className="relative z-10 px-4 py-2">
        {events.map(({ Icon, color, label, time, page }, i) => (
          <button key={i} onClick={() => onItemClick?.(page)}
            className="w-full flex gap-4 py-2.5 px-1 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer group text-left">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${color}12`, border: `1px solid ${color}25` }}>
                <Icon size={13} style={{ color }} />
              </div>
              {i < events.length - 1 && <div className="w-px bg-zinc-200 mt-1" style={{ height: 14 }} />}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-xs text-zinc-700 leading-snug group-hover:text-zinc-900 transition-colors">{label}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock size={9} className="text-zinc-400 flex-shrink-0" />
                <span className="text-[10px] text-zinc-400">{time}</span>
              </div>
            </div>
            <ArrowRight size={11} className="text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all mt-2 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// WEATHER TILE — live data via wttr.in proxy
// ══════════════════════════════════════════════════════════════════════════════

const weatherIcon = (code) => {
  const n = parseInt(code, 10);
  if (n === 113)                       return '☀️';
  if (n === 116)                       return '⛅';
  if (n === 119 || n === 122)          return '☁️';
  if ([143, 248, 260].includes(n))     return '🌫️';
  if ([200, 386, 389, 392, 395].includes(n)) return '⛈️';
  if ([227, 230].includes(n))          return '🌨️';
  if (n >= 263 && n <= 284)            return '🌦️';
  if (n >= 293 && n <= 314)            return '🌧️';
  if (n >= 317 && n <= 338)            return '❄️';
  if (n >= 350 && n <= 377)            return '🌨️';
  return '🌤️';
};

const weatherBg = (code) => {
  const n = parseInt(code, 10);
  if (n === 113) return { accent: '#f59e0b', bg: 'rgba(251,191,36,0.07)', neon: '#d97706' };
  if (n <= 122)  return { accent: '#22d3ee', bg: 'rgba(34,211,238,0.07)', neon: '#0891b2' };
  if ([200, 386, 389, 392, 395].includes(n))
                 return { accent: '#a78bfa', bg: 'rgba(139,92,246,0.07)', neon: '#7c3aed' };
  if (n >= 317)  return { accent: '#93c5fd', bg: 'rgba(147,197,253,0.07)', neon: '#2563eb' };
  return { accent: '#22d3ee', bg: 'rgba(34,211,238,0.05)', neon: '#0891b2' };
};

const WeatherTile = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = () => {
    const controller = new AbortController();
    setRefreshing(true);
    fetch('/api/weather', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        const cur  = data.current_condition[0];
        const area = data.nearest_area[0];
        const ast  = data.weather?.[0]?.astronomy?.[0];
        setWeather({
          tempC:      parseInt(cur.temp_C, 10),
          tempF:      parseInt(cur.temp_F, 10),
          feelsC:     parseInt(cur.FeelsLikeC, 10),
          desc:       cur.weatherDesc[0].value,
          humidity:   cur.humidity,
          windKmph:   cur.windspeedKmph,
          windDir:    cur.winddir16Point,
          uv:         cur.uvIndex,
          visibility: cur.visibility,
          code:       cur.weatherCode,
          city:       area.areaName[0].value,
          country:    area.country[0].value,
          sunrise:    ast?.sunrise  || '—',
          sunset:     ast?.sunset   || '—',
        });
        setLoading(false);
        setRefreshing(false);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') { setError(true); setLoading(false); setRefreshing(false); }
      });
    return controller;
  };

  useEffect(() => {
    const ctrl = fetchWeather();
    return () => ctrl.abort();
  }, []);

  const theme = weather ? weatherBg(weather.code) : weatherBg(116);
  const icon  = weather ? weatherIcon(weather.code) : '🌤️';

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden tile-pop"
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', minHeight: 220 }}>
      <div className="p-5 space-y-3">
        <div className="weather-skeleton h-3 w-24 mb-4" />
        <div className="weather-skeleton h-12 w-20" />
        <div className="weather-skeleton h-3 w-32" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[1,2,3,4].map(i => <div key={i} className="weather-skeleton h-8 rounded-lg" />)}
        </div>
      </div>
    </div>
  );

  /* ── Error state ── */
  if (error) return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden tile-pop flex flex-col items-center justify-center gap-2"
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', minHeight: 220 }}>
      <span className="text-3xl">🌐</span>
      <p className="text-xs text-zinc-500 text-center px-4">Weather unavailable.<br/>Check network connection.</p>
      <button onClick={() => { setError(false); setLoading(true); fetchWeather(); }}
        className="text-[10px] font-bold mt-1 px-3 py-1 rounded-lg transition-all"
        style={{ background: 'rgba(34,211,238,0.10)', color: '#0891b2', border: '1px solid rgba(34,211,238,0.20)' }}>
        Retry
      </button>
    </div>
  );

  return (
    <div className="relative w-full rounded-2xl overflow-hidden tile-pop cursor-default"
      style={{
        background: `linear-gradient(145deg, ${theme.bg} 0%, rgba(247,247,250,0.5) 50%, #FFFFFF 100%)`,
        border: `1px solid ${theme.accent}28`,
        boxShadow: `0 0 20px ${theme.accent}08, 0 1px 3px rgba(0,0,0,0.06)`,
        minHeight: 220,
      }}>

      {/* Ambient glow orb */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${theme.accent}10 0%, transparent 70%)` }} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent, ${theme.accent}50, transparent)` }} />

      <div className="relative z-10 p-5 flex flex-col h-full">

        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={11} style={{ color: theme.neon, opacity: 0.8 }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: theme.neon }}>
              {weather.city}, {weather.country}
            </span>
          </div>
          <button
            onClick={() => { setRefreshing(true); fetchWeather(); }}
            title="Refresh weather"
            className="p-1 rounded-lg transition-all"
            style={{ color: `${theme.accent}70` }}
            onMouseEnter={e => e.currentTarget.style.color = theme.accent}
            onMouseLeave={e => e.currentTarget.style.color = `${theme.accent}70`}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Main temp + icon */}
        <div className="flex items-end gap-3 mb-1">
          <div>
            <div className="text-5xl leading-none font-black tabular-nums"
              style={{ color: '#18181b', textShadow: `0 0 20px ${theme.accent}20` }}>
              {weather.tempC}°
            </div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(0,0,0,0.40)' }}>
              {weather.tempF}°F · Feels {weather.feelsC}°C
            </div>
          </div>
          <div className="text-4xl mb-0.5 leading-none select-none">{icon}</div>
        </div>

        {/* Condition label */}
        <p className="text-xs font-semibold mb-4" style={{ color: theme.neon }}>
          {weather.desc}
        </p>

        {/* Data grid */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          {[
            { Icon: Droplets,    label: 'Humidity',   value: `${weather.humidity}%`           },
            { Icon: Wind,        label: 'Wind',       value: `${weather.windKmph} km/h ${weather.windDir}` },
            { Icon: Eye,         label: 'Visibility', value: `${weather.visibility} km`        },
            { Icon: Thermometer, label: 'UV Index',   value: weather.uv                        },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <Icon size={12} style={{ color: theme.neon, flexShrink: 0, opacity: 0.8 }} />
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.35)' }}>{label}</p>
                <p className="text-xs font-bold truncate" style={{ color: 'rgba(0,0,0,0.75)' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sunrise / Sunset */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1">
            <Sunrise size={10} style={{ color: '#f59e0b', opacity: 0.8 }} />
            <span className="text-[10px] font-mono" style={{ color: 'rgba(0,0,0,0.35)' }}>{weather.sunrise}</span>
          </div>
          <div className="h-px flex-1 mx-2" style={{ background: 'rgba(0,0,0,0.08)' }} />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono" style={{ color: 'rgba(0,0,0,0.35)' }}>{weather.sunset}</span>
            <Sunset size={10} style={{ color: '#f97316', opacity: 0.8 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VERTICAL ICON MAP
// ══════════════════════════════════════════════════════════════════════════════
const V_ICON = {
  filmmaker:    Clapperboard,
  musician:     Music2,
  composer:     Piano,
  actor:        Drama,
  screenwriter: ScrollText,
  crew:         Camera,
  artist:       Palette,
  writer:       BookOpen,
  artsorg:      Building2,
};

const VERTICAL_PATH = {
  filmmaker:    '/vertical/filmmaker',
  musician:     '/vertical/musician',
  composer:     '/vertical/composer',
  actor:        '/vertical/actor',
  screenwriter: '/vertical/screenwriter',
  crew:         '/vertical/crew',
  artist:       '/vertical/artist',
  writer:       '/vertical/writer',
  artsorg:      '/vertical/artsorg',
};

// ══════════════════════════════════════════════════════════════════════════════
// VERTICAL PROFILE CARD — shown after onboarding, personalized to the user
// ══════════════════════════════════════════════════════════════════════════════
const VerticalProfileCard = () => {
  const { profile, navigate } = useAppContext();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!profile?.vertical) return null;

  const vertInfo   = VERTICALS.find(v => v.id === profile.vertical);
  if (!vertInfo) return null;

  const Icon       = V_ICON[profile.vertical] || Layers;
  const neon       = vertInfo.neon;
  const answers    = profile.onboarding_data?.answers || {};
  const answerList = Object.values(answers).filter(Boolean).slice(0, 4);
  const isSkipped  = profile.onboarding_data?.skipped_questions;
  const path       = VERTICAL_PATH[profile.vertical] || '/dashboard';

  return (
    <div
      className="relative rounded-2xl overflow-hidden animate-hud-in"
      style={{
        background: `linear-gradient(135deg, ${neon}08 0%, #FFFFFF 60%)`,
        border: `1px solid ${neon}28`,
        boxShadow: `0 0 0 1px ${neon}10, 0 4px 20px rgba(0,0,0,0.05)`,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent, ${neon}60, transparent)` }}
      />

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all z-10 text-xs font-bold"
        aria-label="Dismiss"
      >
        ✕
      </button>

      <div className="relative z-10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">

        {/* ── Left: Vertical identity ─────────────────────────────────── */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${neon}14`,
              border: `1px solid ${neon}30`,
              boxShadow: `0 0 16px ${neon}15`,
            }}
          >
            <Icon size={26} style={{ color: neon }} />
          </div>

          {/* Label */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[9px] font-black uppercase tracking-[0.22em]"
                style={{ color: neon, fontFamily: 'var(--font-mono)' }}
              >
                Your Vertical
              </span>
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `${neon}12`,
                  border: `1px solid ${neon}28`,
                  color: neon,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: neon }} />
                Profile Active
              </span>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 leading-tight">{vertInfo.label}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{vertInfo.desc}</p>
          </div>
        </div>

        {/* ── Middle: Answer chips ────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {isSkipped ? (
            <p className="text-xs text-zinc-400 italic">
              Profile questions skipped — update anytime in Settings.
            </p>
          ) : answerList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {answerList.map((ans, i) => (
                <span
                  key={i}
                  className="inline-flex text-xs font-medium px-3 py-1.5 rounded-xl border"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#52525b',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <CheckCircle2 size={11} style={{ color: neon, marginRight: 5, flexShrink: 0, marginTop: 1 }} />
                  {ans}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── Right: CTA ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 flex-shrink-0 sm:items-end w-full sm:w-auto">
          <button
            onClick={() => navigate(path)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
            style={{ background: neon, boxShadow: `0 4px 12px ${neon}30` }}
          >
            Open Workspace
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => navigate('/agents')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <SparklesIcon size={11} />
            Talk to an agent
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export const Dashboard = ({ onAgentClick, setActivePage, user }) => {
  const { profile } = useAppContext();
  const nav = (page) => setActivePage?.(page);

  return (
    <div className="space-y-5">

      {/* Hero */}
      <WelcomeHero user={user} profile={profile} />

      {/* Vertical Profile Card — personalized after onboarding */}
      <VerticalProfileCard />

      {/* Row 1 — 4 interactive themed stat cards */}
      <SectionLabel label="Metrics" sub="live indicators" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCardAnimated title="Box Office Revenue" numericValue={30000} formatter={v => `$${v.toLocaleString()}`}
          change="+12.4%" changeUp sub="confirmed"
          Icon={DollarSign} iconBg="bg-blue-100" iconColor="text-blue-600"
          accentColor={C.blue} Bg={BgRevenue} cardBg="linear-gradient(135deg, #eff6ff 0%, #f4f8ff 45%, #ffffff 75%)"
          onClick={() => nav('financing')} linkLabel="View Film Financing →" delay={0} />

        <StatCardAnimated title="Monthly Streams" numericValue={85230} formatter={v => v.toLocaleString()}
          change="+8.2%" changeUp sub="Talise"
          Icon={Music} iconBg="bg-amber-100" iconColor="text-amber-600"
          accentColor={C.gold} Bg={BgStreams} cardBg="linear-gradient(135deg, #fffbeb 0%, #fffdf4 45%, #ffffff 75%)"
          onClick={() => nav('music')} linkLabel="View Music & Composition →" delay={80} />

        <StatCardAnimated title="Active Deals" numericValue={14} formatter={v => String(v)}
          change="+3" changeUp sub="pipeline"
          Icon={Clapperboard} iconBg="bg-emerald-100" iconColor="text-emerald-600"
          accentColor={C.emerald} Bg={BgDeals} cardBg="linear-gradient(135deg, #ecfdf5 0%, #f4fdf9 45%, #ffffff 75%)"
          onClick={() => nav('financing')} linkLabel="View Deal Pipeline →" delay={160} />

        <StatCardAnimated title="Fan Community" numericValue={2847} formatter={v => v.toLocaleString()}
          change="-2.1%" changeUp={false} sub="members"
          Icon={Users} iconBg="bg-purple-100" iconColor="text-purple-600"
          accentColor={C.purple} Bg={BgCommunity} cardBg="linear-gradient(135deg, #f5f3ff 0%, #f9f7ff 45%, #ffffff 75%)"
          onClick={() => nav('music')} linkLabel="View Community →" delay={240} />
      </div>

      {/* Row 2 */}
      <SectionLabel label="Overview" sub="studio command" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: 290 }}>
        <div className="lg:col-span-6"><WelcomeMark onGoToAgents={() => nav('agents')} /></div>
        <div className="lg:col-span-3"><AudienceScore onClick={() => nav('music')} /></div>
        <div className="lg:col-span-3"><DealFlow onClick={() => nav('financing')} /></div>
      </div>

      {/* Row 3 */}
      <SectionLabel label="Analytics" sub="6-month forecast · platform reach" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7"><RevenueChart onClick={() => nav('financing')} /></div>
        <div className="lg:col-span-5"><PlatformChart onClick={() => nav('music')} /></div>
      </div>

      {/* Row 4 */}
      <SectionLabel label="Targets" sub="progress to goal" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <ProgressCard Icon={Film}       iconBg="bg-emerald-100" iconColor="text-emerald-600"
          title="Last County Streams" value="142,847" pct={71} color={C.emerald} sub="Target: 200K"
          Bg={BgFilmFrame} hoverRing="hover:border-emerald-300" onClick={() => nav('productions')}
          cardBg="linear-gradient(135deg, #ecfdf5 0%, #f4fdf9 45%, #ffffff 75%)" />

        <ProgressCard Icon={Music}      iconBg="bg-amber-100"   iconColor="text-amber-600"
          title="Talise Growth"      value="85,230"  pct={85} color={C.gold}    sub="Target: 100K"
          Bg={BgMusicStaff} hoverRing="hover:border-amber-300" onClick={() => nav('music')}
          cardBg="linear-gradient(135deg, #fffbeb 0%, #fffdf4 45%, #ffffff 75%)" />

        <ProgressCard Icon={DollarSign} iconBg="bg-blue-100"    iconColor="text-blue-600"
          title="Pipeline Value"     value="$65K"    pct={65} color={C.blue}    sub="Target: $100K"
          Bg={BgPipeline} hoverRing="hover:border-blue-300" onClick={() => nav('financing')}
          cardBg="linear-gradient(135deg, #eff6ff 0%, #f4f8ff 45%, #ffffff 75%)" />

        <ProgressCard Icon={Users}      iconBg="bg-purple-100"  iconColor="text-purple-600"
          title="Email Subscribers"  value="847"     pct={85} color={C.purple}  sub="Target: 1,000"
          Bg={BgEmail} hoverRing="hover:border-purple-300" onClick={() => nav('music')}
          cardBg="linear-gradient(135deg, #f5f3ff 0%, #f9f7ff 45%, #ffffff 75%)" />
      </div>

      {/* Row 5 */}
      <SectionLabel label="Operations" sub="projects · studio activity" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7"><ProjectsTable onRowClick={(page) => nav(page)} /></div>
        <div className="lg:col-span-5"><ActivityTimeline onItemClick={(page) => nav(page)} /></div>
      </div>

      {/* Row 6 — Agent Fleet */}
      <SectionLabel label="Agent Fleet" sub="9 agents online" />
      <AgentStatusGrid onAgentClick={onAgentClick} />

    </div>
  );
};
