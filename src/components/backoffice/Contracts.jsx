import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FileText, Plus, Trash2, X, Eye, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAppContext } from '../../App';
import { useContracts } from '../../hooks/useBackOffice';
import {
  CARD_STYLE, AmberBg, StatLabel, KpiCard, fmtUsd, PageHeader, StatusBadge,
} from './shared';

const TYPES    = ['Flat Fee', 'Royalty', 'Revenue Share', 'Work for Hire', 'License'];
const STATUSES = ['Pending Signature', 'Active', 'Completed', 'Expired'];

const STATUS_BADGE = {
  'Pending Signature': 'bg-zinc-100 text-zinc-700 border-zinc-200',
  'Active':            'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Completed':         'bg-blue-50 text-blue-700 border-blue-200',
  'Expired':           'bg-red-50 text-red-700 border-red-200',
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.round(ms / 86_400_000);
};

const ContractForm = ({ draft, setDraft, onSubmit, onCancel, saving }) => {
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">{draft.id ? 'Edit Contract' : 'New Contract'}</h2>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Project *</div>
            <input value={draft.project} onChange={e => set('project', e.target.value)}
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </label>
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Client</div>
            <input value={draft.client || ''} onChange={e => set('client', e.target.value)}
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Type</div>
              <select value={draft.contract_type || ''} onChange={e => set('contract_type', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50">
                <option value="">—</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Value (USD)</div>
              <input type="number" min="0" step="0.01" value={draft.value || ''} onChange={e => set('value', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Signed Date</div>
              <input type="date" value={draft.signed_date || ''} onChange={e => set('signed_date', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Expiry Date</div>
              <input type="date" value={draft.expiry_date || ''} onChange={e => set('expiry_date', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
          </div>
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Status</div>
            <select value={draft.status} onChange={e => set('status', e.target.value)}
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">File URL (Drive / Dropbox)</div>
            <input value={draft.file_url || ''} onChange={e => set('file_url', e.target.value)} placeholder="https://…"
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </label>
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Notes</div>
            <textarea value={draft.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y" />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onCancel} className="text-sm text-zinc-700 px-4 py-2 hover:text-zinc-900">Cancel</button>
          <button onClick={onSubmit} disabled={saving || !draft.project.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            Save Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export const Contracts = () => {
  const { profile } = useAppContext();
  const { rows, loading, add, update, remove } = useContracts(profile?.id);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving]   = useState(false);

  const activeCount   = rows.filter(r => r.status === 'Active').length;
  const totalValue    = rows.filter(r => r.status === 'Active' || r.status === 'Pending Signature').reduce((s, r) => s + (Number(r.value) || 0), 0);
  const expiringSoon  = rows.filter(r => {
    const d = daysUntil(r.expiry_date);
    return r.status === 'Active' && d != null && d >= 0 && d <= 30;
  });

  const filtered = useMemo(
    () => filterStatus ? rows.filter(r => r.status === filterStatus) : rows,
    [rows, filterStatus],
  );

  const openNew = () => setEditing({
    project: '', client: '', contract_type: '', value: '',
    signed_date: '', expiry_date: '', status: 'Pending Signature',
    file_url: '', notes: '',
  });
  const openEdit = (row) => setEditing({ ...row });

  const save = async () => {
    setSaving(true);
    const payload = {
      project:       editing.project.trim(),
      client:        (editing.client || '').trim() || null,
      contract_type: editing.contract_type || null,
      value:         editing.value === '' ? null : Number(editing.value),
      signed_date:   editing.signed_date || null,
      expiry_date:   editing.expiry_date || null,
      status:        editing.status,
      file_url:      (editing.file_url || '').trim() || null,
      notes:         (editing.notes || '').trim() || null,
    };
    const res = editing.id ? await update(editing.id, payload) : await add(payload);
    setSaving(false);
    if (res) { toast.success(editing.id ? 'Contract updated' : 'Contract created'); setEditing(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader Icon={FileText} title="Contracts" subtitle="Track signed agreements, expiry dates, and value across every deal." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Active Contracts" value={activeCount}          Icon={FileText} />
        <KpiCard label="Active Value"     value={fmtUsd(totalValue)}   Icon={FileText} />
        <KpiCard label="Expiring ≤30d"    value={expiringSoon.length}  Icon={AlertTriangle} />
      </div>

      {expiringSoon.length > 0 && (
        <div className="tile-pop relative bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-amber-900">{expiringSoon.length} contract{expiringSoon.length > 1 ? 's' : ''} expiring within 30 days</div>
            <div className="text-xs text-amber-800 truncate">{expiringSoon.map(c => c.project).slice(0, 3).join(' · ')}{expiringSoon.length > 3 ? '…' : ''}</div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
          <Plus size={13} /> New Contract
        </button>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="tile-pop relative bg-white rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 border-b border-zinc-200 bg-zinc-50/60">
                <th className="text-left py-2.5 px-4 font-medium">Project</th>
                <th className="text-left py-2.5 px-4 font-medium">Client</th>
                <th className="text-left py-2.5 px-4 font-medium">Type</th>
                <th className="text-left py-2.5 px-4 font-medium">Value</th>
                <th className="text-left py-2.5 px-4 font-medium">Expiry</th>
                <th className="text-left py-2.5 px-4 font-medium">Status</th>
                <th className="text-right py-2.5 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="py-6 text-center text-zinc-500"><Loader2 size={13} className="animate-spin inline mr-1" />Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-zinc-500">No contracts yet.</td></tr>
              )}
              {!loading && filtered.map(c => {
                const d = daysUntil(c.expiry_date);
                const expiringCls = c.status === 'Active' && d != null && d >= 0 && d <= 30 ? 'text-amber-700 font-semibold' : 'text-zinc-700';
                return (
                  <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="py-2.5 px-4 font-medium text-zinc-900">{c.project}</td>
                    <td className="py-2.5 px-4 text-zinc-700">{c.client || '—'}</td>
                    <td className="py-2.5 px-4 text-zinc-700">{c.contract_type || '—'}</td>
                    <td className="py-2.5 px-4 text-zinc-900 font-mono">{c.value != null ? fmtUsd(c.value) : '—'}</td>
                    <td className={`py-2.5 px-4 font-mono text-[12px] ${expiringCls}`}>
                      {c.expiry_date || '—'}{d != null && d >= 0 && d <= 30 && c.status === 'Active' ? ` (${d}d)` : ''}
                    </td>
                    <td className="py-2.5 px-4"><StatusBadge status={c.status} palette={STATUS_BADGE} /></td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {c.file_url && <a href={c.file_url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-amber-700 p-1" aria-label="Open file"><ExternalLink size={14} /></a>}
                        <button onClick={() => openEdit(c)} className="text-zinc-500 hover:text-amber-700 p-1" aria-label="Edit"><Eye size={14} /></button>
                        <button onClick={() => remove(c.id)} className="text-zinc-400 hover:text-red-600 p-1" aria-label="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <ContractForm draft={editing} setDraft={setEditing} onSubmit={save} onCancel={() => setEditing(null)} saving={saving} />}
    </div>
  );
};
