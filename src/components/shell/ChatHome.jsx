import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2, Wallet, DollarSign, Radar, Sparkles } from 'lucide-react';
import { useAppContext } from '../../App';
import { usePersona } from '../../lib/personaState';
import { useAuditions } from '../../hooks/useAuditions';
import { useCommissions } from '../../hooks/useCommissions';
import { useChatSessions } from '../../hooks/useChatSessions';
import { MOAvatar } from './MOAvatar';
import { ChatBar } from './ChatBar';
import { ObservationBar } from './cards/ObservationBar';
import { FunnelCard } from './cards/FunnelCard';
import { ChurnCard } from './cards/ChurnCard';
import { getDashboardDay } from '../../lib/dashboardDay';

const usd = (n) => `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const MiniStat = ({ label, value, icon: Icon, accent = '#0B1D3A' }) => (
  <div style={{
    background: '#FFFFFF',
    border:     '1px solid #E0E0E0',
    borderRadius: 14,
    padding:    16,
    boxShadow:  '0 1px 3px rgba(11,29,58,0.04)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: '#888', fontFamily: 'DM Mono, monospace',
      }}>
        {label}
      </div>
      {Icon && <Icon size={14} style={{ color: '#888' }} />}
    </div>
    <div style={{
      fontSize: 24, fontWeight: 700,
      color: accent,
      fontFamily: 'DM Mono, monospace',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.01em',
    }}>
      {value}
    </div>
  </div>
);

const QuickChip = ({ label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 14px',
      borderRadius: 999,
      background: '#FFFFFF',
      border: '1px solid #E0E0E0',
      fontSize: 13,
      color: '#0B1D3A',
      cursor: 'pointer',
      fontWeight: 500,
      transition: 'all 120ms ease',
      boxShadow: '0 1px 2px rgba(11,29,58,0.03)',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#5DCAA5';
      e.currentTarget.style.background  = 'rgba(15,110,86,0.04)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '#E0E0E0';
      e.currentTarget.style.background  = '#FFFFFF';
    }}
  >
    <Sparkles size={12} style={{ color: '#0F6E56' }} />
    {label}
  </button>
);

export const ChatHome = () => {
  const navigate = useNavigate();
  const { profile, user } = useAppContext();
  const { persona } = usePersona();
  const { counts: auditionCounts, callbackRate } = useAuditions(profile?.id);
  const { totals: commissionTotals, overdueCount } = useCommissions(profile?.id);
  const { createSession } = useChatSessions(profile?.id, { skipLoad: true });
  const [sending, setSending] = useState(false);

  const firstName = user?.name?.first_name
    || (user?.emails?.[0]?.email || '').split('@')[0].split('.')[0]
    || 'there';
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const personaName = persona.name || 'MO';

  const sendPrompt = async (text) => {
    setSending(true);
    try {
      const s = await createSession(text.slice(0, 60));
      if (s?.id) {
        navigate(`/chat/${s.id}`, { state: { initialPrompt: text } });
      }
    } finally {
      setSending(false);
    }
  };

  const roles = profile?.roles || [];
  const isTalent = roles.includes('talent') || roles.includes('admin') || roles.includes('super_admin');
  const isAgency = roles.includes('agency') || roles.includes('admin') || roles.includes('super_admin');
  const day = getDashboardDay(profile);

  return (
    <div style={{
      minHeight: '100%',
      background: '#F5F6F8',
    }}>
      {/* (Top status strip replaced by ObservationBar below — see Hero) */}

      {/* Hero — main column (ChatShell <main> owns the scroll) */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        padding: '24px 24px 40px',
        maxWidth: 980,
        margin: '0 auto',
        width: '100%',
      }}>
        <ObservationBar />

        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          paddingTop: 12,
        }}>
        <MOAvatar size={96} state="idle" />
        <h1 style={{
          fontFamily: "'Inter Tight', sans-serif",
          fontSize:   38,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: '#0B1D3A',
          marginTop: 24,
          textAlign: 'center',
          lineHeight: 1.1,
        }}>
          Hi {greeting}. How can {personaName} help today?
        </h1>
        <p style={{
          fontSize: 15, color: '#888', marginTop: 10, textAlign: 'center', maxWidth: 560,
          lineHeight: 1.5,
        }}>
          Ask anything about your auditions, roster, commissions, or pipeline. Type <code style={{
            background: 'rgba(15,110,86,0.08)', color: '#0F6E56', padding: '2px 6px',
            borderRadius: 4, fontSize: 12, fontFamily: 'DM Mono, monospace',
          }}>/</code> to jump straight to a specialist agent.
        </p>

        {/* ChatBar */}
        <div style={{ width: '100%', maxWidth: 720, marginTop: 28 }}>
          <ChatBar
            onSend={sendPrompt}
            sending={sending}
            autoFocus
            onIntegrations={() => navigate('/settings')}
            onVoice={() => { /* Phase B */ }}
          />
        </div>

        {/* Quick chips */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          marginTop: 16, justifyContent: 'center',
          maxWidth: 720,
        }}>
          {isTalent && <QuickChip label="Log an audition"          onClick={() => sendPrompt('/audition I want to log a new audition')} />}
          {isAgency && <QuickChip label="Add a commission"         onClick={() => sendPrompt('/commission Help me track a new commission')} />}
          <QuickChip                label="What's my spend today?" onClick={() => sendPrompt('/cost What is my AI + integration spend today?')} />
          <QuickChip                label="Find casting calls"     onClick={() => sendPrompt('/casting Find current casting calls relevant to me')} />
        </div>

        {/* Snapshot KPIs */}
        <div style={{
          width: '100%', maxWidth: 720, marginTop: 32,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}>
          {isTalent && (
            <>
              <MiniStat
                label="Auditions"
                value={auditionCounts?.total ?? 0}
                icon={Mic2}
              />
              <MiniStat
                label="Callback Rate"
                value={`${callbackRate ?? 0}%`}
                icon={Radar}
                accent="#0F6E56"
              />
            </>
          )}
          {isAgency && (
            <>
              <MiniStat
                label="Commission Pipeline"
                value={usd(commissionTotals?.totalOutstanding)}
                icon={Wallet}
                accent="#0F6E56"
              />
              <MiniStat
                label="Overdue"
                value={overdueCount ?? 0}
                icon={DollarSign}
                accent={overdueCount > 0 ? '#E24B4A' : '#0B1D3A'}
              />
            </>
          )}
          {!isTalent && !isAgency && (
            <MiniStat label="Welcome" value="MO" icon={Sparkles} accent="#0F6E56" />
          )}
        </div>
        </div>{/* /centered hero block */}

        {/* Dashboard cards row — day-locked progression */}
        <div style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}>
          <FunnelCard counts={auditionCounts} locked={day < 2} />
          <ChurnCard  noResponse={auditionCounts?.no_response || 0} overdue={overdueCount || 0} locked={day < 3} />
        </div>
      </div>
    </div>
  );
};

export default ChatHome;
