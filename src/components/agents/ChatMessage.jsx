import React, { useState } from 'react';
import { Copy, Check, Zap } from 'lucide-react';
import { verticalColors } from '../../config/verticalColors';

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
            border: `1px solid ${vc.neon}35`,
            color: vc.neon,
            boxShadow: `0 0 10px ${vc.neon}15`,
            flexShrink: 0,
          }}>
          {initials(agentName)}
          {/* Online indicator */}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.7)', border: '1.5px solid #050507' }} />
        </div>
      )}

      <div className={`group max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>

        {/* Agent meta row */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-xs font-bold" style={{ color: vc.neon }}>
              {agentName}
            </span>
            <span className="chip" style={{
              background: `${vc.neon}10`,
              color: `${vc.neon}80`,
              border: `1px solid ${vc.neon}20`,
              fontSize: '8px',
            }}>
              AI
            </span>
            {message.timestamp && (
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>
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
            background: 'rgba(14,14,22,0.95)',
            border: `1px solid ${vc.neon}18`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.4), ${vc.glow ? vc.glow.replace('16px', '8px') : ''}`,
            padding: '12px 16px',
          }}>

          {/* Agent bg glow */}
          {!isUser && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top left, ${vc.dim}, transparent 70%)` }} />
          )}

          {/* Content */}
          <p className={`relative z-10 whitespace-pre-wrap leading-relaxed text-sm ${
            isUser ? 'text-zinc-950 font-semibold' : 'text-zinc-200'
          }`}>
            {message.content}
          </p>

          {/* Copy button — agent messages */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="Copy response"
            >
              {copied
                ? <Check size={12} style={{ color: '#34d399' }} />
                : <Copy size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
              }
            </button>
          )}
        </div>

        {/* User timestamp */}
        {isUser && message.timestamp && (
          <div className="flex justify-end mt-1 px-1">
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>
              {message.timestamp}
            </span>
          </div>
        )}
      </div>

      {/* User avatar — right side */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#f59e0b',
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
          border: `1px solid ${vc.neon}35`,
          color: vc.neon,
          flexShrink: 0,
        }}>
        {initials(agentName || 'AI')}
      </div>

      <div className="rounded-2xl rounded-bl-sm px-5 py-4 relative overflow-hidden"
        style={{
          background: 'rgba(14,14,22,0.95)',
          border: `1px solid ${vc.neon}18`,
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top left, ${vc.dim}, transparent 70%)` }} />
        <div className="relative z-10 flex items-center gap-3">
          {/* Neural dots */}
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full neural-dot"
              style={{ background: vc.neon, boxShadow: `0 0 4px ${vc.neon}` }} />
            <span className="w-1.5 h-1.5 rounded-full neural-dot"
              style={{ background: vc.neon, boxShadow: `0 0 4px ${vc.neon}` }} />
            <span className="w-1.5 h-1.5 rounded-full neural-dot"
              style={{ background: vc.neon, boxShadow: `0 0 4px ${vc.neon}` }} />
          </div>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
            neural link active
          </span>
          <Zap size={10} style={{ color: vc.neon, opacity: 0.6 }} />
        </div>
      </div>
    </div>
  );
};
