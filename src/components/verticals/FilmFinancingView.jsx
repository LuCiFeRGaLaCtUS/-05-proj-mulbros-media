import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { filmFinancingPipeline, activities } from '../../config/mockData';
import { callAI } from '../../utils/ai';
import { getJurisdictionPromptContext, getTopJurisdictions } from '../../config/jurisdictions';
import {
  Clock, Search, Sparkles, CheckCircle2, Plus, Send,
  ChevronDown, ChevronUp, AlertCircle, Users, RefreshCw,
  Loader2, DollarSign, MapPin, FileText, TrendingUp, ArrowRight, Download, GripVertical
} from 'lucide-react';

// ── Cinematic background — blue theme ────────────────────────────────────────
const BlueBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/25 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/10 blur-xl rounded-full pointer-events-none" />
  </>
);

// ─── Pipeline config ──────────────────────────────────────────────────────────

const STAGES = [
  { key: 'discovery',   label: 'Discovery',   color: 'zinc' },
  { key: 'contacted',   label: 'Contacted',   color: 'blue' },
  { key: 'qualified',   label: 'Qualified',   color: 'amber' },
  { key: 'negotiating', label: 'Negotiating', color: 'purple' },
  { key: 'closed',      label: 'Closed',      color: 'emerald' },
];

const stageColorMap = {
  zinc:    { header: 'bg-zinc-800 text-zinc-300',             card: 'border-zinc-700/50 bg-zinc-800/30',   badge: 'bg-zinc-700 text-zinc-300' },
  blue:    { header: 'bg-blue-500/10 text-blue-400',          card: 'border-blue-500/20 bg-blue-500/5',    badge: 'bg-blue-500/10 text-blue-400' },
  amber:   { header: 'bg-amber-500/10 text-amber-400',        card: 'border-amber-500/20 bg-amber-500/5',  badge: 'bg-amber-500/10 text-amber-400' },
  purple:  { header: 'bg-purple-500/10 text-purple-400',      card: 'border-purple-500/20 bg-purple-500/5',badge: 'bg-purple-500/10 text-purple-400' },
  emerald: { header: 'bg-emerald-500/10 text-emerald-400',    card: 'border-emerald-500/20 bg-emerald-500/5', badge: 'bg-emerald-500/10 text-emerald-400' },
};

// ─── KPIs ─────────────────────────────────────────────────────────────────────

const kpis = [
  { label: 'Leads Scraped',       value: '312',    sub: 'This quarter' },
  { label: 'Qualified Leads',     value: '47',     sub: '+11 this month' },
  { label: 'Pipeline Value',      value: '$1.9M',  sub: 'Active deal value' },
  { label: 'Incentives Modeled',  value: '$2.1M',  sub: 'Savings identified' },
];

// ─── Lead Gen config ──────────────────────────────────────────────────────────

const SOURCE_GROUPS = [
  {
    label: 'Social / Forum',
    color: 'orange',
    sources: [
      { id: 'reddit',   label: 'Reddit' },
      { id: 'facebook', label: 'Facebook Groups' },
      { id: 'discord',  label: 'Discord' },
      { id: 'linkedin', label: 'LinkedIn' },
    ]
  },
  {
    label: 'Crowdfunding',
    color: 'green',
    sources: [
      { id: 'kickstarter', label: 'Kickstarter' },
      { id: 'indiegogo',   label: 'Indiegogo' },
      { id: 'filmocracy',  label: 'Filmocracy' },
    ]
  },
  {
    label: 'Film Marketplaces',
    color: 'blue',
    sources: [
      { id: 'stage32',        label: 'Stage32' },
      { id: 'slated',         label: 'Slated' },
      { id: 'filmhedge',      label: 'FilmHedge' },
      { id: 'shootingpeople', label: 'Shooting People' },
      { id: 'mandy',          label: 'Mandy' },
    ]
  },
  {
    label: 'Festival Markets',
    color: 'purple',
    sources: [
      { id: 'cannes', label: 'Cannes Marché' },
      { id: 'afm',    label: 'AFM' },
      { id: 'efm',    label: 'Berlin EFM' },
    ]
  },
  {
    label: 'Pro Databases',
    color: 'rose',
    sources: [
      { id: 'imdbpro', label: 'IMDb Pro' },
    ]
  },
];

// flat list for filtering mock results
const ALL_SOURCE_IDS = SOURCE_GROUPS.flatMap(g => g.sources.map(s => s.id));

const groupColorMap = {
  orange: { active: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
  green:  { active: 'bg-green-500/10 text-green-400 border-green-500/20',   dot: 'bg-green-400' },
  blue:   { active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',      dot: 'bg-blue-400' },
  purple: { active: 'bg-purple-500/10 text-purple-400 border-purple-500/20',dot: 'bg-purple-400' },
  rose:   { active: 'bg-rose-500/10 text-rose-400 border-rose-500/20',      dot: 'bg-rose-400' },
};

const ALL_SUBREDDITS = [
  'r/indiefilm', 'r/filmmakers', 'r/lowbudgetfilmmaking',
  'r/Filmmaking', 'r/moviemaking', 'r/Screenwriting',
  'r/shoestring', 'r/FilmSchool', 'r/TrueFilm',
];

const SIGNAL_KEYWORDS = [
  'tax incentive', 'tax credit', 'gap financing', 'production budget',
  'state rebate', 'film grant', 'EU co-production', 'BFI grant',
  'Screen Australia', 'Telefilm Canada', 'global tax rebate', 'co-production treaty',
  'investor', 'pre-production', 'looking for financing',
];

const REGIONS = ['All Regions', 'United States', 'Canada', 'United Kingdom', 'Europe', 'Australia', 'India', 'Latin America', 'Global'];
const LANGUAGES = ['Any Language', 'English', 'Spanish', 'French', 'Hindi', 'Portuguese', 'German', 'Other'];

// ─── Mock scan results ────────────────────────────────────────────────────────

const MOCK_RESULTS = [
  {
    id: 'r1', source: 'reddit', subreddit: 'r/indiefilm', signal: 'high',
    username: 'u/firstfeature_dev',
    snippet: '"Just wrapped pre-vis on my first feature. Budget is around $220,000. Anyone know which states have the best tax incentives for a small thriller? Looking at Ohio, Georgia, and NM."',
    budget: '$220,000', country: 'United States', language: 'English', postedAgo: '2h ago',
    tags: ['tax incentive', 'pre-production', 'thriller'],
  },
  {
    id: 'r2', source: 'kickstarter', signal: 'high',
    username: 'Roads We Forgot (Project)',
    snippet: 'Drama feature campaign — $85,000 raised of $120,000 goal. Director seeking co-production partner and gap financing to bridge remaining $35,000 before principal photography.',
    budget: '$120,000', country: 'Canada', language: 'English', postedAgo: '5h ago',
    tags: ['gap financing', 'co-production', 'drama'],
  },
  {
    id: 'r3', source: 'stage32', signal: 'high',
    username: 'Priya Nair — Director',
    snippet: '"Producing a $450,000 horror-thriller shooting in Q3 2026. Need advice on maximizing qualified spend for state rebate. Anyone worked with Ohio or Louisiana recently?"',
    budget: '$450,000', country: 'United States', language: 'English', postedAgo: '1d ago',
    tags: ['state rebate', 'qualified spend', 'horror'],
  },
  {
    id: 'r4', source: 'slated', signal: 'high',
    username: 'Alejandro Vega — Producer',
    snippet: 'Spanish-language drama, $380,000 budget. Seeking EU co-production partner to access Spanish film subsidies and possible French co-production tax credit stacking.',
    budget: '$380,000', country: 'Spain', language: 'Spanish', postedAgo: '3h ago',
    tags: ['EU co-production', 'Spanish subsidies', 'drama'],
  },
  {
    id: 'r5', source: 'linkedin', signal: 'high',
    username: 'Marcus Webb — Producer',
    snippet: 'Moving into pre-production on "The Glass Field" — a $2,300,000 thriller. Actively seeking gap financing and exploring state incentive packages. DMs open.',
    budget: '$2,300,000', country: 'United States', language: 'English', postedAgo: '6h ago',
    tags: ['gap financing', 'state incentive', 'thriller'],
  },
  {
    id: 'r6', source: 'indiegogo', signal: 'medium',
    username: 'Amara Films (UK)',
    snippet: 'British drama feature — $290,000 budget, $95,000 raised. Seeking BFI grant guidance and advice on stacking regional creative England funding with BFI co-production.',
    budget: '$290,000', country: 'United Kingdom', language: 'English', postedAgo: '4h ago',
    tags: ['BFI grant', 'co-production', 'drama'],
  },
  {
    id: 'r7', source: 'facebook', signal: 'medium',
    username: 'Indie Film Producers Network',
    snippet: '"Anyone have experience with the New Mexico Film Office? We\'re finalizing a $1,100,000 western. Heard NM is 25–40% rebate on qualified spend but paperwork is intense."',
    budget: '$1,100,000', country: 'United States', language: 'English', postedAgo: '4h ago',
    tags: ['state rebate', 'New Mexico', 'western'],
  },
  {
    id: 'r8', source: 'reddit', subreddit: 'r/filmmakers', signal: 'medium',
    username: 'u/mumbai_director',
    snippet: '"Hindi-language thriller, $175,000 budget. Shooting in Mumbai but considering a UK/India co-production treaty to access BFI + Indian government incentives. Any experience?"',
    budget: '$175,000', country: 'India', language: 'Hindi', postedAgo: '5h ago',
    tags: ['co-production treaty', 'India', 'BFI'],
  },
  {
    id: 'r9', source: 'shootingpeople', signal: 'high',
    username: 'Clara Hoffmann — Director',
    snippet: 'German-language feature, $520,000 budget. Exploring German Federal Film Fund (DFFF) + Medienboard Berlin-Brandenburg grants. Also interested in UK co-production to access BFI.',
    budget: '$520,000', country: 'Germany', language: 'German', postedAgo: '7h ago',
    tags: ['DFFF', 'EU co-production', 'German grant'],
  },
  {
    id: 'r10', source: 'filmocracy', signal: 'medium',
    username: 'Southern Cross Films',
    snippet: '"Australian feature, $410,000 budget. Currently researching Screen Australia funding and the Australian Producer Offset (40%). Would love AI-generated benchmark comparing AU vs. NZ options."',
    budget: '$410,000', country: 'Australia', language: 'English', postedAgo: '1d ago',
    tags: ['Screen Australia', 'Producer Offset', 'AU/NZ'],
  },
];

const sourceColorMap = {
  reddit:        'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  facebook:      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  discord:       'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  linkedin:      'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  kickstarter:   'bg-green-500/10 text-green-400 border border-green-500/20',
  indiegogo:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  filmocracy:    'bg-teal-500/10 text-teal-400 border border-teal-500/20',
  stage32:       'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  slated:        'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  filmhedge:     'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  shootingpeople:'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  mandy:         'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  cannes:        'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  afm:           'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  efm:           'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  imdbpro:       'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

const signalBadge = {
  high:   'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-400',
};

const financingActivities = activities.filter(a => a.vertical === 'financing');

// ─── Lead Gen Tab ─────────────────────────────────────────────────────────────

const LeadGenTab = ({ onAddToPipeline }) => {
  const defaultSources = ['reddit', 'kickstarter', 'indiegogo', 'stage32', 'slated', 'linkedin'];
  const [activeSources, setActiveSources] = useState(defaultSources);
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
    setTimeout(() => {
      const filtered = MOCK_RESULTS.filter(r => activeSources.includes(r.source));
      setResults(filtered);
      setScanning(false);
      setScanned(true);
    }, 2200);
  };

  const addToPipeline = (id) => {
    setAddedIds(prev => [...prev, id]);
    // Also push to the shared pipeline state (passed down from FilmFinancingView)
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
      <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 overflow-hidden">
        <BlueBg />
        <div className="relative z-10 px-5 py-4 border-b border-zinc-800/60 bg-gradient-to-r from-blue-500/5 to-transparent flex items-center gap-2">
          <Search size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-zinc-100">Configure Global Lead Scan</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
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
                  <div className="text-xs text-zinc-600 font-medium mb-1.5">{group.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.sources.map(s => {
                      const isOn = activeSources.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSource(s.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                            isOn ? gc.active : 'border-zinc-700/50 text-zinc-600 bg-zinc-800/20 hover:text-zinc-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOn ? gc.dot : 'bg-zinc-700'}`} />
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
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-2 hover:text-zinc-300 transition-colors"
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
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            : 'border-zinc-700/40 text-zinc-600 hover:text-zinc-400'
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
                className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none"
                placeholder="e.g. tax incentive, BFI grant, co-production treaty..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-2">
                Budget Range
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">$</span>
                  <input
                    type="text"
                    value={Number(budgetMin).toLocaleString()}
                    onChange={e => setBudgetMin(e.target.value.replace(/,/g, ''))}
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg pl-6 pr-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <span className="text-zinc-600 text-xs flex-shrink-0">to</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">$</span>
                  <input
                    type="text"
                    value={Number(budgetMax).toLocaleString()}
                    onChange={e => setBudgetMax(e.target.value.replace(/,/g, ''))}
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg pl-6 pr-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50"
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
                  className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50"
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-2">Film Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50"
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
        <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 p-6 flex flex-col items-center gap-3 overflow-hidden">
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
          <div className="relative z-10 text-sm text-zinc-300 font-medium">
            AI scanning {activeSources.join(', ')}…
          </div>
          <div className="relative z-10 text-xs text-zinc-500">Extracting high-intent signals from posts and profiles</div>
        </div>
      )}

      {/* Results */}
      {scanned && !scanning && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="relative flex items-center gap-4 bg-zinc-900 rounded-xl ring-1 ring-blue-900/30 px-5 py-3 flex-wrap overflow-hidden">
            <BlueBg />
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-blue-400" />
              <span className="font-bold text-zinc-100">{results.length}</span>
              <span className="text-zinc-500">leads found</span>
            </div>
            <div className="h-4 w-px bg-zinc-700" />
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={14} className="text-emerald-400" />
              <span className="font-bold text-emerald-400">{highSignal}</span>
              <span className="text-zinc-500">high signal</span>
            </div>
            <div className="h-4 w-px bg-zinc-700" />
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
                className={`relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/20 p-4 flex flex-col gap-3 overflow-hidden ${
                  addedIds.includes(lead.id) ? 'opacity-60' : ''
                }`}
              >
                <BlueBg />
                {/* Top row */}
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColorMap[lead.source] || 'bg-zinc-700 text-zinc-300 border border-zinc-600'}`}>
                      {srcLabel}
                    </span>
                    {lead.subreddit && (
                      <span className="text-xs text-orange-400/70">{lead.subreddit}</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${signalBadge[lead.signal]}`}>
                    {lead.signal === 'high' ? '⬆ High' : '— Med'}
                  </span>
                </div>

                {/* Username */}
                <div className="relative z-10 text-xs font-semibold text-zinc-300">{lead.username}</div>

                {/* Signal snippet */}
                <p className="relative z-10 text-xs text-zinc-400 leading-relaxed line-clamp-3 italic">{lead.snippet}</p>

                {/* Meta */}
                <div className="relative z-10 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-400">{lead.budget}</span>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700/40">{lead.country}</span>
                  <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700/40">{lead.language}</span>
                  <span className="text-xs text-zinc-600">{lead.postedAgo}</span>
                </div>

                {/* Tags */}
                <div className="relative z-10 flex flex-wrap gap-1">
                  {lead.tags.map(t => (
                    <span key={t} className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700/40">{t}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="relative z-10 flex gap-2 pt-1">
                  <button
                    onClick={() => addToPipeline(lead.id)}
                    disabled={addedIds.includes(lead.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/40 disabled:opacity-50 text-blue-400 border border-blue-500/20 rounded-lg py-1.5 transition-all"
                  >
                    {addedIds.includes(lead.id)
                      ? <><CheckCircle2 size={12} /> Added</>
                      : <><Plus size={12} /> Add to Pipeline</>
                    }
                  </button>
                  <button
                    onClick={() => sendOutreach(lead.id)}
                    disabled={outreachIds.includes(lead.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 border border-zinc-700/50 rounded-lg py-1.5 transition-all"
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
        <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 p-10 flex flex-col items-center gap-3 text-center overflow-hidden">
          <BlueBg />
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Search size={22} className="text-blue-400" />
          </div>
          <div className="relative z-10 text-sm font-semibold text-zinc-300">Configure sources and run a scan</div>
          <div className="relative z-10 text-xs text-zinc-500 max-w-sm leading-relaxed">
            The AI agent will scan selected platforms for posts containing high-intent signals — filmmakers discussing tax incentives, gap financing, production budgets, and location decisions.
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Mock benchmark (shown when AI is unavailable) ────────────────────────────

const MOCK_BENCHMARK = {
  project: { title: 'Sample Feature', genre: 'Thriller', budget: '$2,000,000', region: 'United States' },
  topPick: { location: 'Ohio', credit: '30%', savings: '$340,000', reason: 'Highest refundable credit, low minimum spend, strong crew base in Cleveland/Columbus.' },
  comparison: [
    { location: 'Ohio',        flag: '🇺🇸', credit: '30%', savings: '$340K', minSpend: '$300K', qualified: 'Labor + goods purchased in-state', refundable: true },
    { location: 'Georgia',     flag: '🇺🇸', credit: '30%', savings: '$320K', minSpend: '$500K', qualified: 'All below-the-line spend', refundable: false },
    { location: 'New Mexico',  flag: '🇺🇸', credit: '40%', savings: '$380K', minSpend: '$1M',   qualified: 'NM resident labor + goods', refundable: true },
    { location: 'UK',          flag: '🇬🇧', credit: '25%', savings: '$290K', minSpend: '£1M',   qualified: 'UK qualifying expenditure', refundable: true },
    { location: 'Screen Aus.', flag: '🇦🇺', credit: '40%', savings: '$400K', minSpend: 'AUD 1M', qualified: 'Australian production spend', refundable: true },
  ],
  budgetTemplate: [
    { category: 'Above-the-Line', estimate: '$320,000', qualified: '$0', notes: 'Director, Writer, Lead Cast — typically non-qualified' },
    { category: 'Production Labor', estimate: '$680,000', qualified: '$612,000', notes: '90% qualified if hiring in-state crew' },
    { category: 'Equipment & Grip', estimate: '$180,000', qualified: '$162,000', notes: 'Rentals from in-state vendors qualify' },
    { category: 'Locations & Sets', estimate: '$120,000', qualified: '$108,000', notes: 'All in-state location fees qualify' },
    { category: 'Post Production', estimate: '$200,000', qualified: '$140,000', notes: '70% if using in-state facilities' },
    { category: 'VFX', estimate: '$150,000', qualified: '$0', notes: 'Check state-specific VFX rules' },
    { category: 'Marketing & P&A', estimate: '$200,000', qualified: '$0', notes: 'Generally non-qualified' },
    { category: 'Contingency (10%)', estimate: '$150,000', qualified: '$0', notes: '' },
  ],
  nextStep: 'Book a 30-min consultation to get your full qualified-spend analysis and state filing roadmap.'
};

// ─── Incentive Analyst Tab ────────────────────────────────────────────────────

const GENRES = ['Thriller', 'Drama', 'Horror', 'Comedy', 'Action', 'Documentary', 'Sci-Fi', 'Romance', 'Animation', 'Other'];

const IncentiveAnalystTab = () => {
  const [form, setForm] = useState({
    title: '', genre: 'Thriller', budget: '', duration: '', region: 'United States', language: 'English',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const jurisdictionContext = getJurisdictionPromptContext();
  const systemPrompt = `You are the Film Financing Incentive Analyst for MulBros Media OS. You are an expert in US state and international film tax incentives, rebates, and production grants.

${jurisdictionContext}

When given project details, produce a structured JSON benchmark with this exact shape (no markdown, raw JSON only):
{
  "topPick": { "location": string, "credit": string, "savings": string, "reason": string },
  "comparison": [{ "location": string, "flag": string, "credit": string, "savings": string, "minSpend": string, "qualified": string, "refundable": boolean }],
  "budgetTemplate": [{ "category": string, "estimate": string, "qualified": string, "notes": string }],
  "nextStep": string
}
Rules:
- Return 4-5 locations in comparison, chosen from the authoritative data above only.
- Exclude any jurisdiction whose minSpend exceeds the project budget.
- Calculate savings as: budget × 0.70 (qualified spend ratio) × credit rate. Show your math in the reason field.
- Mark refundable accurately per the data above — this is critical for the filmmaker's cash flow planning.
- Return 7-8 budget line items specific to the project genre and region.
- All savings in USD equivalent. Be precise and data-driven — this report will be used for real financial decisions.`;

  const handleGenerate = async () => {
    if (!form.budget) return;
    setGenerating(true);
    setResult(null);
    setParseError(false);

    const budgetNum = Number(form.budget) || 0;
    const topJurisdictions = getTopJurisdictions(budgetNum, 8)
      .map(j => `${j.flag} ${j.location} (${j.creditRate}, refundable: ${j.refundable})`)
      .join(', ');
    const userMsg = `Project: "${form.title || 'Untitled'}", Genre: ${form.genre}, Budget: $${Number(form.budget).toLocaleString()}, Shoot Duration: ${form.duration || '8'} weeks, Preferred Region: ${form.region}, Language: ${form.language}.

Top eligible jurisdictions for this budget: ${topJurisdictions || 'see full list above'}.

Generate a tax-incentive benchmark JSON. Pick the best 4-5 locations from the eligible list above, prioritising refundable credits and highest savings for this budget size.`;

    try {
      const raw = await callAI(systemPrompt, [{ role: 'user', content: userMsg }]);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({ ...parsed, project: { title: form.title || 'Your Project', genre: form.genre, budget: `$${Number(form.budget).toLocaleString()}`, region: form.region } });
    } catch {
      setParseError(true);
      setResult({ ...MOCK_BENCHMARK, project: { title: form.title || 'Your Project', genre: form.genre, budget: `$${Number(form.budget || 2000000).toLocaleString()}`, region: form.region } });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (!result) return;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const MARGIN = 40;
    const INNER_W = W - MARGIN * 2;
    const LINE_H = 14; // base line height for 9pt text
    let y = 68;

    // Helper: strip emoji / non-latin chars that jsPDF can't render
    const safe = (s = '') => s.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[^\x00-\xFF]/g, '').trim();
    // Helper: show only the credit percentage, not the full type string
    const creditPct = (s = '') => s.split(' ')[0]; // "25–40% Tax Credit" → "25–40%"

    // ── Header bar ──────────────────────────────────────────────────────
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, W, 36, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('MulBros Media OS  —  Film Tax Incentive Benchmark', MARGIN, 23);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      W - MARGIN, 23, { align: 'right' }
    );

    // ── Project title + meta ─────────────────────────────────────────────
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(safe(result.project?.title) || 'Your Project', MARGIN, y);
    y += 18;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Genre: ${result.project?.genre || '—'}   |   Budget: ${result.project?.budget || '—'}   |   Region: ${result.project?.region || '—'}`,
      MARGIN, y
    );
    y += 22;

    // divider
    doc.setDrawColor(220, 220, 220);
    doc.line(MARGIN, y, W - MARGIN, y);
    y += 16;

    // ── Top Recommendation ──────────────────────────────────────────────
    // Calculate how many lines the reason needs (left column only, 55% width)
    const REASON_W = INNER_W * 0.58;
    const RIGHT_W  = INNER_W * 0.38; // right stats panel
    doc.setFontSize(9);
    const reasonLines = doc.splitTextToSize(safe(result.topPick?.reason) || '', REASON_W);
    const heroInnerH  = 20 + 20 + (reasonLines.length * LINE_H) + 16; // label + location + reason + padding
    const heroH       = Math.max(heroInnerH, 90);

    doc.setFillColor(235, 245, 255);
    doc.roundedRect(MARGIN - 8, y, INNER_W + 16, heroH, 6, 6, 'F');

    // Left column
    const lx = MARGIN;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('TOP RECOMMENDATION', lx, y + 14);

    doc.setFontSize(15);
    doc.setTextColor(15, 15, 15);
    doc.text(safe(result.topPick?.location) || '—', lx, y + 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(reasonLines, lx, y + 46);

    // Right column — top-aligned, no overlap with reason
    const rx = W - MARGIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text(safe(result.topPick?.savings) || '', rx, y + 22, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Estimated savings', rx, y + 34, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(59, 130, 246);
    doc.text(creditPct(result.topPick?.credit), rx, y + 52, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Tax credit', rx, y + 64, { align: 'right' });

    y += heroH + 20;

    // ── Comparison table ─────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('Location Comparison', MARGIN, y);
    y += 12;

    // Columns: Location | Credit % | Est. Savings | Min. Spend | Refundable
    // (drop Qualified Spend — it's too verbose for narrow columns)
    const cX = [MARGIN, 220, 300, 390, 470, 530];
    const cH = ['Location', 'Credit %', 'Est. Savings', 'Min. Spend', 'Qualified', 'Refundable'];

    doc.setFillColor(230, 230, 230);
    doc.rect(MARGIN - 8, y, INNER_W + 16, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    cH.forEach((h, i) => doc.text(h, cX[i], y + 12));
    y += 20;

    doc.setFontSize(9);
    (result.comparison || []).forEach((row, idx) => {
      const isTop = safe(row.location) === safe(result.topPick?.location);
      if (isTop) {
        doc.setFillColor(219, 234, 254); // blue-100
      } else if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(MARGIN - 8, y, INNER_W + 16, 18, 'F');

      doc.setFont(isTop ? 'helvetica' : 'helvetica', isTop ? 'bold' : 'normal');
      doc.setTextColor(20, 20, 20);
      const locLabel = safe(row.location) + (isTop ? '  [Best]' : '');
      doc.text(locLabel, cX[0], y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(59, 130, 246);
      doc.text(creditPct(row.credit) || '', cX[1], y + 12);

      doc.setTextColor(16, 185, 129);
      doc.text(safe(row.savings) || '', cX[2], y + 12);

      doc.setTextColor(80, 80, 80);
      doc.text(safe(row.minSpend) || '', cX[3], y + 12);

      // Qualified — first 12 chars max
      const qual = (safe(row.qualified) || '').slice(0, 12);
      doc.text(qual, cX[4], y + 12);

      doc.setTextColor(row.refundable ? 16 : 130, row.refundable ? 185 : 130, row.refundable ? 129 : 130);
      doc.setFont('helvetica', row.refundable ? 'bold' : 'normal');
      doc.text(row.refundable ? 'Yes' : 'No', cX[5], y + 12);

      y += 20;
    });
    y += 16;

    // ── Budget template ──────────────────────────────────────────────────
    if (y > 580) { doc.addPage(); y = MARGIN; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(`Itemized Budget Template  —  ${safe(result.topPick?.location) || ''}`, MARGIN, y);
    y += 12;

    // Columns: Category | Estimate | Qualified | Notes
    const bX = [MARGIN, 200, 295, 360];
    const bH = ['Category', 'Estimate', 'Qualified', 'Notes'];

    doc.setFillColor(230, 230, 230);
    doc.rect(MARGIN - 8, y, INNER_W + 16, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    bH.forEach((h, i) => doc.text(h, bX[i], y + 12));
    y += 20;

    doc.setFontSize(9);
    (result.budgetTemplate || []).forEach((row, idx) => {
      // Wrap notes — calculate row height dynamically
      const noteLines = doc.splitTextToSize(safe(row.notes) || '', INNER_W - (bX[3] - MARGIN) - 8);
      const rowH = Math.max(18, (noteLines.length * LINE_H) + 8);

      if (idx % 2 === 0) { doc.setFillColor(248, 248, 248); } else { doc.setFillColor(255, 255, 255); }
      doc.rect(MARGIN - 8, y, INNER_W + 16, rowH, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(safe(row.category) || '', bX[0], y + 12);

      doc.setTextColor(60, 60, 60);
      doc.text(safe(row.estimate) || '', bX[1], y + 12);

      const isQual = (safe(row.qualified) || '').toLowerCase().startsWith('y');
      doc.setTextColor(isQual ? 16 : 130, isQual ? 185 : 130, isQual ? 129 : 130);
      doc.setFont('helvetica', 'bold');
      doc.text(isQual ? 'Yes' : 'No', bX[2], y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(noteLines, bX[3], y + 12);

      y += rowH;
    });
    y += 16;

    // ── Next step box ────────────────────────────────────────────────────
    if (y > 680) { doc.addPage(); y = MARGIN; }
    doc.setFontSize(9);
    const nextLines = doc.splitTextToSize(safe(result.nextStep) || '', INNER_W - 24);
    const nextH = 22 + (nextLines.length * LINE_H) + 12;

    doc.setFillColor(235, 245, 255);
    doc.roundedRect(MARGIN - 8, y, INNER_W + 16, nextH, 4, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(59, 130, 246);
    doc.text('RECOMMENDED NEXT STEP', MARGIN, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(nextLines, MARGIN, y + 28);
    y += nextH + 8;

    // ── Footer ───────────────────────────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7.5);
    doc.setTextColor(180, 180, 180);
    doc.text(
      'MulBros Media OS  —  Confidential. For internal use only. Tax incentive figures based on Q1 2026 data; verify with a qualified accountant before filing.',
      MARGIN, pageH - 18
    );

    const slug = (result.project?.title || 'benchmark').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`mulbros-incentive-benchmark-${slug}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 p-5 overflow-hidden">
        <BlueBg />
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-blue-400" />
          <span className="text-sm font-semibold text-zinc-100">Project Details</span>
          <span className="text-xs text-zinc-500 ml-1">— the AI will generate a personalized incentive benchmark</span>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Project Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Saltwater" className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-blue-500/50 text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Genre</label>
            <select value={form.genre} onChange={e => set('genre', e.target.value)}
              className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-blue-500/50 text-sm">
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Budget (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
              <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)}
                placeholder="2000000" className="w-full bg-zinc-800 text-zinc-200 rounded-lg pl-6 pr-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Shoot Duration (weeks)</label>
            <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)}
              placeholder="8" className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-blue-500/50 text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Preferred Region</label>
            <select value={form.region} onChange={e => set('region', e.target.value)}
              className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-blue-500/50 text-sm">
              {REGIONS.slice(1).map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Language of Film</label>
            <select value={form.language} onChange={e => set('language', e.target.value)}
              className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700/50 focus:outline-none focus:border-blue-500/50 text-sm">
              {LANGUAGES.slice(1).map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={!form.budget || generating}
          className="relative z-10 flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all">
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generating ? 'Generating Benchmark…' : 'Generate AI Benchmark'}
        </button>
      </div>

      {/* Empty state */}
      {!generating && !result && (
        <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 p-10 flex flex-col items-center gap-3 text-center overflow-hidden">
          <BlueBg />
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <MapPin size={22} className="text-blue-400" />
          </div>
          <div className="relative z-10 text-sm font-semibold text-zinc-300">Enter your project details above</div>
          <div className="relative z-10 text-xs text-zinc-500 max-w-sm leading-relaxed">
            The AI will rank the top 3–5 states or countries by tax credit %, estimate your savings in dollars, and generate an itemized budget template for your chosen location.
          </div>
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 p-10 flex flex-col items-center gap-4 overflow-hidden">
          <BlueBg />
          <Loader2 size={28} className="relative z-10 text-blue-400 animate-spin" />
          <div className="relative z-10 text-sm font-semibold text-zinc-300">Analyzing incentives across 40+ jurisdictions…</div>
          <div className="relative z-10 text-xs text-zinc-500">Comparing tax credits, rebates, qualified spend rules, and cost benchmarks</div>
        </div>
      )}

      {/* Results */}
      {result && !generating && (
        <div className="space-y-5">
          {parseError && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 text-xs text-amber-400">
              Showing sample benchmark — add your OpenAI key in Settings to generate a personalized report.
            </div>
          )}

          {/* Top pick hero */}
          <div className="relative bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Top Recommendation</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">★ Best Pick</span>
              <span className="text-xs text-zinc-600">—</span>
              <span className="text-xs text-zinc-500 italic">{result.project.title} · {result.project.genre} · {result.project.budget}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-zinc-100 mb-1">{result.topPick?.location}</div>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">{result.topPick?.reason}</p>
                {(() => {
                  const topRow = (result.comparison || []).find(r => r.location === result.topPick?.location);
                  return topRow ? (
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${topRow.refundable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {topRow.refundable ? '✓ Refundable credit' : '○ Non-refundable (transferable)'}
                      </span>
                      {topRow.minSpend && (
                        <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-1 rounded-full">
                          Min spend: {topRow.minSpend}
                        </span>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold font-mono text-emerald-400">{result.topPick?.savings}</div>
                <div className="text-xs text-zinc-500 mt-0.5">Estimated savings</div>
                <div className="text-2xl font-bold text-blue-400 mt-2">{result.topPick?.credit}</div>
                <div className="text-xs text-zinc-500">Tax credit rate</div>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 overflow-hidden">
            <BlueBg />
            <div className="relative z-10 px-5 py-3 border-b border-zinc-800/60 bg-gradient-to-r from-blue-500/5 to-transparent">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Location Comparison</span>
            </div>
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                    <th className="text-left py-2.5 px-5 font-medium">Location</th>
                    <th className="text-left py-2.5 px-4 font-medium">Credit %</th>
                    <th className="text-left py-2.5 px-4 font-medium">Est. Savings</th>
                    <th className="text-left py-2.5 px-4 font-medium">Min. Spend</th>
                    <th className="text-left py-2.5 px-4 font-medium">Qualified Spend</th>
                    <th className="text-left py-2.5 px-4 font-medium">Refundable</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.comparison || []).map((row, i) => {
                    const isTop = row.location === result.topPick?.location;
                    return (
                    <tr key={i} className={`border-b border-zinc-800/40 transition-colors ${isTop ? 'bg-blue-500/5 hover:bg-blue-500/8' : 'hover:bg-zinc-800/20'}`}>
                      <td className="py-2.5 px-5 font-medium">
                        <span className={isTop ? 'text-zinc-100' : 'text-zinc-300'}>{row.flag} {row.location}</span>
                        {isTop && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">★ Top</span>}
                      </td>
                      <td className="py-2.5 px-4 text-blue-400 font-bold font-mono">{row.credit}</td>
                      <td className="py-2.5 px-4 text-emerald-400 font-semibold font-mono">{row.savings}</td>
                      <td className="py-2.5 px-4 text-zinc-400">{row.minSpend}</td>
                      <td className="py-2.5 px-4 text-zinc-400 text-xs">{row.qualified}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.refundable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                          {row.refundable ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Budget template */}
          <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 overflow-hidden">
            <BlueBg />
            <div className="relative z-10 px-5 py-3 border-b border-zinc-800/60 bg-gradient-to-r from-blue-500/5 to-transparent flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Itemized Budget Template — {result.topPick?.location}</span>
              <span className="text-xs text-zinc-600">Based on {result.project.budget} budget</span>
            </div>
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                    <th className="text-left py-2.5 px-5 font-medium">Category</th>
                    <th className="text-left py-2.5 px-4 font-medium">Estimate</th>
                    <th className="text-left py-2.5 px-4 font-medium">Qualified Spend</th>
                    <th className="text-left py-2.5 px-4 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.budgetTemplate || []).map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-2.5 px-5 text-zinc-200 font-medium">{row.category}</td>
                      <td className="py-2.5 px-4 text-zinc-300 font-mono">{row.estimate}</td>
                      <td className="py-2.5 px-4 text-emerald-400 font-mono">{row.qualified}</td>
                      <td className="py-2.5 px-4 text-zinc-500 text-xs">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-100 mb-1">Ready to move forward?</div>
              <p className="text-xs text-zinc-400 leading-relaxed">{result.nextStep}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap border border-zinc-700/50">
              <Download size={14} /> Export PDF
            </button>
            <button
              onClick={() => {
                const subject = encodeURIComponent(`Film Financing Consultation — ${result.project?.title || 'My Project'}`);
                const body = encodeURIComponent(
                  `Hi Sean,\n\nI'd like to book a film financing consultation.\n\nProject Details:\n` +
                  `• Title: ${result.project?.title || 'Untitled'}\n` +
                  `• Budget: ${result.project?.budget || 'TBD'}\n` +
                  `• Genre: ${result.project?.genre || 'TBD'}\n` +
                  `• Top Recommended Location: ${result.topPick?.location || 'TBD'} (${result.topPick?.credit || ''} credit)\n` +
                  `• Estimated Savings: ${result.topPick?.savings || 'TBD'}\n\n` +
                  `Please let me know your availability.\n\nThank you`
                );
                window.location.href = `mailto:sean@mulbros.com?subject=${subject}&body=${body}`;
              }}
              className="flex-shrink-0 flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap">
              Book Consultation <ArrowRight size={14} />
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Pipeline DnD primitives ──────────────────────────────────────────────────

const FFDraggableCard = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, position: 'relative', zIndex: 999 }
        : undefined}
      className={`cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-30' : ''}`}
    >
      {children}
    </div>
  );
};

const FFDroppableColumn = ({ id, children, color }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const hoverRing = color === 'emerald' ? 'ring-emerald-500/30 bg-emerald-500/5'
    : color === 'amber'   ? 'ring-amber-500/30 bg-amber-500/5'
    : color === 'purple'  ? 'ring-purple-500/30 bg-purple-500/5'
    : color === 'blue'    ? 'ring-blue-500/30 bg-blue-500/5'
    : 'ring-zinc-600/30 bg-zinc-800/20';
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[72px] rounded-xl p-1 -m-1 transition-all ${isOver ? `ring-1 ${hoverRing}` : ''}`}
    >
      {children}
    </div>
  );
};

// ─── Pipeline tab (with DnD) ──────────────────────────────────────────────────

const PipelineTab = ({ pipeline, setPipeline }) => {
  const [activeCardId, setActiveCardId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    setActiveCardId(null);
    if (!over) return;
    const [srcStage, idxStr] = active.id.split('::');
    const destStage = over.id;
    if (srcStage === destStage) return;
    setPipeline(prev => {
      const src  = [...(prev[srcStage]  || [])];
      const dest = [...(prev[destStage] || [])];
      const [moved] = src.splice(Number(idxStr), 1);
      dest.push(moved);
      return { ...prev, [srcStage]: src, [destStage]: dest };
    });
  };

  const getDraggedCard = () => {
    if (!activeCardId) return null;
    const [stage, idx] = activeCardId.split('::');
    return { card: pipeline[stage]?.[Number(idx)] || null, stage };
  };
  const _dragResult = getDraggedCard();
  const draggedCard = _dragResult ? _dragResult.card : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveCardId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCardId(null)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STAGES.map(stage => {
          const leads = pipeline[stage.key] || [];
          const colors = stageColorMap[stage.color];
          return (
            <div key={stage.key} className="space-y-3">
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${colors.header}`}>
                <span className="text-xs font-semibold uppercase tracking-wider">{stage.label}</span>
                <span className="text-xs font-mono font-bold">{leads.length}</span>
              </div>
              <FFDroppableColumn id={stage.key} color={stage.color}>
                {leads.map((lead, i) => {
                  const cardId = `${stage.key}::${i}`;
                  return (
                    <FFDraggableCard key={cardId} id={cardId}>
                      <div className={`rounded-xl border p-3 ${colors.card}`}>
                        <div className="flex items-start gap-1.5 mb-1">
                          <GripVertical size={11} className="text-zinc-700 flex-shrink-0 mt-0.5" />
                          <div className="text-xs font-semibold text-zinc-200 leading-snug">{lead.title}</div>
                        </div>
                        {lead.director && <div className="text-xs text-zinc-500 mb-1 pl-4">{lead.director}</div>}
                        <div className="flex items-center gap-1.5 flex-wrap mt-2 pl-4">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors.badge}`}>{lead.budget}</span>
                          {lead.country && <span className="text-xs text-zinc-600 truncate">{lead.country}</span>}
                        </div>
                        {lead.daysInStage !== undefined && (
                          <div className="flex items-center gap-1 mt-2 pl-4 text-zinc-600">
                            <Clock size={10} />
                            <span className="text-xs">{lead.daysInStage}d</span>
                          </div>
                        )}
                        {lead.incentiveSavings && (
                          <div className="text-xs text-emerald-400 mt-1 pl-4 font-medium">Saves {lead.incentiveSavings}</div>
                        )}
                        {lead.signal && (
                          <div className="text-xs text-zinc-500 mt-1 pl-4 italic leading-snug">"{lead.signal}"</div>
                        )}
                        {lead.status && <div className="text-xs text-zinc-400 mt-1 pl-4">{lead.status}</div>}
                      </div>
                    </FFDraggableCard>
                  );
                })}
                {leads.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-700/40 p-4 text-center text-xs text-zinc-600">
                    Drop here
                  </div>
                )}
              </FFDroppableColumn>
            </div>
          );
        })}
      </div>

      {/* Ghost card overlay */}
      <DragOverlay>
        {draggedCard ? (
          <div className="rounded-xl border border-blue-500/30 bg-zinc-900 p-3 shadow-2xl shadow-blue-500/10 rotate-1 scale-105 opacity-95">
            <div className="text-xs font-semibold text-zinc-200 mb-1">{draggedCard.title}</div>
            {draggedCard.director && <div className="text-xs text-zinc-500">{draggedCard.director}</div>}
            <div className="text-xs bg-zinc-800 text-zinc-400 inline-block px-1.5 py-0.5 rounded mt-1">{draggedCard.budget}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// ─── Main view ────────────────────────────────────────────────────────────────

export const FilmFinancingView = () => {
  const [activeTab, setActiveTab] = useState('Lead Gen');
  const tabs = ['Lead Gen', 'Incentive Analyst', 'Pipeline', 'Activity'];

  // ── Shared pipeline state — lifted so LeadGen and Pipeline tabs stay in sync ──
  const [pipeline, setPipeline] = useState(() =>
    Object.fromEntries(
      Object.entries(filmFinancingPipeline).map(([k, v]) => [k, v.map(c => ({ ...c }))])
    )
  );

  // Called by LeadGenTab when user clicks "Add to Pipeline"
  const handleAddToPipeline = (lead) => {
    // Map LeadGen result fields → pipeline card fields (matches mockData schema)
    const card = {
      title:       lead.username,                                         // card header
      budget:      lead.budget,
      country:     lead.country || 'Unknown',
      source:      lead.source,
      signal:      lead.snippet ? lead.snippet.substring(0, 80) + '…' : '', // italic context row
      daysInStage: 0,
    };
    setPipeline(prev => ({
      ...prev,
      discovery: [...(prev.discovery || []), card],
    }));
  };

  return (
    <div className="space-y-5">
      {/* ── Cinematic page header ───────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-zinc-900 to-zinc-950 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-blue-500/5 blur-xl rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(59,130,246,0.04),transparent_70%)] pointer-events-none" />
        {/* Film strip holes across top */}
        <div className="absolute top-1.5 left-0 right-0 flex gap-1.5 px-4 pointer-events-none opacity-10">
          {Array.from({ length: 16 }).map((_, i) => <div key={i} className="flex-1 h-1.5 bg-white rounded-[1px]" />)}
        </div>
        {/* Ticket perforation rings */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-blue-500/10 pointer-events-none" />
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-blue-500/15 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Film Financing</h1>
            <p className="text-sm text-zinc-500 mt-1">
              AI-driven lead discovery → tax incentive modeling → production planning → qualified spend tracking → tax filing
            </p>
          </div>
          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg font-medium">
            Vertical A
          </span>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 p-5 overflow-hidden">
            <BlueBg />
            <div className="relative z-10">
              <div className="text-3xl font-bold font-mono text-zinc-100 mb-1">{k.value}</div>
              <div className="text-sm font-medium text-zinc-300 mb-0.5">{k.label}</div>
              <div className="text-xs text-zinc-500">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-blue-400 border-blue-400'
                  : 'text-zinc-400 border-transparent hover:text-zinc-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Gen — passes handleAddToPipeline so leads land in shared pipeline */}
      {activeTab === 'Lead Gen' && <LeadGenTab onAddToPipeline={handleAddToPipeline} />}

      {/* Incentive Analyst */}
      {activeTab === 'Incentive Analyst' && <IncentiveAnalystTab />}

      {/* Pipeline — reads shared pipeline state, changes visible immediately after LeadGen adds */}
      {activeTab === 'Pipeline' && <PipelineTab pipeline={pipeline} setPipeline={setPipeline} />}

      {/* Activity */}
      {activeTab === 'Activity' && (
        <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-blue-900/30 overflow-hidden">
          <BlueBg />
          <div className="relative z-10 px-5 py-4 border-b border-zinc-800/60 bg-gradient-to-r from-blue-500/5 to-transparent">
            <h3 className="text-sm font-semibold text-zinc-100">Recent Agent Activity</h3>
          </div>
          <div className="relative z-10 divide-y divide-zinc-800/40">
            {financingActivities.map((a, i) => (
              <div key={i} className="flex gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors">
                <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 leading-snug">{a.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">{a.agent}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs text-zinc-500">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {financingActivities.length === 0 && (
              <div className="px-5 py-6 text-sm text-zinc-500">No recent activity.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
