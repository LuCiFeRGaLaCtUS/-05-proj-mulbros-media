import React from 'react';
import { LayoutDashboard, Users, Palette, Megaphone, Heart, MessageSquare, BarChart3, Settings, GitBranch } from 'lucide-react';

const navItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'talent', name: 'Talent Manager', icon: Users },
  { id: 'content', name: 'Content Studio', icon: Palette },
  { id: 'campaigns', name: 'Campaigns', icon: Megaphone },
  { id: 'community', name: 'Community Hub', icon: Heart },
  { id: 'agents', name: 'Agent Chat', icon: MessageSquare },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'roadmap', name: 'Journey Map', icon: GitBranch },
  { id: 'settings', name: 'Settings', icon: Settings }
];

export const Sidebar = ({ activePage, setActivePage }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-amber-500 text-zinc-950 font-bold rounded-lg flex items-center justify-center text-xl">
            M
          </div>
          <div>
            <div className="text-2xl font-bold tracking-widest text-amber-500">MULBROS</div>
            <div className="text-xs text-zinc-500 tracking-wider">MARKETING OS</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 mb-1 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>8 Agents Online</span>
        </div>
        <div className="text-xs text-zinc-600">Powered by FSZT Partners</div>
      </div>
    </div>
  );
};