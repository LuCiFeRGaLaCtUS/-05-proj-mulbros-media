import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Mic2, Plus, Trash2, X, Calendar, ChevronRight, ExternalLink, Bot, MessageSquare, Loader2 } from 'lucide-react';
import { useAppContext } from '../../../App';
import { useAuditions, AUDITION_STAGES, AUDITION_STAGE_LABELS } from '../../../hooks/useAuditions';
import { useNavigate } from 'react-router-dom';
import { twilioSendSms } from '../../../utils/integrations';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const STAGE_COLORS = {
  submitted:   { bg: 'bg-zinc-50',    border: 'border-zinc-200',    text: 'text-zinc-700',    dot: 'bg-zinc-400' },
  callback:    { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  booked:      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pass:        { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-500' },
  no_response: { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-600',   dot: 'bg-slate-400' },
};

const AUDITION_TYPES = [
  { id: 'self_tape',      label: 'Self-tape' },
  { id: 'in_person',      label: 'In-person' },
  { id: 'callback',       label: 'Callback' },
  { id: 'chemistry_read', label: 'Chemistry read' },
  { id: 'screen_test',    label: 'Screen test' },
];

const KpiCard = ({ label, value, accent = 'text-zinc-900' }) => (
  <div className="bg-white rounded-2xl p-4" style={CARD_STYLE}>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
      {label}
    </div>
    <div className={`text-2xl font-bold tabular-nums ${accent}`} style={{ fontFamily: 'var(--font-mono)' }}>
      {value}
    </div>
  </div>
);

const AuditionCard = ({ row, onStatusChange, onDelete }) => {
  const color = STAGE_COLORS[row.status] || STAGE_COLORS.submitted;
  return (
    <div className="group bg-white rounded-xl p-3 hover:shadow-md transition-shadow" style={CARD_STYLE}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-900 truncate">{row.project_title}</div>
          {row.role_name && <div className="text-xs text-zinc-500 truncate">{row.role_name}</div>}
        </div>
        <button
          onClick={() => onDelete(row.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 transition"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
      {row.casting_director && (
        <div className="text-[11px] text-zinc-500 mb-1.5">CD: {row.casting_director}</div>
      )}
      {row.audition_at && (
        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mb-2">
          <Calendar size={10} />
          {new Date(row.audition_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-100">
        <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${color.bg} ${color.text} ${color.border}`}>
          {AUDITION_TYPES.find(t => t.id === row.audition_type)?.label || row.audition_type || 'self-tape'}
        </div>
        <select
          value={row.status}
          onChange={(e) => onStatusChange(row.id, row.status, e.target.value)}
          className="text-[11px] bg-white border border-zinc-200 rounded-md px-1.5 py-0.5 text-zinc-700 cursor-pointer hover:border-amber-400"
        >
          {AUDITION_STAGES.map(s => (
            <option key={s} value={s}>{AUDITION_STAGE_LABELS[s]}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const StageColumn = ({ stage, rows, onStatusChange, onDelete }) => {
  const color = STAGE_COLORS[stage];
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${color.dot}`} />
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-700">
          {AUDITION_STAGE_LABELS[stage]}
        </div>
        <div className="ml-auto text-xs text-zinc-500 font-mono">{rows.length}</div>
      </div>
      <div className="space-y-2 min-h-[200px]">
        {rows.length === 0 ? (
          <div className="text-xs text-zinc-400 text-center py-4">No auditions</div>
        ) : (
          rows.map(r => (
            <AuditionCard key={r.id} row={r} onStatusChange={onStatusChange} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
};

const AddAuditionModal = ({ open, onClose, onAdd }) => {
  const [form, setForm] = useState({
    project_title: '',
    role_name: '',
    casting_director: '',
    audition_type: 'self_tape',
    audition_at: '',
    deadline: '',
    paying_rate: '',
    source: '',
    source_url: '',
    notes: '',
  });

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_title.trim()) {
      toast.error('Project title is required.');
      return;
    }
    const audition = await onAdd({
      ...form,
      audition_at: form.audition_at || null,
      deadline:    form.deadline    || null,
    });
    if (audition) {
      toast.success('Audition added.');
      onClose();
      setForm({ project_title: '', role_name: '', casting_director: '', audition_type: 'self_tape', audition_at: '', deadline: '', paying_rate: '', source: '', source_url: '', notes: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <div className="font-bold text-zinc-900">New Audition</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Project Title *</label>
            <input
              type="text"
              value={form.project_title}
              onChange={(e) => setForm({ ...form, project_title: e.target.value })}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
              placeholder="e.g. Untitled Netflix Pilot"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Role</label>
              <input type="text" value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" placeholder="Lead / Supporting" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Casting Director</label>
              <input type="text" value={form.casting_director} onChange={(e) => setForm({ ...form, casting_director: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" placeholder="Name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Type</label>
              <select value={form.audition_type} onChange={(e) => setForm({ ...form, audition_type: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400">
                {AUDITION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Audition Date</label>
              <input type="datetime-local" value={form.audition_at} onChange={(e) => setForm({ ...form, audition_at: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Deadline</label>
              <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Paying Rate</label>
              <input type="text" value={form.paying_rate} onChange={(e) => setForm({ ...form, paying_rate: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" placeholder="$300/day, SAG scale" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Source URL</label>
            <input type="url" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" placeholder="https://backstage.com/..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" placeholder="Sides attached, comp pages, callback feedback…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">Add Audition</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AuditionsView = () => {
  const { profile } = useAppContext();
  const navigate = useNavigate();
  const { auditions, counts, callbackRate, addAudition, moveAudition, deleteAudition } = useAuditions(profile?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  const handleStatusChange = (id, from, to) => {
    moveAudition(id, from, to);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this audition? This cannot be undone.')) {
      deleteAudition(id);
    }
  };

  const handleOpenAgent = () => {
    sessionStorage.setItem('agentchat.preselectedAgent', 'talent-audition-tracker');
    navigate('/agents');
  };

  const handleSendReminders = async () => {
    const phone = prompt('Your mobile number (E.164 format, e.g. +14155551234) to receive audition reminders:');
    if (!phone) return;
    const upcoming = AUDITION_STAGES.flatMap(s => auditions[s] || [])
      .filter(a => a.audition_at && new Date(a.audition_at) > new Date())
      .sort((a, b) => new Date(a.audition_at) - new Date(b.audition_at))
      .slice(0, 5);
    if (upcoming.length === 0) {
      toast('No upcoming auditions scheduled.', { icon: 'ℹ️' });
      return;
    }
    const lines = upcoming.map(a => {
      const when = new Date(a.audition_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      return `${when} · ${a.project_title}${a.role_name ? ' (' + a.role_name + ')' : ''}`;
    });
    const message = `MulBros — upcoming auditions:\n${lines.join('\n')}`;
    setSmsLoading(true);
    try {
      const { mode, sid, message: respMsg } = await twilioSendSms({ to: phone, message });
      if (mode === 'mock') {
        toast(respMsg || 'Twilio not configured. Set TWILIO_* env vars to enable.', { icon: 'ℹ️', duration: 5000 });
      } else {
        toast.success(`SMS sent (${sid?.slice(0, 8)}…)`);
      }
    } catch (err) {
      toast.error(err.userMessage || err.message || 'SMS send failed.');
    } finally {
      setSmsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mic2 className="text-sky-600" size={20} />
            <h1 className="text-xl font-bold text-zinc-900">Auditions</h1>
          </div>
          <p className="text-sm text-zinc-500">Track every audition · status pipeline · callback rate</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSendReminders}
            disabled={smsLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-sky-400 hover:text-sky-600">
            {smsLoading ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
            SMS Reminders
          </button>
          <button onClick={handleOpenAgent}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-sky-400 hover:text-sky-600">
            <Bot size={14} />
            Ask Audition Tracker
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 shadow-md shadow-sky-500/20">
            <Plus size={14} />
            New Audition
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total" value={counts.total} />
        <KpiCard label="Submitted" value={counts.submitted} accent="text-zinc-700" />
        <KpiCard label="Callbacks" value={counts.callback} accent="text-amber-600" />
        <KpiCard label="Booked" value={counts.booked} accent="text-emerald-600" />
        <KpiCard label="Callback Rate" value={`${callbackRate}%`} accent="text-sky-600" />
      </div>

      {/* Kanban */}
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {AUDITION_STAGES.map(stage => (
            <StageColumn
              key={stage}
              stage={stage}
              rows={auditions[stage] || []}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      <AddAuditionModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addAudition} />
    </div>
  );
};
