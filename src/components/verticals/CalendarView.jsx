import React, { useState, useEffect } from 'react';
import { callAIFast } from '../../utils/ai';
import {
  ChevronLeft, ChevronRight, Plus, Sparkles,
  Clock, CheckCircle2, FileText, Loader2, Trash2,
  Music, Piano, CalendarDays, LayoutGrid,
} from 'lucide-react';
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, addWeeks, subWeeks,
  addMonths, subMonths, isToday, isSameMonth, isSameDay,
} from 'date-fns';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mulbros_calendar_v1';

const PLATFORMS = {
  talise: [
    { key: 'instagram', label: 'Instagram'   },
    { key: 'tiktok',    label: 'TikTok'      },
    { key: 'twitter',   label: 'X / Twitter' },
    { key: 'youtube',   label: 'YouTube'     },
    { key: 'spotify',   label: 'Spotify'     },
  ],
  luke: [
    { key: 'linkedin',  label: 'LinkedIn'    },
    { key: 'twitter',   label: 'X / Twitter' },
    { key: 'instagram', label: 'Instagram'   },
    { key: 'imdb',      label: 'IMDb Pro'    },
  ],
};

const PLATFORM_STYLE = {
  instagram: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  tiktok:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  twitter:   'bg-zinc-700 text-zinc-300 border-zinc-600',
  youtube:   'bg-red-500/10 text-red-400 border-red-500/20',
  spotify:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  linkedin:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  imdb:      'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const STATUS_CFG = {
  draft:     { label: 'Draft',     badge: 'bg-zinc-700/80 text-zinc-400',          Icon: FileText,     next: 'scheduled', dot: 'bg-zinc-500'    },
  scheduled: { label: 'Scheduled', badge: 'bg-blue-500/10 text-blue-400',          Icon: Clock,        next: 'posted',    dot: 'bg-blue-400'    },
  posted:    { label: 'Posted',    badge: 'bg-emerald-500/10 text-emerald-400',    Icon: CheckCircle2, next: 'draft',     dot: 'bg-emerald-400' },
};

const TALENT_BIOS = {
  talise: 'SXSW 2025 breakout indie pop artist. Known for cinematic, emotionally resonant music. 47K+ Spotify streams, 12K TikTok followers growing 8% MoM. Recent sync placements on editorial playlists.',
  luke:   'Film composer with $30K in active deals. Specialises in dramatic scores for indie films. Active on IMDb Pro and Film Freeway. Background in orchestral writing; based in the US.',
};

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const loadPosts = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
const savePosts = posts => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); } catch {} };

// ── Violet bg accent ──────────────────────────────────────────────────────────
const VioletBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 bg-violet-500/10 blur-xl rounded-full pointer-events-none" />
  </>
);

// ── Post card ─────────────────────────────────────────────────────────────────
const PostCard = ({ post, onCycle, onDelete }) => {
  const st  = STATUS_CFG[post.status] || STATUS_CFG.draft;
  const { Icon } = st;
  const plStyle = PLATFORM_STYLE[post.platform] || 'bg-zinc-700 text-zinc-300 border-zinc-600';
  const plLabel = [...PLATFORMS.talise, ...PLATFORMS.luke].find(p => p.key === post.platform)?.label || post.platform;

  return (
    <div className="relative bg-zinc-900 rounded-xl ring-1 ring-violet-900/20 p-2.5 overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/10 via-zinc-900 to-zinc-950 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${plStyle}`}>{plLabel}</span>
          <button
            onClick={() => onCycle(post.id)}
            title="Click to advance status"
            className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-all hover:brightness-125 border border-transparent ${st.badge}`}
          >
            <Icon size={9} /> {st.label}
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 p-0.5"
          >
            <Trash2 size={10} />
          </button>
        </div>
        <p className="text-xs text-zinc-300 leading-snug line-clamp-3 whitespace-pre-line">{post.content}</p>
        {post.scheduledTime && post.status === 'scheduled' && (
          <div className="flex items-center gap-1 mt-1.5 text-zinc-500">
            <Clock size={9} /><span className="text-[10px]">{post.scheduledTime}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Add Post form ─────────────────────────────────────────────────────────────
const AddPostForm = ({ date, talent, onAdd, onClose }) => {
  const platforms = PLATFORMS[talent] || [];
  const [platform,   setPlatform]   = useState(platforms[0]?.key || '');
  const [content,    setContent]    = useState('');
  const [time,       setTime]       = useState('');
  const [suggesting, setSuggesting] = useState(false);

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const plLabel = platforms.find(p => p.key === platform)?.label || platform;
      const sys = `You are a social media strategist for MulBros Media.
Talent: ${talent === 'talise' ? 'Talise' : 'Luke Mulholland'}
Profile: ${TALENT_BIOS[talent]}
Platform: ${plLabel}
Post date: ${format(date, 'EEEE, MMMM d yyyy')}

Generate exactly 3 content ideas as a numbered list. Each idea: one-line bold title + one sentence hook. Keep the total response under 130 words. No preamble.`;
      const result = await callAIFast(sys, [{ role: 'user', content: 'Generate 3 ideas.' }]);
      setContent(result.trim());
    } catch {
      setContent('Could not generate — add your OpenAI key in Settings to enable AI suggestions.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleAdd = () => {
    if (!content.trim()) return;
    onAdd({ id: genId(), date: format(date, 'yyyy-MM-dd'), talent, platform, content: content.trim(), scheduledTime: time || null, status: 'draft' });
    onClose();
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl border border-violet-500/20 p-3 space-y-2.5">
      {/* Platform pills */}
      <div className="flex flex-wrap gap-1">
        {platforms.map(p => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
              platform === p.key
                ? `${PLATFORM_STYLE[p.key]}`
                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        rows={3}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={`Write your ${format(date, 'MMM d')} post…`}
        className="w-full bg-zinc-900 text-zinc-200 text-xs rounded-lg px-3 py-2 border border-zinc-700 focus:outline-none focus:border-violet-500/50 resize-none placeholder-zinc-600 leading-relaxed"
      />

      {/* Bottom row */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="bg-zinc-900 text-zinc-400 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:outline-none focus:border-violet-500/40 w-28"
        />
        <button
          onClick={handleSuggest}
          disabled={suggesting}
          className="flex items-center gap-1.5 text-xs bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/25 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          {suggesting ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          AI Suggest
        </button>
        <div className="flex-1" />
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors">Cancel</button>
        <button
          onClick={handleAdd}
          disabled={!content.trim()}
          className="text-xs bg-violet-500 hover:bg-violet-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-all"
        >
          Add post
        </button>
      </div>
    </div>
  );
};

// ── Weekly view ───────────────────────────────────────────────────────────────
const WeekView = ({ weekStart, talent, posts, onAdd, onCycle, onDelete }) => {
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
  const [addingDay, setAddingDay] = useState(null);

  return (
    <div className="grid grid-cols-7 gap-2.5">
      {days.map(day => {
        const ds       = format(day, 'yyyy-MM-dd');
        const dayPosts = posts.filter(p => p.date === ds && p.talent === talent);
        const isAdding = addingDay && isSameDay(addingDay, day);

        return (
          <div key={ds} className="space-y-2">
            {/* Day header */}
            <div className={`text-center py-1.5 rounded-xl ${isToday(day) ? 'bg-violet-500/20 ring-1 ring-violet-500/30' : 'bg-zinc-800/40'}`}>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{format(day, 'EEE')}</div>
              <div className={`text-base font-bold leading-none mt-0.5 ${isToday(day) ? 'text-violet-400' : 'text-zinc-300'}`}>
                {format(day, 'd')}
              </div>
              <div className="text-[9px] text-zinc-600 mt-0.5">{format(day, 'MMM')}</div>
            </div>

            {/* Posts */}
            <div className="space-y-1.5">
              {dayPosts.map(p => <PostCard key={p.id} post={p} onCycle={onCycle} onDelete={onDelete} />)}
            </div>

            {/* Add form or button */}
            {isAdding ? (
              <AddPostForm
                date={day}
                talent={talent}
                onAdd={p => { onAdd(p); setAddingDay(null); }}
                onClose={() => setAddingDay(null)}
              />
            ) : (
              <button
                onClick={() => setAddingDay(day)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-zinc-600 hover:text-violet-400 hover:bg-violet-500/5 rounded-lg border border-dashed border-zinc-800 hover:border-violet-500/30 transition-all"
              >
                <Plus size={10} /> Add
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Monthly view ──────────────────────────────────────────────────────────────
const MonthView = ({ monthStart, talent, posts, onAdd, onCycle, onDelete }) => {
  const [selectedDay,    setSelectedDay]    = useState(null);
  const [addingToDay,    setAddingToDay]    = useState(false);

  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const selDs      = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selPosts   = selectedDay ? posts.filter(p => p.date === selDs && p.talent === talent) : [];

  return (
    <div className="space-y-4">
      {/* DOW headers */}
      <div className="grid grid-cols-7 gap-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const ds         = format(day, 'yyyy-MM-dd');
          const dayPosts   = posts.filter(p => p.date === ds && p.talent === talent);
          const inMonth    = isSameMonth(day, monthStart);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const today      = isToday(day);

          const byStatus = {
            draft:     dayPosts.filter(p => p.status === 'draft').length,
            scheduled: dayPosts.filter(p => p.status === 'scheduled').length,
            posted:    dayPosts.filter(p => p.status === 'posted').length,
          };

          return (
            <button
              key={ds}
              onClick={() => { setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day); setAddingToDay(false); }}
              className={`relative p-1.5 rounded-xl min-h-[60px] text-left transition-all border ${
                !inMonth   ? 'opacity-25 border-transparent bg-transparent'
                : isSelected ? 'bg-violet-500/20 border-violet-500/40 ring-1 ring-violet-500/30'
                : today    ? 'bg-violet-500/10 border-violet-500/20'
                : 'bg-zinc-900/60 border-zinc-800/60 hover:bg-zinc-800/50 hover:border-zinc-700/60'
              }`}
            >
              <div className={`text-xs font-bold mb-1.5 ${today ? 'text-violet-400' : isSelected ? 'text-violet-300' : 'text-zinc-400'}`}>
                {format(day, 'd')}
              </div>
              {dayPosts.length > 0 && (
                <div className="flex flex-wrap gap-0.5 items-center">
                  {byStatus.draft     > 0 && <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"    title={`${byStatus.draft} draft`} />}
                  {byStatus.scheduled > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"   title={`${byStatus.scheduled} scheduled`} />}
                  {byStatus.posted    > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title={`${byStatus.posted} posted`} />}
                  {dayPosts.length > 4 && (
                    <span className="text-[8px] text-zinc-600 leading-none">+{dayPosts.length - 4}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-violet-900/30 p-5 overflow-hidden">
          <VioletBg />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-zinc-100">{format(selectedDay, 'EEEE, MMMM d yyyy')}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{selPosts.length} post{selPosts.length !== 1 ? 's' : ''}</div>
              </div>
              <button
                onClick={() => setAddingToDay(v => !v)}
                className="flex items-center gap-1.5 text-xs bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/25 px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus size={12} /> Add Post
              </button>
            </div>

            {addingToDay && (
              <div className="mb-4">
                <AddPostForm
                  date={selectedDay}
                  talent={talent}
                  onAdd={p => { onAdd(p); setAddingToDay(false); }}
                  onClose={() => setAddingToDay(false)}
                />
              </div>
            )}

            {selPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {selPosts.map(p => <PostCard key={p.id} post={p} onCycle={onCycle} onDelete={onDelete} />)}
              </div>
            ) : !addingToDay && (
              <p className="text-xs text-zinc-600 text-center py-4">No posts yet — click Add Post to schedule one.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
export const CalendarView = () => {
  const [talent,  setTalent]  = useState('talise');
  const [view,    setView]    = useState('week');   // 'week' | 'month'
  const [cursor,  setCursor]  = useState(new Date());
  const [posts,   setPosts]   = useState(loadPosts);

  // Persist on every change
  useEffect(() => { savePosts(posts); }, [posts]);

  const addPost    = post => setPosts(prev => [...prev, post]);
  const deletePost = id   => setPosts(prev => prev.filter(p => p.id !== id));
  const cycleStatus = id  => setPosts(prev =>
    prev.map(p => p.id === id ? { ...p, status: STATUS_CFG[p.status]?.next || 'draft' } : p)
  );

  const weekStart  = startOfWeek(cursor, { weekStartsOn: 1 });
  const monthStart = startOfMonth(cursor);

  const goBack   = () => setCursor(d => view === 'week' ? subWeeks(d, 1)  : subMonths(d, 1));
  const goNext   = () => setCursor(d => view === 'week' ? addWeeks(d, 1)  : addMonths(d, 1));
  const goToday  = () => setCursor(new Date());

  const navLabel = view === 'week'
    ? `${format(weekStart, 'MMM d')} – ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
    : format(monthStart, 'MMMM yyyy');

  // KPI stats for current talent
  const tp = posts.filter(p => p.talent === talent);
  const kpis = [
    { label: 'Total Posts',  value: tp.length,                                  sub: 'All time'     },
    { label: 'Drafts',       value: tp.filter(p => p.status === 'draft').length,     sub: 'Unpublished'  },
    { label: 'Scheduled',    value: tp.filter(p => p.status === 'scheduled').length, sub: 'Queued'        },
    { label: 'Posted',       value: tp.filter(p => p.status === 'posted').length,    sub: 'Live'          },
  ];

  return (
    <div className="space-y-5">

      {/* ── Cinematic page header ────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-zinc-900 rounded-2xl ring-1 ring-violet-900/30 p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-zinc-900 to-zinc-950 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-violet-500/5 blur-xl rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(139,92,246,0.05),transparent_70%)] pointer-events-none" />
        {/* Calendar grid lines decoration */}
        <div className="absolute top-2 right-16 grid grid-cols-4 gap-1.5 opacity-8 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-sm border border-violet-500/20" />
          ))}
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Content Calendar</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Plan, schedule, and track content for Talise and Luke across Instagram, TikTok, YouTube, LinkedIn, and more.
            </p>
          </div>
          <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1.5 rounded-lg font-medium">
            Content Studio
          </span>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="relative bg-zinc-900 rounded-2xl ring-1 ring-violet-900/30 p-5 overflow-hidden">
            <VioletBg />
            <div className="relative z-10">
              <div className="text-3xl font-bold font-mono text-zinc-100 mb-1">{k.value}</div>
              <div className="text-sm font-medium text-zinc-300 mb-0.5">{k.label}</div>
              <div className="text-xs text-zinc-500">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Talent selector */}
        <div className="flex items-center gap-1 bg-zinc-800/60 rounded-xl p-1">
          <button
            onClick={() => setTalent('talise')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              talent === 'talise'
                ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Music size={13} /> Talise
          </button>
          <button
            onClick={() => setTalent('luke')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              talent === 'luke'
                ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Piano size={13} /> Luke
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-zinc-800/60 rounded-xl p-1">
          <button
            onClick={() => setView('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'week'
                ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CalendarDays size={13} /> Week
          </button>
          <button
            onClick={() => setView('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'month'
                ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid size={13} /> Month
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-xl bg-zinc-800/60 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 transition-all"
          >
            Today
          </button>
          <button
            onClick={goNext}
            className="p-2 rounded-xl bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Nav label */}
        <div className="text-sm font-semibold text-zinc-300">{navLabel}</div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" /> Draft</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Scheduled</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Posted</span>
        </div>
      </div>

      {/* ── Calendar body ─────────────────────────────────────────────────── */}
      <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-violet-900/30 p-5 overflow-hidden">
        <VioletBg />
        <div className="relative z-10">
          {view === 'week' ? (
            <WeekView
              weekStart={weekStart}
              talent={talent}
              posts={posts}
              onAdd={addPost}
              onCycle={cycleStatus}
              onDelete={deletePost}
            />
          ) : (
            <MonthView
              monthStart={monthStart}
              talent={talent}
              posts={posts}
              onAdd={addPost}
              onCycle={cycleStatus}
              onDelete={deletePost}
            />
          )}
        </div>
      </div>

    </div>
  );
};
