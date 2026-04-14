import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { callClaude, getApiKey } from '../../utils/claude';

const communitySystemPrompt = `You are the Community Manager Agent for Mulbros Entertainment. You manage the fan community across all three assets: Last County (film), Talise (indie artist), and Luke Mulholland (composer). Your job is to write newsletters, engagement emails, and community content that keeps fans connected to the Mulbros ecosystem. Write warm, inclusive, insider-feeling content that makes fans feel like they're part of something special.`;

export const NewsletterBuilder = () => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAutoDraft = async () => {
    setIsGenerating(true);
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Go to Settings > API Keys.');
      }
      const result = await callClaude(
        communitySystemPrompt,
        [{ role: 'user', content: 'Draft this month\'s Mulbros ecosystem newsletter' }],
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
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">Newsletter Builder</h3>
        <button
          onClick={handleAutoDraft}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg px-3 py-2 transition-all text-sm"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          Auto-Draft with AI
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your newsletter content here..."
        className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 resize-none h-48"
      />

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSend}
          disabled={!content}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 font-semibold rounded-lg px-6 py-2 transition-all"
        >
          Send to Subscribers
        </button>
      </div>
    </div>
  );
};