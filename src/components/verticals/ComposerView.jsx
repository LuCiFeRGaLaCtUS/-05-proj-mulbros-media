import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragOverlay, useDraggable, useDroppable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import {
  Piano, Send, Sparkles, Bot, Loader2, X, ExternalLink, GripVertical, Trash2,
  Film, Calendar as CalendarIcon, Mail, DollarSign, Plus, Upload, Link as LinkIcon,
  Briefcase,
} from 'lucide-react';
import { useAppContext } from '../../App';
import { useComposerProjects } from '../../hooks/useComposerProjects';
import {
  composerOpportunitiesMock, COMPOSER_GENRES, COMPOSER_PLATFORMS, COMPOSER_BUDGETS,
  COMPOSER_PROJECT_STAGES,
} from '../../config/composerOpportunitiesMock';
import { callAIFast } from '../../utils/ai';
import { getAgentById } from '../../config/agents';
import { TiltCard } from '../ui/TiltCard';
import { logger } from '../../lib/logger';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const AmberBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-100 blur-xl rounded-full pointer-events-none" />
  </>
);

const StatLabel = ({ children, Icon }) => (
  <div
    style={{ fontFamily: 'var(--font-mono)' }}
    className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5"
  >
    {Icon && <Icon size={10} />}
    {children}
  </div>
);

const StatNumber = ({ children }) => (
  <div
    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
    className="text-[1.65rem] font-bold text-zinc-900 leading-none tabular-nums"
  >
    {children}
  </div>
);

const budgetLabel = (id) => COMPOSER_BUDGETS.find(b => b.id === id)?.range || id;

// ── Sync platforms panel ──────────────────────────────────────────────────────
const SYNC_PLATFORMS = [
  { name: 'Epidemic Sound',  url: 'https://epidemicsound.com',  desc: 'Sync licensing marketplace' },
  { name: 'Audio Network',   url: 'https://audionetwork.com',   desc: 'Broadcast sync licensing' },
  { name: 'Marmoset',        url: 'https://marmosetmusic.com',  desc: 'Boutique curated sync' },
  { name: 'SoundBetter',     url: 'https://soundbetter.com',    desc: 'Custom scoring jobs' },
  { name: 'Score a Score',   url: 'https://scoreascore.com',    desc: 'Managed composer matching' },
  { name: 'ASCAP',           url: 'https://ascap.com',          desc: 'Performing rights + royalties' },
  { name: 'BMI',             url: 'https://bmi.com',            desc: 'Performing rights + royalties' },
  { name: 'Scorefolio',      url: 'https://scorefol.io',        desc: 'Composer portfolio' },
  { name: 'Stage 32',        url: 'https://stage32.com',        desc: 'Industry networking + pitching' },
];

// ═════════════════════════════════════════════════════════════════════════════
// TAB 1 — SYNC LICENSING DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

const OpportunityCard = ({ opp, onPitch }) => (
  <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
    <AmberBg />
    <div className="relative z-10">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-500 font-medium">{opp.platform}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-xs text-zinc-500">{opp.genre}</span>
          </div>
          <h3 className="text-base font-bold text-zinc-900 leading-snug">{opp.title}</h3>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
          {budgetLabel(opp.budget)}
        </span>
      </div>

      <p className="text-xs text-zinc-600 leading-relaxed mb-2">{opp.description}</p>
      <div className="text-[11px] text-zinc-500 mb-3"><span className="font-medium text-zinc-700">Style:</span> {opp.style}</div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1"><CalendarIcon size={10} /> Due {opp.deadline}</span>
        </div>
        <button
          onClick={() => onPitch(opp)}
          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Send size={11} /> Pitch Music
        </button>
      </div>
    </div>
  </div>
);

const PitchModal = ({ opp, onClose, onSubmit }) => {
  const { profile } = useAppContext();
  const answers = profile?.onboarding_data?.answers || {};
  const [trackLink, setTrackLink] = useState('');
  const [email, setEmail]         = useState('');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const system = 'You write concise, professional cold emails from composers pitching a specific track for a specific production. Keep it under 160 words. Open with a personal hook tied to the project\'s style brief. Mention 1 relevant credit or speciality. End with a link to the track and a direct CTA.';
      const userCtx = [
        `Opportunity: "${opp.title}" (${opp.platform} · ${opp.genre})`,
        `Style brief: ${opp.style}`,
        `Description: ${opp.description}`,
        `Composer: ${profile?.display_name || profile?.email || 'composer'}`,
        answers.speciality && `Composer speciality: ${answers.speciality}`,
        answers.credits    && `Credits: ${answers.credits}`,
        answers.daw        && `DAW: ${answers.daw}`,
        trackLink          && `Track link: ${trackLink}`,
      ].filter(Boolean).join('\n');
      const text = await callAIFast(system, [{ role: 'user', content: userCtx }]);
      setEmail(text.trim());
    } catch (err) {
      logger.error('ComposerView.pitch.generate.failed', err);
      toast.error('Could not generate pitch email. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    const saved = await onSubmit({
      title:        opp.title,
      director:     null,
      platform:     opp.platform,
      genre:        opp.genre,
      budget_range: budgetLabel(opp.budget),
      status:       'Pitching',
      notes:        email,
      metadata:     { opp_id: opp.id, track_link: trackLink, contact: opp.contact },
    });
    setSubmitting(false);
    if (saved) {
      toast.success('Pitch saved to pipeline');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={CARD_STYLE}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-zinc-200">
          <div>
            <div className="text-xs text-zinc-500 mb-0.5">{opp.platform} · {opp.genre}</div>
            <h2 className="text-lg font-bold text-zinc-900">{opp.title}</h2>
            <div className="text-xs text-zinc-600 mt-1"><span className="font-medium">Style:</span> {opp.style}</div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1"><LinkIcon size={10} /> Track Link (SoundCloud / Vimeo / Dropbox)</div>
            <input
              value={trackLink}
              onChange={e => setTrackLink(e.target.value)}
              placeholder="https://soundcloud.com/you/track"
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50"
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <StatLabel>Pitch Email</StatLabel>
              <button
                onClick={generate}
                disabled={generating}
                className="flex items-center gap-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {generating
                  ? <><Loader2 size={11} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={11} /> AI Generate</>}
              </button>
            </div>
            <textarea
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Write your pitch email, or click AI Generate to draft one tied to this opportunity's style brief."
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y"
              rows={10}
            />
          </div>

          <div className="text-xs text-zinc-500 flex items-center gap-1">
            <Mail size={11} /> Contact: <span className="font-medium text-zinc-700">{opp.contact}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} className="text-sm text-zinc-700 px-4 py-2 hover:text-zinc-900">Cancel</button>
          <button
            onClick={submit}
            disabled={submitting || !email.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Save Pitch
          </button>
        </div>
      </div>
    </div>
  );
};

const SyncDashboardTab = ({ projects, addProject }) => {
  const [genre, setGenre]       = useState('');
  const [platform, setPlatform] = useState('');
  const [budget, setBudget]     = useState('');
  const [activeOpp, setActiveOpp] = useState(null);

  const filtered = useMemo(() => composerOpportunitiesMock.filter(o => {
    if (genre    && o.genre    !== genre)    return false;
    if (platform && o.platform !== platform) return false;
    if (budget   && o.budget   !== budget)   return false;
    return true;
  }), [genre, platform, budget]);

  const activePitches = projects.Pitching?.length || 0;
  const placements    = projects.Delivered?.length || 0;
  const inScoring     = projects.Scoring?.length || 0;
  const pipelineDeals = (projects['In Consideration']?.length || 0) + (projects.Contract?.length || 0);

  return (
    <div className="space-y-5 animate-hud-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={Send}>Active Pitches</StatLabel>
            <StatNumber>{activePitches}</StatNumber>
          </div>
        </div>
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={Film}>Sync Placements</StatLabel>
            <StatNumber>{placements}</StatNumber>
          </div>
        </div>
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={DollarSign}>Pipeline Deals</StatLabel>
            <StatNumber>{pipelineDeals}</StatNumber>
          </div>
        </div>
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={Piano}>In Scoring</StatLabel>
            <StatNumber>{inScoring}</StatNumber>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tile-pop bg-white rounded-2xl p-4" style={CARD_STYLE}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-1">Filters:</span>
          <select value={genre} onChange={e => setGenre(e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
            <option value="">All genres</option>
            {COMPOSER_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={platform} onChange={e => setPlatform(e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
            <option value="">Any platform</option>
            {COMPOSER_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={budget} onChange={e => setBudget(e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
            <option value="">Any budget</option>
            {COMPOSER_BUDGETS.map(b => <option key={b.id} value={b.id}>{b.label} · {b.range}</option>)}
          </select>
          {(genre || platform || budget) && (
            <button
              onClick={() => { setGenre(''); setPlatform(''); setBudget(''); }}
              className="text-xs text-zinc-500 hover:text-amber-700 flex items-center gap-1 px-2"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Opportunity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(opp => <OpportunityCard key={opp.id} opp={opp} onPitch={setActiveOpp} />)}
        {filtered.length === 0 && (
          <div className="col-span-full tile-pop bg-white rounded-2xl p-8 text-center" style={CARD_STYLE}>
            <p className="text-sm text-zinc-600">No opportunities match these filters.</p>
          </div>
        )}
      </div>

      {/* Recommended sync platforms */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel>Recommended sync platforms</StatLabel>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {SYNC_PLATFORMS.map(t => (
              <a key={t.name} href={t.url} target="_blank" rel="noreferrer"
                className="group relative bg-white rounded-xl p-3 border border-zinc-200 hover:border-amber-500/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-sm font-semibold text-zinc-900">{t.name}</div>
                  <ExternalLink size={12} className="text-zinc-400 group-hover:text-amber-600 flex-shrink-0 mt-0.5" />
                </div>
                <div className="text-xs text-zinc-500 leading-snug">{t.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {activeOpp && <PitchModal opp={activeOpp} onClose={() => setActiveOpp(null)} onSubmit={addProject} />}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TAB 2 — PROJECTS PIPELINE (Kanban)
// ═════════════════════════════════════════════════════════════════════════════

const STAGE_BADGE = {
  'Pitching':         'bg-zinc-100 text-zinc-700 border-zinc-200',
  'In Consideration': 'bg-blue-50 text-blue-700 border-blue-200',
  'Contract':         'bg-amber-50 text-amber-700 border-amber-200',
  'Scoring':          'bg-purple-50 text-purple-700 border-purple-200',
  'Delivered':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Archived':         'bg-zinc-50 text-zinc-500 border-zinc-200',
};

const ProjDraggable = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)`, zIndex: 999, position: 'relative' } : undefined}
      className={`transition-opacity ${isDragging ? 'opacity-30' : ''} cursor-grab active:cursor-grabbing`}
    >
      {children}
    </div>
  );
};

const ProjDroppable = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[72px] rounded-xl p-1 -m-1 transition-all ${isOver ? 'bg-amber-50 ring-1 ring-amber-300' : ''}`}>
      {children}
    </div>
  );
};

const ProjectCard = ({ project, onDelete }) => (
  <div className="relative bg-white rounded-xl p-3 overflow-hidden group" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="relative z-10">
      <div className="flex items-start gap-1.5 mb-1">
        <GripVertical size={12} className="text-zinc-600 flex-shrink-0 mt-0.5 cursor-grab" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-zinc-900 leading-snug">{project.title}</div>
          {project.director && <div className="text-[11px] text-zinc-500 mt-0.5">{project.director}</div>}
        </div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 transition p-0.5"
          aria-label="Delete project"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-4 text-[11px] text-zinc-600">
        {project.platform && <span>{project.platform}</span>}
        {project.genre && <><span className="text-zinc-300">·</span><span>{project.genre}</span></>}
      </div>
      {project.budget_range && (
        <div className="pl-4 text-[11px] text-amber-700 font-medium mt-1">{project.budget_range}</div>
      )}
    </div>
  </div>
);

const AddProjectModal = ({ onClose, onSubmit }) => {
  const [title, setTitle]         = useState('');
  const [director, setDirector]   = useState('');
  const [platform, setPlatform]   = useState('');
  const [genre, setGenre]         = useState('');
  const [budgetRange, setBudget]  = useState('');
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);

  const submit = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    const saved = await onSubmit({
      title: title.trim(),
      director: director.trim(),
      platform,
      genre,
      budget_range: budgetRange,
      notes: notes.trim(),
      status: 'Pitching',
    });
    setSaving(false);
    if (saved) { toast.success('Project added'); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">Add Project</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Project title *"
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <input value={director} onChange={e => setDirector(e.target.value)} placeholder="Director / contact"
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <div className="grid grid-cols-3 gap-2">
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
              <option value="">Platform</option>
              {COMPOSER_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={genre} onChange={e => setGenre(e.target.value)}
              className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
              <option value="">Genre</option>
              {COMPOSER_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={budgetRange} onChange={e => setBudget(e.target.value)}
              className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
              <option value="">Budget</option>
              {COMPOSER_BUDGETS.map(b => <option key={b.id} value={b.range}>{b.range}</option>)}
            </select>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes"
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y" rows={3} />
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} className="text-sm text-zinc-700 px-4 py-2 hover:text-zinc-900">Cancel</button>
          <button onClick={submit} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectsPipelineTab = ({ projects, moveProject, deleteProject, addProject, loading }) => {
  const [activeId, setActiveId] = useState(null);
  const [adding, setAdding] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const dragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    let fromStatus = null;
    for (const s of COMPOSER_PROJECT_STAGES) {
      if ((projects[s] || []).some(p => p.id === active.id)) { fromStatus = s; break; }
    }
    if (fromStatus && fromStatus !== over.id) moveProject(active.id, fromStatus, over.id);
  };

  const draggedProj = activeId
    ? COMPOSER_PROJECT_STAGES.flatMap(s => projects[s] || []).find(p => p.id === activeId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        Loading projects…
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-hud-in">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">Projects Pipeline</div>
        <button
          onClick={() => setAdding(true)}
          className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          <Plus size={13} /> Add Project
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={({ active }) => setActiveId(active.id)} onDragEnd={dragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {COMPOSER_PROJECT_STAGES.map(stage => {
            const items = projects[stage] || [];
            return (
              <div key={stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${STAGE_BADGE[stage]}`}>{stage}</span>
                  <span className="text-xs font-mono text-zinc-500">{items.length}</span>
                </div>
                <ProjDroppable id={stage}>
                  {items.map(p => (
                    <ProjDraggable key={p.id} id={p.id}>
                      <ProjectCard project={p} onDelete={() => deleteProject(p.id)} />
                    </ProjDraggable>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-zinc-200 p-3 text-center text-[11px] text-zinc-500">
                      Drop here
                    </div>
                  )}
                </ProjDroppable>
              </div>
            );
          })}
        </div>
        <DragOverlay modifiers={[snapCenterToCursor]}>
          {draggedProj ? (
            <div className="relative bg-white rounded-xl p-3 shadow-lg rotate-1 scale-105" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="text-xs font-semibold text-zinc-900">{draggedProj.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {adding && <AddProjectModal onClose={() => setAdding(false)} onSubmit={addProject} />}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TAB 3 — PORTFOLIO & CREDITS
// ═════════════════════════════════════════════════════════════════════════════

const PORTFOLIO_TOOLS = [
  { name: 'Scorefolio',   url: 'https://scorefol.io',      desc: 'Composer portfolio' },
  { name: 'SoundCloud',   url: 'https://soundcloud.com',   desc: 'Demo reel hosting' },
  { name: 'Vimeo',        url: 'https://vimeo.com',        desc: 'Showreel w/ picture' },
  { name: 'IMDbPro',      url: 'https://pro.imdb.com',     desc: 'Credits database' },
  { name: 'Stage 32',     url: 'https://stage32.com',      desc: 'Industry networking' },
];

const PortfolioTab = ({ userAnswers, profile, updateProfile }) => {
  const meta = profile?.metadata || {};
  const [credits, setCredits]    = useState(meta.composer_credits || []);
  const [soundcloud, setSc]      = useState(meta.composer_soundcloud || '');
  const [vimeo, setVimeo]        = useState(meta.composer_vimeo || '');
  const [scorefolio, setScorefolio] = useState(meta.composer_scorefolio || '');
  const [imdbpro, setImdbpro]    = useState(meta.composer_imdbpro || '');
  const [bio, setBio]            = useState(meta.composer_bio || '');
  const [newCredit, setNewCredit] = useState({ title: '', role: '', year: '', platform: '' });
  const [generatingBio, setGenBio] = useState(false);
  const [saving, setSaving]      = useState(false);

  const addCredit = () => {
    if (!newCredit.title.trim()) { toast.error('Title required'); return; }
    setCredits(prev => [...prev, { ...newCredit, id: crypto.randomUUID() }]);
    setNewCredit({ title: '', role: '', year: '', platform: '' });
  };

  const removeCredit = (id) => setCredits(prev => prev.filter(c => c.id !== id));

  const generateBio = async () => {
    setGenBio(true);
    try {
      const system = 'You write professional, concise composer bios. 120-160 words. Third person. Emphasize speciality, scoring philosophy, and credits when supplied. Avoid cliché ("award-winning" without specifics). No invented credits.';
      const ctx = [
        `Composer: ${profile?.display_name || profile?.email || 'the composer'}`,
        userAnswers.speciality && `Speciality: ${userAnswers.speciality}`,
        userAnswers.credits    && `Credits bucket: ${userAnswers.credits}`,
        userAnswers.daw        && `Primary DAW: ${userAnswers.daw}`,
        userAnswers.seeking    && `Currently seeking: ${userAnswers.seeking}`,
        credits.length > 0 && 'Real credits:\n' + credits.map(c => `- ${c.title}${c.role ? ` (${c.role})` : ''}${c.year ? ` ${c.year}` : ''}${c.platform ? ` [${c.platform}]` : ''}`).join('\n'),
      ].filter(Boolean).join('\n');
      const text = await callAIFast(system, [{ role: 'user', content: ctx }]);
      setBio(text.trim());
    } catch (err) {
      logger.error('ComposerView.bio.generate.failed', err);
      toast.error('Could not generate bio.');
    } finally {
      setGenBio(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const next_meta = {
      ...meta,
      composer_credits:    credits,
      composer_soundcloud: soundcloud,
      composer_vimeo:      vimeo,
      composer_scorefolio: scorefolio,
      composer_imdbpro:    imdbpro,
      composer_bio:        bio,
    };
    const { error } = await updateProfile({ metadata: next_meta });
    setSaving(false);
    if (error) toast.error('Could not save portfolio'); else toast.success('Portfolio saved');
  };

  const exportPdf = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text((profile?.display_name || 'Composer Portfolio'), 20, 20);
      doc.setFontSize(11);
      let y = 32;
      const line = (k, v) => { if (v) { doc.text(`${k}: ${v}`, 20, y); y += 7; } };
      line('Speciality',  userAnswers.speciality);
      line('DAW',         userAnswers.daw);
      line('Seeking',     userAnswers.seeking);
      y += 4;
      if (bio) {
        doc.setFontSize(12); doc.text('Bio', 20, y); y += 7;
        doc.setFontSize(10);
        const split = doc.splitTextToSize(bio, 170);
        split.forEach(row => { if (y > 270) { doc.addPage(); y = 20; } doc.text(row, 20, y); y += 5; });
        y += 4;
      }
      if (credits.length > 0) {
        doc.setFontSize(12); doc.text('Credits', 20, y); y += 7;
        doc.setFontSize(10);
        credits.forEach(c => {
          const t = `${c.title}${c.role ? ` — ${c.role}` : ''}${c.year ? ` (${c.year})` : ''}${c.platform ? ` · ${c.platform}` : ''}`;
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`• ${t}`, 22, y);
          y += 6;
        });
      }
      doc.save(`composer-portfolio-${(profile?.display_name || 'me').replace(/\s+/g,'-')}.pdf`);
    } catch (err) {
      logger.error('ComposerView.portfolio.pdf.failed', err);
      toast.error('Could not export PDF');
    }
  };

  return (
    <div className="space-y-5 animate-hud-in">
      {/* Credits table */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel Icon={Film}>Credits</StatLabel>
          {credits.length > 0 ? (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-zinc-500 border-b border-zinc-200">
                    <th className="text-left py-2 px-2 font-medium">Title</th>
                    <th className="text-left py-2 px-2 font-medium">Role</th>
                    <th className="text-left py-2 px-2 font-medium">Year</th>
                    <th className="text-left py-2 px-2 font-medium">Platform</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {credits.map(c => (
                    <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="py-2 px-2 text-zinc-900 font-medium">{c.title}</td>
                      <td className="py-2 px-2 text-zinc-700">{c.role || '—'}</td>
                      <td className="py-2 px-2 text-zinc-700">{c.year || '—'}</td>
                      <td className="py-2 px-2 text-zinc-700">{c.platform || '—'}</td>
                      <td className="py-2 px-2">
                        <button onClick={() => removeCredit(c.id)} className="text-zinc-400 hover:text-red-600"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-zinc-500 mb-3">No credits yet. Add your first below.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input value={newCredit.title} onChange={e => setNewCredit({ ...newCredit, title: e.target.value })} placeholder="Title *"
              className="md:col-span-2 text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input value={newCredit.role} onChange={e => setNewCredit({ ...newCredit, role: e.target.value })} placeholder="Role"
              className="text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input value={newCredit.year} onChange={e => setNewCredit({ ...newCredit, year: e.target.value })} placeholder="Year"
              className="text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <div className="flex gap-1">
              <input value={newCredit.platform} onChange={e => setNewCredit({ ...newCredit, platform: e.target.value })} placeholder="Platform"
                className="flex-1 text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
              <button onClick={addCredit} className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2" aria-label="Add credit"><Plus size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo reel links */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel Icon={LinkIcon}>Demo reels + profiles</StatLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'SoundCloud',  val: soundcloud, setter: setSc,         ph: 'https://soundcloud.com/you' },
              { label: 'Vimeo',       val: vimeo,      setter: setVimeo,      ph: 'https://vimeo.com/you' },
              { label: 'Scorefolio',  val: scorefolio, setter: setScorefolio, ph: 'https://scorefol.io/your-handle' },
              { label: 'IMDbPro',     val: imdbpro,    setter: setImdbpro,    ph: 'https://pro.imdb.com/name/…' },
            ].map(f => (
              <label key={f.label} className="block">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">{f.label}</div>
                <input value={f.val} onChange={e => f.setter(e.target.value)} placeholder={f.ph}
                  className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <StatLabel>Bio</StatLabel>
            <button onClick={generateBio} disabled={generatingBio}
              className="flex items-center gap-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg disabled:opacity-50">
              {generatingBio ? <><Loader2 size={11} className="animate-spin" /> Generating…</> : <><Sparkles size={11} /> AI Generate</>}
            </button>
          </div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Your composer bio. Click AI Generate to draft from your credits + speciality."
            rows={6}
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={exportPdf} className="text-sm font-semibold bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 hover:border-amber-500/50 px-4 py-2 rounded-lg flex items-center gap-1.5">
          <Upload size={13} /> Export PDF
        </button>
        <button onClick={save} disabled={saving}
          className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Portfolio'}
        </button>
      </div>

      {/* Recommended platforms */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel>Recommended platforms</StatLabel>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {PORTFOLIO_TOOLS.map(t => (
              <a key={t.name} href={t.url} target="_blank" rel="noreferrer"
                className="group relative bg-white rounded-xl p-3 border border-zinc-200 hover:border-amber-500/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-sm font-semibold text-zinc-900">{t.name}</div>
                  <ExternalLink size={12} className="text-zinc-400 group-hover:text-amber-600 flex-shrink-0 mt-0.5" />
                </div>
                <div className="text-xs text-zinc-500 leading-snug">{t.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TAB 4 — AI COMPOSER AGENT
// ═════════════════════════════════════════════════════════════════════════════

const COMPOSER_AGENT_IDS = ['composer-sales', 'composer-marketing'];

const AgentTab = () => {
  const { setPreselectedAgent, navigate } = useAppContext();
  const agents = COMPOSER_AGENT_IDS.map(getAgentById).filter(Boolean);

  const open = (agentId, prompt) => {
    setPreselectedAgent(agentId);
    if (prompt) sessionStorage.setItem('agentchat.prefill', prompt);
    navigate('/agents');
  };

  if (agents.length === 0) {
    return <div className="tile-pop bg-white rounded-2xl p-6 text-center" style={CARD_STYLE}><p className="text-sm text-zinc-500">Composer agents not configured.</p></div>;
  }

  return (
    <div className="space-y-5 animate-hud-in">
      {agents.map(agent => (
        <div key={agent.id} className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
                <Bot size={22} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-900">{agent.name}</h3>
                <p className="text-xs text-zinc-600 leading-relaxed mt-1 max-w-2xl">{agent.description}</p>
              </div>
              <button
                onClick={() => open(agent.id)}
                className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-shrink-0"
              >
                <Bot size={12} /> Open Chat
              </button>
            </div>

            <StatLabel>Suggested prompts</StatLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agent.suggestedPrompts?.map(p => (
                <button
                  key={p}
                  onClick={() => open(agent.id, p)}
                  className="text-left group relative bg-white rounded-xl p-3 border border-zinc-200 hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-zinc-700 leading-snug">{p}</span>
                    <Send size={12} className="text-zinc-400 group-hover:text-amber-600 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'sync',      label: 'Sync Licensing',    Icon: Send },
  { id: 'pipeline',  label: 'Projects Pipeline', Icon: Briefcase },
  { id: 'portfolio', label: 'Portfolio',         Icon: Piano },
  { id: 'agent',     label: 'AI Composer Agent', Icon: Bot },
];

export const ComposerView = () => {
  const { profile, updateProfile } = useAppContext();
  const [activeTab, setActiveTab] = useState('sync');
  const userAnswers = profile?.onboarding_data?.answers || {};

  const {
    projects, loading,
    addProject, moveProject, deleteProject,
  } = useComposerProjects(profile?.id);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <TiltCard tiltLimit={6} scale={1.015} perspective={1400} className="tile-pop bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-amber-100 blur-xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Piano size={22} className="text-amber-600" />
            Composer Studio
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            Sync pitches, scoring pipeline, portfolio building, and AI outreach for film / TV composers.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {userAnswers.speciality && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">{userAnswers.speciality}</span>}
            {userAnswers.daw        && <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">{userAnswers.daw}</span>}
            {userAnswers.credits    && <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">{userAnswers.credits}</span>}
            {userAnswers.seeking    && <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">Seeking: {userAnswers.seeking}</span>}
          </div>
        </div>
      </TiltCard>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <div className="flex gap-4">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === id
                  ? 'text-amber-600 border-amber-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-800'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'sync'      && <SyncDashboardTab projects={projects} addProject={addProject} />}
      {activeTab === 'pipeline'  && <ProjectsPipelineTab projects={projects} moveProject={moveProject} deleteProject={deleteProject} addProject={addProject} loading={loading} />}
      {activeTab === 'portfolio' && <PortfolioTab userAnswers={userAnswers} profile={profile} updateProfile={updateProfile} />}
      {activeTab === 'agent'     && <AgentTab />}
    </div>
  );
};
