import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDataForAI } from '../../utils/appData';
import { createActionHandlers, parseUserIntent, getQuickResponses } from '../../utils/appActions';
import { callOpenRouter, getApiKey } from '../../utils/claude';

const chatbotSystemPrompt = `You are the Mulbros Global Assistant - an AI that helps users navigate and get information from the Mulbros Marketing OS web application.

You have access to ALL data in the system. Here's the current data:

${formatDataForAI()}

IMPORTANT CAPABILITIES:
1. You can ANSWER QUESTIONS about any data above with specific numbers
2. You can NAVIGATE the app - just tell me "go to [page]" and I'll switch pages
3. You can OPEN the Content Studio - tell me "generate content" or "create [type]"
4. You can OPEN Agent Chat - tell me "chat with [agent name]"

RESPONSE STYLE:
- Be concise and specific with numbers
- Offer to take actions when relevant
- If user asks about data, provide exact figures
- If user wants to navigate, confirm first then navigate

EXAMPLES:
- "How much did Luke make?" → "Luke made $42,000 total: $18K delivered (Last County), $12K in progress (Saltwater), $35K negotiating (Echo Valley)."
- "Go to Talent Manager" → I'll navigate there
- "What's in the pipeline?" → Show Luke's pipeline summary

Answer the user's question or request based on the data above.`;

export const FloatingChatbot = ({ appState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Mulbros Global Assistant. I can help you with:\n\n• Luke's revenue and pipeline\n• Talise's streaming stats\n• Campaign status\n• Community metrics\n• Navigate to any page\n• Generate content\n• Chat with agents\n\nJust ask me a question!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const actions = createActionHandlers(appState);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Go to Settings > API Keys.');
      }

      const intent = parseUserIntent(userMessage);
      let quickResponse = getQuickResponses(intent);
      
      const shouldUseAI = !['help', 'lukeRevenue', 'lukePipeline', 'taliseStats', 'lastCounty', 'campaigns', 'community', 'analytics'].includes(intent);

      if (shouldUseAI) {
        const response = await callOpenRouter(
          chatbotSystemPrompt,
          [...newMessages],
          apiKey
        );

        const navigateMatch = response.match(/\[NAVIGATE:(\w+)\]/);
        if (navigateMatch) {
          actions.navigate(navigateMatch[1]);
        }

        const cleanResponse = response.replace(/\[NAVIGATE:\w+\]/, '').trim();
        setMessages([...newMessages, { role: 'assistant', content: cleanResponse }]);
      } else {
        if (intent === 'navigate') {
          const pageMatch = userMessage.match(/(?:go to|navigate|open)\s+(?:the\s+)?(dashboard|talent|content|campaigns|community|agents|analytics|settings)/i);
          if (pageMatch) {
            const page = pageMatch[1].toLowerCase();
            actions.navigate(page);
            quickResponse += "\n\n✓ Navigated to " + page;
          }
        }
        setMessages([...newMessages, { role: 'assistant', content: quickResponse }]);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to get response');
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I encountered an error. Please check your API key in Settings." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    setInput(action);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full shadow-lg shadow-amber-500/20 flex items-center justify-center transition-all z-50 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-110'
        }`}
      >
        <MessageCircle size={24} className="text-zinc-950" />
      </button>

      <div
        className={`fixed bottom-6 right-6 w-96 h-[500px] bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl flex flex-col z-50 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <span className="font-semibold text-zinc-100">Global Assistant</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-xl text-sm ${
                  message.role === 'user'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 p-3 rounded-xl">
                <Loader2 size={16} className="text-zinc-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-zinc-800">
          <div className="flex gap-2 mb-2">
            <button onClick={() => handleQuickAction("How much did Luke make?")} className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400">Luke's Revenue</button>
            <button onClick={() => handleQuickAction("Talise streaming stats")} className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400">Talise Stats</button>
            <button onClick={() => handleQuickAction("Show campaigns")} className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400">Campaigns</button>
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-500 border border-zinc-700 focus:outline-none focus:border-amber-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 rounded-lg p-2 transition-all"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};