import React from 'react';
import { LayoutDashboard, MessageSquare, Clapperboard, Film, Music, Zap, Settings, CalendarDays } from 'lucide-react';

const verticals = [
  { id: 'financing',   name: 'Film Financing',           sub: 'Vertical A', icon: Clapperboard, color: 'blue'    },
  { id: 'productions', name: 'Productions & Distribution', sub: 'Vertical B', icon: Film,         color: 'emerald' },
  { id: 'music',       name: 'Music & Composition',       sub: 'Vertical C', icon: Music,         color: 'amber'   },
];

const colorMap = {
  blue:    { activeBg: 'bg-blue-500/10',    activeText: 'text-blue-400',    activeBorder: 'border-l-blue-400',    hoverBg: 'hover:bg-blue-500/5',    hoverText: 'hover:text-blue-300',    glow: 'shadow-blue-500/20',    dot: 'bg-blue-400',    iconBg: 'bg-blue-500/15'    },
  emerald: { activeBg: 'bg-emerald-500/10', activeText: 'text-emerald-400', activeBorder: 'border-l-emerald-400', hoverBg: 'hover:bg-emerald-500/5', hoverText: 'hover:text-emerald-300', glow: 'shadow-emerald-500/20', dot: 'bg-emerald-400', iconBg: 'bg-emerald-500/15' },
  amber:   { activeBg: 'bg-amber-500/10',   activeText: 'text-amber-400',   activeBorder: 'border-l-amber-400',   hoverBg: 'hover:bg-amber-500/5',   hoverText: 'hover:text-amber-300',   glow: 'shadow-amber-500/20',   dot: 'bg-amber-400',   iconBg: 'bg-amber-500/15'   },
};

// ── Film strip — vertical perforations along the right edge ──────────────────
const FilmStripEdge = () => (
  <div className="absolute right-0 top-0 bottom-0 w-4 flex flex-col justify-around py-3 opacity-20 pointer-events-none z-0">
    {Array.from({ length: 18 }).map((_, i) => (
      <div key={i} className="mx-0.5 h-2.5 bg-white rounded-[1px]" />
    ))}
  </div>
);

// ── Ambient cinematic background layers ──────────────────────────────────────
const CinematicBg = () => (
  <>
    {/* Base gradient — deep space dark */}
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 pointer-events-none" />
    {/* Amber spotlight from top-left (logo area) */}
    <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 blur-xl rounded-full pointer-events-none" />
    {/* Blue ambient from middle */}
    <div className="absolute top-1/2 -translate-y-1/2 -left-8 w-32 h-64 bg-blue-500/5 blur-xl rounded-full pointer-events-none" />
    {/* Subtle conic spotlight sweep from top */}
    <div className="absolute inset-0 bg-[conic-gradient(from_160deg_at_20%_0%,rgba(245,158,11,0.04)_0deg,transparent_60deg)] pointer-events-none" />
    {/* Thin top highlight line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />
  </>
);

export const Sidebar = ({ activePage, setActivePage }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-64 flex flex-col overflow-hidden border-r border-zinc-800/80 z-40">
      {/* ── Cinematic layered background ── */}
      <CinematicBg />
      <FilmStripEdge />

      {/* ── Logo / Brand header ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 px-5 py-5 border-b border-zinc-800/60">
        {/* Film strip holes across top */}
        <div className="absolute top-1.5 left-5 right-6 flex gap-1.5 pointer-events-none opacity-25">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 bg-white rounded-[1px]" />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-1">
          {/* Logo mark with cinematic glow */}
          <div className="relative flex-shrink-0">
            {/* Outer glow ring */}
            <div className="absolute -inset-1 rounded-xl bg-amber-500/20 blur-sm pointer-events-none" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 text-zinc-950 font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/30">
              M
              {/* Film hole accents */}
              <span className="absolute top-1 left-1 w-1 h-1 rounded-full bg-zinc-950/30" />
              <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-zinc-950/30" />
              <span className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-zinc-950/30" />
              <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-zinc-950/30" />
            </div>
          </div>

          <div>
            <div className="text-[17px] font-black tracking-[0.2em] text-amber-400 leading-none">MULBROS</div>
            <div className="flex items-center gap-1.5 mt-1">
              <Film size={8} className="text-zinc-600" />
              <span className="text-[9px] font-semibold text-zinc-600 tracking-[0.25em] uppercase">Media OS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* Dashboard */}
        <NavButton
          label="Dashboard"
          icon={LayoutDashboard}
          isActive={activePage === 'dashboard'}
          onClick={() => setActivePage('dashboard')}
          activeClass="bg-amber-500/10 text-amber-400 border-l-amber-400"
          hoverClass="hover:text-zinc-100 hover:bg-zinc-800/50"
        />

        {/* Verticals section */}
        <div className="pt-5 pb-2 px-3 flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-600">Verticals</span>
          <div className="flex-1 h-px bg-zinc-800/80" />
        </div>

        {verticals.map(v => {
          const Icon = v.icon;
          const c = colorMap[v.color];
          const isActive = activePage === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActivePage(v.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border-l-2 group ${
                isActive
                  ? `${c.activeBg} ${c.activeText} ${c.activeBorder} shadow-sm ${c.glow}`
                  : `border-l-transparent text-zinc-400 ${c.hoverBg} ${c.hoverText}`
              }`}
            >
              {/* Icon badge */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isActive ? c.iconBg : 'bg-zinc-800 group-hover:bg-zinc-700'
              }`}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-snug truncate">{v.name}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{v.sub}</div>
              </div>
              {/* Active indicator pip */}
              {isActive && (
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div className="py-3 px-3">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        </div>

        {/* Content Calendar */}
        <NavButton
          label="Content Calendar"
          icon={CalendarDays}
          isActive={activePage === 'calendar'}
          onClick={() => setActivePage('calendar')}
          activeClass="bg-violet-500/10 text-violet-400 border-l-violet-400"
          hoverClass="hover:text-zinc-100 hover:bg-zinc-800/50"
        />

        {/* Agent Chat */}
        <NavButton
          label="Agent Chat"
          icon={MessageSquare}
          isActive={activePage === 'agents'}
          onClick={() => setActivePage('agents')}
          activeClass="bg-purple-500/10 text-purple-400 border-l-purple-400"
          hoverClass="hover:text-zinc-100 hover:bg-zinc-800/50"
        />

        {/* Settings */}
        <NavButton
          label="Settings"
          icon={Settings}
          isActive={activePage === 'settings'}
          onClick={() => setActivePage('settings')}
          activeClass="bg-amber-500/10 text-amber-400 border-l-amber-400"
          hoverClass="hover:text-zinc-100 hover:bg-zinc-800/50"
        />

      </nav>

      {/* ── Footer status ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 border-t border-zinc-800/60">
        {/* Film strip holes across top of footer */}
        <div className="absolute top-0 left-3 right-6 flex gap-1.5 pointer-events-none opacity-20 -translate-y-px">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white rounded-[1px]" />
          ))}
        </div>

        <div className="px-4 py-4">
          {/* Agents online */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="w-2 h-2 bg-emerald-400 rounded-full block" />
                <span className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-60" />
              </div>
              <span className="text-xs font-medium text-zinc-300">8 Agents Online</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={9} className="text-amber-400/70" />
              <span className="text-[10px] text-amber-400/70 font-medium">Live</span>
            </div>
          </div>

          {/* Branding */}
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 opacity-40">
              {[0,1,2].map(i => <div key={i} className="w-1 h-2.5 bg-amber-500 rounded-[1px]" />)}
            </div>
            <span className="text-[9px] text-zinc-600 tracking-wider">Powered by FSZT Partners</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Simple nav button (Dashboard, Agent Chat, Settings) ──────────────────────
const NavButton = ({ label, icon: Icon, isActive, onClick, activeClass, hoverClass }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border-l-2 ${
      isActive
        ? `${activeClass}`
        : `border-l-transparent text-zinc-400 ${hoverClass}`
    }`}
  >
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
      isActive ? 'bg-white/10' : 'bg-zinc-800'
    }`}>
      <Icon size={14} />
    </div>
    <span className="font-medium text-sm">{label}</span>
  </button>
);
