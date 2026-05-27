import React, { useEffect, useState, useCallback } from 'react';
import { Shield, DollarSign, Users, Activity, Loader2, RefreshCw, AlertCircle, Check, X, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getStytchAuthHeaders } from '../../lib/stytch';
import { useAppContext } from '../../App';

const CARD_STYLE = {
  border:    '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const usd = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: n < 1 ? 4 : 2,
    maximumFractionDigits: n < 1 ? 6 : 2,
  })}`;

const Tile = ({ label, value, sub, accent = 'text-zinc-900', Icon }) => (
  <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
    <div className="flex items-start justify-between mb-2">
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </div>
      {Icon && <Icon size={14} className="text-zinc-400" />}
    </div>
    <div
      className={`text-2xl font-bold tabular-nums ${accent}`}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {value}
    </div>
    {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
  </div>
);

export const PlatformAdminView = () => {
  const { profile } = useAppContext();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/overview', {
        headers: { ...getStytchAuthHeaders() },
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error?.message || `HTTP ${r.status}`);
      }
      setData(await r.json());
    } catch (err) {
      setError(err.message || 'Failed to load admin overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const roles = profile?.roles || [];
  const isSuper = roles.includes('super_admin');

  // ── Pending admin requests (super_admin only) ──
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [actingId, setActingId] = useState(null);

  const loadRequests = useCallback(async () => {
    if (!isSuper) return;
    setReqLoading(true);
    try {
      const r = await fetch('/api/admin/requests', { headers: { ...getStytchAuthHeaders() } });
      if (r.ok) {
        const body = await r.json();
        setRequests(body.requests || []);
      }
    } catch { /* noop */ }
    setReqLoading(false);
  }, [isSuper]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const review = async (profileId, action) => {
    setActingId(profileId);
    try {
      const r = await fetch(`/api/admin/requests/${profileId}/${action}`, {
        method: 'POST',
        headers: { ...getStytchAuthHeaders() },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      toast.success(action === 'approve' ? 'Admin access granted.' : 'Request denied.');
      setRequests(prev => prev.filter(req => req.id !== profileId));
      load(); // refresh overview counts
    } catch (err) {
      toast.error(`Could not ${action}: ${err.message}`);
    }
    setActingId(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-amber-600" size={20} />
            <h1 className="text-xl font-bold text-zinc-900">Platform Admin</h1>
            {isSuper && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Super Admin
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500">
            System-wide spend · users · roles · recent activity
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-amber-400 hover:text-amber-600"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Pending Admin Requests — super_admin only */}
      {isSuper && (
        <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={16} className="text-amber-600" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500" style={{ fontFamily: 'var(--font-mono)' }}>
              Pending Admin Requests
            </span>
            {requests.length > 0 && (
              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </div>
          {reqLoading ? (
            <div className="text-sm text-zinc-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading…</div>
          ) : requests.length === 0 ? (
            <div className="text-sm text-zinc-400">No pending requests.</div>
          ) : (
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-900 truncate">{req.display_name || req.email}</div>
                    <div className="text-xs text-zinc-500 truncate">
                      {req.email}{req.vertical ? ` · ${req.vertical}` : ''}
                      {req.admin_requested_at ? ` · ${new Date(req.admin_requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => review(req.id, 'approve')}
                      disabled={actingId === req.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {actingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Approve
                    </button>
                    <button
                      onClick={() => review(req.id, 'deny')}
                      disabled={actingId === req.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 text-xs font-semibold hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                    >
                      <X size={12} /> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile
          label="Total Users"
          value={loading ? '…' : (data?.profile_count ?? 0)}
          sub="profiles in system"
          Icon={Users}
        />
        <Tile
          label="Cost (24h)"
          value={loading ? '…' : usd(data?.cost_24h?.total_usd)}
          sub="AI + integrations"
          accent="text-emerald-600"
          Icon={DollarSign}
        />
        <Tile
          label="Calls (24h)"
          value={
            loading
              ? '…'
              : (data?.cost_24h?.by_provider || []).reduce((s, p) => s + p.requests, 0)
          }
          sub="logged AI/API calls"
          Icon={Activity}
        />
        <Tile
          label="Admins"
          value={
            loading
              ? '…'
              : (data?.role_breakdown?.super_admin || 0) + (data?.role_breakdown?.admin || 0)
          }
          sub="super_admin + admin"
          accent="text-amber-600"
          Icon={Shield}
        />
      </div>

      {/* Cost by Provider */}
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Cost by Provider (24h)
        </div>
        {loading ? (
          <div className="text-sm text-zinc-400">Loading…</div>
        ) : (data?.cost_24h?.by_provider || []).length === 0 ? (
          <div className="text-sm text-zinc-400">No spend logged in the last 24 hours.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-100">
                <th className="py-2">Provider</th>
                <th className="py-2 text-right">Requests</th>
                <th className="py-2 text-right">Tokens In</th>
                <th className="py-2 text-right">Tokens Out</th>
                <th className="py-2 text-right">USD</th>
              </tr>
            </thead>
            <tbody>
              {data.cost_24h.by_provider
                .sort((a, b) => b.usd - a.usd)
                .map((p) => (
                  <tr key={p.provider} className="border-b border-zinc-50">
                    <td className="py-2 font-medium text-zinc-800">{p.provider}</td>
                    <td className="py-2 text-right tabular-nums text-zinc-700">{p.requests}</td>
                    <td className="py-2 text-right tabular-nums text-zinc-500">
                      {p.tokens_in.toLocaleString()}
                    </td>
                    <td className="py-2 text-right tabular-nums text-zinc-500">
                      {p.tokens_out.toLocaleString()}
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold text-emerald-600">
                      {usd(p.usd)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Breakdown */}
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Role Breakdown (user_roles)
        </div>
        {loading ? (
          <div className="text-sm text-zinc-400">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['super_admin', 'admin', 'manager', 'member', 'viewer'].map((r) => (
              <div key={r} className="rounded-lg bg-zinc-50 p-3">
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {r}
                </div>
                <div
                  className="text-xl font-bold tabular-nums text-zinc-800"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {data?.role_breakdown?.[r] || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Calls */}
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Recent AI / Integration Calls
        </div>
        {loading ? (
          <div className="text-sm text-zinc-400">Loading…</div>
        ) : (data?.recent_calls || []).length === 0 ? (
          <div className="text-sm text-zinc-400">No calls logged yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-100">
                <th className="py-2">Endpoint</th>
                <th className="py-2">Provider</th>
                <th className="py-2">Model</th>
                <th className="py-2 text-right">USD</th>
                <th className="py-2 text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_calls.map((row, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  <td className="py-2 font-mono text-[11px] text-zinc-700">{row.endpoint}</td>
                  <td className="py-2 text-zinc-700">{row.provider}</td>
                  <td className="py-2 text-zinc-500 font-mono text-[11px]">{row.model || '—'}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-700">{usd(row.usd_cost)}</td>
                  <td className="py-2 text-right text-zinc-500 text-[11px]">
                    {new Date(row.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day:   'numeric',
                      hour:  'numeric',
                      minute:'2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PlatformAdminView;
