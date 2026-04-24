import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragOverlay, useDraggable, useDroppable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import {
  Camera, Search, Filter, Briefcase, Sparkles, Send, X, Bot, Loader2,
  Film, MapPin, Calendar as CalendarIcon, Shield, Clock, ExternalLink,
  GripVertical, Trash2, FileText, Link as LinkIcon, Upload,
} from 'lucide-react';
import { useAppContext } from '../../App';
import { useCrewApplications, CREW_STAGES } from '../../hooks/useCrewApplications';
import {
  crewJobsMock, CREW_ROLES, UNION_STATUSES, PROJECT_TYPES, BUDGET_TIERS,
} from '../../config/crewJobsMock';
import { callAIFast } from '../../utils/ai';
import { getAgentById } from '../../config/agents';
import { TiltCard } from '../ui/TiltCard';
import { logger } from '../../lib/logger';

// ── Shared card shell (match FilmFinancingView) ──────────────────────────────
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

const budgetLabel = (id) => BUDGET_TIERS.find(t => t.id === id)?.range || id;

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — JOB BOARD
// ─────────────────────────────────────────────────────────────────────────────

const JobCard = ({ job, onApply }) => (
  <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
    <AmberBg />
    <div className="relative z-10">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-500 font-medium">{job.company}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-xs text-zinc-500">{job.type}</span>
          </div>
          <h3 className="text-base font-bold text-zinc-900 leading-snug">{job.title}</h3>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
          job.union === 'IATSE'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : job.union === 'Non-Union'
              ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>{job.union}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 mb-3">
        <span className="flex items-center gap-1"><Briefcase size={11} /> {job.role}</span>
        <span className="text-zinc-300">·</span>
        <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
        <span className="text-zinc-300">·</span>
        <span className="flex items-center gap-1"><CalendarIcon size={11} /> {job.shootDates}</span>
      </div>

      <p className="text-xs text-zinc-600 leading-relaxed mb-3">{job.description}</p>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg font-medium">
            {budgetLabel(job.budget)}
          </span>
          <span className="text-zinc-500 flex items-center gap-1"><Clock size={10} /> {job.postedDaysAgo}d ago</span>
        </div>
        <button
          onClick={() => onApply(job)}
          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Send size={11} /> Quick Apply
        </button>
      </div>
    </div>
  </div>
);

const QuickApplyModal = ({ job, onClose, onSubmit }) => {
  const { profile } = useAppContext();
  const answers = profile?.onboarding_data?.answers || {};
  const [letter, setLetter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const generateLetter = async () => {
    setGenerating(true);
    try {
      const system = 'You write concise, personable cover letters for film/TV crew applying to productions. Keep it under 180 words. Lead with role fit, one specific credit or experience beat, availability, and a direct sign-off. No fluff, no "To Whom It May Concern".';
      const userCtx = [
        `Production: "${job.title}" (${job.company})`,
        `Role: ${job.role} · ${job.type} · ${job.location}`,
        `Shoot: ${job.shootDates}`,
        `Description: ${job.description}`,
        `Applicant: ${profile?.display_name || profile?.email || 'crew member'}`,
        answers.role        && `Their role: ${answers.role}`,
        answers.experience  && `Experience: ${answers.experience}`,
        answers.union       && `Union: ${answers.union}`,
        answers.availability && `Availability: ${answers.availability}`,
      ].filter(Boolean).join('\n');
      const text = await callAIFast(system, [{ role: 'user', content: userCtx }]);
      setLetter(text.trim());
    } catch (err) {
      logger.error('CrewView.quickApply.generate.failed', err);
      toast.error('Could not generate cover letter. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    const row = {
      production_title: job.title,
      role:             job.role,
      location:         job.location,
      union_status:     job.union,
      notes:            letter,
      metadata:         { job_id: job.id, apply_url: job.applyUrl, company: job.company },
    };
    const saved = await onSubmit(row);
    setSubmitting(false);
    if (saved) {
      toast.success('Application saved to My Applications');
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
            <div className="text-xs text-zinc-500 mb-0.5">{job.company} · {job.type}</div>
            <h2 className="text-lg font-bold text-zinc-900">{job.title}</h2>
            <div className="text-xs text-zinc-600 mt-1">{job.role} · {job.location} · {job.union}</div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <StatLabel>Cover Letter</StatLabel>
              <button
                onClick={generateLetter}
                disabled={generating}
                className="flex items-center gap-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {generating
                  ? <><Loader2 size={11} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={11} /> AI Generate</>}
              </button>
            </div>
            <textarea
              value={letter}
              onChange={e => setLetter(e.target.value)}
              placeholder="Write your cover letter, or click AI Generate to draft one based on this production."
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 resize-y"
              rows={10}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-zinc-200 bg-zinc-50">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-500 hover:text-amber-700 flex items-center gap-1"
          >
            Open original listing <ExternalLink size={10} />
          </a>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-sm text-zinc-700 px-4 py-2 hover:text-zinc-900">Cancel</button>
            <button
              onClick={submit}
              disabled={submitting || !letter.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const JobBoardTab = ({ applicationsMap, addApplication }) => {
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [union, setUnion]     = useState('');
  const [type, setType]       = useState('');
  const [location, setLocation] = useState('');
  const [activeJob, setActiveJob] = useState(null);

  const applicationCount = useMemo(
    () => CREW_STAGES.reduce((n, s) => n + (applicationsMap[s]?.length || 0), 0),
    [applicationsMap]
  );
  const bookedCount   = applicationsMap.Booked?.length || 0;
  const respondedCount = (applicationsMap.Viewed?.length || 0)
    + (applicationsMap.Interview?.length || 0)
    + bookedCount;
  const responseRate = applicationCount > 0
    ? Math.round((respondedCount / applicationCount) * 100)
    : 0;

  const newThisWeek = crewJobsMock.filter(j => j.postedDaysAgo <= 7).length;

  const filtered = useMemo(() => crewJobsMock.filter(j => {
    if (role     && j.role     !== role)     return false;
    if (union    && j.union    !== union && union !== 'Either' && j.union !== 'Either') return false;
    if (type     && j.type     !== type)     return false;
    if (location && !j.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${j.title} ${j.company} ${j.role} ${j.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [search, role, union, type, location]);

  return (
    <div className="space-y-5 animate-hud-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={Briefcase}>Active Jobs</StatLabel>
            <StatNumber>{crewJobsMock.length}</StatNumber>
          </div>
        </div>
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={Sparkles}>New This Week</StatLabel>
            <StatNumber>{newThisWeek}</StatNumber>
          </div>
        </div>
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={Send}>Your Applications</StatLabel>
            <StatNumber>{applicationCount}</StatNumber>
          </div>
        </div>
        <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
          <AmberBg />
          <div className="relative z-10">
            <StatLabel Icon={Film}>Response Rate</StatLabel>
            <StatNumber>{applicationCount ? `${responseRate}%` : '—'}</StatNumber>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tile-pop bg-white rounded-2xl p-4" style={CARD_STYLE}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[220px] bg-zinc-50 border border-zinc-200 rounded-lg px-3">
            <Search size={14} className="text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search production, company, role…"
              className="flex-1 bg-transparent text-sm py-2 focus:outline-none"
            />
          </div>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
            <option value="">All roles</option>
            {CREW_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={union} onChange={e => setUnion(e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
            <option value="">Any union</option>
            {UNION_STATUSES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50">
            <option value="">Any type</option>
            {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Location"
            className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50 w-40"
          />
          {(search || role || union || type || location) && (
            <button
              onClick={() => { setSearch(''); setRole(''); setUnion(''); setType(''); setLocation(''); }}
              className="text-xs text-zinc-500 hover:text-amber-700 flex items-center gap-1 px-2"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(job => <JobCard key={job.id} job={job} onApply={setActiveJob} />)}
        {filtered.length === 0 && (
          <div className="col-span-full tile-pop bg-white rounded-2xl p-8 text-center" style={CARD_STYLE}>
            <Filter size={24} className="mx-auto mb-2 text-zinc-400" />
            <p className="text-sm text-zinc-600">No jobs match these filters.</p>
          </div>
        )}
      </div>

      {activeJob && (
        <QuickApplyModal
          job={activeJob}
          onClose={() => setActiveJob(null)}
          onSubmit={addApplication}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — MY APPLICATIONS (Kanban)
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_BADGE = {
  Applied:   'bg-zinc-100 text-zinc-700 border-zinc-200',
  Viewed:    'bg-blue-50 text-blue-700 border-blue-200',
  Interview: 'bg-amber-50 text-amber-700 border-amber-200',
  Booked:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Passed:    'bg-red-50 text-red-700 border-red-200',
};

const AppDraggable = ({ id, children }) => {
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

const AppDroppable = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[72px] rounded-xl p-1 -m-1 transition-all ${isOver ? 'bg-amber-50 ring-1 ring-amber-300' : ''}`}>
      {children}
    </div>
  );
};

const AppCard = ({ app, onDelete }) => (
  <div className="relative bg-white rounded-xl p-3 overflow-hidden group" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="relative z-10">
      <div className="flex items-start gap-1.5 mb-1">
        <GripVertical size={12} className="text-zinc-600 flex-shrink-0 mt-0.5 cursor-grab" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-zinc-900 leading-snug">{app.production_title}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{app.role}</div>
        </div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 transition p-0.5"
          aria-label="Delete application"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-4 text-[11px] text-zinc-600">
        {app.location && <span>{app.location}</span>}
        {app.union_status && <><span className="text-zinc-300">·</span><span>{app.union_status}</span></>}
      </div>
      <div className="pl-4 text-[10px] font-mono text-zinc-400 mt-1">
        {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
      </div>
    </div>
  </div>
);

const ApplicationsTab = ({ applications, moveApplication, deleteApplication, loading }) => {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const dragStart = ({ active }) => setActiveId(active.id);
  const dragEnd   = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const appId = active.id;
    const toStatus = over.id;
    // Find current status
    let fromStatus = null;
    for (const s of CREW_STAGES) {
      if ((applications[s] || []).some(a => a.id === appId)) { fromStatus = s; break; }
    }
    if (fromStatus && fromStatus !== toStatus) {
      moveApplication(appId, fromStatus, toStatus);
    }
  };
  const draggedApp = activeId
    ? CREW_STAGES.flatMap(s => applications[s] || []).find(a => a.id === activeId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        Loading applications…
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-hud-in">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">My Applications</div>
        <div className="text-xs text-zinc-500">Drag cards between stages to update status</div>
      </div>

      <DndContext sensors={sensors} onDragStart={dragStart} onDragEnd={dragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {CREW_STAGES.map(stage => {
            const apps = applications[stage] || [];
            return (
              <div key={stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${STAGE_BADGE[stage]}`}>{stage}</span>
                  <span className="text-xs font-mono text-zinc-500">{apps.length}</span>
                </div>
                <AppDroppable id={stage}>
                  {apps.map(app => (
                    <AppDraggable key={app.id} id={app.id}>
                      <AppCard app={app} onDelete={() => deleteApplication(app.id)} />
                    </AppDraggable>
                  ))}
                  {apps.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500">
                      Drop here
                    </div>
                  )}
                </AppDroppable>
              </div>
            );
          })}
        </div>
        <DragOverlay modifiers={[snapCenterToCursor]}>
          {draggedApp ? (
            <div className="relative bg-white rounded-xl p-3 shadow-lg rotate-1 scale-105" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="text-xs font-semibold text-zinc-900">{draggedApp.production_title}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{draggedApp.role}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — PROFILE
// ─────────────────────────────────────────────────────────────────────────────

const CREW_TOOLS = [
  { name: 'ProductionHUB',  url: 'https://productionhub.com',    desc: 'Daily crew job alerts + 150K profiles' },
  { name: 'Make My Crew',   url: 'https://makemycrew.com',       desc: 'Mobile-first, fast local hires' },
  { name: 'ProductionBeast', url: 'https://productionbeast.com', desc: 'Crew listings' },
  { name: 'ShowbizJobs',    url: 'https://showbizjobs.com',      desc: 'Studio + network jobs' },
  { name: 'Behance',        url: 'https://behance.net',          desc: 'Visual portfolio' },
  { name: 'LinkedIn',       url: 'https://linkedin.com',         desc: 'UPM + producer outreach' },
  { name: 'IMDbPro',        url: 'https://pro.imdb.com',         desc: 'Project tracking (no jobs listings as of Dec 2025)' },
  { name: 'Wrapbook',       url: 'https://wrapbook.com',         desc: 'Production payroll' },
  { name: 'Hurdlr',         url: 'https://hurdlr.com',           desc: 'Freelance income + tax tracking' },
];

const ProfileTab = ({ userAnswers, profile, updateProfile }) => {
  const initialMeta = profile?.metadata || {};
  const [showreel,   setShowreel]   = useState(initialMeta.crew_showreel   || '');
  const [imdbpro,    setImdbpro]    = useState(initialMeta.crew_imdbpro    || '');
  const [prodhub,    setProdhub]    = useState(initialMeta.crew_productionhub || '');
  const [available,  setAvailable]  = useState(initialMeta.crew_available !== false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const next_meta = {
      ...initialMeta,
      crew_showreel:      showreel,
      crew_imdbpro:       imdbpro,
      crew_productionhub: prodhub,
      crew_available:     available,
    };
    const { error } = await updateProfile({ metadata: next_meta });
    setSaving(false);
    if (error) toast.error('Could not save profile'); else toast.success('Profile saved');
  };

  const exportPdf = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(profile?.display_name || 'Crew Profile', 20, 20);
      doc.setFontSize(12);
      let y = 35;
      const line = (k, v) => { if (v) { doc.text(`${k}: ${v}`, 20, y); y += 8; } };
      line('Role',         userAnswers.role);
      line('Experience',   userAnswers.experience);
      line('Union',        userAnswers.union);
      line('Availability', userAnswers.availability);
      line('Showreel',     showreel);
      line('IMDbPro',      imdbpro);
      line('ProductionHUB', prodhub);
      doc.save(`crew-profile-${(profile?.display_name || 'me').replace(/\s+/g,'-')}.pdf`);
    } catch (err) {
      logger.error('CrewView.profile.pdf.failed', err);
      toast.error('Could not export PDF');
    }
  };

  return (
    <div className="space-y-5 animate-hud-in">
      {/* Identity card */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel Icon={Camera}>Crew Profile</StatLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Role</div>
              <div className="text-sm font-semibold text-zinc-900">{userAnswers.role || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Experience</div>
              <div className="text-sm font-semibold text-zinc-900">{userAnswers.experience || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Union</div>
              <div className="text-sm font-semibold text-zinc-900">{userAnswers.union || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Availability</div>
              <div className="text-sm font-semibold text-zinc-900">{userAnswers.availability || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Availability toggle + links */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
            <div>
              <div className="text-sm font-medium text-zinc-900 flex items-center gap-2"><Shield size={14} className="text-zinc-500" /> Availability</div>
              <div className="text-xs text-zinc-500 mt-0.5">Toggle this to show as available for new bookings</div>
            </div>
            <button
              onClick={() => setAvailable(v => !v)}
              className={`w-12 h-6 rounded-full transition-all ${available ? 'bg-emerald-500' : 'bg-zinc-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${available ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1"><FileText size={10} /> Showreel URL</div>
              <input value={showreel} onChange={e => setShowreel(e.target.value)} placeholder="https://vimeo.com/…"
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1"><LinkIcon size={10} /> IMDbPro URL</div>
              <input value={imdbpro} onChange={e => setImdbpro(e.target.value)} placeholder="https://pro.imdb.com/name/…"
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
            <label className="block">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1"><LinkIcon size={10} /> ProductionHUB URL</div>
              <input value={prodhub} onChange={e => setProdhub(e.target.value)} placeholder="https://productionhub.com/…"
                className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={exportPdf} className="text-sm font-semibold bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 hover:border-amber-500/50 px-4 py-2 rounded-lg flex items-center gap-1.5">
              <Upload size={13} /> Export PDF
            </button>
            <button onClick={save} disabled={saving}
              className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Recommended tools */}
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <StatLabel>Recommended platforms</StatLabel>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {CREW_TOOLS.map(t => (
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

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4 — AI CAREER AGENT
// ─────────────────────────────────────────────────────────────────────────────

const AgentTab = () => {
  const { setPreselectedAgent, navigate } = useAppContext();
  const agent = getAgentById('crew-job-discovery');

  const openChat = (prompt) => {
    setPreselectedAgent('crew-job-discovery');
    if (prompt) sessionStorage.setItem('agentchat.prefill', prompt);
    navigate('/agents');
  };

  if (!agent) {
    return (
      <div className="tile-pop bg-white rounded-2xl p-6 text-center" style={CARD_STYLE}>
        <p className="text-sm text-zinc-500">Crew agent not configured.</p>
      </div>
    );
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
            <div>
              <h3 className="text-base font-bold text-zinc-900">{agent.name}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed mt-1 max-w-2xl">{agent.description}</p>
            </div>
          </div>

          <StatLabel>Suggested prompts</StatLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agent.suggestedPrompts?.map(p => (
              <button
                key={p}
                onClick={() => openChat(p)}
                className="text-left group relative bg-white rounded-xl p-3 border border-zinc-200 hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-zinc-700 leading-snug">{p}</span>
                  <Send size={12} className="text-zinc-400 group-hover:text-amber-600 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={() => openChat()}
              className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Bot size={13} /> Open Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'board',    label: 'Job Board',      Icon: Briefcase },
  { id: 'apps',     label: 'My Applications', Icon: Send },
  { id: 'profile',  label: 'Profile',        Icon: Camera },
  { id: 'agent',    label: 'AI Career Agent', Icon: Bot },
];

export const CrewView = () => {
  const { profile, updateProfile } = useAppContext();
  const [activeTab, setActiveTab] = useState('board');
  const userAnswers = profile?.onboarding_data?.answers || {};

  const {
    applications, loading,
    addApplication, moveApplication, deleteApplication,
  } = useCrewApplications(profile?.id);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <TiltCard tiltLimit={6} scale={1.015} perspective={1400} className="tile-pop bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-amber-100 blur-xl rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Camera size={22} className="text-amber-600" />
              Film / TV Crew
            </h1>
            <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
              Job leads, applications tracking, and AI outreach for below-the-line film and TV crew — DPs, ADs, Gaffers, HMU, Sound, Production Design, VFX, PAs.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {userAnswers.role         && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">{userAnswers.role}</span>}
              {userAnswers.experience   && <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">{userAnswers.experience}</span>}
              {userAnswers.union        && <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">{userAnswers.union}</span>}
              {userAnswers.availability && <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">{userAnswers.availability}</span>}
            </div>
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

      {activeTab === 'board'   && <JobBoardTab applicationsMap={applications} addApplication={addApplication} />}
      {activeTab === 'apps'    && <ApplicationsTab applications={applications} moveApplication={moveApplication} deleteApplication={deleteApplication} loading={loading} />}
      {activeTab === 'profile' && <ProfileTab userAnswers={userAnswers} profile={profile} updateProfile={updateProfile} />}
      {activeTab === 'agent'   && <AgentTab />}
    </div>
  );
};
