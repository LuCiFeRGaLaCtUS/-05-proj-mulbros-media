import React, { useState } from 'react';
import { Copy, Check, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { verticalColors } from '../../config/verticalColors';

// Markdown renderer — minimal, safe defaults. Tailwind classes via prose-like
// inline styles; no plugins beyond GFM (tables, strikethrough, task lists).
const MD_COMPONENTS = {
  p:      ({ node, ...p }) => <p {...p} className="mb-2 last:mb-0" />,
  strong: ({ node, ...p }) => <strong {...p} className="font-bold" />,
  em:     ({ node, ...p }) => <em {...p} className="italic" />,
  ul:     ({ node, ...p }) => <ul {...p} className="list-disc pl-5 my-2 space-y-1" />,
  ol:     ({ node, ...p }) => <ol {...p} className="list-decimal pl-5 my-2 space-y-1" />,
  li:     ({ node, ...p }) => <li {...p} className="leading-relaxed" />,
  h1:     ({ node, ...p }) => <h1 {...p} className="text-lg font-bold mt-3 mb-2" />,
  h2:     ({ node, ...p }) => <h2 {...p} className="text-base font-bold mt-3 mb-2" />,
  h3:     ({ node, ...p }) => <h3 {...p} className="text-sm font-bold mt-2 mb-1" />,
  a:      ({ node, ...p }) => <a {...p} target="_blank" rel="noopener noreferrer" className="text-amber-600 underline hover:text-amber-700" />,
  code:   ({ node, inline, ...p }) => inline
    ? <code {...p} className="px-1 py-0.5 rounded bg-zinc-100 text-[13px] font-mono text-zinc-800" />
    : <code {...p} className="block p-3 rounded-lg bg-zinc-900 text-zinc-100 text-[13px] font-mono overflow-x-auto" />,
  pre:    ({ node, ...p }) => <pre {...p} className="my-2" />,
  blockquote: ({ node, ...p }) => <blockquote {...p} className="border-l-2 border-amber-400 pl-3 my-2 italic text-zinc-700" />,
  table:  ({ node, ...p }) => <table {...p} className="my-2 border-collapse text-sm" />,
  th:     ({ node, ...p }) => <th {...p} className="border border-zinc-300 px-2 py-1 bg-zinc-100 font-semibold text-left" />,
  td:     ({ node, ...p }) => <td {...p} className="border border-zinc-300 px-2 py-1" />,
  hr:     ({ node, ...p }) => <hr {...p} className="my-3 border-zinc-200" />,
};

// ── Tool-call result card ─────────────────────────────────────────────────────
// ChatThread emits each executed tool call as a fenced ```toolcall block whose
// body is JSON { name, ok, args, result }. We parse those out and render a
// formatted result tile instead of raw JSON in the chat.
const TOOL_LABELS = {
  'audition.create':         'Audition logged',
  'audition.update_status':  'Audition updated',
  'tour.create':             'Tour created',
  'show.create':             'Show added',
  'show.update_status':      'Show updated',
  'release.create':          'Release created',
  'track.add':               'Track added',
  'commission.create':       'Commission tracked',
  'commission.mark_collected': 'Commission collected',
  'roster.add':              'Talent added to roster',
  'epk.upsert':              'EPK saved',
  'epk.publish':             'EPK published',
  'industry_contact.create': 'Contact saved',
  'submission.draft':        'Submission drafted',
  'resend.email':            'Email drafted',
  'twilio.sms':              'SMS drafted',
};

const humanizeKey = (k) =>
  String(k).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ISO_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/;
const formatValue = (key, val) => {
  if (val == null) return '';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  const s = String(val);
  // Format date-ish fields nicely
  if ((/(_at|date|deadline|_on)$/i.test(key) || ISO_RE.test(s)) && ISO_RE.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      const hasTime = /[T ]\d{2}:\d{2}/.test(s);
      return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        ...(hasTime ? { hour: 'numeric', minute: '2-digit' } : {}),
      });
    }
  }
  return s.length > 160 ? s.slice(0, 157) + '…' : s;
};

const friendlyToolName = (name) => {
  if (TOOL_LABELS[name]) return TOOL_LABELS[name];
  const parts = String(name || 'action').split('.');
  return humanizeKey(parts[parts.length - 1] || name);
};

const ToolCallCard = ({ data }) => {
  const ok = data?.ok !== false;
  const rows = Object.entries(data?.args || {})
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => [humanizeKey(k), formatValue(k, v)])
    .filter(([, v]) => v !== '');
  return (
    <div className="my-2 rounded-xl overflow-hidden" style={{
      border: `1px solid ${ok ? 'rgba(5,150,105,0.25)' : 'rgba(217,119,6,0.3)'}`,
      background: ok ? 'rgba(5,150,105,0.04)' : 'rgba(217,119,6,0.05)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5" style={{
        background: ok ? 'rgba(5,150,105,0.08)' : 'rgba(217,119,6,0.1)',
        borderBottom: rows.length ? `1px solid ${ok ? 'rgba(5,150,105,0.15)' : 'rgba(217,119,6,0.2)'}` : 'none',
      }}>
        {ok
          ? <CheckCircle2 size={15} style={{ color: '#059669' }} />
          : <AlertTriangle size={15} style={{ color: '#d97706' }} />}
        <span className="text-[13px] font-bold" style={{ color: ok ? '#065f46' : '#92400e' }}>
          {friendlyToolName(data?.name)}
        </span>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-wider" style={{ color: ok ? '#059669' : '#d97706' }}>
          {ok ? 'Done' : 'Needs attention'}
        </span>
      </div>
      {rows.length > 0 && (
        <div className="px-3.5 py-2.5 grid gap-1.5" style={{ gridTemplateColumns: 'auto 1fr' }}>
          {rows.map(([k, v]) => (
            <React.Fragment key={k}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 pr-3 whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)' }}>{k}</div>
              <div className="text-[13px] text-zinc-800 break-words">{v}</div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// Split agent content into markdown chunks + tool-call cards.
const TOOLCALL_RE = /```toolcall\s*\n([\s\S]*?)\n```/g;
const renderAgentContent = (content) => {
  const src = content || '';
  if (!src.includes('```toolcall')) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{src}</ReactMarkdown>;
  }
  const nodes = [];
  let last = 0, m, i = 0;
  TOOLCALL_RE.lastIndex = 0;
  while ((m = TOOLCALL_RE.exec(src)) !== null) {
    const before = src.slice(last, m.index).trim();
    if (before) nodes.push(<ReactMarkdown key={`md-${i}`} remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{before}</ReactMarkdown>);
    let parsed = null;
    try { parsed = JSON.parse(m[1]); } catch { /* keep raw fallback below */ }
    if (parsed) nodes.push(<ToolCallCard key={`tc-${i}`} data={parsed} />);
    else nodes.push(<ReactMarkdown key={`raw-${i}`} remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{m[0]}</ReactMarkdown>);
    last = m.index + m[0].length;
    i++;
  }
  const tail = src.slice(last).trim();
  if (tail) nodes.push(<ReactMarkdown key={`md-tail`} remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{tail}</ReactMarkdown>);
  return <>{nodes}</>;
};

const initials = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const ChatMessage = ({ message, agentName, vertical }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const vc = verticalColors[vertical] || verticalColors.financing;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-left`}>

      {/* Agent avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold relative"
          style={{
            background: vc.dim,
            border: `1px solid ${vc.neon}45`,
            color: vc.ink,
            boxShadow: `0 0 10px ${vc.neon}15`,
            flexShrink: 0,
          }}>
          {initials(agentName)}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.7)', border: '1.5px solid #ffffff' }} />
        </div>
      )}

      <div className={`group max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>

        {/* Agent meta row */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-xs font-bold" style={{ color: vc.ink }}>
              {agentName}
            </span>
            <span className="chip" style={{
              background: `${vc.neon}14`,
              color: vc.ink,
              border: `1px solid ${vc.neon}40`,
              fontSize: '11px',
            }}>
              AI
            </span>
            {message.timestamp && (
              <span className="text-xs font-mono text-zinc-500">
                {message.timestamp}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className={`relative ${
          isUser ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
        } overflow-hidden`}
          style={isUser ? {
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 60%, #f59e0b 100%)',
            boxShadow: '0 4px 20px rgba(245,158,11,0.25), 0 0 0 1px rgba(245,158,11,0.3)',
            padding: '12px 16px',
          } : {
            background: '#ffffff',
            border: `1px solid ${vc.neon}30`,
            boxShadow: `0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)`,
            padding: '12px 16px',
          }}>

          {/* Agent bg glow */}
          {!isUser && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top left, ${vc.dim}, transparent 70%)` }} />
          )}

          {/* Content — user messages stay plain text; agent messages render markdown */}
          {isUser ? (
            <p className="relative z-10 whitespace-pre-wrap leading-relaxed text-[15px] text-zinc-950 font-semibold">
              {message.content}
            </p>
          ) : (
            <div className="relative z-10 leading-relaxed text-[15px] text-zinc-800">
              {renderAgentContent(message.content)}
            </div>
          )}

          {/* Copy button — agent messages */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
              title="Copy response"
            >
              {copied
                ? <Check size={12} style={{ color: '#059669' }} />
                : <Copy size={12} className="text-zinc-600" />
              }
            </button>
          )}
        </div>

        {/* User timestamp */}
        {isUser && message.timestamp && (
          <div className="flex justify-end mt-1 px-1">
            <span className="text-xs font-mono text-zinc-500">
              {message.timestamp}
            </span>
          </div>
        )}
      </div>

      {/* User avatar — right side */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))',
            border: '1px solid rgba(245,158,11,0.35)',
            color: '#b45309',
            flexShrink: 0,
          }}>
          AC
        </div>
      )}
    </div>
  );
};

export const TypingIndicator = ({ agentName, vertical }) => {
  const vc = verticalColors[vertical] || verticalColors.financing;
  return (
    <div className="flex gap-3 justify-start animate-slide-left">
      <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{
          background: vc.dim,
          border: `1px solid ${vc.neon}45`,
          color: vc.ink,
          flexShrink: 0,
        }}>
        {initials(agentName || 'AI')}
      </div>

      <div className="rounded-2xl rounded-bl-sm px-5 py-4 relative overflow-hidden"
        style={{
          background: '#ffffff',
          border: `1px solid ${vc.neon}30`,
          boxShadow: `0 1px 3px rgba(0,0,0,0.06)`,
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top left, ${vc.dim}, transparent 70%)` }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full neural-dot"
              style={{ background: vc.neon, boxShadow: `0 0 4px ${vc.neon}` }} />
            <span className="w-1.5 h-1.5 rounded-full neural-dot"
              style={{ background: vc.neon, boxShadow: `0 0 4px ${vc.neon}` }} />
            <span className="w-1.5 h-1.5 rounded-full neural-dot"
              style={{ background: vc.neon, boxShadow: `0 0 4px ${vc.neon}` }} />
          </div>
          <span className="text-xs font-mono text-zinc-600">
            neural link active
          </span>
          <Zap size={10} style={{ color: vc.ink }} />
        </div>
      </div>
    </div>
  );
};
