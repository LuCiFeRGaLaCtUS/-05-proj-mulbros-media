import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { callAI, getApiKey } from '../../utils/ai';

const communitySystemPrompt = `You are the Community Manager Agent for Mulbros Entertainment. You manage the fan community across all three assets: Last County (film), Talise (indie artist), and Luke Mulholland (composer). Your job is to write newsletters, engagement emails, and community content that keeps fans connected to the Mulbros ecosystem. Write warm, inclusive, insider-feeling content that makes fans feel like they're part of something special.`;

export const NewsletterBuilder = () => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAutoDraft = async () => {
    setIsGenerating(true);
    try {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error('No API key configured. Go to Settings > API Keys.');
      const result = await callAI(
        communitySystemPrompt,
        [{ role: 'user', content: "Draft this month's Mulbros ecosystem newsletter" }],
        apiKey
      );
      setContent(result);
    } catch (error) {
      toast.error(error.message || 'Failed to generate newsletter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    toast.success('Newsletter sent to 847 subscribers');
  };

  return (
    <div className="relative bg-zinc-900 rounded-xl p-6 border border-purple-900/30 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-zinc-900 to-zinc-950 pointer-events-none" />
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-purple-500/10 blur-xl rounded-full pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-purple-500 rounded-full" />
            <h3 className="text-sm font-semibold text-zinc-200">Newsletter Builder</h3>
          </div>
          <button
            onClick={handleAutoDraft}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg px-3 py-2 transition-all text-xs font-medium"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
            Auto-Draft with AI
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your newsletter content here..."
          className="w-full bg-zinc-800/80 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-purple-500/40 resize-none h-48 text-sm placeholder:text-zinc-600"
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSend}
            disabled={!content}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 font-semibold rounded-lg px-6 py-2 transition-all text-sm"
          >
            Send to Subscribers
          </button>
        </div>
      </div>
    </div>
  );
};
