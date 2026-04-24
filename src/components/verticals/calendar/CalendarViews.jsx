import React, { useState } from 'react';
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval,
  endOfMonth, isToday, isSameMonth, isSameDay,
} from 'date-fns';
import { Plus } from 'lucide-react';
import { DOW, VioletBg } from './constants';
import { PostCard, AddPostForm } from './PostForms';

// ── Weekly view ───────────────────────────────────────────────────────────────
export const WeekView = ({ weekStart, posts, onAdd, onCycle, onDelete, onEdit }) => {
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
  const [addingDay, setAddingDay] = useState(null);

  return (
    <div className="grid grid-cols-7 gap-2.5">
      {days.map(day => {
        const ds       = format(day, 'yyyy-MM-dd');
        const dayPosts = posts.filter(p => p.date === ds);
        const isAdding = addingDay && isSameDay(addingDay, day);

        return (
          <div key={ds} className="space-y-2">
            <div className={`text-center py-1.5 rounded-xl ${isToday(day) ? 'bg-violet-500/20 ring-1 ring-violet-500/30' : 'bg-zinc-50'}`}>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{format(day, 'EEE')}</div>
              <div className={`text-base font-bold leading-none mt-0.5 ${isToday(day) ? 'text-violet-500' : 'text-zinc-700'}`}>
                {format(day, 'd')}
              </div>
              <div className="text-xs text-zinc-600 mt-0.5">{format(day, 'MMM')}</div>
            </div>

            <div className="space-y-1.5">
              {dayPosts.map(p => <PostCard key={p.id} post={p} onCycle={onCycle} onDelete={onDelete} onEdit={onEdit} />)}
            </div>

            {isAdding ? (
              <AddPostForm
                date={day}
                onAdd={p => { onAdd(p); setAddingDay(null); }}
                onClose={() => setAddingDay(null)}
              />
            ) : (
              <button onClick={() => setAddingDay(day)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-zinc-600 hover:text-violet-500 hover:bg-violet-50 rounded-lg border border-dashed border-zinc-200 hover:border-violet-300 transition-all">
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
export const MonthView = ({ monthStart, posts, onAdd, onCycle, onDelete, onEdit }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [addingToDay, setAddingToDay] = useState(false);

  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd   = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const selDs     = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selPosts  = selectedDay ? posts.filter(p => p.date === selDs && p.talent === talent) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-zinc-600 uppercase tracking-widest py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const ds         = format(day, 'yyyy-MM-dd');
          const dayPosts   = posts.filter(p => p.date === ds);
          const inMonth    = isSameMonth(day, monthStart);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const today      = isToday(day);

          const byStatus = {
            draft:     dayPosts.filter(p => p.status === 'draft').length,
            scheduled: dayPosts.filter(p => p.status === 'scheduled').length,
            posted:    dayPosts.filter(p => p.status === 'posted').length,
          };

          return (
            <button key={ds}
              onClick={() => { setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day); setAddingToDay(false); }}
              className={`relative p-1.5 rounded-xl min-h-[60px] text-left transition-all border ${
                !inMonth   ? 'opacity-25 border-transparent bg-transparent'
                : isSelected ? 'bg-violet-500/20 border-violet-500/40 ring-1 ring-violet-500/30'
                : today    ? 'bg-violet-500/10 border-violet-500/20'
                : 'bg-white border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200'
              }`}>
              <div className={`text-xs font-bold mb-1.5 ${today ? 'text-violet-500' : isSelected ? 'text-violet-600' : 'text-zinc-500'}`}>
                {format(day, 'd')}
              </div>
              {dayPosts.length > 0 && (
                <div className="flex flex-wrap gap-0.5 items-center">
                  {byStatus.draft     > 0 && <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"    title={`${byStatus.draft} draft`} />}
                  {byStatus.scheduled > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"   title={`${byStatus.scheduled} scheduled`} />}
                  {byStatus.posted    > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title={`${byStatus.posted} posted`} />}
                  {dayPosts.length > 4 && (
                    <span className="text-[11px] text-zinc-600 leading-none">+{dayPosts.length - 4}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="relative bg-white rounded-2xl ring-1 ring-violet-200 p-5 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <VioletBg />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900">{format(selectedDay, 'EEEE, MMMM d yyyy')}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{selPosts.length} post{selPosts.length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => setAddingToDay(v => !v)}
                className="flex items-center gap-1.5 text-xs bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/25 px-3 py-1.5 rounded-lg transition-all">
                <Plus size={12} /> Add Post
              </button>
            </div>

            {addingToDay && (
              <div className="mb-4">
                <AddPostForm
                  date={selectedDay}
                  onAdd={p => { onAdd(p); setAddingToDay(false); }}
                  onClose={() => setAddingToDay(false)}
                />
              </div>
            )}

            {selPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selPosts.map(p => <PostCard key={p.id} post={p} onCycle={onCycle} onDelete={onDelete} onEdit={onEdit} />)}
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
