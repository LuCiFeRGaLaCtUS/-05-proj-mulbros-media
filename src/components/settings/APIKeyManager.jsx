import React, { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { testOpenRouterKey } from '../../utils/claude';

export const APIKeyManager = () => {
  const [apiKeys, setApiKeys] = useState({
    openrouter: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    spotify: '',
    youtube: '',
    instagram: '',
    mailchimp: '',
    vercel: ''
  });
  const [testing, setTesting] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem('mulbros_openrouter_key');
    if (stored) {
      setApiKeys(prev => ({ ...prev, openrouter: stored }));
    }
  }, []);

  const handleTest = async (service) => {
    if (service === 'openrouter') {
      setTesting(prev => ({ ...prev, openrouter: true, testResult: null }));
      try {
        const result = await testOpenRouterKey(apiKeys.openrouter);
        setTesting(prev => ({ ...prev, openrouter: false, testResult: result }));
      } catch (error) {
        setTesting(prev => ({ ...prev, openrouter: false, testResult: { success: false, message: error.message } }));
      }
    }
  };

  const services = [
    { name: 'OpenRouter', key: 'openrouter', prefix: '' },
    { name: 'Supabase URL', key: 'supabaseUrl' },
    { name: 'Supabase Anon Key', key: 'supabaseAnonKey' },
    { name: 'Spotify API', key: 'spotify' },
    { name: 'YouTube API', key: 'youtube' },
    { name: 'Instagram Graph API', key: 'instagram' },
    { name: 'Mailchimp API', key: 'mailchimp' },
    { name: 'Vercel Token', key: 'vercel' }
  ];

  const handleSaveOpenRouter = () => {
    localStorage.setItem('mulbros_openrouter_key', apiKeys.openrouter);
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-500">
          Using free model: <span className="font-mono">nvidia/nemotron-3-super-120b-a12b:free</span>
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
          {services.map((service) => (
            <tr key={service.key} className="border-b border-zinc-800/50">
              <td className="py-3 px-4 text-sm text-zinc-200">{service.name}</td>
              <td className="py-3 px-4">
                <input
                  type="password"
                  value={apiKeys[service.key] || ''}
                  onChange={(e) => {
                    setApiKeys({ ...apiKeys, [service.key]: e.target.value });
                    if (service.key === 'openrouter') {
                      localStorage.setItem('mulbros_openrouter_key', e.target.value);
                    }
                  }}
                  placeholder={`Enter ${service.name} API key`}
                  className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 text-sm"
                />
              </td>
              <td className="py-3 px-4">
                {apiKeys[service.key] ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <Check size={14} /> Connected
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500">Not configured</span>
                )}
              </td>
              <td className="py-3 px-4">
                {service.key === 'openrouter' && (
                  <button
                    onClick={() => handleTest('openrouter')}
                    disabled={!apiKeys.openrouter || testing.openrouter}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded px-3 py-1 transition-all"
                  >
                    {testing.openrouter ? <Loader2 className="animate-spin" size={14} /> : 'Test'}
                  </button>
                )}
              </td>
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
          {testing.testResult.success ? '✓ Connected' : `✗ Error: ${testing.testResult.message}`}
        </div>
      )}
    </div>
  );
};