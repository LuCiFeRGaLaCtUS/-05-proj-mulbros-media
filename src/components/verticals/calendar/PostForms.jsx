import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Clock, Loader2, Trash2, Pencil, X, Sparkles,
} from 'lucide-react';
import { callAIFast } from '../../../utils/ai';
import { platformsForVertical, PLATFORM_STYLE, STATUS_CFG } from './constants';
import { useAppContext } from '../../../App';

// ── Edit Post modal form ──────────────────────────────────────────────────────
export const EditPostForm = ({ post, onSave, onClose }) => {
  const { profile }  = useAppContext();
  const vertical     = post.vertical || profile?.vertical || 'musician';
  const platforms    = platformsForVertical(vertical);
  const [platform, setPlatform] = useState(post.platform);
  const [content,  setContent]  = useState(post.content || '');
  const [time,     setTime]     = useState(post.scheduledTime || '');
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await onSave(post.id, { platform, content: content.trim(), scheduledTime: time || null });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl ring-1 ring-violet-500/20 p-5 space-y-4 shadow-xl animate-hud-in" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/40 via-white to-white rounded-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Edit Post</h3>
            <p className="text-xs text-zinc-500 mt-0.5 capitalize">{vertical} · {post.date}</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-700 transition-colors p-1"><X size={16} /></button>
        </div>
        <div className="relative z-10 flex flex-wrap gap-1.5">
          {platforms.map(p => (
            <button key={p.key} onClick={() => setPlatform(p.key)}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                platform === p.key
                  ? PLATFORM_STYLE[p.key] || 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:text-zinc-700'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="relative z-10">
          <textarea rows={5} value={content} onChange={e => setContent(e.target.value)} placeholder="Post content…"
            className="w-full bg-white text-zinc-900 text-xs rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-violet-500/50 resize-none placeholder-zinc-400 leading-relaxed" />
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="bg-white text-zinc-700 text-xs rounded-lg px-2 py-1.5 border border-zinc-200 focus:outline-none focus:border-violet-500/40 w-28" />
          <div className="flex-1" />
          <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-700 px-3 py-1.5 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!content.trim() || saving}
            className="text-xs bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-100 disabled:text-zinc-600 text-white px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5">
            {saving && <Loader2 size={11} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Post card ─────────────────────────────────────────────────────────────────
export const PostCard = ({ post, onCycle, onDelete, onEdit }) => {
  const { profile } = useAppContext();
  const vertical    = post.vertical || profile?.vertical || 'musician';
  const st          = STATUS_CFG[post.status] || STATUS_CFG.draft;
  const { Icon }    = st;
  const plStyle     = PLATFORM_STYLE[post.platform] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
  const plLabel     = platformsForVertical(vertical).find(p => p.key === post.platform)?.label || post.platform;

  return (
    <div className="relative bg-white rounded-xl ring-1 ring-violet-200 p-2.5 overflow-hidden group" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-white to-white pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full border ${plStyle}`}>{plLabel}</span>
          <button onClick={() => onCycle(post.id)} title="Click to advance status"
            className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full transition-all hover:brightness-125 border border-transparent ${st.badge}`}>
            <Icon size={9} /> {st.label}
          </button>
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(post)} title="Edit post" className="text-zinc-600 hover:text-violet-400 p-0.5 transition-colors"><Pencil size={10} /></button>
            <button onClick={() => onDelete(post.id)} title="Delete post" className="text-zinc-600 hover:text-red-400 p-0.5 transition-colors"><Trash2 size={10} /></button>
          </div>
        </div>
        <p className="text-xs text-zinc-700 leading-snug line-clamp-3 whitespace-pre-line">{post.content}</p>
        {post.scheduledTime && post.status === 'scheduled' && (
          <div className="flex items-center gap-1 mt-1.5 text-zinc-500">
            <Clock size={9} /><span className="text-xs">{post.scheduledTime}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Add Post form ─────────────────────────────────────────────────────────────
export const AddPostForm = ({ date, onAdd, onClose }) => {
  const { profile } = useAppContext();
  const vertical    = profile?.vertical || 'musician';
  const platforms   = platformsForVertical(vertical);
  const [platform,   setPlatform]   = useState(platforms[0]?.key || '');
  const [content,    setContent]    = useState('');
  const [time,       setTime]       = useState('');
  const [suggesting, setSuggesting] = useState(false);

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const plLabel   = platforms.find(p => p.key === platform)?.label || platform;
      const answers   = profile?.onboarding_data?.answers || {};
      const who       = profile?.display_name || profile?.email?.split('@')[0] || 'the creator';
      const ctxLines  = [
        `You are a social media strategist for MulBros Media.`,
        `Creator: ${who}`,
        `Vertical: ${vertical}`,
        answers.genre        && `Genre: ${answers.genre}`,
        answers.speciality   && `Speciality: ${answers.speciality}`,
        answers.goal         && `Goal: ${answers.goal}`,
        answers.seeking      && `Seeking: ${answers.seeking}`,
        answers.role         && `Role: ${answers.role}`,
        answers.primary_range && `Range: ${answers.primary_range}`,
        `Platform: ${plLabel}`,
        `Post date: ${format(date, 'EEEE, MMMM d yyyy')}`,
        ``,
        `Generate exactly 3 content ideas as a numbered list. Each idea: one-line bold title + one sentence hook. Under 130 words. No preamble.`,
      ].filter(Boolean).join('\n');
      const result = await callAIFast(ctxLines, [{ role: 'user', content: 'Generate 3 ideas.' }]);
      setContent(result.trim());
    } catch {
      setContent('Could not generate — add your OpenAI key in Settings to enable AI suggestions.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleAdd = () => {
    if (!content.trim()) return;
    onAdd({
      date: format(date, 'yyyy-MM-dd'),
      vertical,
      platform,
      content: content.trim(),
      scheduledTime: time || null,
      status: 'draft',
    });
    onClose();
  };

  return (
    <div className="bg-white rounded-xl border border-violet-200 p-3 space-y-2.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex flex-wrap gap-1">
        {platforms.map(p => (
          <button key={p.key} onClick={() => setPlatform(p.key)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
              platform === p.key
                ? `${PLATFORM_STYLE[p.key]}`
                : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:text-zinc-700'
            }`}>
            {p.label}
          </button>
        ))}
      </div>
      <textarea rows={3} value={content} onChange={e => setContent(e.target.value)}
        placeholder={`Write your ${format(date, 'MMM d')} post…`}
        className="w-full bg-white text-zinc-900 text-xs rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-violet-500/50 resize-none placeholder-zinc-400 leading-relaxed" />
      <div className="flex items-center gap-2 flex-wrap">
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="bg-white text-zinc-700 text-xs rounded-lg px-2 py-1.5 border border-zinc-200 focus:outline-none focus:border-violet-500/40 w-28" />
        <button onClick={handleSuggest} disabled={suggesting}
          className="flex items-center gap-1.5 text-xs bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/25 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50">
          {suggesting ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          AI Suggest
        </button>
        <div className="flex-1" />
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1.5 transition-colors">Cancel</button>
        <button onClick={handleAdd} disabled={!content.trim()}
          className="text-xs bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-100 disabled:text-zinc-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-all">
          Add post
        </button>
      </div>
    </div>
  );
};
