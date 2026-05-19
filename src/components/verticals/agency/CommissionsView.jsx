import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wallet, AlertTriangle, Bot, TrendingUp, DollarSign, Link2, Loader2 } from 'lucide-react';
import { useAppContext } from '../../../App';
import { useCommissions } from '../../../hooks/useCommissions';
import { stripeConnectOnboard } from '../../../utils/integrations';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const STATUS_COLORS = {
  pending:     'bg-amber-50 text-amber-700 border-amber-200',
  invoiced:    'bg-blue-50 text-blue-700 border-blue-200',
  collected:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue:     'bg-rose-50 text-rose-700 border-rose-200',
  written_off: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const usd = (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const KpiCard = ({ label, value, accent = 'text-zinc-900', Icon }) => (
  <div className="bg-white rounded-2xl p-4" style={CARD_STYLE}>
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
      {Icon && <Icon size={10} />}
      {label}
    </div>
    <div className={`text-2xl font-bold tabular-nums ${accent}`} style={{ fontFamily: 'var(--font-mono)' }}>
      {value}
    </div>
  </div>
);

const AgingBar = ({ aging }) => {
  const total = aging.current + aging.b30 + aging.b60 + aging.b90 + aging.b90plus || 1;
  const buckets = [
    { label: 'Current',   amt: aging.current, color: 'bg-emerald-500' },
    { label: '1-30',      amt: aging.b30,     color: 'bg-amber-400' },
    { label: '31-60',     amt: aging.b60,     color: 'bg-orange-500' },
    { label: '61-90',     amt: aging.b90,     color: 'bg-rose-500' },
    { label: '90+',       amt: aging.b90plus, color: 'bg-rose-700' },
  ];
  return (
    <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
        Receivables Aging
      </div>
      <div className="flex h-3 rounded-full overflow-hidden mb-3 bg-zinc-100">
        {buckets.map(b => (
          b.amt > 0 ? <div key={b.label} className={b.color} style={{ width: `${(b.amt / total) * 100}%` }} /> : null
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {buckets.map(b => (
          <div key={b.label}>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">{b.label}</div>
            <div className="text-sm font-bold tabular-nums text-zinc-900" style={{ fontFamily: 'var(--font-mono)' }}>{usd(b.amt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CommissionsView = () => {
  const { profile } = useAppContext();
  const navigate = useNavigate();
  const { commissions, totals, aging, overdueCount, updateCommission, deleteCommission } = useCommissions(profile?.id);
  const [connecting, setConnecting] = useState(false);

  const handleOpenAgent = () => {
    sessionStorage.setItem('agentchat.preselectedAgent', 'agency-commission-tracker');
    navigate('/agents');
  };

  const handleStripeConnect = async () => {
    setConnecting(true);
    try {
      const { mode, onboarding_url, message } = await stripeConnectOnboard({
        email: profile?.email,
      });
      if (mode === 'mock' || !onboarding_url) {
        toast(message || 'Stripe Connect not configured yet.', { icon: 'ℹ️', duration: 5000 });
        return;
      }
      window.location.href = onboarding_url;
    } catch (err) {
      toast.error(err.userMessage || err.message || 'Stripe onboarding failed.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="text-violet-600" size={20} />
            <h1 className="text-xl font-bold text-zinc-900">Commissions</h1>
          </div>
          <p className="text-sm text-zinc-500">Receivables aging · overdue · collected commissions across bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleStripeConnect}
            disabled={connecting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-indigo-400 hover:text-indigo-600">
            {connecting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Connect Stripe
          </button>
          <button onClick={handleOpenAgent}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 text-amber-300 text-sm font-semibold hover:bg-zinc-800 border border-amber-500/20">
            <Bot size={14} />
            Ask Commission Tracker
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Due (YTD)" value={usd(totals.totalDue)} Icon={DollarSign} />
        <KpiCard label="Collected" value={usd(totals.totalCollected)} accent="text-emerald-600" Icon={TrendingUp} />
        <KpiCard label="Outstanding" value={usd(totals.totalOutstanding)} accent="text-amber-600" />
        <KpiCard label="Overdue (>30d)" value={overdueCount} accent="text-rose-600" Icon={AlertTriangle} />
      </div>

      <AgingBar aging={aging} />

      <div className="bg-white rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
          <div className="text-sm font-bold text-zinc-900">Commission Ledger</div>
          <div className="text-xs text-zinc-500">{commissions.length} entries</div>
        </div>
        {commissions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="mx-auto text-zinc-300 mb-3" size={32} />
            <div className="text-sm font-semibold text-zinc-700 mb-1">No commissions yet</div>
            <p className="text-xs text-zinc-500 mb-4">Commissions appear automatically when bookings are confirmed.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {commissions.map(c => {
              const statusColor = STATUS_COLORS[c.status] || STATUS_COLORS.pending;
              const outstanding = (c.amount_due || 0) - (c.amount_collected || 0);
              return (
                <div key={c.id} className="px-5 py-3 hover:bg-zinc-50 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-zinc-900 truncate">
                      {c.bookings?.project_title || 'Unnamed project'}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {c.roster?.talent_name || 'Unknown talent'} · Due {c.due_date ? new Date(c.due_date).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="font-bold text-sm tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{usd(c.amount_due)}</div>
                    <div className="text-[11px] text-zinc-500">Due</div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="font-bold text-sm tabular-nums text-emerald-600" style={{ fontFamily: 'var(--font-mono)' }}>{usd(c.amount_collected)}</div>
                    <div className="text-[11px] text-zinc-500">Collected</div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className={`font-bold text-sm tabular-nums ${outstanding > 0 ? 'text-amber-600' : 'text-zinc-400'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                      {usd(outstanding)}
                    </div>
                    <div className="text-[11px] text-zinc-500">Outstanding</div>
                  </div>
                  <select value={c.status} onChange={(e) => updateCommission(c.id, { status: e.target.value })}
                    className={`text-[11px] border rounded-full px-2 py-1 cursor-pointer min-w-[100px] ${statusColor}`}>
                    <option value="pending">Pending</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="collected">Collected</option>
                    <option value="overdue">Overdue</option>
                    <option value="written_off">Written off</option>
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
