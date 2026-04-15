import React, { useState } from 'react';
import { filmFinancingPipeline, activities } from '../../config/mockData';
import {
  Clock, Search, Sparkles, CheckCircle2, Plus, Send,
  ChevronDown, ChevronUp, AlertCircle, Users, RefreshCw
} from 'lucide-react';

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

const LeadGenTab = () => {
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

  const addToPipeline = (id) => setAddedIds(prev => [...prev, id]);
  const sendOutreach  = (id) => setOutreachIds(prev => [...prev, id]);

  const highSignal = results.filter(r => r.signal === 'high').length;
  const totalActive = activeSources.length;

  return (
    <div className="space-y-5">
      {/* Config panel */}
      <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center gap-2">
          <Search size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-zinc-100">Configure Global Lead Scan</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            <Sparkles size={9} /> AI-Powered
          </span>
        </div>

        <div className="p-5 grid grid-cols-2 gap-6">
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
        <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-6 flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-1.5 h-6 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <div className="text-sm text-zinc-300 font-medium">
            AI scanning {activeSources.join(', ')}…
          </div>
          <div className="text-xs text-zinc-500">Extracting high-intent signals from posts and profiles</div>
        </div>
      )}

      {/* Results */}
      {scanned && !scanning && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-4 bg-zinc-900 rounded-xl ring-1 ring-zinc-800 px-5 py-3 flex-wrap">
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
                className={`bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-4 flex flex-col gap-3 ${
                  addedIds.includes(lead.id) ? 'opacity-60' : ''
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
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
                <div className="text-xs font-semibold text-zinc-300">{lead.username}</div>

                {/* Signal snippet */}
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 italic">{lead.snippet}</p>

                {/* Meta */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-400">{lead.budget}</span>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700/40">{lead.country}</span>
                  <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700/40">{lead.language}</span>
                  <span className="text-xs text-zinc-600">{lead.postedAgo}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map(t => (
                    <span key={t} className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700/40">{t}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
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
        <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Search size={22} className="text-blue-400" />
          </div>
          <div className="text-sm font-semibold text-zinc-300">Configure sources and run a scan</div>
          <div className="text-xs text-zinc-500 max-w-sm leading-relaxed">
            The AI agent will scan selected platforms for posts containing high-intent signals — filmmakers discussing tax incentives, gap financing, production budgets, and location decisions.
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main view ────────────────────────────────────────────────────────────────

export const FilmFinancingView = () => {
  const [activeTab, setActiveTab] = useState('Lead Gen');
  const tabs = ['Lead Gen', 'Pipeline', 'Activity'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
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

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-5">
            <div className="text-3xl font-bold font-mono text-zinc-100 mb-1">{k.value}</div>
            <div className="text-sm font-medium text-zinc-300 mb-0.5">{k.label}</div>
            <div className="text-xs text-zinc-500">{k.sub}</div>
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

      {/* Lead Gen */}
      {activeTab === 'Lead Gen' && <LeadGenTab />}

      {/* Pipeline */}
      {activeTab === 'Pipeline' && (
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map(stage => {
            const leads = filmFinancingPipeline[stage.key] || [];
            const colors = stageColorMap[stage.color];
            return (
              <div key={stage.key} className="space-y-3">
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${colors.header}`}>
                  <span className="text-xs font-semibold uppercase tracking-wider">{stage.label}</span>
                  <span className="text-xs font-mono font-bold">{leads.length}</span>
                </div>
                <div className="space-y-2">
                  {leads.map((lead, i) => (
                    <div key={i} className={`rounded-xl border p-3 ${colors.card}`}>
                      <div className="text-xs font-semibold text-zinc-200 mb-1 leading-snug">{lead.title}</div>
                      {lead.director && <div className="text-xs text-zinc-500 mb-1">{lead.director}</div>}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors.badge}`}>{lead.budget}</span>
                        {lead.country && <span className="text-xs text-zinc-600 truncate">{lead.country}</span>}
                      </div>
                      {lead.daysInStage !== undefined && (
                        <div className="flex items-center gap-1 mt-2 text-zinc-600">
                          <Clock size={10} />
                          <span className="text-xs">{lead.daysInStage}d</span>
                        </div>
                      )}
                      {lead.incentiveSavings && (
                        <div className="text-xs text-emerald-400 mt-1 font-medium">Saves {lead.incentiveSavings}</div>
                      )}
                      {lead.signal && (
                        <div className="text-xs text-zinc-500 mt-1 italic leading-snug">"{lead.signal}"</div>
                      )}
                      {lead.status && <div className="text-xs text-zinc-400 mt-1">{lead.status}</div>}
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <div className="rounded-xl border border-zinc-700/30 p-3 text-center text-xs text-zinc-600">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity */}
      {activeTab === 'Activity' && (
        <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60">
            <h3 className="text-sm font-semibold text-zinc-100">Recent Agent Activity</h3>
          </div>
          <div className="divide-y divide-zinc-800/40">
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
