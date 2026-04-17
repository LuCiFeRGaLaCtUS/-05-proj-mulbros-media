import React, { useState, useRef, useEffect } from 'react';
import {
  Bell, Search, X, Settings, Sun, Moon, CircleUserRound,
  LogOut, BadgeCheck, Menu, Cpu, Zap,
} from 'lucide-react';
import { agents } from '../../config/agents';
import { campaigns, activities } from '../../config/mockData';

const pageNames = {
  dashboard:   'Dashboard',
  financing:   'Film Financing',
  productions: 'Productions & Distribution',
  music:       'Music & Composition',
  agents:      'Agent Chat',
  settings:    'Settings',
  calendar:    'Content Calendar',
};

const pageTags = {
  dashboard:   { label: 'OVERVIEW',   color: '#f59e0b' },
  financing:   { label: 'VERTICAL A', color: '#60a5fa' },
  productions: { label: 'VERTICAL B', color: '#34d399' },
  music:       { label: 'VERTICAL C', color: '#fbbf24' },
  agents:      { label: 'NEURAL',     color: '#22d3ee' },
  settings:    { label: 'CONFIG',     color: '#a78bfa' },
  calendar:    { label: 'SCHEDULE',   color: '#f472b6' },
};

const verticalColorMap = {
  financing: 'bg-blue-500',
  film: 'bg-emerald-500',
  music: 'bg-amber-500',
  composer: 'bg-amber-500',
  community: 'bg-purple-500',
  strategy: 'bg-rose-500',
};

const verticalTextMap = {
  financing: 'text-blue-400',
  film: 'text-emerald-400',
  music: 'text-amber-400',
  composer: 'text-amber-400',
  community: 'text-purple-400',
  strategy: 'text-rose-400',
};

const searchablePages = Object.entries(pageNames)
  .filter(([id]) => id !== 'settings')
  .map(([id, name]) => ({ id, name, type: 'page' }));

const getInitialTheme = () => {
  const stored = localStorage.getItem('mulbros_theme');
  return stored || 'dark';
};

const applyTheme = (theme) => {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
  localStorage.setItem('mulbros_theme', theme);
  window.dispatchEvent(new CustomEvent('mulbros-theme', { detail: theme }));
};

export const TopBar = ({ activePage, setActivePage, setPreselectedAgent, onMenuClick, user, signOut }) => {
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials    = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasUnread, setHasUnread]     = useState(true);
  const [theme, setTheme]             = useState(getInitialTheme);

  const searchRef  = useRef(null);
  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => { applyTheme(theme); }, []);


  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current  && !searchRef.current.contains(e.target))  setSearchOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getSearchResults = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matchedPages    = searchablePages.filter(p => p.name.toLowerCase().includes(q));
    const matchedAgents   = agents.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)).map(a => ({ ...a, type: 'agent' }));
    const matchedCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(q)).map(c => ({ ...c, type: 'campaign' }));
    return [...matchedPages, ...matchedAgents, ...matchedCampaigns];
  };

  const results = getSearchResults(searchQuery);

  const handleResultClick = (result) => {
    if (result.type === 'page')     setActivePage(result.id);
    else if (result.type === 'agent')    { setPreselectedAgent(result.id); setActivePage('agents'); }
    else if (result.type === 'campaign') setActivePage('financing');
    setSearchQuery('');
    setSearchOpen(false);
  };

  const recentNotifs = activities.slice(0, 6);
  const tag = pageTags[activePage] || pageTags.dashboard;

  return (
    <div
      className="fixed top-0 left-0 lg:left-64 right-0 h-16 flex items-center justify-between px-4 lg:px-6 z-50"
      style={{
        background: 'rgba(7,7,14,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* ── Bottom neon accent line ── */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.4) 30%, rgba(34,211,238,0.2) 70%, transparent)' }} />

      {/* ── Top micro line ── */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.04) 50%, transparent)' }} />

      {/* ── LEFT: page title ── */}
      <div className="relative z-10 flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <Menu size={20} />
        </button>

        {/* Tag chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{
            background: `${tag.color}10`,
            border: `1px solid ${tag.color}22`,
          }}>
          <div className="w-1 h-1 rounded-full"
            style={{ background: tag.color, boxShadow: `0 0 4px ${tag.color}` }} />
          <span className="text-[9px] font-black tracking-[0.25em]" style={{ color: `${tag.color}cc` }}>
            {tag.label}
          </span>
        </div>

        <div className="flex flex-col">
          <h1 className="text-base font-bold text-zinc-100 leading-tight">
            {pageNames[activePage] || 'Dashboard'}
          </h1>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
              MULBROS / {(pageNames[activePage] || 'DASHBOARD').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: controls ── */}
      <div className="relative z-10 flex items-center gap-3">

        {/* Search */}
        <div className="relative" ref={searchRef}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(245,158,11,0.5)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(245,158,11,0.35)';
              e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.05), 0 0 14px rgba(245,158,11,0.08)';
              setSearchOpen(true);
            }}
            placeholder="Search agents, pages…"
            className="text-zinc-300 rounded-xl pl-8 pr-8 py-2 w-56 lg:w-72 text-sm transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              outline: 'none',
              color: '#d4d4d8',
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.07)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={13} />
            </button>
          )}

          {/* Search results dropdown */}
          {searchOpen && searchQuery && (
            <div className="absolute top-full mt-2 left-0 w-full rounded-xl overflow-hidden z-50 animate-hud-in"
              style={{
                background: 'rgba(10,10,18,0.97)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,158,11,0.1)',
                backdropFilter: 'blur(20px)',
              }}>
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No results for "{searchQuery}"
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {['page', 'agent', 'campaign'].map(type => {
                    const group = results.filter(r => r.type === type);
                    if (!group.length) return null;
                    const labels = { page: 'Pages', agent: 'Agents', campaign: 'Campaigns' };
                    return (
                      <div key={type}>
                        <div className="px-3 py-2 text-[9px] font-black tracking-[0.25em] uppercase"
                          style={{ color: 'rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.04)' }}>
                          {labels[type]}
                        </div>
                        {group.map(r => (
                          <button key={r.id} onClick={() => handleResultClick(r)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            {type !== 'page' && (
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${verticalColorMap[r.vertical] || 'bg-zinc-500'}`} />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm text-zinc-200 truncate">{r.name}</div>
                              {r.description && (
                                <div className="text-xs text-zinc-500 truncate">{r.description}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            aria-haspopup="true"
            className="relative p-2 rounded-xl transition-all"
            style={{
              background: notifOpen ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: notifOpen ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'; e.currentTarget.style.color = '#f59e0b'; }}
            onMouseLeave={e => { if (!notifOpen) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}}
          >
            <Bell size={17} />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                style={{ background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.8)' }} />
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-96 rounded-2xl overflow-hidden z-50 animate-hud-in"
              style={{
                background: 'rgba(9,9,16,0.97)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.08)',
                backdropFilter: 'blur(24px)',
              }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(245,158,11,0.03)' }}>
                <div className="flex items-center gap-2">
                  <Bell size={14} style={{ color: '#f59e0b' }} />
                  <span className="text-sm font-bold text-zinc-100">Notifications</span>
                </div>
                {hasUnread && (
                  <span className="chip" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                    {recentNotifs.length} NEW
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {recentNotifs.map((notif, i) => (
                  <div key={i} className="flex gap-3 px-5 py-3 transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="flex-shrink-0 mt-1.5">
                      <span className={`block w-1.5 h-1.5 rounded-full ${verticalColorMap[notif.vertical] || 'bg-zinc-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 leading-snug">{notif.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono" style={{ color: 'rgba(34,211,238,0.5)' }}>{notif.agent}</span>
                        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{notif.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => { setHasUnread(false); setNotifOpen(false); }}
                  className="w-full text-sm font-semibold transition-colors"
                  style={{ color: 'rgba(245,158,11,0.7)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,158,11,0.7)'}
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            aria-haspopup="true"
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all"
            style={{
              background: profileOpen
                ? 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(34,211,238,0.1))'
                : 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))',
              border: `1px solid ${profileOpen ? 'rgba(245,158,11,0.4)' : 'rgba(245,158,11,0.2)'}`,
              color: '#f59e0b',
              boxShadow: profileOpen ? '0 0 16px rgba(245,158,11,0.2)' : 'none',
            }}
          >
            {initials}
          </button>

          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl overflow-hidden z-50 animate-hud-in"
              style={{
                background: 'rgba(9,9,16,0.97)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.06)',
                backdropFilter: 'blur(24px)',
              }}>

              {/* User card */}
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-zinc-100 truncate">{displayName}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="chip" style={{ background: 'rgba(245,158,11,0.08)', color: 'rgba(245,158,11,0.7)', border: '1px solid rgba(245,158,11,0.15)', fontSize: '8px' }}>ADMIN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick icons row */}
              <div className="flex items-center justify-around px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => { setActivePage('settings'); setProfileOpen(false); }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#f59e0b'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  title="Settings"
                >
                  <Settings size={15} />
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#f59e0b'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                >
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                </button>

                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                  {initials}
                </div>
              </div>

              {/* Menu items */}
              <div className="px-3 py-3 space-y-0.5">
                {[
                  { label: 'Account', icon: BadgeCheck, action: () => { setActivePage('settings'); setProfileOpen(false); } },
                  { label: 'Notifications', icon: Bell, action: () => { setNotifOpen(true); setProfileOpen(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-zinc-400"
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#e4e4e7'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ''; }}>
                    <item.icon size={15} style={{ opacity: 0.5 }} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}

                <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.05)' }} />

                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-zinc-400"
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#f87171'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ''; }}
                >
                  <LogOut size={15} style={{ opacity: 0.5 }} />
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
