import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Plus, Bot, X, Loader2, FileText, DollarSign, Calendar } from 'lucide-react';
import { useAppContext } from '../../App';
import { useVerticalPipeline } from '../../hooks/useVerticalPipeline';
import {
  CARD_STYLE, AmberBg, StatLabel, KpiCard, VerticalHeader, ToolsPanel, AgentTab,
} from './shared/VerticalShell';
import { PipelineKanban } from './shared/PipelineKanban';

const STAGES = ['Draft', 'Submitted', 'Funded', 'In Progress', 'Complete'];
const STAGE_BADGE = {
  Draft:         'bg-zinc-100 text-zinc-700 border-zinc-200',
  Submitted:     'bg-blue-50 text-blue-700 border-blue-200',
  Funded:        'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-purple-50 text-purple-700 border-purple-200',
  Complete:      'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const TOOLS = [
  { name: 'Capacity Interactive',  url: 'https://capacityinteractive.com', desc: 'Digital marketing agency + benchmarks' },
  { name: 'Audience Access 360',   url: 'https://audienceaccess.co',       desc: 'Patron engagement platform' },
  { name: 'SymphonyOS',            url: 'https://symphonyos.co',           desc: 'Arts marketing automation' },
  { name: 'Optimize.art',          url: 'https://optimize.art',            desc: 'Arts-specific marketing' },
  { name: 'Candid',                url: 'https://candid.org',              desc: 'Grant database (formerly Foundation Ctr)' },
  { name: 'NEA',                   url: 'https://arts.gov',                desc: 'National Endowment for the Arts' },
  { name: 'Mailchimp',             url: 'https://mailchimp.com',           desc: 'Email campaigns' },
  { name: 'Eventbrite',            url: 'https://eventbrite.com',          desc: 'Ticketing' },
  { name: 'GrantStation',          url: 'https://grantstation.com',        desc: 'Grant opportunity alerts' },
];

const AddModal = ({ onClose, onSubmit }) => {
  const [f, setF] = useState({ title: '', funder: '', amount_requested: '', category: 'Grant', deadline: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const save = async () => {
    if (!f.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    const saved = await onSubmit({
      ...f, title: f.title.trim(),
      amount_requested: f.amount_requested ? Number(f.amount_requested) : null,
      deadline: f.deadline || null,
    });
    setSaving(false);
    if (saved) { toast.success('Grant added'); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">Add Grant / Initiative</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={f.title} onChange={e => set('title', e.target.value)} placeholder="Title *"
            className="w-full text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <input value={f.funder} onChange={e => set('funder', e.target.value)} placeholder="Funder / Foundation"
            className="w-full text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <div className="grid grid-cols-3 gap-2">
            <select value={f.category} onChange={e => set('category', e.target.value)}
              className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
              {['Grant', 'Campaign', 'Sponsor', 'Earned', 'Individual'].map(o => <option key={o}>{o}</option>)}
            </select>
            <input type="number" value={f.amount_requested} onChange={e => set('amount_requested', e.target.value)} placeholder="Amount USD"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input type="date" value={f.deadline} onChange={e => set('deadline', e.target.value)}
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <textarea value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes" rows={3}
            className="w-full text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y" />
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} className="text-sm text-zinc-700 px-4 py-2 hover:text-zinc-900">Cancel</button>
          <button onClick={save} disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1.5">
            {saving && <Loader2 size={12} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
};

const TABS = [
  { id: 'pipeline', label: 'Grants',        Icon: FileText },
  { id: 'profile',  label: 'Org Profile',   Icon: Building2 },
  { id: 'agent',    label: 'Ops Agent',     Icon: Bot },
];

export const ArtsOrgView = () => {
  const { profile } = useAppContext();
  const [tab, setTab] = useState('pipeline');
  const [adding, setAdding] = useState(false);
  const answers = profile?.onboarding_data?.answers || {};

  const { rows, loading, add, move, remove } = useVerticalPipeline('artsorg_grants', STAGES, profile?.id);

  const total      = STAGES.reduce((n, s) => n + (rows[s]?.length || 0), 0);
  const submitted  = rows.Submitted?.length || 0;
  const funded     = rows.Funded?.length || 0;
  const fundedUsd  = [...(rows.Funded || []), ...(rows['In Progress'] || []), ...(rows.Complete || [])]
    .reduce((s, r) => s + (Number(r.amount_awarded || r.amount_requested) || 0), 0);

  return (
    <div className="space-y-5">
      <VerticalHeader Icon={Building2}
        title="Arts Organization Hub"
        subtitle="Grants tracker, donor outreach, audience development, and earned-income planning for nonprofit arts orgs."
        chips={[answers.org_type, answers.budget_size, answers.region].filter(Boolean)} />

      <div className="border-b border-zinc-200">
        <div className="flex gap-4">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 flex items-center gap-1.5 ${
                tab === id ? 'text-amber-600 border-amber-500' : 'text-zinc-500 border-transparent hover:text-zinc-800'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'pipeline' && (
        <div className="space-y-5 animate-hud-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Initiatives" value={total}     Icon={FileText} />
            <KpiCard label="Submitted"         value={submitted} Icon={Calendar} />
            <KpiCard label="Funded"            value={funded}    Icon={DollarSign} />
            <KpiCard label="Funded $"          value={fundedUsd >= 1000 ? `$${(fundedUsd/1000).toFixed(1)}K` : `$${fundedUsd}`} Icon={DollarSign} />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-900">Grants + Initiatives Pipeline</div>
            <button onClick={() => setAdding(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Plus size={13} /> Add Grant
            </button>
          </div>
          <PipelineKanban rows={rows} stages={STAGES} stageBadgeMap={STAGE_BADGE}
            onMove={move} onDelete={remove} loading={loading}
            renderCard={(r) => (
              <>
                <div className="text-xs font-semibold text-zinc-900 leading-snug">{r.title}</div>
                {r.funder && <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{r.funder}</div>}
                <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-600 mt-0.5">
                  {r.category && <span>{r.category}</span>}
                  {r.amount_requested && <><span className="text-zinc-300">·</span><span className="font-mono">${Number(r.amount_requested).toLocaleString()}</span></>}
                </div>
                {r.deadline && <div className="text-[11px] text-amber-700 mt-1">Due {r.deadline}</div>}
              </>
            )} />
          <ToolsPanel tools={TOOLS} />
          {adding && <AddModal onClose={() => setAdding(false)} onSubmit={add} />}
        </div>
      )}

      {tab === 'profile' && (
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={Building2}>Organization profile</StatLabel>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Org type</div><div className="text-sm font-semibold text-zinc-900">{answers.org_type || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Budget size</div><div className="text-sm font-semibold text-zinc-900">{answers.budget_size || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Region</div><div className="text-sm font-semibold text-zinc-900">{answers.region || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Staff size</div><div className="text-sm font-semibold text-zinc-900">{answers.staff || '—'}</div></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'agent' && <AgentTab agentId="artsorg-ops" />}
    </div>
  );
};
