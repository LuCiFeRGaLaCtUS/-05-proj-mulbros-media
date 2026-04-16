import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Send, Loader2 } from 'lucide-react';
import { AgentSelector } from './AgentSelector';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { SuggestedPrompts } from './SuggestedPrompts';
import { getAgentById } from '../../config/agents';
import { callClaude, getApiKey } from '../../utils/claude';

const verticalColors = {
  financing: { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/20'    },
  film:      { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  music:     { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  composer:  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  community: { bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-purple-500/20'  },
  strategy:  { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/20'    },
};

const initials = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const AgentChat = ({ preselectedAgentId, onClose }) => {
  const [selectedAgent, setSelectedAgent] = useState(preselectedAgentId || 'film-financing-discovery');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const agent = getAgentById(selectedAgent) || getAgentById('film-financing-discovery');
  const vc = verticalColors[agent?.vertical] || verticalColors.financing;

  useEffect(() => {
    if (preselectedAgentId && preselectedAgentId !== selectedAgent) {
      setSelectedAgent(preselectedAgentId);
      setMessages([]);
    }
  }, [preselectedAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, timestamp: now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Go to Settings → API Keys and paste your OpenAI key.');
      }

      // Strip timestamps before sending to API
      const apiMessages = newMessages.map(({ role, content }) => ({ role, content }));
      const response = await callClaude(agent.systemPrompt, apiMessages, apiKey);

      setMessages([...newMessages, { role: 'assistant', content: response, timestamp: now() }]);
    } catch (error) {
      toast.error(error.message || 'Failed to get response from agent');
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (prompt) => {
    setInput(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)]">
      <AgentSelector
        selectedAgent={selectedAgent}
        onSelectAgent={(id) => {
          setSelectedAgent(id);
          setMessages([]);
        }}
      />

      <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            /* ── Empty state ── */
            <div className="h-full flex flex-col justify-center items-center">
              <div className={`w-16 h-16 rounded-2xl ${vc.bg} flex items-center justify-center mb-4`}>
                <span className={`text-2xl font-bold ${vc.text}`}>{initials(agent.name)}</span>
              </div>
              <h2 className={`text-xl font-bold mb-1 ${vc.text}`}>{agent.name}</h2>
              <p className="text-sm text-zinc-500 text-center max-w-sm mb-8 leading-relaxed">
                {agent.description}
              </p>
              <SuggestedPrompts agentId={selectedAgent} onSelectPrompt={handlePromptSelect} />
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  agentName={agent.name}
                  vertical={agent.vertical}
                />
              ))}
              {isLoading && <TypingIndicator agentName={agent.name} vertical={agent.vertical} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className={`p-4 border-t border-zinc-800`}>
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}…`}
              className={`flex-1 bg-zinc-800 text-zinc-200 rounded-xl px-4 py-3 placeholder:text-zinc-500 border border-zinc-700/50 focus:outline-none focus:${vc.border} resize-none transition-all`}
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`${vc.bg} hover:opacity-80 disabled:bg-zinc-700 ${vc.text} disabled:text-zinc-500 rounded-xl px-4 transition-all flex items-center justify-center border ${vc.border}`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
};
