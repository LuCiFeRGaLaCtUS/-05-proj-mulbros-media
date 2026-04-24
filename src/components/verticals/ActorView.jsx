import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragOverlay, useDraggable, useDroppable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import {
  Drama, Plus, Trash2, Send, Sparkles, Bot, Loader2, X,
  ExternalLink, GripVertical, Film, Camera, Check, Upload, Video,
} from 'lucide-react';
import { useAppContext } from '../../App';
import { useActorSubmissions, ACTOR_STAGES } from '../../hooks/useActorSubmissions';
import { TiltCard } from '../ui/TiltCard';
import { callAIFast } from '../../utils/ai';
import { getAgentById } from '../../config/agents';
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
  <div style={{ fontFamily: 'var(--font-mono)' }}
    className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5">
    {Icon && <Icon size={10} />}
    {children}
  </div>
);

const StatNumber = ({ children }) => (
  <div style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
    className="text-[1.65rem] font-bold text-zinc-900 leading-none tabular-nums">
    {children}
  </div>
);

const KpiCard = ({ label, value, Icon }) => (
  <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
    <AmberBg />
    <div className="relative z-10">
      <StatLabel Icon={Icon}>{label}</StatLabel>
      <StatNumber>{value}</StatNumber>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// TAB 1 — AUDITION TRACKER (Kanban)
// ═════════════════════════════════════════════════════════════════════════════

const STAGE_BADGE = {
  'Submitted':          'bg-zinc-100 text-zinc-700 border-zinc-200',
  'Audition Scheduled': 'bg-blue-50 text-blue-700 border-blue-200',
  'Callback':           'bg-amber-50 text-amber-700 border-amber-200',
  'Booked':             'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Passed':             'bg-red-50 text-red-700 border-red-200',
};

const DraggableCard = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)`, zIndex: 999, position: 'relative' } : undefined}
      className={`transition-opacity ${isDragging ? 'opacity-30' : ''} cursor-grab active:cursor-grabbing`}>
      {children}
    </div>
  );
};

const DroppableColumn = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[72px] rounded-xl p-1 -m-1 transition-all ${isOver ? 'bg-amber-50 ring-1 ring-amber-300' : ''}`}>
      {children}
    </div>
  );
};

const SubmissionCard = ({ sub, onDelete }) => (
  <div className="relative bg-white rounded-xl p-3 overflow-hidden group" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="relative z-10">
      <div className="flex items-start gap-1.5 mb-1">
        <GripVertical size={12} className="text-zinc-600 flex-shrink-0 mt-0.5 cursor-grab" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-zinc-900 leading-snug">{sub.project_title}</div>
          {sub.role && <div className="text-[11px] text-zinc-500 mt-0.5">{sub.role}</div>}
        </div>
        <button onPointerDown={e => e.stopPropagation()} onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 transition p-0.5"
          aria-label="Delete submission"><Trash2 size={11} /></button>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-4 text-[11px] text-zinc-600">
        {sub.casting_director && <span>{sub.casting_director}</span>}
        {sub.format && <><span className="text-zinc-300">·</span><span>{sub.format}</span></>}
      </div>
      {sub.audition_date && (
        <div className="pl-4 text-[10px] font-mono text-zinc-400 mt-1">
          {new Date(sub.audition_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      )}
    </div>
  </div>
);

const AddSubmissionModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({
    project_title: '', role: '', casting_director: '', production_company: '',
    audition_date: '', format: 'self-tape', platform: '', rate: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.project_title.trim()) { toast.error('Project title required'); return; }
    setSaving(true);
    const saved = await onSubmit({
      ...form,
      project_title: form.project_title.trim(),
      audition_date: form.audition_date || null,
      rate: form.rate === '' ? null : Number(form.rate),
    });
    setSaving(false);
    if (saved) { toast.success('Submission added'); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">Add Submission</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <input value={form.project_title} onChange={e => set('project_title', e.target.value)} placeholder="Project title *"
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="Role"
              className="text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <select value={form.format} onChange={e => set('format', e.target.value)}
              className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
              <option value="self-tape">Self-tape</option>
              <option value="in-person">In-person</option>
              <option value="zoom">Zoom</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.casting_director} onChange={e => set('casting_director', e.target.value)} placeholder="Casting director"
              className="text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input value={form.production_company} onChange={e => set('production_company', e.target.value)} placeholder="Production company"
              className="text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="datetime-local" value={form.audition_date} onChange={e => set('audition_date', e.target.value)}
              className="text-sm bg-white text-zinc-900 rounded-lg px-2 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="Platform"
              className="text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input type="number" value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="Rate USD"
              className="text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes" rows={3}
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

const ACTOR_TOOLS = [
  { name: 'Actors Access',    url: 'https://actorsaccess.com',    desc: '$68/yr PLUS plan — best ROI' },
  { name: 'Casting Networks', url: 'https://castingnetworks.com', desc: 'TV/commercial + IMDbPro integration' },
  { name: 'Casting Frontier', url: 'https://castingfrontier.com', desc: 'Emerging + commercial' },
  { name: 'CastmeNow',        url: 'https://castmenow.co',        desc: 'AI auto-submission' },
  { name: 'Backstage',        url: 'https://backstage.com',       desc: 'Theater + indie + secondary markets' },
  { name: 'SAG-AFTRA',        url: 'https://sagaftra.org',        desc: 'Union membership + residuals' },
];

const TrackerTab = ({ submissions, moveSubmission, deleteSubmission, addSubmission, loading }) => {
  const [activeId, setActiveId] = useState(null);
  const [adding, setAdding] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const total         = ACTOR_STAGES.reduce((n, s) => n + (submissions[s]?.length || 0), 0);
  const booked        = submissions.Booked?.length || 0;
  const callbackCount = submissions.Callback?.length || 0;
  const auditionCount = submissions['Audition Scheduled']?.length || 0;

  const monthCount = ACTOR_STAGES.reduce((n, s) => {
    const rows = submissions[s] || [];
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return n + rows.filter(r => new Date(r.created_at) >= start).length;
  }, 0);

  const dragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    let from = null;
    for (const s of ACTOR_STAGES) {
      if ((submissions[s] || []).some(x => x.id === active.id)) { from = s; break; }
    }
    if (from && from !== over.id) moveSubmission(active.id, from, over.id);
  };

  const dragged = activeId ? ACTOR_STAGES.flatMap(s => submissions[s] || []).find(x => x.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading submissions…
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-hud-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Submissions (month)" value={monthCount}     Icon={Send} />
        <KpiCard label="Auditions Booked"    value={auditionCount}  Icon={Camera} />
        <KpiCard label="Callbacks"           value={callbackCount}  Icon={Check} />
        <KpiCard label="Bookings"            value={booked}         Icon={Film} />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">Audition Tracker</div>
        <button onClick={() => setAdding(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Plus size={13} /> Add Submission
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={({ active }) => setActiveId(active.id)} onDragEnd={dragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ACTOR_STAGES.map(stage => {
            const items = submissions[stage] || [];
            return (
              <div key={stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${STAGE_BADGE[stage]}`}>{stage}</span>
                  <span className="text-xs font-mono text-zinc-500">{items.length}</span>
                </div>
                <DroppableColumn id={stage}>
                  {items.map(s => (
                    <DraggableCard key={s.id} id={s.id}>
                      <SubmissionCard sub={s} onDelete={() => deleteSubmission(s.id)} />
                    </DraggableCard>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-zinc-200 p-3 text-center text-[11px] text-zinc-500">Drop here</div>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>
        <DragOverlay modifiers={[snapCenterToCursor]}>
          {dragged ? (
            <div className="relative bg-white rounded-xl p-3 shadow-lg rotate-1 scale-105" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="text-xs font-semibold text-zinc-900">{dragged.project_title}</div>
              {dragged.role && <div className="text-[11px] text-zinc-500">{dragged.role}</div>}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel>Recommended platforms</StatLabel>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {ACTOR_TOOLS.map(t => (
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

      {adding && <AddSubmissionModal onClose={() => setAdding(false)} onSubmit={addSubmission} />}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TAB 2 — SELF-TAPE STUDIO
// ═════════════════════════════════════════════════════════════════════════════

const SELF_TAPE_CHECKLIST = [
  'Lighting — key + fill, no hard shadows',
  'Framing — mid-shot, eye-line near camera',
  'Audio levels — clean, no room echo',
  'Background — neutral, uncluttered',
  'File format — MP4 H.264, <500MB',
  'Slating — name, height, agent, role',
];

const SelfTapeStudioTab = ({ profile }) => {
  const answers = profile?.onboarding_data?.answers || {};
  const [checks, setChecks]   = useState({});
  const [sides, setSides]     = useState('');
  const [role, setRole]       = useState('');
  const [reading, setReading] = useState('');
  const [busy, setBusy]       = useState(false);

  const toggle = (item) => setChecks(c => ({ ...c, [item]: !c[item] }));

  const readSides = async () => {
    if (!sides.trim() || !role.trim()) { toast.error('Paste sides + enter your role name'); return; }
    setBusy(true);
    try {
      const system = `You are a reader assistant for an actor self-taping a scene. The actor will play the character "${role}". Read the sides and output ONLY the other characters' dialogue with action lines in square brackets. Skip all of "${role}"'s lines entirely (replace with a line of underscores so the actor can see where to deliver). Keep formatting tight.`;
      const text = await callAIFast(system, [{ role: 'user', content: `Sides:\n\n${sides}` }]);
      setReading(text.trim());
    } catch (err) {
      logger.error('ActorView.sides.reader.failed', err);
      toast.error('Could not process sides.');
    } finally {
      setBusy(false);
    }
  };

  const getTips = async () => {
    setBusy(true);
    try {
      const system = 'You are an acting coach. Give 5 specific, actionable self-tape tips based on the actor\'s profile and role type. Under 150 words. No fluff.';
      const ctx = [
        answers.union_status && `Union: ${answers.union_status}`,
        answers.primary_range && `Range: ${answers.primary_range}`,
        role && `Current role: ${role}`,
      ].filter(Boolean).join('\n') || 'General actor';
      const text = await callAIFast(system, [{ role: 'user', content: ctx }]);
      toast.success('Tips generated');
      setReading(prev => `TIPS:\n${text.trim()}\n\n---\n\n${prev || ''}`);
    } catch (err) {
      logger.error('ActorView.tips.failed', err);
      toast.error('Could not generate tips.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-hud-in">
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel Icon={Video}>Pre-shoot checklist</StatLabel>
          <div className="space-y-1.5">
            {SELF_TAPE_CHECKLIST.map(item => (
              <label key={item} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                <input type="checkbox" checked={!!checks[item]} onChange={() => toggle(item)} className="w-4 h-4 accent-amber-600" />
                <span className={`text-sm ${checks[item] ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <StatLabel Icon={Sparkles}>AI Sides Reader</StatLabel>
            <div className="flex gap-2">
              <button onClick={getTips} disabled={busy}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-zinc-200 hover:border-amber-500/50 text-zinc-900 px-3 py-1.5 rounded-lg disabled:opacity-50">
                {busy ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Tips
              </button>
              <button onClick={readSides} disabled={busy}
                className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
                {busy ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Read Sides
              </button>
            </div>
          </div>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Your character name (e.g. DETECTIVE CHEN)"
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 mb-2" />
          <textarea value={sides} onChange={e => setSides(e.target.value)} rows={8}
            placeholder="Paste sides here. Include slug lines, action, and character dialogue."
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y font-mono" />
          {reading && (
            <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <pre className="text-xs text-zinc-800 whitespace-pre-wrap font-mono">{reading}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TAB 3 — PROFILE
// ═════════════════════════════════════════════════════════════════════════════

const PROFILE_TOOLS = [
  { name: 'ArtHelper.ai',  url: 'https://arthelper.ai',      desc: 'AI bio + social content' },
  { name: 'Bonsai',        url: 'https://hellobonsai.com',   desc: 'Freelance contracts + invoicing' },
  { name: 'Hurdlr',        url: 'https://hurdlr.com',        desc: 'Income + quarterly tax tracking' },
  { name: 'SAG-AFTRA',     url: 'https://sagaftra.org',      desc: 'Residuals tracking' },
];

const ProfileTab = ({ profile, updateProfile }) => {
  const meta = profile?.metadata || {};
  const answers = profile?.onboarding_data?.answers || {};
  const [credits, setCredits]       = useState(meta.actor_credits || []);
  const [newCredit, setNewCredit]   = useState({ title: '', role: '', director: '', year: '', platform: '' });
  const [headshotA, setHeadA]       = useState(meta.actor_headshot_theatrical || '');
  const [headshotB, setHeadB]       = useState(meta.actor_headshot_commercial || '');
  const [reel, setReel]             = useState(meta.actor_reel || '');
  const [size, setSize]             = useState(meta.actor_size || { height: '', weight: '', hair: '', eye: '', ethnicity: '', age_range: '' });
  const [bio, setBio]               = useState(meta.actor_bio || '');
  const [busy, setBusy]             = useState(false);

  const addCredit = () => {
    if (!newCredit.title.trim()) { toast.error('Title required'); return; }
    setCredits(prev => [...prev, { ...newCredit, id: crypto.randomUUID() }]);
    setNewCredit({ title: '', role: '', director: '', year: '', platform: '' });
  };
  const removeCredit = (id) => setCredits(prev => prev.filter(c => c.id !== id));

  const generateBio = async () => {
    setBusy(true);
    try {
      const system = 'You write professional, concise actor bios. 120-160 words, third person. Emphasize range, training, and real credits only. No invented credits. No cliché adjectives.';
      const ctx = [
        `Name: ${profile?.display_name || 'the actor'}`,
        answers.union_status && `Union: ${answers.union_status}`,
        answers.primary_range && `Range: ${answers.primary_range}`,
        credits.length ? 'Credits:\n' + credits.map(c => `- ${c.title}${c.role ? ` (${c.role})` : ''}${c.year ? ` ${c.year}` : ''}${c.director ? ` — dir. ${c.director}` : ''}`).join('\n') : null,
      ].filter(Boolean).join('\n');
      const text = await callAIFast(system, [{ role: 'user', content: ctx }]);
      setBio(text.trim());
    } catch (err) {
      logger.error('ActorView.bio.failed', err);
      toast.error('Could not generate bio.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    const next_meta = {
      ...meta,
      actor_credits:            credits,
      actor_headshot_theatrical: headshotA,
      actor_headshot_commercial: headshotB,
      actor_reel:               reel,
      actor_size:               size,
      actor_bio:                bio,
    };
    const { error } = await updateProfile({ metadata: next_meta });
    setBusy(false);
    if (error) toast.error('Could not save profile'); else toast.success('Profile saved');
  };

  const exportPdf = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text(profile?.display_name || 'Actor Resume', 20, 20);
      doc.setFontSize(11);
      let y = 35;
      const line = (k, v) => { if (v) { doc.text(`${k}: ${v}`, 20, y); y += 7; } };
      line('Union',     answers.union_status);
      line('Range',     answers.primary_range);
      line('Height',    size.height);
      line('Hair',      size.hair);
      line('Eye',       size.eye);
      line('Age range', size.age_range);
      if (bio) {
        y += 4; doc.setFontSize(12); doc.text('Bio', 20, y); y += 7; doc.setFontSize(10);
        doc.splitTextToSize(bio, 170).forEach(r => { if (y > 270) { doc.addPage(); y = 20; } doc.text(r, 20, y); y += 5; });
      }
      if (credits.length > 0) {
        y += 4; doc.setFontSize(12); doc.text('Credits', 20, y); y += 7; doc.setFontSize(10);
        credits.forEach(c => {
          const t = `${c.title}${c.role ? ` — ${c.role}` : ''}${c.year ? ` (${c.year})` : ''}${c.director ? ` · dir. ${c.director}` : ''}${c.platform ? ` · ${c.platform}` : ''}`;
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`• ${t}`, 22, y); y += 6;
        });
      }
      doc.save(`actor-resume-${(profile?.display_name || 'me').replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      logger.error('ActorView.pdf.failed', err);
      toast.error('Could not export PDF');
    }
  };

  const field = (label, val, set, ph = '') => (
    <label className="block">
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">{label}</div>
      <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
        className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
    </label>
  );

  return (
    <div className="space-y-5 animate-hud-in">
      {/* Headshots + reel */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel Icon={Camera}>Headshots + reel</StatLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {field('Theatrical headshot URL', headshotA, setHeadA, 'https://…')}
            {field('Commercial headshot URL', headshotB, setHeadB, 'https://…')}
            {field('Demo reel URL',            reel,     setReel,  'https://vimeo.com/…')}
          </div>
        </div>
      </div>

      {/* Size card */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel>Size card</StatLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {field('Height',    size.height,     v => setSize(s => ({ ...s, height: v })),    `5'10"`)}
            {field('Weight',    size.weight,     v => setSize(s => ({ ...s, weight: v })),    '175 lb')}
            {field('Hair',      size.hair,       v => setSize(s => ({ ...s, hair: v })),      'Brown')}
            {field('Eye',       size.eye,        v => setSize(s => ({ ...s, eye: v })),       'Hazel')}
            {field('Ethnicity', size.ethnicity,  v => setSize(s => ({ ...s, ethnicity: v })), '')}
            {field('Age range', size.age_range,  v => setSize(s => ({ ...s, age_range: v })), '25–35')}
          </div>
        </div>
      </div>

      {/* Credits */}
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
                    <th className="text-left py-2 px-2 font-medium">Director</th>
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
                      <td className="py-2 px-2 text-zinc-700">{c.director || '—'}</td>
                      <td className="py-2 px-2 text-zinc-700">{c.year || '—'}</td>
                      <td className="py-2 px-2 text-zinc-700">{c.platform || '—'}</td>
                      <td className="py-2 px-2"><button onClick={() => removeCredit(c.id)} className="text-zinc-400 hover:text-red-600"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-zinc-500 mb-3">No credits yet. Add below.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <input value={newCredit.title} onChange={e => setNewCredit({ ...newCredit, title: e.target.value })} placeholder="Title *"
              className="md:col-span-2 text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input value={newCredit.role} onChange={e => setNewCredit({ ...newCredit, role: e.target.value })} placeholder="Role"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input value={newCredit.director} onChange={e => setNewCredit({ ...newCredit, director: e.target.value })} placeholder="Director"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <input value={newCredit.year} onChange={e => setNewCredit({ ...newCredit, year: e.target.value })} placeholder="Year"
              className="text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            <div className="flex gap-1">
              <input value={newCredit.platform} onChange={e => setNewCredit({ ...newCredit, platform: e.target.value })} placeholder="Platform"
                className="flex-1 text-sm bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
              <button onClick={addCredit} className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2" aria-label="Add credit"><Plus size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <StatLabel>Bio</StatLabel>
            <button onClick={generateBio} disabled={busy}
              className="flex items-center gap-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg disabled:opacity-50">
              {busy ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} AI Generate
            </button>
          </div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={6} placeholder="Your actor bio. Click AI Generate to draft from credits + union + range."
            className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={exportPdf} className="text-sm font-semibold bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 hover:border-amber-500/50 px-4 py-2 rounded-lg flex items-center gap-1.5">
          <Upload size={13} /> Export PDF
        </button>
        <button onClick={save} disabled={busy}
          className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
          {busy ? 'Saving…' : 'Save Profile'}
        </button>
      </div>

      {/* Recommended tools */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel>Recommended tools</StatLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PROFILE_TOOLS.map(t => (
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
// TAB 4 — AI CAREER AGENT
// ═════════════════════════════════════════════════════════════════════════════

const AgentTab = () => {
  const { setPreselectedAgent, navigate } = useAppContext();
  const agent = getAgentById('actor-career');

  const open = (prompt) => {
    setPreselectedAgent('actor-career');
    if (prompt) sessionStorage.setItem('agentchat.prefill', prompt);
    navigate('/agents');
  };

  if (!agent) {
    return <div className="tile-pop bg-white rounded-2xl p-6 text-center" style={CARD_STYLE}><p className="text-sm text-zinc-500">Actor agent not configured.</p></div>;
  }

  return (
    <div className="space-y-5 animate-hud-in">
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
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
            <button onClick={() => open()}
              className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-shrink-0">
              <Bot size={12} /> Open Chat
            </button>
          </div>

          <StatLabel>Suggested prompts</StatLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agent.suggestedPrompts?.map(p => (
              <button key={p} onClick={() => open(p)}
                className="text-left group relative bg-white rounded-xl p-3 border border-zinc-200 hover:border-amber-500/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-zinc-700 leading-snug">{p}</span>
                  <Send size={12} className="text-zinc-400 group-hover:text-amber-600 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'tracker', label: 'Audition Tracker', Icon: Camera },
  { id: 'tape',    label: 'Self-Tape Studio', Icon: Video },
  { id: 'profile', label: 'Profile',          Icon: Drama },
  { id: 'agent',   label: 'AI Career Agent',  Icon: Bot },
];

export const ActorView = () => {
  const { profile, updateProfile } = useAppContext();
  const [activeTab, setActiveTab] = useState('tracker');
  const answers = profile?.onboarding_data?.answers || {};

  const {
    submissions, loading,
    addSubmission, moveSubmission, deleteSubmission,
  } = useActorSubmissions(profile?.id);

  return (
    <div className="space-y-5">
      <TiltCard tiltLimit={6} scale={1.015} perspective={1400} className="tile-pop bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-amber-100 blur-xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Drama size={22} className="text-amber-600" />
            Actor Studio
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            Submissions tracker, self-tape tools, resume + headshots, and a career agent for professional actors.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {answers.union_status  && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">{answers.union_status}</span>}
            {answers.primary_range && <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">{answers.primary_range}</span>}
            {answers.city          && <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">{answers.city}</span>}
          </div>
        </div>
      </TiltCard>

      <div className="border-b border-zinc-200">
        <div className="flex gap-4">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === id
                  ? 'text-amber-600 border-amber-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-800'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'tracker' && (
        <TrackerTab
          submissions={submissions}
          moveSubmission={moveSubmission}
          deleteSubmission={deleteSubmission}
          addSubmission={addSubmission}
          loading={loading}
        />
      )}
      {activeTab === 'tape'    && <SelfTapeStudioTab profile={profile} />}
      {activeTab === 'profile' && <ProfileTab profile={profile} updateProfile={updateProfile} />}
      {activeTab === 'agent'   && <AgentTab />}
    </div>
  );
};
