import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Palette, Plus, Bot, X, Loader2, Image as ImageIcon, DollarSign } from 'lucide-react';
import { useAppContext } from '../../App';
import { useVerticalPipeline } from '../../hooks/useVerticalPipeline';
import {
  CARD_STYLE, AmberBg, StatLabel, KpiCard, VerticalHeader, ToolsPanel, AgentTab,
} from './shared/VerticalShell';
import { PipelineKanban } from './shared/PipelineKanban';

const STAGES = ['Proposal', 'Jury', 'Accepted', 'Shipped', 'Sold'];
const STAGE_BADGE = {
  Proposal: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  Jury:     'bg-blue-50 text-blue-700 border-blue-200',
  Accepted: 'bg-amber-50 text-amber-700 border-amber-200',
  Shipped:  'bg-purple-50 text-purple-700 border-purple-200',
  Sold:     'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const TOOLS = [
  { name: 'Artwork Archive', url: 'https://artworkarchive.com',  desc: 'Inventory + business management' },
  { name: 'ArtHelper.ai',    url: 'https://arthelper.ai',        desc: 'AI marketing + pricing' },
  { name: 'Artsy',           url: 'https://artsy.net',           desc: 'Marketplace + gallery reach' },
  { name: 'RevArt',          url: 'https://revart.co',           desc: 'Collector CRM' },
  { name: 'Behance',         url: 'https://behance.net',         desc: 'Portfolio discoverability' },
  { name: 'Patreon',         url: 'https://patreon.com',         desc: 'Recurring fan income' },
];

const AddModal = ({ onClose, onSubmit }) => {
  const [f, setF] = useState({ title: '', medium: '', year: '', dimensions: '', price: '', venue: '', notes: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const save = async () => {
    if (!f.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    const saved = await onSubmit({
      ...f, title: f.title.trim(),
      year: f.year ? Number(f.year) : null,
      price: f.price ? Number(f.price) : null,
    });
    setSaving(false);
    if (saved) { toast.success('Artwork added'); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">Add Artwork</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={f.title} onChange={e => set('title', e.target.value)} placeholder="Title *"
            className="w-full text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <div className="grid grid-cols-3 gap-2">
            <input value={f.medium} onChange={e => set('medium', e.target.value)} placeholder="Medium"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input type="number" value={f.year} onChange={e => set('year', e.target.value)} placeholder="Year"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input type="number" value={f.price} onChange={e => set('price', e.target.value)} placeholder="Price USD"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <input value={f.dimensions} onChange={e => set('dimensions', e.target.value)} placeholder={`Dimensions (e.g. 36x48 in)`}
            className="w-full text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <input value={f.venue} onChange={e => set('venue', e.target.value)} placeholder="Venue / gallery / commission"
            className="w-full text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <input value={f.image_url} onChange={e => set('image_url', e.target.value)} placeholder="Image URL (optional)"
            className="w-full text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <textarea value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes" rows={2}
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
  { id: 'pipeline', label: 'Pipeline',     Icon: ImageIcon },
  { id: 'profile',  label: 'Profile',      Icon: Palette },
  { id: 'agent',    label: 'Career Agent', Icon: Bot },
];

export const ArtistView = () => {
  const { profile } = useAppContext();
  const [tab, setTab] = useState('pipeline');
  const [adding, setAdding] = useState(false);
  const answers = profile?.onboarding_data?.answers || {};

  const { rows, loading, add, move, remove } = useVerticalPipeline('artist_artworks', STAGES, profile?.id);

  const total    = STAGES.reduce((n, s) => n + (rows[s]?.length || 0), 0);
  const accepted = rows.Accepted?.length || 0;
  const sold     = rows.Sold?.length || 0;
  const soldValue = (rows.Sold || []).reduce((s, r) => s + (Number(r.price) || 0), 0);

  return (
    <div className="space-y-5">
      <VerticalHeader Icon={Palette}
        title="Visual Artist Studio"
        subtitle="Exhibition pipeline, commissions, grants, portfolio management for fine artists + illustrators."
        chips={[answers.medium, answers.career_stage, answers.representation].filter(Boolean)} />

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
            <KpiCard label="Total Works" value={total}    Icon={ImageIcon} />
            <KpiCard label="Accepted"    value={accepted} Icon={Palette} />
            <KpiCard label="Sold"        value={sold}     Icon={DollarSign} />
            <KpiCard label="Sold $"      value={soldValue >= 1000 ? `$${(soldValue/1000).toFixed(1)}K` : `$${soldValue}`} Icon={DollarSign} />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-900">Artworks Pipeline</div>
            <button onClick={() => setAdding(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Plus size={13} /> Add Artwork
            </button>
          </div>
          <PipelineKanban rows={rows} stages={STAGES} stageBadgeMap={STAGE_BADGE}
            onMove={move} onDelete={remove} loading={loading}
            renderCard={(r) => (
              <>
                <div className="text-xs font-semibold text-zinc-900 leading-snug">{r.title}</div>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-600 mt-0.5">
                  {r.medium && <span>{r.medium}</span>}
                  {r.year && <><span className="text-zinc-300">·</span><span>{r.year}</span></>}
                  {r.dimensions && <><span className="text-zinc-300">·</span><span>{r.dimensions}</span></>}
                </div>
                {r.venue && <div className="text-[11px] text-amber-700 mt-1 truncate">{r.venue}</div>}
                {r.price && <div className="text-[11px] font-mono font-semibold text-emerald-700 mt-0.5">${Number(r.price).toLocaleString()}</div>}
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
            <StatLabel Icon={Palette}>Artist profile</StatLabel>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Medium</div><div className="text-sm font-semibold text-zinc-900">{answers.medium || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Career stage</div><div className="text-sm font-semibold text-zinc-900">{answers.career_stage || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Representation</div><div className="text-sm font-semibold text-zinc-900">{answers.representation || '—'}</div></div>
              <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Region</div><div className="text-sm font-semibold text-zinc-900">{answers.region || '—'}</div></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'agent' && <AgentTab agentId="artist-career" />}
    </div>
  );
};
