import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

/**
 * DatePicker — functional, white-theme calendar matching the app.
 * Drop-in for <input type="date"> / <input type="datetime-local">.
 *
 * Props:
 *   value      ISO string — 'YYYY-MM-DD' (date) or 'YYYY-MM-DDTHH:mm' (withTime)
 *   onChange   (iso: string) => void
 *   withTime   include a time field; emits 'YYYY-MM-DDTHH:mm'
 *   label      optional field label
 *   placeholder, disabled, minWidth, className
 */

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ACCENT = '#0F6E56';
const pad = (n) => String(n).padStart(2, '0');

const parseISO = (v) => {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0));
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmtISO = (d, withTime) => {
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return withTime ? `${base}T${pad(d.getHours())}:${pad(d.getMinutes())}` : base;
};
const fmtDisplay = (d, withTime) => {
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return withTime ? `${date}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : date;
};
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const DatePicker = ({
  value,
  onChange,
  withTime = false,
  label,
  placeholder = withTime ? 'Select date & time' : 'Select date',
  disabled = false,
  minWidth = 220,
  className = '',
}) => {
  const selected = useMemo(() => parseISO(value), [value]);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [yearMode, setYearMode] = useState(false);
  const [view, setView] = useState(() => {
    const base = selected || today;
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const rootRef = useRef(null);

  // Re-sync view to the selected value when it changes externally
  useEffect(() => {
    if (selected) setView({ y: selected.getFullYear(), m: selected.getMonth() });
  }, [selected]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) { setOpen(false); setYearMode(false); } };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setYearMode(false); } };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(view.y, view.m, 1).getDay();
    const start = 1 - firstWeekday;
    return Array.from({ length: 42 }, (_, i) => new Date(view.y, view.m, start + i));
  }, [view]);

  const shiftMonth = (delta) => {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const pick = (cellDate) => {
    const hh = selected && withTime ? selected.getHours() : (withTime ? 10 : 0);
    const mm = selected && withTime ? selected.getMinutes() : 0;
    const next = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), hh, mm);
    onChange?.(fmtISO(next, withTime));
    setView({ y: next.getFullYear(), m: next.getMonth() });
    if (!withTime) { setOpen(false); }
  };

  const setTime = (timeStr) => {
    const [h, m] = (timeStr || '').split(':').map(Number);
    const base = selected || new Date(view.y, view.m, today.getDate());
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h || 0, m || 0);
    onChange?.(fmtISO(next, true));
  };

  const timeValue = selected && withTime ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : '10:00';

  return (
    <div ref={rootRef} className={`relative ${className}`} style={{ minWidth }}>
      {label && (
        <label className="block text-xs font-semibold text-zinc-700 mb-1">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
        style={{
          border: `1px solid ${open ? ACCENT : '#E0E0E0'}`,
          background: disabled ? '#F5F6F8' : '#FFFFFF',
          color: selected ? '#0B1D3A' : '#9aa3b0',
          boxShadow: open ? `0 0 0 2px rgba(15,110,86,0.18)` : '0 1px 2px rgba(11,29,58,0.04)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span className="truncate">{selected ? fmtDisplay(selected, withTime) : placeholder}</span>
        <CalendarIcon size={15} style={{ color: '#9aa3b0', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute z-50 mt-2 rounded-2xl p-3"
          style={{ background: '#FFFFFF', border: '1px solid #E0E0E0', boxShadow: '0 16px 40px rgba(11,29,58,0.16), 0 2px 8px rgba(11,29,58,0.08)', width: 280 }}
        >
          {/* Header */}
          <div className="flex items-center gap-1 mb-2">
            <button
              type="button"
              onClick={() => setYearMode(y => !y)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold hover:bg-zinc-100 transition-colors"
              style={{ color: '#0B1D3A' }}
            >
              {MONTHS[view.m]} {view.y}
              <ChevronDown size={14} style={{ color: '#9aa3b0', transform: yearMode ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
            </button>
            <div className="flex-1" />
            <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}
              className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-zinc-100 transition-colors" style={{ color: '#5a6472' }}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}
              className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-zinc-100 transition-colors" style={{ color: '#5a6472' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {yearMode ? (
            <div className="grid grid-cols-4 gap-1 max-h-56 overflow-auto">
              {Array.from({ length: 25 }, (_, i) => view.y - 12 + i).map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => { setView(v => ({ ...v, y: yr })); setYearMode(false); }}
                  className="h-8 rounded-lg text-[13px] transition-colors"
                  style={yr === view.y
                    ? { background: ACCENT, color: '#FFFFFF', fontWeight: 600 }
                    : { color: '#0B1D3A' }}
                  onMouseEnter={(e) => { if (yr !== view.y) e.currentTarget.style.background = '#F1F3F5'; }}
                  onMouseLeave={(e) => { if (yr !== view.y) e.currentTarget.style.background = 'transparent'; }}
                >
                  {yr}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-1">
                {WEEK_DAYS.map((w) => (
                  <div key={w} className="text-center text-[11px] font-semibold py-1" style={{ color: '#9aa3b0' }}>{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((cd, i) => {
                  const outside = cd.getMonth() !== view.m;
                  const isSel = sameDay(cd, selected);
                  const isToday = sameDay(cd, today);
                  return (
                    <div key={i} className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => pick(cd)}
                        className="flex items-center justify-center w-8 h-8 rounded-full text-[13px] transition-colors"
                        style={isSel
                          ? { background: ACCENT, color: '#FFFFFF', fontWeight: 600 }
                          : { color: outside ? '#c2c8d0' : '#0B1D3A', fontWeight: isToday ? 700 : 400, border: isToday ? `1px solid ${ACCENT}55` : '1px solid transparent' }}
                        onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = '#F1F3F5'; }}
                        onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {cd.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>

              {withTime && (
                <div className="flex items-center justify-between gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #EEF0F2' }}>
                  <span className="text-xs font-semibold text-zinc-600">Time</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={timeValue}
                      onChange={(e) => setTime(e.target.value)}
                      className="rounded-lg px-2 py-1 text-sm outline-none"
                      style={{ border: '1px solid #E0E0E0', color: '#0B1D3A' }}
                    />
                    <button type="button" onClick={() => { setOpen(false); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: ACCENT }}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
