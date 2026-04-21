import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Clapperboard, Film, Music2, Piano,
  Drama, ScrollText, Camera, Palette, BookOpen, Building2,
  Settings, CalendarDays, Activity, ChevronRight, Shield, Film as FilmIcon,
} from 'lucide-react';
import { agents } from '../../config/agents';
import { VERTICALS } from '../../config/verticals';

// ── Icon resolver — maps string names from verticals.js to Lucide components ──
const ICON_MAP = {
  Clapperboard, Music2, Piano, Drama, ScrollText,
  Camera, Palette, BookOpen, Building2,
};

// ── Productions sub-vertical (existing view, lives under filmmaker) ────────────
const PRODUCTIONS = {
  id: 'productions', path: '/vertical/productions',
  label: 'Productions', sub: 'Distribution',
  icon: FilmIcon, neon: '#34d399',
};

// ── Full color map for all 9 vertical color tokens ────────────────────────────
const colorMap = {
  emerald: { activeText: 'text-emerald-700', hoverText: 'hover:text-emerald-600', dot: 'bg-emerald-500', iconBg: 'bg-emerald-50',  iconText: 'text-emerald-600', glowStyle: 'inset 0 0 0 1px rgba(16,185,129,0.20)'  },
  amber:   { activeText: 'text-amber-700',   hoverText: 'hover:text-amber-600',   dot: 'bg-amber-500',   iconBg: 'bg-amber-50',    iconText: 'text-amber-600',   glowStyle: 'inset 0 0 0 1px rgba(245,158,11,0.20)'  },
  violet:  { activeText: 'text-violet-700',  hoverText: 'hover:text-violet-600',  dot: 'bg-violet-500',  iconBg: 'bg-violet-50',   iconText: 'text-violet-600',  glowStyle: 'inset 0 0 0 1px rgba(139,92,246,0.20)'  },
  rose:    { activeText: 'text-rose-700',    hoverText: 'hover:text-rose-600',    dot: 'bg-rose-500',    iconBg: 'bg-rose-50',     iconText: 'text-rose-600',    glowStyle: 'inset 0 0 0 1px rgba(244,63,94,0.20)'   },
  orange:  { activeText: 'text-orange-700',  hoverText: 'hover:text-orange-600',  dot: 'bg-orange-500',  iconBg: 'bg-orange-50',   iconText: 'text-orange-600',  glowStyle: 'inset 0 0 0 1px rgba(249,115,22,0.20)'  },
  slate:   { activeText: 'text-slate-700',   hoverText: 'hover:text-slate-600',   dot: 'bg-slate-500',   iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   glowStyle: 'inset 0 0 0 1px rgba(100,116,139,0.20)' },
  pink:    { activeText: 'text-pink-700',    hoverText: 'hover:text-pink-600',    dot: 'bg-pink-500',    iconBg: 'bg-pink-50',     iconText: 'text-pink-600',    glowStyle: 'inset 0 0 0 1px rgba(236,72,153,0.20)'  },
  teal:    { activeText: 'text-teal-700',    hoverText: 'hover:text-teal-600',    dot: 'bg-teal-500',    iconBg: 'bg-teal-50',     iconText: 'text-teal-600',    glowStyle: 'inset 0 0 0 1px rgba(20,184,166,0.20)'  },
  indigo:  { activeText: 'text-indigo-700',  hoverText: 'hover:text-indigo-600',  dot: 'bg-indigo-500',  iconBg: 'bg-indigo-50',   iconText: 'text-indigo-600',  glowStyle: 'inset 0 0 0 1px rgba(99,102,241,0.20)'  },
};

/* ── White sidebar background ──────────────────────────────────────────────── */
const SidebarBg = () => (
  <>
    <div className="absolute inset-0" style={{ background: '#FFFFFF' }} />
    <div className="absolute inset-0 bg-dot-grid opacity-70" />
    <div
      className="absolute -top-8 -left-8 w-56 h-56 rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }}
    />
    <div
      className="absolute top-0 right-0 bottom-0 w-px pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.05) 70%, transparent)' }}
    />
  </>
);

/* ── HUD section divider ───────────────────────────────────────────────────── */
const HudDivider = ({ label }) => (
  <div className="flex items-center gap-2 px-3 pt-5 pb-2">
    <div className="w-1 h-3 rounded-sm" style={{ background: 'rgba(245,158,11,0.6)' }} />
    <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(245,158,11,0.5)' }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(245,158,11,0.2), transparent)' }} />
  </div>
);

/* ── Simple nav button ─────────────────────────────────────────────────────── */
const NavButton = ({ label, icon: Icon, isActive, onClick, activeAccent = '#f59e0b', chip }) => (
  <button
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group overflow-hidden ${
      isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
    }`}
    style={isActive ? {
      background: `linear-gradient(90deg, ${activeAccent}14 0%, transparent 100%)`,
      boxShadow: `inset 0 0 0 1px ${activeAccent}22`,
    } : undefined}
  >
    {isActive && (
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
        style={{ background: activeAccent, boxShadow: `0 0 8px ${activeAccent}` }}
      />
    )}
    {!isActive && (
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.03)' }} />
    )}
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
      isActive ? 'bg-black/[0.07]' : 'bg-black/[0.04] group-hover:bg-black/[0.07]'
    }`}>
      <Icon size={14} style={isActive ? { color: activeAccent } : undefined} />
    </div>
    <span className="font-medium text-sm flex-1">{label}</span>
    {chip && (
      <span className="chip bg-amber-500/10 text-amber-600 border border-amber-500/20">{chip}</span>
    )}
    {isActive && (
      <ChevronRight size={12} style={{ color: activeAccent, opacity: 0.6 }} />
    )}
  </button>
);

/* ── Main Sidebar ──────────────────────────────────────────────────────────── */
export const Sidebar = ({ profile, onClose }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const pathname  = location.pathname;

  const go = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 flex flex-col overflow-hidden z-40">
      <SidebarBg />

      {/* ── Logo / Brand header ───────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>

        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.5), rgba(34,211,238,0.2), transparent)' }} />

        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0" style={{ isolation: 'isolate' }}>
            <div className="absolute -inset-2 rounded-2xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' }} />
            <div className="absolute -inset-0.5 rounded-xl pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(34,211,238,0.1))', filter: 'blur(4px)' }} />
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-zinc-950"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
                boxShadow: '0 0 16px rgba(245,158,11,0.30), 0 2px 6px rgba(0,0,0,0.12)',
              }}>
              <span>M</span>
              <span className="absolute top-1 left-1 w-1 h-1 rounded-full bg-zinc-950/40" />
              <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-zinc-950/40" />
              <span className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-zinc-950/40" />
              <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-zinc-950/40" />
            </div>
          </div>

          <div>
            <div className="text-[18px] font-black tracking-[0.20em] leading-none"
              style={{ color: '#f59e0b', fontFamily: 'var(--font-sans)' }}>
              MULBROS
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1 h-1 rounded-full bg-cyan-400 online-dot" />
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase font-mono"
                style={{ color: 'rgba(0,0,0,0.40)', fontFamily: 'var(--font-mono)' }}>
                MEDIA OS
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
          <span className="chip" style={{
            background: 'rgba(34,211,238,0.10)',
            color: 'rgba(6,182,212,0.9)',
            border: '1px solid rgba(34,211,238,0.20)',
          }}>
            SYS ONLINE
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">

        <NavButton
          label="Dashboard"
          icon={LayoutDashboard}
          isActive={pathname === '/dashboard' || pathname === '/'}
          onClick={() => go('/dashboard')}
          activeAccent="#f59e0b"
        />

        <HudDivider label="Verticals" />

        {/* All 9 verticals — shown to everyone for testing */}
        {VERTICALS.map(v => {
          const Icon     = ICON_MAP[v.icon] || Clapperboard;
          const c        = colorMap[v.color] || colorMap.emerald;
          const path     = `/vertical/${v.id}`;
          const isActive = pathname.startsWith(path);
          return (
            <button
              key={v.id}
              onClick={() => go(path)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group overflow-hidden ${
                isActive ? c.activeText : `text-zinc-600 ${c.hoverText}`
              }`}
              style={isActive ? { boxShadow: c.glowStyle } : undefined}
            >
              {isActive && (
                <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${c.dot}`}
                  style={{ boxShadow: '0 0 8px currentColor' }} />
              )}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.025)' }} />
              )}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                isActive ? c.iconBg : 'bg-black/[0.04] group-hover:bg-black/[0.07]'
              }`}>
                <Icon size={14} className={isActive ? c.iconText : ''} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-snug truncate">{v.label}</div>
                <div className="text-[10px] mt-0.5 tracking-[0.12em]"
                  style={{ color: 'rgba(0,0,0,0.30)', fontFamily: 'var(--font-mono)' }}>
                  {v.sub}
                </div>
              </div>
              {isActive && (
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot} animate-cyan-pulse`} />
              )}
            </button>
          );
        })}

        {/* Productions — Distribution sub-vertical */}
        {(() => {
          const c        = colorMap.emerald;
          const isActive = pathname.startsWith(PRODUCTIONS.path);
          const Icon     = PRODUCTIONS.icon;
          return (
            <button
              key="productions"
              onClick={() => go(PRODUCTIONS.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group overflow-hidden ${
                isActive ? c.activeText : `text-zinc-600 ${c.hoverText}`
              }`}
              style={isActive ? { boxShadow: c.glowStyle } : undefined}
            >
              {isActive && (
                <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${c.dot}`}
                  style={{ boxShadow: '0 0 8px currentColor' }} />
              )}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.025)' }} />
              )}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                isActive ? c.iconBg : 'bg-black/[0.04] group-hover:bg-black/[0.07]'
              }`}>
                <Icon size={14} className={isActive ? c.iconText : ''} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-snug truncate">{PRODUCTIONS.label}</div>
                <div className="text-[10px] mt-0.5 tracking-[0.12em]"
                  style={{ color: 'rgba(0,0,0,0.30)', fontFamily: 'var(--font-mono)' }}>
                  {PRODUCTIONS.sub}
                </div>
              </div>
              {isActive && (
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
              )}
            </button>
          );
        })()}

        <HudDivider label="Tools" />

        <NavButton
          label="Content Calendar"
          icon={CalendarDays}
          isActive={pathname === '/calendar'}
          onClick={() => go('/calendar')}
          activeAccent="#a78bfa"
        />

        <NavButton
          label="Agent Chat"
          icon={MessageSquare}
          isActive={pathname === '/agents'}
          onClick={() => go('/agents')}
          activeAccent="#22d3ee"
          chip="AI"
        />

        <NavButton
          label="Settings"
          icon={Settings}
          isActive={pathname === '/settings'}
          onClick={() => go('/settings')}
          activeAccent="#f59e0b"
        />
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 px-4 py-4"
        style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>

        <div className="absolute top-0 left-4 right-4 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.25), transparent)' }} />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative w-2 h-2">
              <span className="block w-2 h-2 rounded-full bg-emerald-400"
                style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
              <span className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-50" />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'rgba(52,211,153,0.9)' }}>
              {agents.length} Agents Online
            </span>
          </div>
          <div className="flex items-center gap-1 chip"
            style={{ background: 'rgba(245,158,11,0.08)', color: 'rgba(245,158,11,0.7)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <Activity size={8} />
            <span>Live</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          {agents.slice(0, 8).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{
                background: i % 3 === 0 ? 'rgba(245,158,11,0.7)' : i % 3 === 1 ? 'rgba(34,211,238,0.7)' : 'rgba(52,211,153,0.7)',
                boxShadow:  i % 3 === 0 ? '0 0 4px rgba(245,158,11,0.5)' : i % 3 === 1 ? '0 0 4px rgba(34,211,238,0.5)' : '0 0 4px rgba(52,211,153,0.5)',
              }} />
          ))}
          {agents.length > 8 && (
            <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>
              +{agents.length - 8}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-px opacity-30">
            {[12, 20, 14, 18, 10, 16].map((h, i) => (
              <div key={i} className="w-0.5 bg-amber-500 rounded-full" style={{ height: h }} />
            ))}
          </div>
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase"
            style={{ color: 'rgba(0,0,0,0.25)' }}>
            Powered by FSZT Partners
          </span>
        </div>
      </div>
    </div>
  );
};
