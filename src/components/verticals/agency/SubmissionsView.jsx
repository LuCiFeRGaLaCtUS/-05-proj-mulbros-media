import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send, Plus, X, ShieldCheck, Trash2, Bot, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../../App';
import { useSubmissions, SUBMISSION_STATUS_LABELS } from '../../../hooks/useSubmissions';
import { useRoster } from '../../../hooks/useRoster';
import { useIndustryContacts } from '../../../hooks/useIndustryContacts';
import { callAI, getApiKey } from '../../../utils/ai';
import { getAgentById } from '../../../config/agents';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const STATUS_COLORS = {
  draft:            'bg-zinc-100 text-zinc-700 border-zinc-200',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  sent:             'bg-sky-50 text-sky-700 border-sky-200',
  viewed:           'bg-violet-50 text-violet-700 border-violet-200',
  responded:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  no_response:      'bg-zinc-100 text-zinc-500 border-zinc-200',
};

const KpiCard = ({ label, value, accent = 'text-zinc-900' }) => (
  <div className="bg-white rounded-2xl p-4" style={CARD_STYLE}>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
      {label}
    </div>
    <div className={`text-2xl font-bold tabular-nums ${accent}`} style={{ fontFamily: 'var(--font-mono)' }}>{value}</div>
  </div>
);

const DraftModal = ({ open, onClose, onSave, roster, contacts }) => {
  const [form, setForm] = useState({
    talent_id:           '',
    casting_director_id: '',
    project_title:       '',
    role_name:           '',
    source_url:          '',
    draft_content:       '',
  });
  const [drafting, setDrafting] = useState(false);

  if (!open) return null;

  const handleAIDraft = async () => {
    if (!form.project_title.trim() || !form.role_name.trim()) {
      toast.error('Project + role required before AI draft.');
      return;
    }
    const talent = roster.find(t => t.id === form.talent_id);
    const cd = contacts.find(c => c.id === form.casting_director_id);
    if (!talent) {
      toast.error('Pick a talent first.');
      return;
    }
    setDrafting(true);
    try {
      const agent = getAgentById('agency-submission-drafter');
      const apiKey = getApiKey(agent.model);
      const messages = [{
        role: 'user',
        content: `Draft a submission email.
Talent: ${talent.talent_name}${talent.union_status ? ' · ' + talent.union_status : ''}
Disciplines: ${(talent.disciplines || []).join(', ') || 'n/a'}
Skills: ${(talent.skills || []).join(', ') || 'n/a'}
Bio: ${talent.bio || 'n/a'}

Project: ${form.project_title}
Role: ${form.role_name}
${cd ? `Casting Director: ${cd.name}${cd.company ? ' (' + cd.company + ')' : ''}` : ''}
${form.source_url ? `Source: ${form.source_url}` : ''}

Output a 100-150 word submission email. Direct, pro-formal, signal-only.`,
      }];
      const draft = await callAI(agent.systemPrompt, messages, apiKey, agent.model);
      setForm({ ...form, draft_content: draft });
      toast.success('Draft generated. Review before approving.');
    } catch (err) {
      console.error('submission-draft failed', err);
      toast.error(err.message || 'Could not draft.');
    } finally {
      setDrafting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.project_title.trim()) {
      toast.error('Project title required.');
      return;
    }
    const s = await onSave({ ...form, status: 'pending_approval' });
    if (s) {
      toast.success('Submission saved — pending approval.');
      onClose();
      setForm({ talent_id: '', casting_director_id: '', project_title: '', role_name: '', source_url: '', draft_content: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <div className="font-bold text-zinc-900">New Submission</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Talent</label>
              <select value={form.talent_id} onChange={(e) => setForm({ ...form, talent_id: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400">
                <option value="">— Select roster talent —</option>
                {roster.filter(t => t.status === 'active').map(t => (
                  <option key={t.id} value={t.id}>{t.talent_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Casting Director</label>
              <select value={form.casting_director_id} onChange={(e) => setForm({ ...form, casting_director_id: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400">
                <option value="">— Optional —</option>
                {contacts.filter(c => c.contact_type === 'casting_director').map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Project Title *</label>
              <input required type="text" value={form.project_title} onChange={(e) => setForm({ ...form, project_title: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Role</label>
              <input type="text" value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400"
                placeholder="Lead / Supporting / Day-player" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Source URL</label>
            <input type="url" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400"
              placeholder="Breakdown link, casting notice URL" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700">Draft Content</label>
              <button type="button" onClick={handleAIDraft}
                disabled={drafting}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-50 flex items-center gap-1">
                {drafting ? <><Loader2 size={11} className="animate-spin" /> Drafting…</> : '✨ AI draft this'}
              </button>
            </div>
            <textarea value={form.draft_content} onChange={(e) => setForm({ ...form, draft_content: e.target.value })}
              rows={8}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 font-mono"
              placeholder="Paste or draft the submission email here. Use AI draft to generate from talent + role fields above." />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <ShieldCheck size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-900">
              <span className="font-semibold">HITL gate active.</span> Saved as <span className="font-mono">pending_approval</span>. Approve from the list to mark sent (HITL ≠ auto-send today).
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600">Save Draft</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubmissionRow = ({ s, onApprove, onUpdate, onDelete }) => {
  const statusColor = STATUS_COLORS[s.status] || STATUS_COLORS.draft;
  return (
    <div className="group bg-white rounded-xl p-4 hover:shadow-md transition-shadow" style={CARD_STYLE}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm text-zinc-900 truncate">{s.project_title}</div>
          <div className="text-xs text-zinc-500 truncate">
            {s.role_name || 'no role'} · {s.roster?.talent_name || 'no talent'}
            {s.industry_contacts?.name && ` → ${s.industry_contacts.name}`}
          </div>
        </div>
        <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColor}`}>
          {SUBMISSION_STATUS_LABELS[s.status]}
        </div>
      </div>
      {s.draft_content && (
        <div className="bg-zinc-50 rounded-lg p-3 mt-2 text-xs text-zinc-700 max-h-32 overflow-auto font-mono whitespace-pre-wrap">
          {s.draft_content.slice(0, 600)}
          {s.draft_content.length > 600 && '…'}
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-100">
        {s.status === 'pending_approval' && (
          <button onClick={() => onApprove(s.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-600">
            <ShieldCheck size={11} /> Approve + Send
          </button>
        )}
        <select value={s.status} onChange={(e) => onUpdate(s.id, { status: e.target.value })}
          className="text-[11px] border border-zinc-200 rounded-md px-2 py-1 bg-white cursor-pointer">
          {Object.keys(SUBMISSION_STATUS_LABELS).map(k => (
            <option key={k} value={k}>{SUBMISSION_STATUS_LABELS[k]}</option>
          ))}
        </select>
        {s.source_url && (
          <a href={s.source_url} target="_blank" rel="noreferrer"
            className="text-[11px] text-zinc-500 hover:text-violet-600 flex items-center gap-1 ml-auto">
            <ExternalLink size={11} /> Source
          </a>
        )}
        <button onClick={() => confirm('Delete this submission?') && onDelete(s.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 transition ml-auto">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export const SubmissionsView = () => {
  const { profile } = useAppContext();
  const navigate = useNavigate();
  const { submissions, counts, addSubmission, updateSubmission, approveSubmission, deleteSubmission } = useSubmissions(profile?.id);
  const { roster } = useRoster(profile?.id);
  const { contacts } = useIndustryContacts(profile?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Send className="text-violet-600" size={20} />
            <h1 className="text-xl font-bold text-zinc-900">Submissions</h1>
          </div>
          <p className="text-sm text-zinc-500">Draft + send submissions to casting directors. HITL approval gate on every send.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { sessionStorage.setItem('agentchat.preselectedAgent', 'agency-submission-drafter'); navigate('/agents'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-violet-400 hover:text-violet-600">
            <Bot size={14} />
            Ask Drafter
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 shadow-md shadow-violet-500/20">
            <Plus size={14} />
            New Submission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total" value={counts.total} />
        <KpiCard label="Drafts" value={counts.draft} />
        <KpiCard label="Pending Approval" value={counts.pendingApproval} accent="text-amber-600" />
        <KpiCard label="Sent" value={counts.sent} accent="text-sky-600" />
        <KpiCard label="Responded" value={counts.responded} accent="text-emerald-600" />
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === 'all' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-700'}`}>
          All
        </button>
        {Object.keys(SUBMISSION_STATUS_LABELS).map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === k ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-700'}`}>
            {SUBMISSION_STATUS_LABELS[k]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-300">
          <Send className="mx-auto text-zinc-300 mb-3" size={32} />
          <div className="text-sm font-semibold text-zinc-700 mb-1">No submissions in this filter</div>
          <p className="text-xs text-zinc-500 mb-4">Pitch your roster to a casting director — every send goes through HITL approval.</p>
          <button onClick={() => setShowAdd(true)} className="text-sm font-semibold text-violet-600 hover:text-violet-700">
            + New submission
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(s => (
            <SubmissionRow key={s.id} s={s}
              onApprove={approveSubmission}
              onUpdate={updateSubmission}
              onDelete={deleteSubmission} />
          ))}
        </div>
      )}

      <DraftModal open={showAdd} onClose={() => setShowAdd(false)} onSave={addSubmission} roster={roster} contacts={contacts} />
    </div>
  );
};
