import React, { useState } from 'react';
import { Loader2, Check, Zap, Eye, EyeOff, Wifi, WifiOff, CircleDot, Server } from 'lucide-react';
import { testAIKey, testAnthropicKey } from '../../utils/ai';

const OTHER_SERVICES = [
  'OpenRouter',
  'Spotify API', 'YouTube API', 'Instagram Graph API', 'Mailchimp API', 'Vercel Token',
];

const storageKey = (name) => `mulbros_key_${name.toLowerCase().replace(/\s+/g, '_')}`;

const INPUT_CLASSES = 'flex-1 bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500 text-sm font-mono';
const ROW_CLASSES = 'border-b border-zinc-200';

// ── Status badge ──────────────────────────────────────────────────────────────
const TestBadge = ({ result }) => {
  if (!result) return null;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
      {result.success ? <Wifi size={11} /> : <WifiOff size={11} />}
      {result.message}
    </span>
  );
};

// ── Key row ───────────────────────────────────────────────────────────────────
const KeyRow = ({ label, sub, storeName, placeholder, onTest, testLabel = 'Test' }) => {
  const [val,       setVal]     = useState(localStorage.getItem(storeName) || '');
  const [show,      setShow]    = useState(false);
  const [testing,   setTesting] = useState(false);
  const [result,    setResult]  = useState(null);

  const handleChange = (v) => { setVal(v); setResult(null); };
  const handleBlur   = () => {
    if (val.trim()) localStorage.setItem(storeName, val.trim());
    else            localStorage.removeItem(storeName);
  };

  const handleTest = async () => {
    if (!onTest) return;
    setTesting(true);
    setResult(null);
    const r = await onTest(val || undefined);
    setResult(r);
    setTesting(false);
  };

  return (
    <tr className={ROW_CLASSES}>
      <td className="py-3 px-4 text-sm text-zinc-900 align-top pt-4 font-semibold">
        {label}
        {sub && <span className="ml-2 text-xs font-normal text-zinc-600">{sub}</span>}
      </td>

      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <input
            type={show ? 'text' : 'password'}
            value={val}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={INPUT_CLASSES}
          />
          <button
            onClick={() => setShow(v => !v)}
            aria-label={show ? 'Hide key' : 'Show key'}
            className="text-zinc-600 hover:text-zinc-900 transition-colors flex-shrink-0"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </td>

      <td className="py-3 px-4 align-top pt-4">
        <span className="flex items-center gap-1 text-xs">
          {val
            ? <><Check size={13} className="text-emerald-600" /><span className="text-emerald-700 font-medium">Custom key set</span></>
            : <span className="text-zinc-600">Env key active</span>
          }
        </span>
      </td>

      <td className="py-3 px-4 align-top pt-4 space-y-1">
        {onTest ? (
          <>
            <button
              onClick={handleTest}
              disabled={testing}
              className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded px-3 py-1.5 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {testing
                ? <Loader2 className="animate-spin" size={11} />
                : <CircleDot size={11} />
              }
              {testing ? 'Testing…' : testLabel}
            </button>
            {result && <TestBadge result={result} />}
          </>
        ) : (
          <span className="text-xs text-zinc-500 italic">—</span>
        )}
      </td>
    </tr>
  );
};

// ── Server-side-only key row ──────────────────────────────────────────────────
const ServerKeyRow = ({ label, sub, description }) => (
  <tr className={ROW_CLASSES}>
    <td className="py-3 px-4 text-sm text-zinc-900 align-middle font-semibold">
      {label}
      {sub && <span className="ml-2 text-xs font-normal text-zinc-600">{sub}</span>}
    </td>
    <td className="py-3 px-4 align-middle">
      <span className="text-xs text-zinc-600 font-mono italic">{description}</span>
    </td>
    <td className="py-3 px-4 align-middle">
      <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
        <Server size={11} />
        Server-side
      </span>
    </td>
    <td className="py-3 px-4 align-middle">
      <span className="text-xs text-zinc-500 italic">—</span>
    </td>
  </tr>
);

// ── Other service row ─────────────────────────────────────────────────────────
const OtherRow = ({ name }) => {
  const store = storageKey(name);
  const [val,  setVal]  = useState(localStorage.getItem(store) || '');
  const [show, setShow] = useState(false);

  const handleBlur = () => {
    if (val.trim()) localStorage.setItem(store, val.trim());
    else            localStorage.removeItem(store);
  };

  return (
    <tr className={ROW_CLASSES}>
      <td className="py-3 px-4 text-sm text-zinc-900 font-semibold">{name}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <input
            type={show ? 'text' : 'password'}
            value={val}
            onChange={e => { setVal(e.target.value); }}
            onBlur={handleBlur}
            placeholder={`Enter ${name} key`}
            className={INPUT_CLASSES}
          />
          <button
            onClick={() => setShow(v => !v)}
            aria-label={show ? `Hide ${name} key` : `Show ${name} key`}
            className="text-zinc-600 hover:text-zinc-900 transition-colors flex-shrink-0"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </td>
      <td className="py-3 px-4">
        {val
          ? <span className="text-emerald-700 flex items-center gap-1 text-xs font-medium"><Check size={12} /> Saved</span>
          : <span className="text-xs text-zinc-600">Not configured</span>
        }
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-zinc-500 italic">—</span>
      </td>
    </tr>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
export const APIKeyManager = () => (
  <div className="space-y-4">
    {/* Active model banner */}
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
      <Zap size={16} className="text-emerald-600 flex-shrink-0" />
      <div>
        <p className="text-sm text-emerald-800 font-semibold">
          Active: gpt-4o (agents) · gpt-4o-mini (chatbot) · Firecrawl (Reddit search)
        </p>
        <p className="text-xs text-zinc-700 mt-0.5">
          OpenAI/Anthropic keys: paste below to override at runtime (browser-only storage).
          Firecrawl + Apify: server-side only — set in <code className="font-mono bg-zinc-100 px-1 rounded">.env.local</code> or Render env vars.
        </p>
      </div>
    </div>

    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="text-left py-3 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider w-40">Service</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">API Key</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider w-36">Status</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider w-40">Actions</th>
          </tr>
        </thead>
        <tbody>
          <KeyRow
            label="OpenAI"
            sub="(gpt-4o agents · gpt-4o-mini chatbot)"
            storeName="mulbros_openai_key"
            placeholder="sk-proj-… (leave blank to use env key)"
            onTest={testAIKey}
            testLabel="Test connection"
          />

          <KeyRow
            label="Anthropic"
            sub="(Claude models — optional)"
            storeName="mulbros_anthropic_key"
            placeholder="sk-ant-… (leave blank to use env key)"
            onTest={testAnthropicKey}
            testLabel="Test connection"
          />

          <ServerKeyRow
            label="Firecrawl"
            sub="Reddit search (Google-indexed)"
            description="Set FIRECRAWL_API_KEY in server env"
          />

          <ServerKeyRow
            label="Apify"
            sub="Reddit deep scraper (headless)"
            description="Set APIFY_API_TOKEN in server env"
          />

          {OTHER_SERVICES.map(name => <OtherRow key={name} name={name} />)}
        </tbody>
      </table>
    </div>
  </div>
);
