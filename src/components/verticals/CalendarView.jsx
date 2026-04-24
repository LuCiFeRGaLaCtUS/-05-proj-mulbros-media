import React, { useState } from 'react';
import { useCalendar } from '../../hooks/useCalendar';
import { useAppContext } from '../../App';
import {
  ChevronLeft, ChevronRight, CalendarDays, LayoutGrid,
} from 'lucide-react';
import {
  format, startOfWeek, endOfWeek,
  startOfMonth, addWeeks, subWeeks,
  addMonths, subMonths,
} from 'date-fns';
import { STATUS_CFG, VioletBg } from './calendar/constants';
import { TiltCard } from '../ui/TiltCard';
import { EditPostForm } from './calendar/PostForms';
import { WeekView, MonthView } from './calendar/CalendarViews';

// ── Main export ───────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
export const CalendarView = ({ user }) => {
  const { profile } = useAppContext();
  const [view,        setView]        = useState('week');   // 'week' | 'month'
  const [cursor,      setCursor]      = useState(new Date());
  const [editingPost, setEditingPost] = useState(null);

  const { posts, addPost, updatePost, deletePost, cycleStatus } = useCalendar(profile?.id);

  const handleCycleStatus = (id) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const nextStatus = STATUS_CFG[post.status]?.next || 'draft';
    cycleStatus(id, nextStatus);
  };

  const handleEdit     = (post) => setEditingPost(post);
  const handleEditSave = (id, changes) => updatePost(id, changes);

  const weekStart  = startOfWeek(cursor, { weekStartsOn: 1 });
  const monthStart = startOfMonth(cursor);

  const goBack  = () => setCursor(d => view === 'week' ? subWeeks(d, 1)  : subMonths(d, 1));
  const goNext  = () => setCursor(d => view === 'week' ? addWeeks(d, 1)  : addMonths(d, 1));
  const goToday = () => setCursor(new Date());

  const navLabel = view === 'week'
    ? `${format(weekStart, 'MMM d')} – ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
    : format(monthStart, 'MMMM yyyy');

  // KPI stats — all posts for this user
  const tp = posts;
  const kpis = [
    { label: 'Total Posts', value: tp.length,                                           sub: 'All time'    },
    { label: 'Drafts',      value: tp.filter(p => p.status === 'draft').length,         sub: 'Unpublished' },
    { label: 'Scheduled',   value: tp.filter(p => p.status === 'scheduled').length,     sub: 'Queued'      },
    { label: 'Posted',      value: tp.filter(p => p.status === 'posted').length,        sub: 'Live'        },
  ];

  return (
    <div className="space-y-5">

      {/* Edit modal */}
      {editingPost && (
        <EditPostForm
          post={editingPost}
          onSave={handleEditSave}
          onClose={() => setEditingPost(null)}
        />
      )}

      {/* Page header */}
      <TiltCard tiltLimit={6} scale={1.015} perspective={1400} className="bg-white rounded-2xl ring-1 ring-violet-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-white to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-violet-500/5 blur-xl rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(139,92,246,0.03),transparent_70%)] pointer-events-none" />
        <div className="absolute top-2 right-16 grid grid-cols-4 gap-1.5 opacity-8 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-sm border border-violet-500/20" />
          ))}
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Content Calendar</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Plan, schedule, and track posts. Platforms auto-tuned to your vertical.
            </p>
          </div>
          <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-lg font-medium capitalize">
            {profile?.vertical || 'Content Studio'}
          </span>
        </div>
      </TiltCard>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="relative bg-white rounded-2xl ring-1 ring-violet-200 p-5 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <VioletBg />
            <div className="relative z-10">
              <div className="text-3xl font-bold font-mono text-zinc-900 mb-1">{k.value}</div>
              <div className="text-sm font-medium text-zinc-700 mb-0.5">{k.label}</div>
              <div className="text-xs text-zinc-500">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
          <button onClick={() => setView('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'week' ? 'bg-violet-500/20 text-violet-600 ring-1 ring-violet-500/30' : 'text-zinc-500 hover:text-zinc-800'
            }`}>
            <CalendarDays size={13} /> Week
          </button>
          <button onClick={() => setView('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'month' ? 'bg-violet-500/20 text-violet-600 ring-1 ring-violet-500/30' : 'text-zinc-500 hover:text-zinc-800'
            }`}>
            <LayoutGrid size={13} /> Month
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={goBack}  className="p-2 rounded-xl bg-zinc-100 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 transition-all"><ChevronLeft size={16} /></button>
          <button onClick={goToday} className="px-3 py-1.5 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 transition-all">Today</button>
          <button onClick={goNext}  className="p-2 rounded-xl bg-zinc-100 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 transition-all"><ChevronRight size={16} /></button>
        </div>

        <div className="text-sm font-semibold text-zinc-700">{navLabel}</div>

        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" /> Draft</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Scheduled</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Posted</span>
        </div>
      </div>

      {/* Calendar body */}
      <div className="relative bg-white rounded-2xl ring-1 ring-violet-200 p-5 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <VioletBg />
        <div className="relative z-10">
          {view === 'week' ? (
            <WeekView
              weekStart={weekStart}
              posts={posts}
              onAdd={addPost}
              onCycle={handleCycleStatus}
              onDelete={deletePost}
              onEdit={handleEdit}
            />
          ) : (
            <MonthView
              monthStart={monthStart}
              posts={posts}
              onAdd={addPost}
              onCycle={handleCycleStatus}
              onDelete={deletePost}
              onEdit={handleEdit}
            />
          )}
        </div>
      </div>

    </div>
  );
};
