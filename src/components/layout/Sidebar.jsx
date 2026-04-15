import React from 'react';
import { LayoutDashboard, MessageSquare, Clapperboard, Film, Music } from 'lucide-react';

const verticals = [
  {
    id: 'financing',
    name: 'Film Financing',
    sub: 'Vertical A',
    icon: Clapperboard,
    color: 'blue',
  },
  {
    id: 'productions',
    name: 'Productions & Distribution',
    sub: 'Vertical B',
    icon: Film,
    color: 'emerald',
  },
  {
    id: 'music',
    name: 'Music & Composition',
    sub: 'Vertical C',
    icon: Music,
    color: 'amber',
  },
];

const verticalActiveColors = {
  blue:    'bg-blue-500/10 text-blue-400 border-l-blue-400',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-l-emerald-400',
  amber:   'bg-amber-500/10 text-amber-400 border-l-amber-400',
};

const verticalHoverColors = {
  blue:    'hover:text-blue-300 hover:bg-blue-500/5',
  emerald: 'hover:text-emerald-300 hover:bg-emerald-500/5',
  amber:   'hover:text-amber-300 hover:bg-amber-500/5',
};

export const Sidebar = ({ activePage, setActivePage }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 text-zinc-950 font-bold rounded-lg flex items-center justify-center text-xl">
            M
          </div>
          <div>
            <div className="text-2xl font-bold tracking-widest text-amber-500">MULBROS</div>
            <div className="text-xs text-zinc-500 tracking-wider">MEDIA OS</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <button
          onClick={() => setActivePage('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 border-l-2 ${
            activePage === 'dashboard'
              ? 'bg-amber-500/10 text-amber-500 border-l-amber-500'
              : 'border-l-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="font-medium text-sm">Dashboard</span>
        </button>

        {/* Verticals section label */}
        <div className="pt-5 pb-2 px-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Verticals</span>
        </div>

        {verticals.map(v => {
          const Icon = v.icon;
          const isActive = activePage === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActivePage(v.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 border-l-2 ${
                isActive
                  ? verticalActiveColors[v.color]
                  : `border-l-transparent text-zinc-400 ${verticalHoverColors[v.color]}`
              }`}
            >
              <Icon size={16} className="mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium leading-snug">{v.name}</div>
                <div className="text-xs text-zinc-600 mt-0.5">{v.sub}</div>
              </div>
            </button>
          );
        })}

        {/* Divider */}
        <div className="pt-4 pb-1">
          <div className="h-px bg-zinc-800" />
        </div>

        {/* Agent Chat */}
        <button
          onClick={() => setActivePage('agents')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 border-l-2 ${
            activePage === 'agents'
              ? 'bg-amber-500/10 text-amber-500 border-l-amber-500'
              : 'border-l-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          }`}
        >
          <MessageSquare size={18} />
          <span className="font-medium text-sm">Agent Chat</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>8 Agents Online</span>
        </div>
        <div className="text-xs text-zinc-600">Powered by FSZT Partners</div>
      </div>
    </div>
  );
};
