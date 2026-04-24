import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../App';
import { useNotifications } from '../../hooks/useNotifications';

const timeAgo = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

export const NotificationBell = () => {
  const { profile }    = useAppContext();
  const navigate       = useNavigate();
  const { items, unreadCount, markRead, markAllRead } = useNotifications(profile?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = async (n) => {
    if (!n.read_at) await markRead(n.id);
    if (n.link) { setOpen(false); navigate(n.link); }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative p-2 rounded-lg text-zinc-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-hidden bg-white rounded-2xl shadow-lg border border-zinc-200 z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
            <div className="text-sm font-bold text-zinc-900">Notifications</div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1">
                  <Check size={11} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-zinc-500">You're all caught up.</div>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors flex items-start gap-2 ${
                    !n.read_at ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {!n.read_at && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-zinc-900 leading-snug">{n.title}</div>
                    {n.body && <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</div>}
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono">{timeAgo(n.created_at)} ago</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
