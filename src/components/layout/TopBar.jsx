import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Search, X, Settings, CircleUserRound,
  LogOut, BadgeCheck, Menu,
} from 'lucide-react';
import { agents } from '../../config/agents';
import { campaigns, activities } from '../../config/mockData';
import { NotificationBell } from './NotificationBell';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useAppContext } from '../../App';

// ── Page metadata — keyed by pathname prefix ──────────────────────────────────
const PAGE_META = {
  '/dashboard':             { name: 'Dashboard',                   label: 'OVERVIEW',    color: '#f59e0b' },
  '/vertical/filmmaker':    { name: 'Film Financing',              label: 'VERTICAL A',  color: '#60a5fa' },
  '/vertical/productions':  { name: 'Productions & Distribution',  label: 'VERTICAL B',  color: '#34d399' },
  '/vertical/musician':     { name: 'Music & Composition',         label: 'VERTICAL C',  color: '#fbbf24' },
  '/vertical/composer':     { name: 'Composer',                    label: 'VERTICAL D',  color: '#a78bfa' },
  '/vertical/actor':        { name: 'Actor',                       label: 'COMING SOON', color: '#fb7185' },
  '/vertical/screenwriter': { name: 'Screenwriter',                label: 'COMING SOON', color: '#fb923c' },
  '/vertical/crew':         { name: 'Film / TV Crew',              label: 'COMING SOON', color: '#94a3b8' },
  '/vertical/artist':       { name: 'Visual Artist',               label: 'COMING SOON', color: '#f472b6' },
  '/vertical/writer':       { name: 'Writer',                      label: 'COMING SOON', color: '#2dd4bf' },
  '/vertical/artsorg':      { name: 'Arts Organization',           label: 'COMING SOON', color: '#818cf8' },
  '/agents':                { name: 'Agent Chat',                  label: 'NEURAL',      color: '#22d3ee' },
  '/settings':              { name: 'Settings',                    label: 'CONFIG',      color: '#a78bfa' },
  '/calendar':              { name: 'Content Calendar',            label: 'SCHEDULE',    color: '#f472b6' },
  '/crm':                   { name: 'Lead Pipeline',               label: 'CRM',         color: '#34d399' },
  '/admin':                 { name: 'Admin',                       label: 'ADMIN',       color: '#f59e0b' },
  '/onboarding':            { name: 'Setup',                       label: 'ONBOARDING',  color: '#22d3ee' },
};

const DEFAULT_META = { name: 'Dashboard', label: 'OVERVIEW', color: '#f59e0b' };

const getPageMeta = (pathname) => {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const match = Object.keys(PAGE_META)
    .filter(k => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_META[match] : DEFAULT_META;
};

// ── Searchable content ────────────────────────────────────────────────────────
const searchablePages = Object.entries(PAGE_META)
  .filter(([path]) => !path.includes('coming') && path !== '/onboarding' && path !== '/admin')
  .map(([path, meta]) => ({ id: path, name: meta.name, type: 'page' }));

const verticalColorMap = {
  financing: 'bg-blue-500',
  film:      'bg-emerald-500',
  music:     'bg-amber-500',
  composer:  'bg-violet-500',
  community: 'bg-fuchsia-500',
  strategy:  'bg-cyan-500',
};

export const TopBar = ({ onMenuClick, user, signOut, setPreselectedAgent }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const pageMeta  = getPageMeta(location.pathname);

  // Stytch user: name lives in user.name.first_name, email in user.emails[0].email
  const stytchFirstName = user?.name?.first_name?.trim();
  const emailPrefix     = (user?.emails?.[0]?.email || '').split('@')[0].split('.')[0];
  const rawName         = stytchFirstName || emailPrefix || 'User';
  const displayName     = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  const initials        = displayName.slice(0, 2).toUpperCase();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasUnread,   setHasUnread]   = useState(true);

  const searchRef  = useRef(null);
  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current  && !searchRef.current.contains(e.target))  setSearchOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search
  const getSearchResults = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matchedPages     = searchablePages.filter(p => p.name.toLowerCase().includes(q));
    const matchedAgents    = agents.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)).map(a => ({ ...a, type: 'agent' }));
    const matchedCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(q)).map(c => ({ ...c, type: 'campaign' }));
    return [...matchedPages, ...matchedAgents, ...matchedCampaigns];
  };

  const staticResults    = getSearchResults(searchQuery);
  const { profile }      = useAppContext();
  const { results: live } = useGlobalSearch(searchQuery, profile?.id);
  const results          = [...staticResults, ...live];

  const handleResultClick = (result) => {
    if (result.type === 'page') {
      navigate(result.id);
    } else if (result.type === 'agent') {
      setPreselectedAgent?.(result.id);
      navigate('/agents');
    } else if (result.type === 'campaign') {
      navigate('/vertical/filmmaker');
    } else if (result.link) {
      navigate(result.link);
    }
    setSearchQuery('');
    setSearchOpen(false);
  };

  const recentNotifs = activities.slice(0, 6);

  return (
    <div
      className="fixed top-0 left-0 lg:left-64 right-0 h-16 flex items-center justify-between px-4 lg:px-6 z-50"
      style={{
        background: 'rgba(247,247,250,0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.3) 30%, rgba(34,211,238,0.15) 70%, transparent)' }} />

      {/* ── LEFT: page title ── */}
      <div className="relative z-10 flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-zinc-500 hover:text-zinc-700 transition-colors"
          style={{ background: 'rgba(0,0,0,0.04)' }}
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{
            background: `${pageMeta.color}12`,
            border: `1px solid ${pageMeta.color}28`,
          }}>
          <div className="w-1 h-1 rounded-full"
            style={{ background: pageMeta.color, boxShadow: `0 0 4px ${pageMeta.color}` }} />
          <span className="text-[11px] font-black tracking-[0.25em]" style={{ color: `${pageMeta.color}cc` }}>
            {pageMeta.label}
          </span>
        </div>

        <div className="flex flex-col">
          <h1 className="text-base font-bold text-zinc-900 leading-tight">
            {pageMeta.name}
          </h1>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-xs font-mono" style={{ color: 'rgba(0,0,0,0.62)', fontFamily: 'var(--font-mono)' }}>
              MULBROS / {pageMeta.name.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: controls ── */}
      <div className="relative z-10 flex items-center gap-3">

        {/* Search */}
        <div className="relative" ref={searchRef}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#b45309' }} />
          <input
            type="text"
            aria-label="Search agents and pages"
            role="searchbox"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(245,158,11,0.4)';
              e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.07)';
              setSearchOpen(true);
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0,0,0,0.10)';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="Search agents, pages…"
            className="rounded-xl pl-8 pr-8 py-2 w-56 lg:w-72 text-sm transition-all"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.10)',
              outline: 'none',
              color: '#18181b',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-600 transition-colors"
            >
              <X size={13} />
            </button>
          )}

          {searchOpen && searchQuery && (
            <div className="absolute top-full mt-2 left-0 w-full rounded-xl overflow-hidden z-50 animate-hud-in"
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid rgba(0,0,0,0.10)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(245,158,11,0.08)',
                backdropFilter: 'blur(20px)',
              }}>
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-zinc-600">
                  No results for "{searchQuery}"
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {['page', 'agent', 'campaign', 'chat', 'film', 'music', 'composer', 'crew', 'actor'].map(type => {
                    const group = results.filter(r => r.type === type);
                    if (!group.length) return null;
                    const labels = {
                      page: 'Pages', agent: 'Agents', campaign: 'Campaigns',
                      chat: 'Chat history', film: 'Film pipeline', music: 'Music pipeline',
                      composer: 'Composer projects', crew: 'Crew applications', actor: 'Actor submissions',
                    };
                    return (
                      <div key={type}>
                        <div className="px-3 py-2 text-[11px] font-black tracking-[0.25em] uppercase"
                          style={{ color: '#b45309', background: 'rgba(245,158,11,0.04)' }}>
                          {labels[type]}
                        </div>
                        {group.map(r => (
                          <button key={`${type}-${r.id || r.name}`} onClick={() => handleResultClick(r)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                            style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            {type !== 'page' && (
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${verticalColorMap[r.vertical] || 'bg-zinc-400'}`} />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm text-zinc-800 truncate">{r.name || r.title}</div>
                              {(r.description || r.snippet) && (
                                <div className="text-xs text-zinc-500 truncate">{r.description || r.snippet}</div>
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

        {/* Notification Bell — realtime, Supabase-backed */}
        <NotificationBell />

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
                ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(34,211,238,0.10))'
                : 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(245,158,11,0.07))',
              border: `1px solid ${profileOpen ? 'rgba(245,158,11,0.40)' : 'rgba(245,158,11,0.22)'}`,
              color: '#d97706',
              boxShadow: profileOpen ? '0 0 14px rgba(245,158,11,0.15)' : 'none',
            }}
          >
            {initials}
          </button>

          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl overflow-hidden z-50 animate-hud-in"
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid rgba(0,0,0,0.09)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(245,158,11,0.06)',
                backdropFilter: 'blur(20px)',
              }}>

              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08))', color: '#d97706', border: '1px solid rgba(245,158,11,0.22)' }}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-zinc-900 truncate">{displayName}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="chip" style={{ background: 'rgba(245,158,11,0.08)', color: '#92400e', border: '1px solid rgba(245,158,11,0.15)', fontSize: '11px' }}>ADMIN</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-around px-4 py-3"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                  aria-label="Settings"
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.70)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.30)'; e.currentTarget.style.color = '#d97706'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; e.currentTarget.style.color = 'rgba(0,0,0,0.40)'; }}
                >
                  <Settings size={15} />
                </button>

                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ background: 'rgba(245,158,11,0.09)', color: '#d97706', border: '1px solid rgba(245,158,11,0.18)' }}>
                  {initials}
                </div>

                <button
                  onClick={() => { navigate('/agents'); setProfileOpen(false); }}
                  aria-label="Agent Chat"
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.70)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.35)'; e.currentTarget.style.color = '#0891b2'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; e.currentTarget.style.color = 'rgba(0,0,0,0.40)'; }}
                >
                  <CircleUserRound size={15} />
                </button>
              </div>

              <div className="px-3 py-3 space-y-0.5">
                {[
                  { label: 'Account',       icon: BadgeCheck, action: () => { navigate('/settings'); setProfileOpen(false); } },
                  { label: 'Notifications', icon: Bell,       action: () => { setNotifOpen(true); setProfileOpen(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-zinc-500"
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = '#18181b'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ''; }}>
                    <item.icon size={15} style={{ opacity: 0.5 }} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}

                <div className="h-px my-1" style={{ background: 'rgba(0,0,0,0.06)' }} />

                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-zinc-500"
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#dc2626'; }}
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
