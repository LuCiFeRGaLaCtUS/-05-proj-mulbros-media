import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { activities } from '../../config/mockData';
import { useMusicPipeline } from '../../hooks/useMusicPipeline';
import { useSpotifyIntegration } from '../../hooks/useSpotifyIntegration';
import { useAppContext } from '../../App';
import {
  Bot, Sparkles, Music, Clock, Pencil, Check, X, GripVertical,
  Headphones, ExternalLink, Link as LinkIcon, PlayCircle, Unlink, Loader2,
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';

// ── Light background — amber theme ───────────────────────────────────────────
const AmberBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-100 blur-xl rounded-full pointer-events-none" />
  </>
);

const musicActivities = activities.filter(a => ['music', 'composer'].includes(a.vertical));

// ── Goal → recommended tools (per spec) ──────────────────────────────────────
const TOOL_BY_GOAL = {
  'Sync licensing': [
    { name: 'Groover',   url: 'https://groover.co',        desc: 'Curator + supervisor pitching' },
    { name: 'ASCAP',     url: 'https://ascap.com',         desc: 'Performing rights & royalties' },
    { name: 'BMI',       url: 'https://bmi.com',           desc: 'Performing rights & royalties' },
    { name: 'Marmoset',  url: 'https://marmosetmusic.com', desc: 'Boutique sync licensing' },
  ],
  'Grow my audience': [
    { name: 'SymphonyOS',    url: 'https://symphonyos.co',    desc: 'Marketing automation' },
    { name: 'Chartmetric',   url: 'https://chartmetric.com',  desc: 'Music analytics' },
    { name: 'SubmitHub',     url: 'https://submithub.com',    desc: 'Curator pitching' },
    { name: 'Playlist Push', url: 'https://playlistpush.com', desc: 'Playlist promotion' },
  ],
  'Record deal': [
    { name: 'Chartmetric',   url: 'https://chartmetric.com',   desc: 'Analytics to back your pitch' },
    { name: 'UnitedMasters', url: 'https://unitedmasters.com', desc: 'Distribution + label services' },
    { name: 'Symphonic',     url: 'https://symphonic.com',     desc: 'Distribution + marketing' },
    { name: 'Bandcamp',      url: 'https://bandcamp.com',      desc: 'Direct sales + fanbase' },
  ],
  'Brand partnerships': [
    { name: 'SymphonyOS', url: 'https://symphonyos.co', desc: 'Brand/sync automation' },
    { name: 'Bandcamp',   url: 'https://bandcamp.com',  desc: 'Direct sales' },
    { name: 'AirGigs',    url: 'https://airgigs.com',   desc: 'Session + brand gigs' },
  ],
  'Live performance / touring': [
    { name: 'Bandcamp',    url: 'https://bandcamp.com',    desc: 'Tour merch + direct sales' },
    { name: 'SymphonyOS',  url: 'https://symphonyos.co',   desc: 'Tour marketing' },
    { name: 'AirGigs',     url: 'https://airgigs.com',     desc: 'Session gigs between dates' },
  ],
};

const DEFAULT_TOOLS = [
  { name: 'CD Baby',       url: 'https://cdbaby.com',       desc: 'Distribution' },
  { name: 'Chartmetric',   url: 'https://chartmetric.com',  desc: 'Analytics' },
  { name: 'Bandcamp',      url: 'https://bandcamp.com',     desc: 'Direct sales' },
  { name: 'SymphonyOS',    url: 'https://symphonyos.co',    desc: 'Marketing automation' },
];

const PIPELINE_STAGES = [
  { key: 'prospecting', label: 'Prospecting' },
  { key: 'pitched',     label: 'Pitched'     },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'closed',      label: 'Closed'      },
];

const pipelineStageBadge = {
  prospecting: 'bg-zinc-100 text-zinc-700',
  pitched:     'bg-blue-50 text-blue-700',
  negotiating: 'bg-amber-50 text-amber-700',
  closed:      'bg-emerald-50 text-emerald-700',
};

// ── DnD primitives ────────────────────────────────────────────────────────────
const DraggableCard = ({ id, children, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
      style={transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, position: 'relative', zIndex: 999 }
        : undefined}
      className={`transition-opacity ${isDragging ? 'opacity-30' : ''} ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {children}
    </div>
  );
};

const DroppableColumn = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[72px] rounded-xl p-1 -m-1 transition-all ${
        isOver ? 'bg-amber-50 ring-1 ring-amber-300' : ''
      }`}
    >
      {children}
    </div>
  );
};

// ── Pipeline card (view) ─────────────────────────────────────────────────────
const PipelineCardView = ({ lead, onEdit }) => (
  <div
    className="relative bg-white rounded-xl p-3 overflow-hidden group"
    style={{ border: '1px solid rgba(0,0,0,0.07)' }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="relative z-10">
      <div className="flex items-start gap-1.5 mb-1">
        <GripVertical size={12} className="text-zinc-600 flex-shrink-0 mt-0.5 cursor-grab" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-zinc-900 leading-snug">{lead.title}</div>
        </div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-amber-600 flex-shrink-0 p-0.5"
        >
          <Pencil size={10} />
        </button>
      </div>
      {lead.director && <div className="text-xs text-zinc-500 mb-1 pl-4">{lead.director}</div>}
      <div className="flex gap-1.5 flex-wrap pl-4">
        {lead.budget && <span className="text-xs bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">{lead.budget}</span>}
        {lead.genre  && <span className="text-xs text-zinc-600">{lead.genre}</span>}
      </div>
      {lead.proposedFee && (
        <div className="text-xs text-amber-600 font-medium mt-1 pl-4">{lead.proposedFee}</div>
      )}
      {lead.fee && (
        <div className="text-xs text-emerald-600 font-medium mt-1 pl-4">{lead.fee}</div>
      )}
      {lead.daysInStage !== undefined && (
        <div className="flex items-center gap-1 mt-1.5 pl-4 text-zinc-600">
          <Clock size={9} /><span className="text-xs">{lead.daysInStage}d</span>
        </div>
      )}
    </div>
  </div>
);

const PipelineCardEdit = ({ draft, onChange, onSave, onCancel }) => (
  <div
    className="relative bg-white rounded-xl p-3 overflow-hidden"
    style={{ border: '1px solid rgba(245,158,11,0.4)' }}
    onPointerDown={e => e.stopPropagation()}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="relative z-10 space-y-1.5">
      <input autoFocus
        className="w-full bg-white text-zinc-900 text-xs rounded px-2 py-1.5 border border-amber-400 focus:outline-none focus:border-amber-500 placeholder-zinc-400"
        value={draft.title}
        onChange={e => onChange('title', e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Project title"
      />
      <input
        className="w-full bg-white text-zinc-700 text-xs rounded px-2 py-1.5 border border-zinc-200 focus:outline-none focus:border-zinc-400 placeholder-zinc-400"
        value={draft.director}
        onChange={e => onChange('director', e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Director / contact"
      />
      <input
        className="w-full bg-white text-zinc-700 text-xs rounded px-2 py-1.5 border border-zinc-200 focus:outline-none focus:border-zinc-400 placeholder-zinc-400"
        value={draft.budget}
        onChange={e => onChange('budget', e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Budget (e.g. $1.2M)"
      />
      <input
        className="w-full bg-white text-amber-700 text-xs rounded px-2 py-1.5 border border-amber-200 focus:outline-none focus:border-amber-400 placeholder-zinc-400"
        value={draft.fee}
        onChange={e => onChange('fee', e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Proposed fee (e.g. $8K)"
      />
      <div className="flex gap-1.5 pt-1">
        <button onClick={onSave}
          className="flex items-center gap-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors">
          <Check size={10} /> Save
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg transition-colors">
          <X size={10} /> Cancel
        </button>
      </div>
    </div>
  </div>
);

// ── Deal Pipeline (per-user Kanban) ──────────────────────────────────────────
const DealPipeline = ({ userId }) => {
  const { pipeline, setPipeline } = useMusicPipeline(userId);
  const [editing, setEditing] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [activeCardId, setActiveCardId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const startEdit = (stage, index) => {
    const card = pipeline[stage][index];
    setEditing({ stage, index });
    setEditDraft({
      title:    card.title    || '',
      director: card.director || '',
      budget:   card.budget   || '',
      fee:      card.proposedFee || card.fee || '',
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    setPipeline(prev => {
      const col = [...(prev[editing.stage] || [])];
      col[editing.index] = {
        ...col[editing.index],
        title:       editDraft.title,
        director:    editDraft.director,
        budget:      editDraft.budget,
        proposedFee: editDraft.fee,
        fee:         col[editing.index].fee ? editDraft.fee : undefined,
      };
      return { ...prev, [editing.stage]: col };
    });
    setEditing(null);
  };

  const cancelEdit  = () => setEditing(null);
  const changeDraft = (field, value) => setEditDraft(d => ({ ...d, [field]: value }));

  const handleDragStart = ({ active }) => {
    setActiveCardId(active.id);
    if (editing) setEditing(null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveCardId(null);
    if (!over) return;
    const [srcStage, idxStr] = active.id.split('::');
    const destStage = over.id;
    if (srcStage === destStage) return;
    setPipeline(prev => {
      const src  = [...(prev[srcStage]  || [])];
      const dest = [...(prev[destStage] || [])];
      const [moved] = src.splice(Number(idxStr), 1);
      dest.push(moved);
      return { ...prev, [srcStage]: src, [destStage]: dest };
    });
  };

  const getDraggedCard = () => {
    if (!activeCardId) return null;
    const [stage, idx] = activeCardId.split('::');
    return pipeline[stage]?.[Number(idx)] || null;
  };
  const draggedCard = getDraggedCard();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">Deal Pipeline</div>
        <div className="text-xs text-zinc-500">Drag cards between stages · Click <Pencil size={9} className="inline" /> to edit</div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCardId(null)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_STAGES.map(stage => {
            const leads = pipeline[stage.key] || [];
            return (
              <div key={stage.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${pipelineStageBadge[stage.key]} border-zinc-200`}>
                    {stage.label}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">{leads.length}</span>
                </div>

                <DroppableColumn id={stage.key}>
                  {leads.map((lead, i) => {
                    const cardId    = `${stage.key}::${i}`;
                    const isEditing = editing?.stage === stage.key && editing?.index === i;
                    return isEditing ? (
                      <PipelineCardEdit
                        key={cardId}
                        draft={editDraft}
                        onChange={changeDraft}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                      />
                    ) : (
                      <DraggableCard key={cardId} id={cardId}>
                        <PipelineCardView lead={lead} onEdit={() => startEdit(stage.key, i)} />
                      </DraggableCard>
                    );
                  })}
                  {leads.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-600">
                      Drop here
                    </div>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        <DragOverlay modifiers={[snapCenterToCursor]}>
          {draggedCard ? (
            <div
              className="relative bg-white rounded-xl p-3 overflow-hidden shadow-lg rotate-1 scale-105"
              style={{ border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="text-xs font-semibold text-zinc-900 mb-1">{draggedCard.title}</div>
                {draggedCard.director && <div className="text-xs text-zinc-500">{draggedCard.director}</div>}
                {draggedCard.budget && <div className="text-xs bg-zinc-100 text-zinc-700 border border-zinc-200 inline-block px-1.5 py-0.5 rounded mt-1">{draggedCard.budget}</div>}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

// ── Empty-state tile ─────────────────────────────────────────────────────────
const EmptyTile = ({ icon: Icon, label, message, cta, ctaDisabled }) => (
  <div
    className="relative bg-white rounded-2xl p-4 overflow-hidden border-2 border-dashed border-zinc-200"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-transparent pointer-events-none" />
    <div className="relative z-10">
      <div
        style={{ fontFamily: 'var(--font-mono)' }}
        className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5"
      >
        {Icon && <Icon size={10} />}
        {label}
      </div>
      <div className="text-sm text-zinc-600 mb-2 leading-snug">{message}</div>
      {cta && (
        <button
          disabled={ctaDisabled}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            ctaDisabled
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {cta}
        </button>
      )}
    </div>
  </div>
);

// ─── Main view ────────────────────────────────────────────────────────────────
export const MusicView = () => {
  const { profile } = useAppContext();
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Activity'];

  const {
    connected: spotifyConnected,
    stats: spotifyStats,
    loading: spotifyLoading,
    connect: connectSpotify,
    disconnect: disconnectSpotify,
  } = useSpotifyIntegration(profile?.id);

  // Toast on OAuth callback query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('spotify');
    if (!status) return;
    const map = {
      connected: () => toast.success('Spotify connected'),
      denied:    () => toast.error('Spotify authorization denied'),
      missing_params: () => toast.error('Spotify callback missing params'),
      exchange_failed: () => toast.error('Spotify token exchange failed'),
      server_unconfigured: () => toast.error('Spotify not configured on server'),
      error:     () => toast.error('Spotify connection error'),
    };
    (map[status] || (() => {}))();
    // Clean URL
    params.delete('spotify');
    const next = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (next ? `?${next}` : ''));
  }, []);

  const answers = profile?.onboarding_data?.answers || {};
  const vertical    = profile?.vertical || 'musician';
  const isComposer  = vertical === 'composer';
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Artist';
  const genre       = answers.genre || answers.speciality || null;
  const goal        = answers.goal || answers.seeking || null;
  const listeners   = answers.monthly_listeners || null;
  const releaseStat = answers.release_status || null;
  const credits     = answers.credits || null;
  const daw         = answers.daw || null;

  const tools = (goal && TOOL_BY_GOAL[goal]) || DEFAULT_TOOLS;

  const pageTitle = isComposer ? 'Composer Studio' : 'Music & Composition';
  const pageSubtitle = isComposer
    ? 'Sync pitches, scoring pipeline, and collaborator discovery for film and media composers.'
    : 'Sync licensing, audience growth, and pipeline management for working musicians.';

  return (
    <div className="space-y-5">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <TiltCard
        tiltLimit={6} scale={1.015} perspective={1400}
        className="tile-pop bg-white rounded-2xl p-5"
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-amber-100 blur-xl rounded-full pointer-events-none" />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-amber-200 pointer-events-none" />
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-amber-200 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{pageTitle}</h1>
            <p className="text-sm text-zinc-500 mt-1">{pageSubtitle}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">
                {displayName}
              </span>
              {spotifyConnected && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Spotify connected
                </span>
              )}
              {genre && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">
                  {genre}
                </span>
              )}
              {goal && (
                <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">
                  Goal: {goal}
                </span>
              )}
              {releaseStat && (
                <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">
                  {releaseStat}
                </span>
              )}
              {credits && (
                <span className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium">
                  {credits}
                </span>
              )}
            </div>
          </div>
        </div>
      </TiltCard>

      {/* ── AI Engine banner ──────────────────────────────────────────────── */}
      <div className="tile-pop relative overflow-hidden bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
        <div className="absolute -top-4 right-8 w-24 h-24 bg-amber-200/60 blur-xl rounded-full pointer-events-none" />
        <div className="relative z-10 w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
          <Bot size={18} className="text-amber-600" />
        </div>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-zinc-900">
              AI {isComposer ? 'Composer' : 'Music'} Engine — Online
            </span>
            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full font-medium">
              <Sparkles size={9} /> AI
            </span>
          </div>
          <p className="text-xs text-zinc-600 leading-snug">
            {isComposer
              ? `Matches ${daw ? daw + ' ' : ''}composers to films in pre-production, manages sync pitches, and tracks scoring deliverables.`
              : `Handles sync pitches, playlist campaigns, and audience growth for ${genre ? genre + ' ' : ''}artists end-to-end.`}
          </p>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-200">
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-amber-600 border-amber-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {activeTab === 'Overview' && (
        <div className="space-y-5 animate-hud-in">

          {/* KPI grid — live Spotify data when connected; connect-button empty-state otherwise */}
          {spotifyLoading ? (
            <div className="tile-pop bg-white rounded-2xl p-6 flex items-center gap-3" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <Loader2 size={16} className="animate-spin text-amber-600" />
              <span className="text-sm text-zinc-600">Loading Spotify stats…</span>
            </div>
          ) : spotifyConnected && spotifyStats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="tile-pop relative bg-white rounded-2xl p-4 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
                  <AmberBg />
                  <div className="relative z-10">
                    <div
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5"
                    >
                      <Headphones size={10} /> Followers
                    </div>
                    <div
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
                      className="text-[1.65rem] font-bold text-zinc-900 leading-none tabular-nums"
                    >
                      {spotifyStats.profile?.followers != null ? spotifyStats.profile.followers.toLocaleString() : '—'}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">{spotifyStats.profile?.display_name}</div>
                  </div>
                </div>
                <div className="tile-pop relative bg-white rounded-2xl p-4 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
                  <AmberBg />
                  <div className="relative z-10">
                    <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5">
                      <Music size={10} /> Top Track (4 wk)
                    </div>
                    {spotifyStats.top_tracks?.[0] ? (
                      <a href={spotifyStats.top_tracks[0].url} target="_blank" rel="noreferrer" className="block hover:text-amber-700 transition-colors">
                        <div className="text-sm font-bold text-zinc-900 leading-snug truncate">{spotifyStats.top_tracks[0].name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{spotifyStats.top_tracks[0].artists}</div>
                      </a>
                    ) : (
                      <div className="text-sm text-zinc-500">No recent top track</div>
                    )}
                  </div>
                </div>
                <div className="tile-pop relative bg-white rounded-2xl p-4 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
                  <AmberBg />
                  <div className="relative z-10">
                    <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5">
                      <PlayCircle size={10} /> Recently Played
                    </div>
                    {spotifyStats.recently_played?.[0] ? (
                      <a href={spotifyStats.recently_played[0].url} target="_blank" rel="noreferrer" className="block hover:text-amber-700 transition-colors">
                        <div className="text-sm font-bold text-zinc-900 leading-snug truncate">{spotifyStats.recently_played[0].name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{spotifyStats.recently_played[0].artists}</div>
                      </a>
                    ) : (
                      <div className="text-sm text-zinc-500">No recent plays</div>
                    )}
                  </div>
                </div>
                <EmptyTile
                  icon={Sparkles}
                  label="Active Pitches"
                  message="Track sync pitches in the pipeline below."
                />
              </div>
              <div className="flex items-center justify-between">
                <a href="https://open.spotify.com" target="_blank" rel="noreferrer" className="text-[10px] text-zinc-400 hover:text-amber-700">
                  Powered by Spotify
                </a>
                <button
                  onClick={disconnectSpotify}
                  className="text-xs text-zinc-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Unlink size={11} /> Disconnect Spotify
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="tile-pop relative bg-white rounded-2xl p-4 overflow-hidden border-2 border-dashed border-zinc-200">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5">
                    <Headphones size={10} /> Spotify stats
                  </div>
                  <div className="text-sm text-zinc-600 mb-2 leading-snug">
                    {listeners
                      ? `Onboarding bucket: ${listeners}. Connect Spotify for live data.`
                      : 'Connect Spotify to see followers, top tracks, and recent plays.'}
                  </div>
                  <button
                    onClick={connectSpotify}
                    disabled={!profile?.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Connect Spotify
                  </button>
                </div>
              </div>
              <EmptyTile
                icon={Music}
                label="Top Track"
                message="Surfaces once Spotify is connected."
              />
              <EmptyTile
                icon={Sparkles}
                label="Active Pitches"
                message="No pitches tracked yet. Add a deal in the pipeline below."
              />
              <EmptyTile
                icon={LinkIcon}
                label="Pipeline Value"
                message="No pipeline data yet. Start tracking deals in the Kanban below."
              />
            </div>
          )}

          {/* Deal pipeline */}
          <div
            className="relative tile-pop bg-white rounded-2xl p-5 overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
          >
            <AmberBg />
            <div className="relative z-10">
              <DealPipeline userId={profile?.id} />
            </div>
          </div>

          {/* Recommended tools — driven by goal */}
          <div
            className="relative tile-pop bg-white rounded-2xl p-5 overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
          >
            <AmberBg />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em]"
                >
                  Recommended tools
                </div>
                {goal && (
                  <span className="text-xs text-zinc-500">Tuned for: <span className="text-amber-700 font-medium">{goal}</span></span>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {tools.map(t => (
                  <a
                    key={t.name}
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative bg-white rounded-xl p-3 border border-zinc-200 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-sm font-semibold text-zinc-900">{t.name}</div>
                      <ExternalLink size={12} className="text-zinc-400 group-hover:text-amber-600 transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="text-xs text-zinc-500 leading-snug">{t.desc}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Activity ──────────────────────────────────────────────────────── */}
      {activeTab === 'Activity' && (
        <div
          className="relative tile-pop bg-white rounded-2xl overflow-hidden animate-hud-in"
          style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <AmberBg />
          <div className="relative z-10">
            <div className="px-5 py-4 border-b border-zinc-200 bg-gradient-to-r from-amber-50 to-transparent">
              <h3 className="text-sm font-semibold text-zinc-900">Recent Agent Activity</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {musicActivities.map((a, i) => (
                <div key={i} className="flex gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                  <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 leading-snug">{a.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500">{a.agent}</span>
                      <span className="text-zinc-500">·</span>
                      <span className="text-xs text-zinc-500">{a.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              {musicActivities.length === 0 && (
                <div className="px-5 py-6 text-sm text-zinc-500">No recent activity.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
