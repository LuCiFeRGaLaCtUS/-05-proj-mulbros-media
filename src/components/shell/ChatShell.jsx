import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { getStytchAuthHeaders } from '../../lib/stytch';
import {
  Plus, MessageSquare, LayoutGrid, FolderOpen, Sparkles, Plug,
  Settings as SettingsIcon, LogOut, ChevronLeft, ChevronRight,
  Shield, Briefcase, Mic2, Video, Mail as MailIcon, UsersRound,
  Send, Wallet, Radar, ScrollText, Activity, Trash2,
} from 'lucide-react';
import { useStytch } from '@stytch/react';
import { useAppContext } from '../../App';
import { useChatSessions } from '../../hooks/useChatSessions';
import { usePersona } from '../../lib/personaState';
import { getPersona, NAV_BY_PERSONA } from '../../config/personas';
import { MOAvatar } from './MOAvatar';

/**
 * ChatShell — chat-first app shell (Simara/FSZT layout).
 *  - Left: collapsible sidebar (256 / 60 px)
 *  - Right: <Outlet /> for ChatHome | ChatThread
 *
 * Role-aware nav sections appear based on profile.roles.
 * Recents pulled from chat_sessions via useChatSessions.
 */

const ROW_BASE = {
  display:     'flex',
  alignItems:  'center',
  gap:         10,
  padding:     '8px 12px',
  borderRadius: 10,
  fontSize:    13,
  color:       '#0B1D3A',
  cursor:      'pointer',
  transition:  'background 120ms ease',
  textAlign:   'left',
  width:       '100%',
};

const NavItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    style={{
      ...ROW_BASE,
      background: active ? 'rgba(15,110,86,0.10)' : 'transparent',
      color:      active ? '#0F6E56' : '#0B1D3A',
      fontWeight: active ? 600 : 500,
      justifyContent: collapsed ? 'center' : 'flex-start',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    aria-label={label}
    title={collapsed ? label : undefined}
  >
    <Icon size={16} style={{ flexShrink: 0 }} />
    {!collapsed && <span style={{ minWidth: 0, flex: 1 }}>{label}</span>}
  </button>
);

const SectionLabel = ({ children, collapsed }) => collapsed ? null : (
  <div style={{
    padding:       '14px 12px 6px',
    fontSize:      10,
    fontWeight:    700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color:         '#888',
    fontFamily:    'DM Mono, monospace',
  }}>
    {children}
  </div>
);

export const ChatShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stytch   = useStytch();
  const { profile } = useAppContext();
  const { persona } = usePersona();
  const { sessions, createSession, deleteSession } = useChatSessions(profile?.id);

  const [collapsed, setCollapsed] = useState(false);
  const [pendingAdmin, setPendingAdmin] = useState(0);

  const roles      = profile?.roles || [];
  const isTalent   = roles.includes('talent') || roles.includes('admin') || roles.includes('super_admin');
  const isAgency   = roles.includes('agency') || roles.includes('admin') || roles.includes('super_admin');
  const isPlatformAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isSuper    = roles.includes('super_admin');

  // Pending admin-request count for the sidebar badge (super_admin only).
  useEffect(() => {
    if (!isSuper) return;
    let cancelled = false;
    fetch('/api/admin/overview', { headers: { ...getStytchAuthHeaders() } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d) setPendingAdmin(d.pending_admin_requests || 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSuper, location.pathname]);

  const pathname = location.pathname;
  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  const handleNewChat = async () => {
    const s = await createSession('New chat');
    if (s?.id) navigate(`/chat/${s.id}`);
    else       navigate('/');
  };

  const handleSignOut = async () => {
    try { await stytch.session.revoke(); } catch { /* ignore */ }
    window.location.href = '/';
  };

  const sidebarWidth = collapsed ? 60 : 256;

  return (
    <div style={{ display: 'flex', height: '100vh', minHeight: 0, background: '#F5F6F8' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        style={{
          width:        sidebarWidth,
          background:   '#F3F1EC',
          borderRight:  '1px solid #E0E0E0',
          display:      'flex',
          flexDirection:'column',
          transition:   'width 200ms ease',
          flexShrink:   0,
        }}
      >
        {/* Header */}
        <div style={{
          height:       56,
          padding:      collapsed ? '0 8px' : '0 14px',
          borderBottom: '1px solid #E7E3DA',
          display:      'flex',
          alignItems:   'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap:          8,
          flexShrink:   0,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <MOAvatar size={28} state="idle" />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
                <span style={{
                  fontWeight:   700,
                  fontSize:     14,
                  color:        '#0B1D3A',
                  fontFamily:   "'Inter Tight', sans-serif",
                  letterSpacing: '-0.01em',
                }}>
                  {persona.name || 'MO'}
                </span>
                <span style={{
                  fontSize: 9, color: '#0F6E56',
                  textTransform: 'uppercase', letterSpacing: '0.18em',
                  fontWeight: 500, fontFamily: 'DM Mono, monospace',
                  marginTop: 1,
                }}>
                  AI Operator
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(0,0,0,0.04)',
              color: '#0B1D3A',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* New chat CTA */}
        <div style={{ padding: collapsed ? '10px 8px' : '12px 12px', flexShrink: 0 }}>
          <button
            onClick={handleNewChat}
            style={{
              ...ROW_BASE,
              background: '#0F6E56',
              color: '#FFFFFF',
              fontWeight: 600,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '8px' : '10px 12px',
              boxShadow: '0 1px 3px rgba(15,110,86,0.25)',
            }}
            title="New chat"
          >
            <Plus size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>New chat</span>}
          </button>
        </div>

        {/* Scrollable middle region */}
        <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '0 8px' : '0 8px' }}>
          {/* Primary nav */}
          <NavItem icon={MessageSquare} label="Chats"        active={pathname === '/' || pathname.startsWith('/chat')} onClick={() => navigate('/')}         collapsed={collapsed} />
          {/* Dashboard nav points at ChatHome (/) — legacy Dashboard now at /legacy-dashboard */}
          <NavItem icon={FolderOpen}    label="Projects"     active={isActive('/crm')}         onClick={() => navigate('/crm')}       collapsed={collapsed} />
          <NavItem icon={Sparkles}      label="Artifacts"    active={isActive('/calendar')}    onClick={() => navigate('/calendar')}  collapsed={collapsed} />
          <NavItem icon={Plug}          label="Integrations" active={isActive('/integrations')} onClick={() => navigate('/integrations')} collapsed={collapsed} />

          {/* Talent surface — persona-filtered for non-admins.
              Admin/super_admin see the full talent list (all sub-views).
              A normal talent user sees ONLY their persona's nav:
              actor → acting, director → directing, musician → music. */}
          {isTalent && isPlatformAdmin && (
            <>
              <SectionLabel collapsed={collapsed}>Talent</SectionLabel>
              <NavItem icon={Mic2}        label="Auditions"     active={isActive('/talent/auditions')}     onClick={() => navigate('/talent/auditions')}     collapsed={collapsed} />
              <NavItem icon={Video}       label="Self-Tape"     active={isActive('/talent/self-tape')}     onClick={() => navigate('/talent/self-tape')}     collapsed={collapsed} />
              <NavItem icon={MailIcon}    label="Agent Inbox"   active={isActive('/talent/inbox')}         onClick={() => navigate('/talent/inbox')}         collapsed={collapsed} />
              <NavItem icon={Wallet}      label="Income"        active={isActive('/talent/income')}        onClick={() => navigate('/talent/income')}        collapsed={collapsed} />
              <NavItem icon={Activity}    label="Industry Intel" active={isActive('/talent/intel')}        onClick={() => navigate('/talent/intel')}         collapsed={collapsed} />
              <NavItem icon={ScrollText}  label="Contracts"     active={isActive('/talent/contracts')}     onClick={() => navigate('/talent/contracts')}     collapsed={collapsed} />
              <NavItem icon={Mic2}        label="Touring"       active={isActive('/touring')}              onClick={() => navigate('/touring')}              collapsed={collapsed} />
              <NavItem icon={ScrollText}  label="Catalogue"     active={isActive('/catalogue')}            onClick={() => navigate('/catalogue')}            collapsed={collapsed} />
            </>
          )}

          {isTalent && !isPlatformAdmin && (() => {
            const persona = getPersona(profile);
            const nav = NAV_BY_PERSONA[persona] || NAV_BY_PERSONA.actor;
            return (
              <>
                <SectionLabel collapsed={collapsed}>{nav.label}</SectionLabel>
                {nav.items.map(item => (
                  <NavItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                    collapsed={collapsed}
                  />
                ))}
              </>
            );
          })()}

          {/* Agency surface */}
          {isAgency && (
            <>
              <SectionLabel collapsed={collapsed}>Agency</SectionLabel>
              <NavItem icon={UsersRound} label="Roster"        active={isActive('/agency/roster')}        onClick={() => navigate('/agency/roster')}        collapsed={collapsed} />
              <NavItem icon={Radar}      label="Casting Feed"  active={isActive('/agency/casting')}       onClick={() => navigate('/agency/casting')}       collapsed={collapsed} />
              <NavItem icon={Send}       label="Submissions"   active={isActive('/agency/submissions')}   onClick={() => navigate('/agency/submissions')}   collapsed={collapsed} />
              <NavItem icon={Wallet}     label="Commissions"   active={isActive('/agency/commissions')}   onClick={() => navigate('/agency/commissions')}   collapsed={collapsed} />
              <NavItem icon={ScrollText} label="Contracts"     active={isActive('/agency/contracts')}     onClick={() => navigate('/agency/contracts')}     collapsed={collapsed} />
              <NavItem icon={MailIcon}   label="Comms Relay"   active={isActive('/agency/comms')}         onClick={() => navigate('/agency/comms')}         collapsed={collapsed} />
              <NavItem icon={Activity}   label="Agency Admin"  active={isActive('/agency/admin')}         onClick={() => navigate('/agency/admin')}         collapsed={collapsed} />
            </>
          )}

          {/* Shared */}
          {(isTalent || isAgency) && (
            <NavItem icon={Briefcase} label="Industry Contacts" active={isActive('/industry-contacts')} onClick={() => navigate('/industry-contacts')} collapsed={collapsed} />
          )}

          {/* Platform Admin */}
          {isPlatformAdmin && (
            <>
              <SectionLabel collapsed={collapsed}>Platform</SectionLabel>
              <div style={{ position: 'relative' }}>
                <NavItem icon={Shield} label="Platform Admin" active={isActive('/admin')} onClick={() => navigate('/admin')} collapsed={collapsed} />
                {pendingAdmin > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: collapsed ? 4 : '50%',
                    right: collapsed ? 4 : 12,
                    transform: collapsed ? 'none' : 'translateY(-50%)',
                    minWidth: 18, height: 18, padding: '0 5px',
                    borderRadius: 999, background: '#E24B4A', color: '#fff',
                    fontSize: 10, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'DM Mono, monospace',
                    pointerEvents: 'none',
                  }}>
                    {pendingAdmin}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Recents */}
          {!collapsed && sessions.length > 0 && (
            <>
              <SectionLabel collapsed={collapsed}>Recents</SectionLabel>
              {sessions.slice(0, 20).map(s => (
                <div
                  key={s.id}
                  className="group"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    paddingRight: 6,
                  }}
                >
                  <button
                    onClick={() => navigate(`/chat/${s.id}`)}
                    style={{
                      ...ROW_BASE,
                      flex: 1, minWidth: 0,
                      background: isActive(`/chat/${s.id}`) ? 'rgba(15,110,86,0.10)' : 'transparent',
                      color:      isActive(`/chat/${s.id}`) ? '#0F6E56' : '#0B1D3A',
                      fontWeight: isActive(`/chat/${s.id}`) ? 600 : 500,
                      whiteSpace: 'nowrap',
                      overflow:   'hidden',
                      textOverflow: 'ellipsis',
                      paddingLeft: 12,
                    }}
                  >
                    <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title || 'Untitled chat'}
                    </span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete chat?')) deleteSession(s.id); }}
                    aria-label="Delete chat"
                    className="opacity-0 group-hover:opacity-100"
                    style={{
                      width: 22, height: 22, borderRadius: 6,
                      color: '#888', cursor: 'pointer',
                      background: 'transparent', border: 'none',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'opacity 120ms ease',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #E7E3DA',
          padding:   collapsed ? '8px' : '10px',
          display:   'flex',
          gap:       6,
          flexDirection: collapsed ? 'column' : 'row',
          flexShrink: 0,
        }}>
          <NavItem
            icon={SettingsIcon}
            label="Settings"
            active={isActive('/settings')}
            onClick={() => navigate('/settings')}
            collapsed={collapsed}
          />
          <NavItem
            icon={LogOut}
            label="Sign out"
            onClick={handleSignOut}
            collapsed={collapsed}
          />
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
        overflow: 'auto',
        background: '#F5F6F8',
      }}>
        {/* Chat-native views (ChatHome, ChatThread, Integrations) own their
            padding/layout — render full-bleed. Legacy views (verticals,
            talent/agency, settings, admin) lost the old Layout p-6 wrapper,
            so pad them here to avoid jamming against the top/left edge. */}
        {(() => {
          // Chat thread needs a full-height flex column so its messages area
          // (flex:1) expands and the composer pins to the bottom. ChatHome +
          // Integrations own their scroll. Legacy views get padding + natural flow.
          const isThread = pathname.startsWith('/chat');
          const fullBleed =
            pathname === '/' ||
            isThread ||
            pathname.startsWith('/integrations');
          const wrapStyle = isThread
            ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
            : { minHeight: '100%', padding: fullBleed ? 0 : '24px 28px' };
          return (
            <div style={wrapStyle}>
              <Outlet />
            </div>
          );
        })()}
      </main>
    </div>
  );
};

export default ChatShell;
