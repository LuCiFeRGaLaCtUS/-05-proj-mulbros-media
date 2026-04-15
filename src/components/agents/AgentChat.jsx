import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Send, Loader2 } from 'lucide-react';
import { AgentSelector } from './AgentSelector';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { SuggestedPrompts } from './SuggestedPrompts';
import { getAgentById } from '../../config/agents';
import { callClaude, getApiKey } from '../../utils/claude';

export const AgentChat = ({ preselectedAgentId, onClose }) => {
  const [selectedAgent, setSelectedAgent] = useState(preselectedAgentId || 'film-financing-discovery');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const agent = getAgentById(selectedAgent) || getAgentById('film-financing-discovery');

  useEffect(() => {
    if (preselectedAgentId && preselectedAgentId !== selectedAgent) {
      setSelectedAgent(preselectedAgentId);
    }
  }, [preselectedAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Go to Settings > API Keys.');
      }

      const response = await callClaude(
        agent.systemPrompt,
        newMessages,
        apiKey
      );

      setMessages([...newMessages, { role: 'assistant', content: response }]);
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

      <div className="flex-1 flex flex-col bg-zinc-950">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-zinc-100 mb-2">{agent.name}</h2>
                <p className="text-zinc-400">{agent.description}</p>
              </div>
              <SuggestedPrompts
                agentId={selectedAgent}
                onSelectPrompt={handlePromptSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  agentName={agent.name}
                />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}...`}
              className="flex-1 bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 placeholder:text-zinc-500 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 resize-none transition-all"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 rounded-lg px-4 transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
};