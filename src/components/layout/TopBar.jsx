import React from 'react';
import { Bell, Search } from 'lucide-react';

const pageNames = {
  dashboard: 'Dashboard',
  talent: 'Talent Manager',
  content: 'Content Studio',
  campaigns: 'Campaigns',
  community: 'Community Hub',
  agents: 'Agent Chat',
  analytics: 'Analytics Hub',
  settings: 'Settings'
};

export const TopBar = ({ activePage }) => {
  return (
    <div className="fixed top-0 left-64 right-0 h-16 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 flex items-center justify-between px-6 z-50">
      <div className="text-lg font-semibold text-zinc-100">
        {pageNames[activePage] || 'Dashboard'}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search agents, campaigns, talent..."
            className="bg-zinc-800 text-zinc-200 rounded-lg pl-10 pr-4 py-2 w-80 placeholder:text-zinc-500 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>

        <button className="relative p-2 text-zinc-400 hover:text-zinc-100 transition-all">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="w-9 h-9 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center font-medium">
          AC
        </div>
      </div>
    </div>
  );
};