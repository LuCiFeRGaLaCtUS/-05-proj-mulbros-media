import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Sparkles, CheckCircle2, Plus, Send,
  ChevronDown, ChevronUp, AlertCircle, Users, RefreshCw,
} from 'lucide-react';
import { BlueBg } from './BlueBg';
import {
  SOURCE_GROUPS, groupColorMap, ALL_SUBREDDITS, SIGNAL_KEYWORDS,
  REGIONS, LANGUAGES, MOCK_RESULTS, sourceColorMap, signalBadge,
} from './constants';

export const LeadGenTab = ({ onAddToPipeline }) => {
  const defaultSources = ['reddit', 'kickstarter', 'indiegogo', 'stage32', 'slated', 'linkedin'];
  const [activeSources, setActiveSources] = useState(defaultSources);
  const scanTimerRef = useRef(null);
  useEffect(() => () => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); }, []);
  const [activeSubreddits, setActiveSubreddits] = useState(['r/indiefilm', 'r/filmmakers', 'r/lowbudgetfilmmaking']);
  const [keywords, setKeywords] = useState(SIGNAL_KEYWORDS.slice(0, 6).join(', '));
  const [budgetMin, setBudgetMin] = useState('50000');
  const [budgetMax, setBudgetMax] = useState('5000000');
  const [region, setRegion] = useState('All Regions');
  const [language, setLanguage] = useState('Any Language');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [scanned, setScanned] = useState(false);
  const [addedIds, setAddedIds] = useState([]);
  const [outreachIds, setOutreachIds] = useState([]);
  const [showSubreddits, setShowSubreddits] = useState(true);

  const toggleSource = (id) => {
    setActiveSources(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSubreddit = (sr) => {
    setActiveSubreddits(prev =>
      prev.includes(sr) ? prev.filter(s => s !== sr) : [...prev, sr]
    );
  };

  const runScan = () => {
    setScanning(true);
    setResults([]);
    setScanned(false);
    scanTimerRef.current = setTimeout(() => {
      const filtered = MOCK_RESULTS.filter(r => activeSources.includes(r.source));
      setResults(filtered);
      setScanning(false);
      setScanned(true);
    }, 2200);
  };

  const addToPipeline = (id) => {
    setAddedIds(prev => [...prev, id]);
    if (onAddToPipeline) {
      const lead = results.find(r => r.id === id);
      if (lead) onAddToPipeline(lead);
    }
  };
  const sendOutreach  = (id) => setOutreachIds(prev => [...prev, id]);

  const highSignal = results.filter(r => r.signal === 'high').length;
  const totalActive = activeSources.length;

  return (
    <div className="space-y-5">
      {/* Config panel */}
      <div
        className="relative tile-pop bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
      >
        <BlueBg />
        <div className="relative z-10 px-5 py-4 border-b border-zinc-200 bg-gradient-to-r from-blue-50 to-transparent flex items-center gap-2">
          <Search size={14} className="text-blue-500" />
          <span className="text-sm font-semibold text-zinc-900">Configure Global Lead Scan</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Sparkles size={9} /> AI-Powered
          </span>
        </div>

        <div className="relative z-10 p-5 grid grid-cols-2 gap-6">
          {/* Left: Grouped Sources */}
          <div className="space-y-4 overflow-y-auto max-h-80">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Sources</div>
            {SOURCE_GROUPS.map(group => {
              const gc = groupColorMap[group.color];
              return (
                <div key={group.label}>
                  <div className="text-xs text-zinc-500 font-medium mb-1.5">{group.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.sources.map(s => {
                      const isOn = activeSources.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSource(s.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                            isOn ? gc.active : 'border-zinc-200 text-zinc-600 bg-zinc-50 hover:text-zinc-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOn ? gc.dot : 'bg-zinc-300'}`} />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Reddit subreddits */}
            {activeSources.includes('reddit') && (
              <div>
                <button
                  onClick={() => setShowSubreddits(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-2 hover:text-zinc-800 transition-colors"
                >
                  Subreddits to scan
                  {showSubreddits ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
                {showSubreddits && (
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SUBREDDITS.map(sr => (
                      <button
                        key={sr}
                        onClick={() => toggleSubreddit(sr)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                          activeSubreddits.includes(sr)
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'border-zinc-200 text-zinc-600 hover:text-zinc-700'
                        }`}
                      >
                        {sr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Filters */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-2">
                Signal Keywords
              </label>
              <textarea
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                rows={2}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:border-blue-400 resize-none"
                placeholder="e.g. tax incentive, BFI grant, co-production treaty..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-2">
                Budget Range
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">$</span>
                  <input
                    type="text"
                    value={Number(budgetMin).toLocaleString()}
                    onChange={e => setBudgetMin(e.target.value.replace(/,/g, ''))}
                    className="w-full bg-white border border-zinc-200 rounded-lg pl-6 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <span className="text-zinc-600 text-xs flex-shrink-0">to</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">$</span>
                  <input
                    type="text"
                    value={Number(budgetMax).toLocaleString()}
                    onChange={e => setBudgetMax(e.target.value.replace(/,/g, ''))}
                    className="w-full bg-white border border-zinc-200 rounded-lg pl-6 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-2">Region</label>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-blue-400"
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-2">Film Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-blue-400"
                >
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={runScan}
              disabled={scanning || activeSources.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-all"
            >
              {scanning ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Scanning {totalActive} source{totalActive !== 1 ? 's' : ''} globally…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Run AI Global Lead Scan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scanning animation */}
      {scanning && (
        <div
          className="relative tile-pop bg-white rounded-2xl p-6 flex flex-col items-center gap-3 overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <BlueBg />
          <div className="relative z-10 flex gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-1.5 h-6 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <div className="relative z-10 text-sm text-zinc-700 font-medium">
            AI scanning {activeSources.join(', ')}…
          </div>
          <div className="relative z-10 text-xs text-zinc-500">Extracting high-intent signals from posts and profiles</div>
        </div>
      )}

      {/* Results */}
      {scanned && !scanning && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div
            className="relative flex items-center gap-4 bg-white rounded-xl px-5 py-3 flex-wrap overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)' }}
          >
            <BlueBg />
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-blue-500" />
              <span className="font-bold text-zinc-900">{results.length}</span>
              <span className="text-zinc-500">leads found</span>
            </div>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={14} className="text-emerald-500" />
              <span className="font-bold text-emerald-600">{highSignal}</span>
              <span className="text-zinc-500">high signal</span>
            </div>
            <div className="h-4 w-px bg-zinc-200" />
            <span className="text-xs text-zinc-500">
              {[...new Set(results.map(r => r.country))].join(' · ')}
            </span>
          </div>

          {/* Lead cards */}
          <div className="grid grid-cols-2 gap-4">
            {results.map(lead => {
              const srcLabel = SOURCE_GROUPS.flatMap(g => g.sources).find(s => s.id === lead.source)?.label || lead.source;
              return (
              <div
                key={lead.id}
                className={`relative tile-pop bg-white rounded-2xl p-4 flex flex-col gap-3 overflow-hidden ${
                  addedIds.includes(lead.id) ? 'opacity-60' : ''
                }`}
                style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
              >
                <BlueBg />
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColorMap[lead.source] || 'bg-zinc-100 text-zinc-700 border border-zinc-200'}`}>
                      {srcLabel}
                    </span>
                    {lead.subreddit && (
                      <span className="text-xs text-orange-600">{lead.subreddit}</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${signalBadge[lead.signal]}`}>
                    {lead.signal === 'high' ? '⬆ High' : '— Med'}
                  </span>
                </div>

                <div className="relative z-10 text-xs font-semibold text-zinc-700">{lead.username}</div>

                <p className="relative z-10 text-xs text-zinc-500 leading-relaxed line-clamp-3 italic">{lead.snippet}</p>

                <div className="relative z-10 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-600">{lead.budget}</span>
                  <span className="text-xs bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">{lead.country}</span>
                  <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200">{lead.language}</span>
                  <span className="text-xs text-zinc-600">{lead.postedAgo}</span>
                </div>

                <div className="relative z-10 flex flex-wrap gap-1">
                  {lead.tags.map(t => (
                    <span key={t} className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200">{t}</span>
                  ))}
                </div>

                <div className="relative z-10 flex gap-2 pt-1">
                  <button
                    onClick={() => addToPipeline(lead.id)}
                    disabled={addedIds.includes(lead.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200 rounded-lg py-1.5 transition-all"
                  >
                    {addedIds.includes(lead.id)
                      ? <><CheckCircle2 size={12} /> Added</>
                      : <><Plus size={12} /> Add to Pipeline</>
                    }
                  </button>
                  <button
                    onClick={() => sendOutreach(lead.id)}
                    disabled={outreachIds.includes(lead.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-700 border border-zinc-200 rounded-lg py-1.5 transition-all"
                  >
                    {outreachIds.includes(lead.id)
                      ? <><CheckCircle2 size={12} /> Sent</>
                      : <><Send size={12} /> Send Outreach</>
                    }
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Empty state before first scan */}
      {!scanning && !scanned && (
        <div
          className="relative tile-pop bg-white rounded-2xl p-10 flex flex-col items-center gap-3 text-center overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <BlueBg />
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Search size={22} className="text-blue-500" />
          </div>
          <div className="relative z-10 text-sm font-semibold text-zinc-700">Configure sources and run a scan</div>
          <div className="relative z-10 text-xs text-zinc-500 max-w-sm leading-relaxed">
            The AI agent will scan selected platforms for posts containing high-intent signals — filmmakers discussing tax incentives, gap financing, production budgets, and location decisions.
          </div>
        </div>
      )}
    </div>
  );
};
