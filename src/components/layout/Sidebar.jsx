import React from 'react';
import {
  LayoutDashboard, MessageSquare, Clapperboard, Film, Music,
  Zap, Settings, CalendarDays, Activity, ChevronRight,
} from 'lucide-react';
import { agents } from '../../config/agents';

const verticals = [
  { id: 'financing',   name: 'Film Financing',             sub: 'Vertical A', icon: Clapperboard, color: 'blue'    },
  { id: 'productions', name: 'Productions & Distribution', sub: 'Vertical B', icon: Film,         color: 'emerald' },
  { id: 'music',       name: 'Music & Composition',        sub: 'Vertical C', icon: Music,         color: 'amber'   },
];

const colorMap = {
  blue: {
    activeBg:     'bg-blue-500/10',
    activeText:   'text-blue-300',
    activeBorder: 'border-l-blue-400',
    hoverBg:      'hover:bg-blue-500/5',
    hoverText:    'hover:text-blue-300',
    glow:         'shadow-blue-500/20',
    dot:          'bg-blue-400',
    iconBg:       'bg-blue-500/15',
    iconText:     'text-blue-400',
    glowStyle:    '0 0 12px rgba(59,130,246,0.3)',
    chip:         'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  },
  emerald: {
    activeBg:     'bg-emerald-500/10',
    activeText:   'text-emerald-300',
    activeBorder: 'border-l-emerald-400',
    hoverBg:      'hover:bg-emerald-500/5',
    hoverText:    'hover:text-emerald-300',
    glow:         'shadow-emerald-500/20',
    dot:          'bg-emerald-400',
    iconBg:       'bg-emerald-500/15',
    iconText:     'text-emerald-400',
    glowStyle:    '0 0 12px rgba(16,185,129,0.3)',
    chip:         'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  amber: {
    activeBg:     'bg-amber-500/10',
    activeText:   'text-amber-300',
    activeBorder: 'border-l-amber-400',
    hoverBg:      'hover:bg-amber-500/5',
    hoverText:    'hover:text-amber-300',
    glow:         'shadow-amber-500/20',
    dot:          'bg-amber-400',
    iconBg:       'bg-amber-500/15',
    iconText:     'text-amber-400',
    glowStyle:    '0 0 12px rgba(245,158,11,0.3)',
    chip:         'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  },
};

/* ── Cyber grid background ─────────────────────────────────────────────────── */
const SidebarBg = () => (
  <>
    {/* Deep void base */}
    <div className="absolute inset-0 bg-[#07070e]" />
    {/* Dot grid */}
    <div className="absolute inset-0 bg-dot-grid opacity-60" />
    {/* Top brand glow orb */}
    <div
      className="absolute -top-8 -left-8 w-56 h-56 rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }}
    />
    {/* Mid cyan orb */}
    <div
      className="absolute top-1/2 -left-12 w-40 h-80 rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)' }}
    />
    {/* Bottom blue orb */}
    <div
      className="absolute -bottom-4 left-0 w-48 h-48 rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)' }}
    />
    {/* Right edge neon border */}
    <div
      className="absolute top-0 right-0 bottom-0 w-px pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, transparent, rgba(245,158,11,0.4) 30%, rgba(34,211,238,0.2) 70%, transparent)' }}
    />
    {/* Scanlines */}
    <div className="absolute inset-0 scanlines opacity-50 pointer-events-none" />
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
    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group overflow-hidden ${
      isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
    }`}
    style={isActive ? {
      background: `linear-gradient(90deg, ${activeAccent}14 0%, transparent 100%)`,
      boxShadow: `inset 0 0 0 1px ${activeAccent}22`,
    } : undefined}
  >
    {/* Active left bar */}
    {isActive && (
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
        style={{ background: activeAccent, boxShadow: `0 0 8px ${activeAccent}` }}
      />
    )}
    {/* Hover shimmer */}
    {!isActive && (
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }} />
    )}

    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
      isActive ? 'bg-white/10' : 'bg-white/[0.04] group-hover:bg-white/[0.07]'
    }`}>
      <Icon size={14} style={isActive ? { color: activeAccent } : undefined} />
    </div>

    <span className="font-medium text-sm flex-1">{label}</span>

    {chip && (
      <span className="chip bg-amber-500/10 text-amber-400 border border-amber-500/20">{chip}</span>
    )}

    {isActive && (
      <ChevronRight size={12} style={{ color: activeAccent, opacity: 0.6 }} />
    )}
  </button>
);

export const Sidebar = ({ activePage, setActivePage }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-64 flex flex-col overflow-hidden z-40">
      <SidebarBg />

      {/* ── Logo / Brand header ───────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.5), rgba(34,211,238,0.2), transparent)' }} />

        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="relative flex-shrink-0">
            {/* Outer glow layers */}
            <div className="absolute -inset-2 rounded-2xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' }} />
            <div className="absolute -inset-0.5 rounded-xl pointer-events-none animate-neon-pulse"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(34,211,238,0.1))', filter: 'blur(4px)' }} />
            {/* Logo body */}
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-zinc-950"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
                boxShadow: '0 0 20px rgba(245,158,11,0.4), 0 4px 12px rgba(0,0,0,0.6)',
              }}>
              <span className="animate-flicker">M</span>
              {/* Corner holes */}
              <span className="absolute top-1 left-1 w-1 h-1 rounded-full bg-zinc-950/40" />
              <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-zinc-950/40" />
              <span className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-zinc-950/40" />
              <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-zinc-950/40" />
            </div>
          </div>

          <div>
            <div className="text-[17px] font-black tracking-[0.22em] leading-none text-glow-brand"
              style={{ color: '#f59e0b' }}>
              MULBROS
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1 h-1 rounded-full bg-cyan-400 online-dot" style={{ color: '#22d3ee' }} />
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase font-mono"
                style={{ color: 'rgba(34,211,238,0.6)' }}>
                MEDIA OS
              </span>
            </div>
          </div>
        </div>

        {/* System status row */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <span className="chip" style={{
            background: 'rgba(34,211,238,0.08)',
            color: 'rgba(34,211,238,0.7)',
            border: '1px solid rgba(34,211,238,0.15)',
          }}>
            SYS ONLINE
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">

        {/* Dashboard */}
        <NavButton
          label="Dashboard"
          icon={LayoutDashboard}
          isActive={activePage === 'dashboard'}
          onClick={() => setActivePage('dashboard')}
          activeAccent="#f59e0b"
        />

        {/* Verticals */}
        <HudDivider label="Verticals" />

        {verticals.map(v => {
          const Icon = v.icon;
          const c = colorMap[v.color];
          const isActive = activePage === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActivePage(v.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group overflow-hidden ${
                isActive ? c.activeText : `text-zinc-500 ${c.hoverText}`
              }`}
              style={isActive ? {
                background: `linear-gradient(90deg, ${c.activeBg.replace('bg-', '')} 0%, transparent 100%)`.replace('bg-', ''),
                boxShadow: c.glowStyle,
              } : undefined}
            >
              {/* Active bar */}
              {isActive && (
                <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${c.dot}`}
                  style={{ boxShadow: `0 0 8px currentColor` }} />
              )}
              {/* Hover shimmer */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.015)' }} />
              )}

              {/* Icon */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                isActive ? c.iconBg : 'bg-white/[0.04] group-hover:bg-white/[0.07]'
              }`}>
                <Icon size={14} className={isActive ? c.iconText : ''} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-snug truncate">{v.name}</div>
                <div className="text-[10px] mt-0.5 font-mono tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-mono)' }}>{v.sub}</div>
              </div>

              {isActive && (
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot} animate-cyan-pulse`} />
              )}
            </button>
          );
        })}

        {/* Tools */}
        <HudDivider label="Tools" />

        <NavButton
          label="Content Calendar"
          icon={CalendarDays}
          isActive={activePage === 'calendar'}
          onClick={() => setActivePage('calendar')}
          activeAccent="#a78bfa"
        />

        <NavButton
          label="Agent Chat"
          icon={MessageSquare}
          isActive={activePage === 'agents'}
          onClick={() => setActivePage('agents')}
          activeAccent="#22d3ee"
          chip="AI"
        />

        <NavButton
          label="Settings"
          icon={Settings}
          isActive={activePage === 'settings'}
          onClick={() => setActivePage('settings')}
          activeAccent="#f59e0b"
        />
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 px-4 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Top accent line on footer */}
        <div className="absolute top-0 left-4 right-4 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.2), transparent)' }} />

        {/* Agents online status */}
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

        {/* Mini agent dots */}
        <div className="flex items-center gap-1.5 mb-3">
          {agents.slice(0, 8).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{
                background: i % 3 === 0 ? 'rgba(245,158,11,0.7)' : i % 3 === 1 ? 'rgba(34,211,238,0.7)' : 'rgba(52,211,153,0.7)',
                boxShadow: i % 3 === 0 ? '0 0 4px rgba(245,158,11,0.5)' : i % 3 === 1 ? '0 0 4px rgba(34,211,238,0.5)' : '0 0 4px rgba(52,211,153,0.5)',
              }} />
          ))}
          {agents.length > 8 && (
            <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>
              +{agents.length - 8}
            </span>
          )}
        </div>

        {/* Brand footer */}
        <div className="flex items-center gap-2">
          <div className="flex gap-px opacity-30">
            {[12,20,14,18,10,16].map((h, i) => (
              <div key={i} className="w-0.5 bg-amber-500 rounded-full" style={{ height: h }} />
            ))}
          </div>
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase"
            style={{ color: 'rgba(255,255,255,0.18)' }}>
            Powered by FSZT Partners
          </span>
        </div>
      </div>
    </div>
  );
};
