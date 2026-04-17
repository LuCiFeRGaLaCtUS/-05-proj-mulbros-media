import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, X, Settings, Sun, Moon, CircleUserRound, LogOut, BadgeCheck, Menu } from 'lucide-react';
import { agents } from '../../config/agents';
import { campaigns, activities } from '../../config/mockData';

const pageNames = {
  dashboard:   'Dashboard',
  financing:   'Film Financing',
  productions: 'Productions & Distribution',
  music:       'Music & Composition',
  agents:      'Agent Chat',
  settings:    'Settings',
};

const verticalColorMap = {
  financing: 'bg-blue-500',
  film: 'bg-emerald-500',
  music: 'bg-amber-500',
  composer: 'bg-amber-500',
  community: 'bg-purple-500',
  strategy: 'bg-rose-500'
};

const verticalTextMap = {
  financing: 'text-blue-400',
  film: 'text-emerald-400',
  music: 'text-amber-400',
  composer: 'text-amber-400',
  community: 'text-purple-400',
  strategy: 'text-rose-400'
};

const searchablePages = Object.entries(pageNames)
  .filter(([id]) => id !== 'settings')
  .map(([id, name]) => ({ id, name, type: 'page' }));

const getInitialTheme = () => {
  const stored = localStorage.getItem('mulbros_theme');
  if (stored) return stored;
  return 'dark';
};

const applyTheme = (theme) => {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
  localStorage.setItem('mulbros_theme', theme);
  // Notify all useTheme() subscribers (Toaster, charts, RoadmapView, etc.)
  window.dispatchEvent(new CustomEvent('mulbros-theme', { detail: theme }));
};

export const TopBar = ({ activePage, setActivePage, setPreselectedAgent, onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [theme, setTheme] = useState(getInitialTheme);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getSearchResults = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matchedPages = searchablePages.filter(p => p.name.toLowerCase().includes(q));
    const matchedAgents = agents
      .filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
      .map(a => ({ ...a, type: 'agent' }));
    const matchedCampaigns = campaigns
      .filter(c => c.name.toLowerCase().includes(q))
      .map(c => ({ ...c, type: 'campaign' }));
    return [...matchedPages, ...matchedAgents, ...matchedCampaigns];
  };

  const results = getSearchResults(searchQuery);

  const handleResultClick = (result) => {
    if (result.type === 'page') setActivePage(result.id);
    else if (result.type === 'agent') { setPreselectedAgent(result.id); setActivePage('agents'); }
    else if (result.type === 'campaign') setActivePage('financing');
    setSearchQuery('');
    setSearchOpen(false);
  };

  const recentNotifs = activities.slice(0, 6);

  return (
    <div className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/80 flex items-center justify-between px-4 lg:px-6 z-50">
      {/* Cinematic top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />
      {/* Subtle left amber glow behind title */}
      <div className="absolute left-0 top-0 w-48 h-16 bg-amber-500/3 blur-xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="text-lg font-semibold text-zinc-100">
          {pageNames[activePage] || 'Dashboard'}
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search agents, campaigns, pages..."
            className="bg-zinc-800 text-zinc-200 rounded-lg pl-9 pr-8 py-2 w-80 text-sm placeholder:text-zinc-500 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          )}
          {searchOpen && searchQuery && (
            <div className="absolute top-full mt-2 left-0 w-full bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-zinc-500">No results for "{searchQuery}"</div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {results.filter(r => r.type === 'page').length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-800/50">Pages</div>
                      {results.filter(r => r.type === 'page').map(r => (
                        <button key={r.id} onClick={() => handleResultClick(r)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left">
                          <span className="text-sm text-zinc-200">{r.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.filter(r => r.type === 'agent').length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-800/50">Agents</div>
                      {results.filter(r => r.type === 'agent').map(r => (
                        <button key={r.id} onClick={() => handleResultClick(r)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${verticalColorMap[r.vertical]}`} />
                          <div className="min-w-0">
                            <div className="text-sm text-zinc-200 truncate">{r.name}</div>
                            <div className="text-xs text-zinc-500 truncate">{r.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.filter(r => r.type === 'campaign').length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-800/50">Campaigns</div>
                      {results.filter(r => r.type === 'campaign').map(r => (
                        <button key={r.id} onClick={() => handleResultClick(r)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${verticalColorMap[r.vertical]}`} />
                          <div className="min-w-0">
                            <div className="text-sm text-zinc-200 truncate">{r.name}</div>
                            <div className={`text-xs truncate ${verticalTextMap[r.vertical]}`}>{r.status}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
            className="relative p-2 text-zinc-400 hover:text-zinc-100 transition-all"
          >
            <Bell size={20} />
            {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-amber-500/5 to-transparent">
                <span className="text-sm font-semibold text-zinc-100">Notifications</span>
                {hasUnread && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{recentNotifs.length} new</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentNotifs.map((notif, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex-shrink-0 mt-1.5">
                      <span className={`block w-2 h-2 rounded-full ${verticalColorMap[notif.vertical]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 leading-snug">{notif.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500">{notif.agent}</span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-xs text-zinc-500">{notif.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-zinc-800">
                <button
                  onClick={() => { setHasUnread(false); setNotifOpen(false); }}
                  className="w-full text-sm text-amber-500 hover:text-amber-400 transition-colors font-medium"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar + Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
            className="w-9 h-9 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded-full flex items-center justify-center font-medium text-sm transition-all ring-2 ring-transparent hover:ring-amber-500/40"
          >
            AC
          </button>

          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 w-60 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">

              {/* Quick action icons */}
              <div className="flex items-center justify-around px-4 py-3 border-b border-zinc-800/60">
                <button
                  onClick={() => { setActivePage('settings'); setProfileOpen(false); }}
                  className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-all"
                  title="Settings"
                >
                  <Settings size={16} />
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-amber-400 transition-all"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-semibold text-sm">
                  AC
                </div>
              </div>

              {/* Primary user card */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/40">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    AC
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-100 truncate">Arghya Chowdhury</div>
                    <div className="text-xs text-zinc-400 truncate">Administrator</div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-800 mx-3 my-1" />

              {/* Menu items */}
              <div className="px-3 pb-3 pt-1 space-y-0.5">
                <button
                  onClick={() => { setActivePage('settings'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 text-zinc-300 hover:text-zinc-100 transition-colors text-left group"
                >
                  <BadgeCheck size={16} className="text-zinc-500 group-hover:text-zinc-300 flex-shrink-0" />
                  <span className="text-sm">Account</span>
                </button>

                <button
                  onClick={() => { setNotifOpen(true); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 text-zinc-300 hover:text-zinc-100 transition-colors text-left group"
                >
                  <Bell size={16} className="text-zinc-500 group-hover:text-zinc-300 flex-shrink-0" />
                  <span className="text-sm">Notifications</span>
                </button>

                <div className="h-px bg-zinc-800 my-1" />

                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-zinc-300 hover:text-red-400 transition-colors text-left group">
                  <LogOut size={16} className="text-zinc-500 group-hover:text-red-400 flex-shrink-0" />
                  <span className="text-sm">Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
