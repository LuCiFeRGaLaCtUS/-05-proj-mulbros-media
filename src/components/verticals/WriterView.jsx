import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Bot, X, Loader2, Send, FileText } from 'lucide-react';
import { useAppContext } from '../../App';
import { useVerticalPipeline } from '../../hooks/useVerticalPipeline';
import {
  CARD_STYLE, AmberBg, StatLabel, KpiCard, VerticalHeader, ToolsPanel, AgentTab,
} from './shared/VerticalShell';
import { PipelineKanban } from './shared/PipelineKanban';

const STAGES = ['Drafting', 'Query', 'Full Request', 'Offer', 'Published'];
const STAGE_BADGE = {
  Drafting:       'bg-zinc-100 text-zinc-700 border-zinc-200',
  Query:          'bg-blue-50 text-blue-700 border-blue-200',
  'Full Request': 'bg-amber-50 text-amber-700 border-amber-200',
  Offer:          'bg-emerald-50 text-emerald-700 border-emerald-200',
  Published:      'bg-purple-50 text-purple-700 border-purple-200',
};

const TOOLS = [
  { name: 'BookBub',             url: 'https://bookbub.com',            desc: 'Reader promotions (high ROI)' },
  { name: 'NetGalley',           url: 'https://netgalley.com',          desc: 'Pre-launch pro reviews' },
  { name: 'StoryOrigin',         url: 'https://storyoriginapp.com',     desc: 'Reader marketing + ARCs' },
  { name: 'BookFunnel',          url: 'https://bookfunnel.com',         desc: 'Ebook delivery' },
  { name: 'Reedsy',              url: 'https://reedsy.com',             desc: 'Vetted editors + designers' },
  { name: 'Amazon KDP',          url: 'https://kdp.amazon.com',         desc: 'Self-publishing platform' },
  { name: 'Draft2Digital',       url: 'https://draft2digital.com',      desc: 'Wide ebook distribution' },
  { name: 'Substack',            url: 'https://substack.com',           desc: 'Newsletter platform' },
  { name: 'Goodreads',           url: 'https://goodreads.com',          desc: 'Reader community' },
  { name: 'Written Word Media',  url: 'https://writtenwordmedia.com',   desc: 'Book promotion' },
  { name: 'Duotrope',            url: 'https://duotrope.com',           desc: 'Literary journal tracking' },
  { name: 'BookSirens',          url: 'https://booksirens.com',         desc: 'ARC reviewer network' },
];

const AddModal = ({ onClose, onSubmit }) => {
  const [f, setF] = useState({ book_title: '', agent_name: '', agency: '', genre: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const save = async () => {
    if (!f.book_title.trim()) { toast.error('Book title required'); return; }
    setSaving(true);
    const saved = await onSubmit({ ...f, book_title: f.book_title.trim(), submitted_at: new Date().toISOString() });
    setSaving(false);
    if (saved) { toast.success('Query added'); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">Add Query</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={f.book_title} onChange={e => set('book_title', e.target.value)} placeholder="Book title *"
            className="w-full text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <div className="grid grid-cols-2 gap-2">
            <input value={f.agent_name} onChange={e => set('agent_name', e.target.value)} placeholder="Agent name"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input value={f.agency} onChange={e => set('agency', e.target.value)} placeholder="Agency"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <input value={f.genre} onChange={e => set('genre', e.target.value)} placeholder="Genre"
            className="w-full text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
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
  { id: 'pipeline', label: 'Queries',      Icon: Send },
  { id: 'profile',  label: 'Profile',      Icon: BookOpen },
  { id: 'agent',    label: 'Career Agent', Icon: Bot },
];

export const WriterView = () => {
  const { profile } = useAppContext();
  const [tab, setTab] = useState('pipeline');
  const [adding, setAdding] = useState(false);
  const answers = profile?.onboarding_data?.answers || {};

  const { rows, loading, add, move, remove } = useVerticalPipeline('writer_queries', STAGES, profile?.id);

  const total     = STAGES.reduce((n, s) => n + (rows[s]?.length || 0), 0);
  const querying  = rows.Query?.length || 0;
  const requests  = rows['Full Request']?.length || 0;
  const offers    = rows.Offer?.length || 0;

  return (
    <div className="space-y-5">
      <VerticalHeader Icon={BookOpen}
        title="Writer Studio"
        subtitle="Query tracker, ARC campaign planning, publishing + promo tools for fiction + nonfiction authors."
        chips={[answers.genre, answers.path, answers.stage].filter(Boolean)} />

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
            <KpiCard label="Total Queries"  value={total}    Icon={FileText} />
            <KpiCard label="In Query"       value={querying} Icon={Send} />
            <KpiCard label="Full Requests"  value={requests} Icon={BookOpen} />
            <KpiCard label="Offers"         value={offers}   Icon={Bot} />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-900">Query Pipeline</div>
            <button onClick={() => setAdding(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Plus size={13} /> Add Query
            </button>
          </div>
          <PipelineKanban rows={rows} stages={STAGES} stageBadgeMap={STAGE_BADGE}
            onMove={move} onDelete={remove} loading={loading}
            renderCard={(r) => (
              <>
                <div className="text-xs font-semibold text-zinc-900 leading-snug">{r.book_title}</div>
                {r.agent_name && <div className="text-[11px] text-zinc-500 mt-0.5">{r.agent_name}</div>}
                <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-600 mt-0.5">
                  {r.agency && <span>{r.agency}</span>}
                  {r.genre && <><span className="text-zinc-300">·</span><span>{r.genre}</span></>}
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
            <StatLabel Icon={BookOpen}>Writer profile</StatLabel>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Genre</div><div className="text-sm font-semibold text-zinc-900">{answers.genre || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Path</div><div className="text-sm font-semibold text-zinc-900">{answers.path || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Stage</div><div className="text-sm font-semibold text-zinc-900">{answers.stage || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Email list size</div><div className="text-sm font-semibold text-zinc-900">{answers.list_size || '—'}</div></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'agent' && <AgentTab agentId="writer-career" />}
    </div>
  );
};
