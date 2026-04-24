import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ScrollText, Plus, Bot, X, Loader2, FileText, Send } from 'lucide-react';
import { useAppContext } from '../../App';
import { useVerticalPipeline } from '../../hooks/useVerticalPipeline';
import {
  CARD_STYLE, AmberBg, StatLabel, KpiCard, VerticalHeader, ToolsPanel, AgentTab,
} from './shared/VerticalShell';
import { PipelineKanban } from './shared/PipelineKanban';

const STAGES = ['Drafting', 'Querying', 'Requested', 'Optioned', 'Produced'];
const STAGE_BADGE = {
  Drafting:  'bg-zinc-100 text-zinc-700 border-zinc-200',
  Querying:  'bg-blue-50 text-blue-700 border-blue-200',
  Requested: 'bg-amber-50 text-amber-700 border-amber-200',
  Optioned:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Produced:  'bg-purple-50 text-purple-700 border-purple-200',
};

const TOOLS = [
  { name: 'Stage 32',  url: 'https://stage32.com',      desc: 'Industry pitching + networking' },
  { name: 'InkTip',    url: 'https://inktip.com',       desc: 'Script marketplace — producers hunt here' },
  { name: 'ISA',       url: 'https://networkisa.org',   desc: 'International Screenwriters Assn' },
  { name: 'Duotrope',  url: 'https://duotrope.com',     desc: 'Submission + contest tracking' },
  { name: 'Coverfly',  url: 'https://coverfly.com',     desc: 'Contest coverage + exec reviews' },
  { name: 'BlackList', url: 'https://blcklst.com',      desc: 'Script hosting + buyer discovery' },
];

const AddModal = ({ onClose, onSubmit }) => {
  const [f, setF] = useState({ title: '', logline: '', genre: '', format: 'Feature', length_pages: '', target: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const save = async () => {
    if (!f.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    const saved = await onSubmit({
      ...f, title: f.title.trim(),
      length_pages: f.length_pages ? Number(f.length_pages) : null,
    });
    setSaving(false);
    if (saved) { toast.success('Script added'); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">Add Script</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={f.title} onChange={e => set('title', e.target.value)} placeholder="Title *"
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <textarea value={f.logline} onChange={e => set('logline', e.target.value)} placeholder="Logline" rows={2}
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y" />
          <div className="grid grid-cols-3 gap-2">
            <input value={f.genre} onChange={e => set('genre', e.target.value)} placeholder="Genre"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <select value={f.format} onChange={e => set('format', e.target.value)}
              className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
              {['Feature', 'Pilot', 'Short', 'Limited Series', 'Spec'].map(o => <option key={o}>{o}</option>)}
            </select>
            <input type="number" value={f.length_pages} onChange={e => set('length_pages', e.target.value)} placeholder="Pages"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <input value={f.target} onChange={e => set('target', e.target.value)} placeholder="Target (manager / prodco / contest)"
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <textarea value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes" rows={2}
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y" />
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
  { id: 'pipeline', label: 'Pipeline',    Icon: FileText },
  { id: 'profile',  label: 'Profile',     Icon: ScrollText },
  { id: 'agent',    label: 'Career Agent', Icon: Bot },
];

export const ScreenwriterView = () => {
  const { profile } = useAppContext();
  const [tab, setTab] = useState('pipeline');
  const [adding, setAdding] = useState(false);
  const answers = profile?.onboarding_data?.answers || {};

  const { rows, loading, add, move, remove } = useVerticalPipeline('screenwriter_scripts', STAGES, profile?.id);

  const total      = STAGES.reduce((n, s) => n + (rows[s]?.length || 0), 0);
  const querying   = rows.Querying?.length || 0;
  const requested  = rows.Requested?.length || 0;
  const optioned   = rows.Optioned?.length || 0;

  return (
    <div className="space-y-5">
      <VerticalHeader Icon={ScrollText}
        title="Screenwriter Studio"
        subtitle="Query tracking, pitch discovery, manager/agent outreach for working + aspiring screenwriters."
        chips={[answers.genre_focus, answers.experience, answers.format].filter(Boolean)} />

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
            <KpiCard label="Total Scripts" value={total}     Icon={FileText} />
            <KpiCard label="Querying"      value={querying}  Icon={Send} />
            <KpiCard label="Requested"     value={requested} Icon={Bot} />
            <KpiCard label="Optioned"      value={optioned}  Icon={ScrollText} />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-900">Scripts Pipeline</div>
            <button onClick={() => setAdding(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Plus size={13} /> Add Script
            </button>
          </div>
          <PipelineKanban rows={rows} stages={STAGES} stageBadgeMap={STAGE_BADGE}
            onMove={move} onDelete={remove} loading={loading}
            renderCard={(r) => (
              <>
                <div className="text-xs font-semibold text-zinc-900 leading-snug">{r.title}</div>
                {r.logline && <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{r.logline}</div>}
                <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-600 mt-1">
                  {r.genre && <span>{r.genre}</span>}
                  {r.format && <><span className="text-zinc-300">·</span><span>{r.format}</span></>}
                  {r.target && <><span className="text-zinc-300">·</span><span className="truncate max-w-[100px]">{r.target}</span></>}
                </div>
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
            <StatLabel Icon={ScrollText}>Writer profile</StatLabel>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Genre focus</div><div className="text-sm font-semibold text-zinc-900">{answers.genre_focus || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Experience</div><div className="text-sm font-semibold text-zinc-900">{answers.experience || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Format</div><div className="text-sm font-semibold text-zinc-900">{answers.format || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">WGA status</div><div className="text-sm font-semibold text-zinc-900">{answers.wga || '—'}</div></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'agent' && <AgentTab agentId="screenwriter-career" />}
    </div>
  );
};
