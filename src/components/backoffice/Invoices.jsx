import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Receipt, Plus, Trash2, Upload, X, Eye, Loader2, AlertTriangle,
} from 'lucide-react';
import { useAppContext } from '../../App';
import { useInvoices } from '../../hooks/useBackOffice';
import { logger } from '../../lib/logger';
import {
  CARD_STYLE, AmberBg, StatLabel, KpiCard, fmtUsd, PageHeader, StatusBadge,
} from './shared';

const STATUSES = ['Draft', 'Sent', 'Viewed', 'Paid', 'Overdue'];
const STATUS_BADGE = {
  Draft:   'bg-zinc-100 text-zinc-700 border-zinc-200',
  Sent:    'bg-blue-50 text-blue-700 border-blue-200',
  Viewed:  'bg-amber-50 text-amber-700 border-amber-200',
  Paid:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
};

const emptyLine = () => ({ id: crypto.randomUUID(), description: '', qty: 1, rate: 0 });

const InvoiceForm = ({ draft, setDraft, onSubmit, onCancel, saving }) => {
  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const updateLine = (id, k, v) => setDraft(d => ({
    ...d,
    line_items: d.line_items.map(l => l.id === id ? { ...l, [k]: v } : l),
  }));
  const addLine    = () => setDraft(d => ({ ...d, line_items: [...d.line_items, emptyLine()] }));
  const removeLine = (id) => setDraft(d => ({ ...d, line_items: d.line_items.filter(l => l.id !== id) }));

  const total = useMemo(
    () => (draft.line_items || []).reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0),
    [draft.line_items],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">{draft.id ? 'Edit Invoice' : 'New Invoice'}</h2>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Client *</div>
              <input value={draft.client_name} onChange={e => setField('client_name', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Project</div>
              <input value={draft.project || ''} onChange={e => setField('project', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Due Date</div>
              <input type="date" value={draft.due_date || ''} onChange={e => setField('due_date', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Status</div>
              <select value={draft.status} onChange={e => setField('status', e.target.value)}
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <StatLabel>Line Items</StatLabel>
              <button onClick={addLine} className="flex items-center gap-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg">
                <Plus size={11} /> Add line
              </button>
            </div>
            <div className="space-y-2">
              {draft.line_items.map(l => (
                <div key={l.id} className="grid grid-cols-12 gap-2 items-center">
                  <input value={l.description} onChange={e => updateLine(l.id, 'description', e.target.value)} placeholder="Description"
                    className="col-span-7 text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
                  <input type="number" min="0" step="1" value={l.qty} onChange={e => updateLine(l.id, 'qty', e.target.value)} placeholder="Qty"
                    className="col-span-2 text-sm bg-white text-zinc-900 rounded-lg px-2 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 text-right" />
                  <input type="number" min="0" step="0.01" value={l.rate} onChange={e => updateLine(l.id, 'rate', e.target.value)} placeholder="Rate"
                    className="col-span-2 text-sm bg-white text-zinc-900 rounded-lg px-2 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 text-right" />
                  <button onClick={() => removeLine(l.id)} className="col-span-1 text-zinc-400 hover:text-red-600 flex justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {draft.line_items.length === 0 && (
                <div className="text-xs text-zinc-500 text-center py-3">No line items. Click Add line to start.</div>
              )}
            </div>
            <div className="flex justify-end mt-3 text-sm">
              <div className="text-right">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em]">Total</div>
                <div className="font-mono font-bold text-lg text-zinc-900 tabular-nums">{fmtUsd(total)}</div>
              </div>
            </div>
          </div>

          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Notes</div>
            <textarea value={draft.notes || ''} onChange={e => setField('notes', e.target.value)} rows={2}
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y" />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onCancel} className="text-sm text-zinc-700 px-4 py-2 hover:text-zinc-900">Cancel</button>
          <button onClick={() => onSubmit({ ...draft, total })} disabled={saving || !draft.client_name.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            Save Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export const Invoices = () => {
  const { profile } = useAppContext();
  const { rows, loading, add, update, remove } = useInvoices(profile?.id);
  const [editing, setEditing] = useState(null);
  const [sortBy, setSortBy]   = useState('created_at');
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving]   = useState(false);

  const outstanding = useMemo(() => rows.filter(r => ['Sent', 'Viewed', 'Overdue'].includes(r.status)).reduce((s, r) => s + Number(r.total || 0), 0), [rows]);
  const paidThisMonth = useMemo(() => {
    const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return rows.filter(r => r.status === 'Paid' && new Date(r.created_at) >= start).reduce((s, r) => s + Number(r.total || 0), 0);
  }, [rows]);
  const overdueCount = useMemo(() => rows.filter(r => r.status === 'Overdue').length, [rows]);

  const sorted = useMemo(() => {
    const list = filterStatus ? rows.filter(r => r.status === filterStatus) : rows;
    return [...list].sort((a, b) => {
      if (sortBy === 'total')    return (Number(b.total) || 0) - (Number(a.total) || 0);
      if (sortBy === 'due_date') return String(a.due_date || '').localeCompare(String(b.due_date || ''));
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [rows, sortBy, filterStatus]);

  const openNew = () => setEditing({ client_name: '', project: '', status: 'Draft', line_items: [emptyLine()], notes: '', due_date: '' });
  const openEdit = (row) => setEditing({ ...row, line_items: row.line_items || [] });

  const save = async (draft) => {
    setSaving(true);
    const payload = {
      client_name: draft.client_name.trim(),
      project:     (draft.project || '').trim() || null,
      line_items:  draft.line_items,
      total:       Number(draft.total) || 0,
      status:      draft.status,
      due_date:    draft.due_date || null,
      notes:       (draft.notes || '').trim() || null,
    };
    const result = draft.id ? await update(draft.id, payload) : await add(payload);
    setSaving(false);
    if (result) { toast.success(draft.id ? 'Invoice updated' : 'Invoice created'); setEditing(null); }
  };

  const exportPdf = async (inv) => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text('INVOICE', 20, 20);
      doc.setFontSize(11);
      let y = 35;
      const line = (k, v) => { if (v) { doc.text(`${k}: ${v}`, 20, y); y += 7; } };
      line('Client',   inv.client_name);
      line('Project',  inv.project);
      line('Status',   inv.status);
      line('Due',      inv.due_date);
      y += 4;
      doc.setFontSize(12); doc.text('Line Items', 20, y); y += 7;
      doc.setFontSize(10);
      (inv.line_items || []).forEach(l => {
        if (y > 265) { doc.addPage(); y = 20; }
        const amount = (Number(l.qty) || 0) * (Number(l.rate) || 0);
        doc.text(`${l.description} — ${l.qty} × $${Number(l.rate).toFixed(2)} = $${amount.toFixed(2)}`, 22, y);
        y += 6;
      });
      y += 4;
      doc.setFontSize(13); doc.text(`Total: $${Number(inv.total || 0).toFixed(2)}`, 20, y);
      if (inv.notes) { y += 10; doc.setFontSize(10); const split = doc.splitTextToSize(`Notes: ${inv.notes}`, 170); split.forEach(r => { doc.text(r, 20, y); y += 5; }); }
      doc.save(`invoice-${(inv.client_name || 'client').replace(/\s+/g, '-')}-${inv.id?.slice(0, 8) || 'new'}.pdf`);
    } catch (err) {
      logger.error('Invoices.pdf.failed', err);
      toast.error('Could not export PDF');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader Icon={Receipt} title="Invoices" subtitle="Create, track, and export invoices. One-off or recurring client billing." />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Outstanding"    value={fmtUsd(outstanding)}   Icon={AlertTriangle} />
        <KpiCard label="Paid This Month" value={fmtUsd(paidThisMonth)} Icon={Receipt} />
        <KpiCard label="Overdue"        value={overdueCount}          Icon={AlertTriangle} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
          <Plus size={13} /> New Invoice
        </button>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
          <option value="created_at">Newest</option>
          <option value="total">Amount (high → low)</option>
          <option value="due_date">Due date</option>
        </select>
      </div>

      {/* List */}
      <div className="tile-pop relative bg-white rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 border-b border-zinc-200 bg-zinc-50/60">
                <th className="text-left py-2.5 px-4 font-medium">Client</th>
                <th className="text-left py-2.5 px-4 font-medium">Project</th>
                <th className="text-left py-2.5 px-4 font-medium">Due</th>
                <th className="text-left py-2.5 px-4 font-medium">Total</th>
                <th className="text-left py-2.5 px-4 font-medium">Status</th>
                <th className="text-right py-2.5 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="py-6 text-center text-zinc-500 flex items-center justify-center gap-2"><Loader2 size={13} className="animate-spin" /> Loading…</td></tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-zinc-500">No invoices yet. Create your first with "New Invoice".</td></tr>
              )}
              {!loading && sorted.map(inv => (
                <tr key={inv.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-2.5 px-4 font-medium text-zinc-900">{inv.client_name}</td>
                  <td className="py-2.5 px-4 text-zinc-700">{inv.project || '—'}</td>
                  <td className="py-2.5 px-4 text-zinc-700 font-mono text-[12px]">{inv.due_date || '—'}</td>
                  <td className="py-2.5 px-4 text-zinc-900 font-mono font-semibold">{fmtUsd(inv.total)}</td>
                  <td className="py-2.5 px-4"><StatusBadge status={inv.status} palette={STATUS_BADGE} /></td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => openEdit(inv)} className="text-zinc-500 hover:text-amber-700 p-1" aria-label="Edit"><Eye size={14} /></button>
                      <button onClick={() => exportPdf(inv)} className="text-zinc-500 hover:text-amber-700 p-1" aria-label="Export PDF"><Upload size={14} /></button>
                      <button onClick={() => remove(inv.id)} className="text-zinc-400 hover:text-red-600 p-1" aria-label="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <InvoiceForm draft={editing} setDraft={setEditing} onSubmit={save} onCancel={() => setEditing(null)} saving={saving} />}
    </div>
  );
};
