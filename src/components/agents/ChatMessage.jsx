import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const verticalColors = {
  financing: { bg: 'bg-blue-500/15',    text: 'text-blue-400'    },
  film:      { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  music:     { bg: 'bg-amber-500/15',   text: 'text-amber-400'   },
  composer:  { bg: 'bg-amber-500/15',   text: 'text-amber-400'   },
  community: { bg: 'bg-purple-500/15',  text: 'text-purple-400'  },
  strategy:  { bg: 'bg-rose-500/15',    text: 'text-rose-400'    },
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
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Agent avatar */}
      {!isUser && (
        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${vc.bg} ${vc.text}`}>
          {initials(agentName)}
        </div>
      )}

      <div className={`group max-w-[78%] ${isUser ? '' : ''}`}>
        {/* Agent name + timestamp */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${vc.text}`}>{agentName}</span>
            {message.timestamp && (
              <span className="text-xs text-zinc-600">{message.timestamp}</span>
            )}
          </div>
        )}

        <div className={`relative overflow-hidden ${
          isUser
            ? 'bg-gradient-to-br from-amber-500 to-yellow-400 text-zinc-950 rounded-2xl rounded-br-sm p-4 shadow-md shadow-amber-500/20'
            : 'bg-zinc-900 border border-zinc-800/80 rounded-2xl rounded-bl-sm p-4'
        }`}>
          {!isUser && (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/30 via-zinc-900 to-zinc-950 pointer-events-none" />
          )}
          <p className={`relative z-10 whitespace-pre-wrap leading-relaxed ${isUser ? 'text-zinc-950 font-medium' : 'text-zinc-200'}`}>{message.content}</p>

          {/* Copy button — assistant messages only */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              title="Copy"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          )}
        </div>

        {/* User timestamp */}
        {isUser && message.timestamp && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-zinc-600">{message.timestamp}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const TypingIndicator = ({ agentName, vertical }) => {
  const vc = verticalColors[vertical] || verticalColors.financing;
  return (
    <div className="flex gap-3 justify-start">
      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${vc.bg} ${vc.text}`}>
        {initials(agentName || 'AI')}
      </div>
      <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800/80 rounded-2xl rounded-bl-sm p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/30 via-zinc-900 to-zinc-950 pointer-events-none" />
        <div className="relative z-10 flex gap-1">
          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
