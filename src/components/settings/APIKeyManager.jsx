import React, { useState } from 'react';
import { Loader2, Check, Zap, Eye, EyeOff } from 'lucide-react';
import { testClaudeKey } from '../../utils/claude';

export const APIKeyManager = () => {
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('mulbros_openai_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState({ loading: false, result: null });

  const handleSave = (val) => {
    setOpenaiKey(val);
    if (val.trim()) {
      localStorage.setItem('mulbros_openai_key', val.trim());
    } else {
      localStorage.removeItem('mulbros_openai_key');
    }
  };

  const handleTest = async () => {
    setTesting({ loading: true, result: null });
    const result = await testClaudeKey(openaiKey || undefined);
    setTesting({ loading: false, result });
  };

  const otherServices = [
    'OpenRouter', 'Supabase URL', 'Supabase Anon Key',
    'Spotify API', 'YouTube API', 'Instagram Graph API', 'Mailchimp API', 'Vercel Token'
  ];

  return (
    <div className="space-y-4">
      {/* Active model banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
        <Zap size={16} className="text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm text-emerald-400 font-semibold">Active model: gpt-4o (agents) · gpt-4o-mini (chatbot) via OpenAI</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Key configured via <code className="font-mono">.env.local</code> (dev) or <code className="font-mono">OPENAI_API_KEY</code> env var (production).
            Paste a key below to override at runtime.
          </p>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Service</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">API Key</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* OpenAI — primary */}
          <tr className="border-b border-zinc-800/50">
            <td className="py-3 px-4 text-sm text-zinc-200">
              OpenAI
              <span className="ml-2 text-xs text-zinc-500">(gpt-4o · gpt-4o-mini)</span>
            </td>
            <td className="py-3 px-4">
              <div className="relative flex items-center gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => handleSave(e.target.value)}
                  placeholder="sk-proj-… (leave blank to use .env key)"
                  className="flex-1 bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-blue-500/50 text-sm"
                />
                <button onClick={() => setShowKey(v => !v)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </td>
            <td className="py-3 px-4">
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <Check size={14} /> {openaiKey ? 'Custom key set' : 'Env key active'}
              </span>
            </td>
            <td className="py-3 px-4">
              <button
                onClick={handleTest}
                disabled={testing.loading}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded px-3 py-1.5 transition-all flex items-center gap-1"
              >
                {testing.loading ? <Loader2 className="animate-spin" size={12} /> : null}
                Test
              </button>
            </td>
          </tr>

          {/* Other services (placeholder) */}
          {otherServices.map((name) => (
            <tr key={name} className="border-b border-zinc-800/50">
              <td className="py-3 px-4 text-sm text-zinc-200">{name}</td>
              <td className="py-3 px-4">
                <input type="password" placeholder={`Enter ${name} key`}
                  className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none text-sm" />
              </td>
              <td className="py-3 px-4"><span className="text-xs text-zinc-500">Not configured</span></td>
              <td className="py-3 px-4" />
            </tr>
          ))}
        </tbody>
      </table>

      {testing.result && (
        <div className={`p-3 rounded-xl text-sm ${
          testing.result.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {testing.result.success ? `✓ ${testing.result.message}` : `✗ ${testing.result.message}`}
        </div>
      )}
    </div>
  );
};
