import React, { useState } from 'react';
import { Loader2, Check, Zap } from 'lucide-react';
import { testClaudeKey } from '../../utils/claude';

export const APIKeyManager = () => {
  const [testing, setTesting] = useState({ openai: false, testResult: null });
  const [customKey, setCustomKey] = useState(
    localStorage.getItem('mulbros_openai_key') || ''
  );

  const activeKey = customKey;

  const handleTest = async () => {
    setTesting({ openai: true, testResult: null });
    try {
      const result = await testClaudeKey(activeKey);
      setTesting({ openai: false, testResult: result });
    } catch (error) {
      setTesting({ openai: false, testResult: { success: false, message: error.message } });
    }
  };

  const otherServices = [
    { name: 'Supabase URL', key: 'supabaseUrl' },
    { name: 'Supabase Anon Key', key: 'supabaseAnonKey' },
    { name: 'Spotify API', key: 'spotify' },
    { name: 'YouTube API', key: 'youtube' },
    { name: 'Instagram Graph API', key: 'instagram' },
    { name: 'Mailchimp API', key: 'mailchimp' },
    { name: 'Vercel Token', key: 'vercel' }
  ];

  return (
    <div className="space-y-4">
      {/* Active model banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
        <Zap size={16} className="text-emerald-400 flex-shrink-0" />
        <p className="text-sm text-emerald-400">
          Active model: <span className="font-mono font-semibold">gpt-4o-mini</span> via OpenAI
        </p>
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
          {/* OpenAI — primary row */}
          <tr className="border-b border-zinc-800/50">
            <td className="py-3 px-4 text-sm text-zinc-200">
              OpenAI
              <span className="ml-2 text-xs text-zinc-500">(gpt-4o-mini)</span>
            </td>
            <td className="py-3 px-4">
              <input
                type="password"
                value={customKey}
                onChange={(e) => {
                  setCustomKey(e.target.value);
                  if (e.target.value) {
                    localStorage.setItem('mulbros_openai_key', e.target.value);
                  } else {
                    localStorage.removeItem('mulbros_openai_key');
                  }
                }}
                placeholder="Using built-in key — paste here to override"
                className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </td>
            <td className="py-3 px-4">
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <Check size={14} /> {customKey ? 'Custom key' : 'Built-in key active'}
              </span>
            </td>
            <td className="py-3 px-4">
              <button
                onClick={handleTest}
                disabled={testing.openai}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded px-3 py-1 transition-all"
              >
                {testing.openai ? <Loader2 className="animate-spin" size={14} /> : 'Test'}
              </button>
            </td>
          </tr>

          {/* Other services (placeholder rows) */}
          {otherServices.map((service) => (
            <tr key={service.key} className="border-b border-zinc-800/50">
              <td className="py-3 px-4 text-sm text-zinc-200">{service.name}</td>
              <td className="py-3 px-4">
                <input
                  type="password"
                  placeholder={`Enter ${service.name} key`}
                  className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 text-sm"
                />
              </td>
              <td className="py-3 px-4">
                <span className="text-xs text-zinc-500">Not configured</span>
              </td>
              <td className="py-3 px-4" />
            </tr>
          ))}
        </tbody>
      </table>

      {testing.testResult && (
        <div className={`p-3 rounded-lg text-sm ${
          testing.testResult.success
            ? 'bg-emerald-500/10 text-emerald-500'
            : 'bg-red-500/10 text-red-500'
        }`}>
          {testing.testResult.success ? '✓ Connected to OpenAI' : `✗ Error: ${testing.testResult.message}`}
        </div>
      )}
    </div>
  );
};
