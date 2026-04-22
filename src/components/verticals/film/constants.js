// Shared constants + mock data for the Film Financing vertical.
// Extracted from FilmFinancingView.jsx for maintainability.

import { activities } from '../../../config/mockData';

export const STAGES = [
  { key: 'discovery',   label: 'Discovery',   color: 'zinc' },
  { key: 'contacted',   label: 'Contacted',   color: 'blue' },
  { key: 'qualified',   label: 'Qualified',   color: 'amber' },
  { key: 'negotiating', label: 'Negotiating', color: 'purple' },
  { key: 'closed',      label: 'Closed',      color: 'emerald' },
];

export const stageColorMap = {
  zinc:    { header: 'bg-zinc-100 text-zinc-700',          card: 'border-zinc-200 bg-zinc-50',          badge: 'bg-zinc-100 text-zinc-700' },
  blue:    { header: 'bg-blue-50 text-blue-700',           card: 'border-blue-200 bg-blue-50/50',       badge: 'bg-blue-50 text-blue-700' },
  amber:   { header: 'bg-amber-50 text-amber-700',         card: 'border-amber-200 bg-amber-50/50',     badge: 'bg-amber-50 text-amber-700' },
  purple:  { header: 'bg-purple-50 text-purple-700',       card: 'border-purple-200 bg-purple-50/50',   badge: 'bg-purple-50 text-purple-700' },
  emerald: { header: 'bg-emerald-50 text-emerald-700',     card: 'border-emerald-200 bg-emerald-50/50', badge: 'bg-emerald-50 text-emerald-700' },
};

export const kpis = [
  { label: 'Leads Scraped',       value: '312',    sub: 'This quarter' },
  { label: 'Qualified Leads',     value: '47',     sub: '+11 this month' },
  { label: 'Pipeline Value',      value: '$1.9M',  sub: 'Active deal value' },
  { label: 'Incentives Modeled',  value: '$2.1M',  sub: 'Savings identified' },
];

export const SOURCE_GROUPS = [
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

export const ALL_SOURCE_IDS = SOURCE_GROUPS.flatMap(g => g.sources.map(s => s.id));

export const groupColorMap = {
  orange: { active: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400' },
  green:  { active: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500' },
  blue:   { active: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-500' },
  purple: { active: 'bg-purple-50 text-purple-700 border-purple-200',dot: 'bg-purple-500' },
  rose:   { active: 'bg-rose-50 text-rose-700 border-rose-200',      dot: 'bg-rose-500' },
};

export const ALL_SUBREDDITS = [
  'r/indiefilm', 'r/filmmakers', 'r/lowbudgetfilmmaking',
  'r/Filmmaking', 'r/moviemaking', 'r/Screenwriting',
  'r/shoestring', 'r/FilmSchool', 'r/TrueFilm',
];

export const SIGNAL_KEYWORDS = [
  'tax incentive', 'tax credit', 'gap financing', 'production budget',
  'state rebate', 'film grant', 'EU co-production', 'BFI grant',
  'Screen Australia', 'Telefilm Canada', 'global tax rebate', 'co-production treaty',
  'investor', 'pre-production', 'looking for financing',
];

export const REGIONS = ['All Regions', 'United States', 'Canada', 'United Kingdom', 'Europe', 'Australia', 'India', 'Latin America', 'Global'];
export const LANGUAGES = ['Any Language', 'English', 'Spanish', 'French', 'Hindi', 'Portuguese', 'German', 'Other'];

export const MOCK_RESULTS = [
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

export const sourceColorMap = {
  reddit:        'bg-orange-50 text-orange-700 border border-orange-200',
  facebook:      'bg-indigo-50 text-indigo-700 border border-indigo-200',
  discord:       'bg-violet-50 text-violet-700 border border-violet-200',
  linkedin:      'bg-sky-50 text-sky-700 border border-sky-200',
  kickstarter:   'bg-green-50 text-green-700 border border-green-200',
  indiegogo:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  filmocracy:    'bg-teal-50 text-teal-700 border border-teal-200',
  stage32:       'bg-blue-50 text-blue-700 border border-blue-200',
  slated:        'bg-cyan-50 text-cyan-700 border border-cyan-200',
  filmhedge:     'bg-blue-50 text-blue-700 border border-blue-200',
  shootingpeople:'bg-sky-50 text-sky-700 border border-sky-200',
  mandy:         'bg-blue-50 text-blue-700 border border-blue-200',
  cannes:        'bg-purple-50 text-purple-700 border border-purple-200',
  afm:           'bg-purple-50 text-purple-700 border border-purple-200',
  efm:           'bg-purple-50 text-purple-700 border border-purple-200',
  imdbpro:       'bg-rose-50 text-rose-700 border border-rose-200',
};

export const signalBadge = {
  high:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
};

export const GENRES = ['Thriller', 'Drama', 'Horror', 'Comedy', 'Action', 'Documentary', 'Sci-Fi', 'Romance', 'Animation', 'Other'];

export const MOCK_BENCHMARK = {
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

export const financingActivities = activities.filter(a => a.vertical === 'financing');
