import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { DollarSign, Plus, Trash2, X, Loader2, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../App';
import { usePayments } from '../../hooks/useBackOffice';
import {
  CARD_STYLE, AmberBg, StatLabel, KpiCard, fmtUsd, PageHeader,
} from './shared';

const SOURCES = ['Film Project', 'Sync Placement', 'Session Work', 'Grant', 'Gig', 'Royalty', 'Other'];

const PaymentForm = ({ draft, setDraft, onSubmit, onCancel, saving }) => {
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">Log Payment</h2>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Source *</div>
            <select value={draft.source} onChange={e => set('source', e.target.value)}
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50">
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Amount (USD) *</div>
              <input type="number" min="0" step="0.01" value={draft.amount} onChange={e => set('amount', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Date *</div>
              <input type="date" value={draft.received_date} onChange={e => set('received_date', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
          </div>
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Notes</div>
            <textarea value={draft.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y" />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onCancel} className="text-sm text-zinc-700 px-4 py-2 hover:text-zinc-900">Cancel</button>
          <button onClick={onSubmit} disabled={saving || !draft.amount || !draft.received_date}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
};

const csvEscape = (v) => {
  if (v == null) return '';
  const s = String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const Payments = () => {
  const { profile } = useAppContext();
  const { rows, loading, add, remove } = usePayments(profile?.id);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear  = new Date(now.getFullYear(), 0, 1);

  const thisMonth = rows.filter(r => new Date(r.received_date) >= startMonth).reduce((s, r) => s + Number(r.amount || 0), 0);
  const thisYear  = rows.filter(r => new Date(r.received_date) >= startYear ).reduce((s, r) => s + Number(r.amount || 0), 0);
  const allTime   = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  const bySource = useMemo(() => {
    const map = {};
    SOURCES.forEach(s => { map[s] = 0; });
    rows.forEach(r => { map[r.source] = (map[r.source] || 0) + Number(r.amount || 0); });
    return SOURCES.map(source => ({ source, amount: map[source] })).filter(d => d.amount > 0);
  }, [rows]);

  const openNew = () => setEditing({ source: 'Film Project', amount: '', received_date: new Date().toISOString().slice(0, 10), notes: '' });

  const save = async () => {
    setSaving(true);
    const payload = {
      source:        editing.source,
      amount:        Number(editing.amount),
      received_date: editing.received_date,
      notes:         (editing.notes || '').trim() || null,
    };
    const res = await add(payload);
    setSaving(false);
    if (res) { toast.success('Payment logged'); setEditing(null); }
  };

  const exportCsv = () => {
    const headers = ['source', 'amount', 'received_date', 'notes'];
    const lines = [headers.join(',')];
    rows.forEach(r => {
      lines.push([r.source, r.amount, r.received_date, r.notes].map(csvEscape).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <PageHeader Icon={DollarSign} title="Payments" subtitle="Log every payment received. Track trends. Export for accounting." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="This Month" value={fmtUsd(thisMonth)} Icon={DollarSign} />
        <KpiCard label="This Year"  value={fmtUsd(thisYear)}  Icon={DollarSign} />
        <KpiCard label="All Time"   value={fmtUsd(allTime)}   Icon={DollarSign} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
          <Plus size={13} /> Log Payment
        </button>
        <button onClick={exportCsv} disabled={rows.length === 0}
          className="bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 hover:border-amber-500/50 text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Revenue-by-source chart */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel>Revenue by source</StatLabel>
          {bySource.length === 0 ? (
            <div className="text-sm text-zinc-500 py-8 text-center">No payments logged yet.</div>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={bySource} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="source" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} tickFormatter={fmtUsd} />
                  <Tooltip formatter={(v) => fmtUsd(v)} />
                  <Bar dataKey="amount" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="tile-pop relative bg-white rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 border-b border-zinc-200 bg-zinc-50/60">
                <th className="text-left py-2.5 px-4 font-medium">Date</th>
                <th className="text-left py-2.5 px-4 font-medium">Source</th>
                <th className="text-right py-2.5 px-4 font-medium">Amount</th>
                <th className="text-left py-2.5 px-4 font-medium">Notes</th>
                <th className="text-right py-2.5 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="py-6 text-center text-zinc-500"><Loader2 size={13} className="animate-spin inline mr-1" />Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-zinc-500">No payments logged yet. Click "Log Payment".</td></tr>
              )}
              {!loading && rows.map(p => (
                <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-2.5 px-4 text-zinc-700 font-mono text-[12px]">{p.received_date}</td>
                  <td className="py-2.5 px-4 text-zinc-700">{p.source}</td>
                  <td className="py-2.5 px-4 text-right text-zinc-900 font-mono font-semibold">{fmtUsd(p.amount)}</td>
                  <td className="py-2.5 px-4 text-zinc-500 truncate max-w-xs">{p.notes || '—'}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button onClick={() => remove(p.id)} className="text-zinc-400 hover:text-red-600 p-1" aria-label="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <PaymentForm draft={editing} setDraft={setEditing} onSubmit={save} onCancel={() => setEditing(null)} saving={saving} />}
    </div>
  );
};
