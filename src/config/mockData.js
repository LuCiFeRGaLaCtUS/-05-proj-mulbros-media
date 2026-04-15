import { subDays, format } from 'date-fns';

// ─── KPI Cards ────────────────────────────────────────────────────────────────

export const kpiData = [
  {
    id: 'film-financing',
    title: 'Filmmaker Leads',
    value: '47',
    change: '+11 this month',
    changeDirection: 'up',
    subtitle: 'Film Financing Pipeline',
    icon: 'Clapperboard',
    color: 'blue'
  },
  {
    id: 'talent-pipeline',
    title: 'Talent Pipeline Value',
    value: '$127.5K',
    change: '+$34K this month',
    changeDirection: 'up',
    subtitle: 'Luke + Talise combined',
    icon: 'Music',
    color: 'amber'
  },
  {
    id: 'last-county',
    title: 'Last County Streams',
    value: '142,847',
    change: '+12.4%',
    changeDirection: 'up',
    subtitle: 'Hulu · Prime · YouTube',
    icon: 'Film',
    color: 'emerald'
  },
  {
    id: 'active-campaigns',
    title: 'Active Campaigns',
    value: '6',
    change: '+2 this month',
    changeDirection: 'up',
    subtitle: 'Across all verticals',
    icon: 'Megaphone',
    color: 'purple'
  }
];

// ─── Chart Data ───────────────────────────────────────────────────────────────

export const generateChartData = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'MMM dd'),
      filmFinancing: Math.floor(Math.random() * 8) + 1,
      talentOS:      Math.floor(Math.random() * 5000) + 3000,
      lastCounty:    Math.floor(Math.random() * 3000) + 2500,
    });
  }
  return data;
};

// ─── Activity Feed ────────────────────────────────────────────────────────────

export const activities = [
  {
    agent: 'Film Financing — Lead Discovery',
    action: 'Scraped 14 new filmmaker leads from r/indiefilm and Stage32 — budgets $80K–$400K',
    time: '8 min ago',
    vertical: 'financing'
  },
  {
    agent: 'Film Financing — Incentive Analyst',
    action: 'Generated Ohio vs. Georgia tax-incentive benchmark for Maria Chen ($2.1M feature) — projected $340K savings in Ohio',
    time: '22 min ago',
    vertical: 'financing'
  },
  {
    agent: 'Luke Sales Agent',
    action: 'Sent cold email to director of "The Hollow Ground" ($2.1M thriller, Georgia) referencing Last County scoring credit',
    time: '45 min ago',
    vertical: 'composer'
  },
  {
    agent: 'Talise Marketing Agent',
    action: 'Submitted "Western Pine" to 8 Spotify editorial curators — Folk, Americana, and New Artist Discovery playlists',
    time: '1h ago',
    vertical: 'music'
  },
  {
    agent: 'Last County Distribution',
    action: 'Launched TikTok horror-season campaign — 4 video scripts ready, targeting r/horror and indie-film TikTok',
    time: '1h 30m ago',
    vertical: 'film'
  },
  {
    agent: 'Film Financing — Incentive Analyst',
    action: 'Produced Ohio budget template pre-filled with local cost data for David Osei ("Winter Hymnal", $1.4M drama)',
    time: '2h ago',
    vertical: 'financing'
  },
  {
    agent: 'Talise BDR Agent',
    action: 'Triggered 3-step welcome sequence for 45 new Spotify followers — Day 1: full portfolio + SXSW reel sent',
    time: '2h 30m ago',
    vertical: 'music'
  },
  {
    agent: 'Luke Sales Agent',
    action: 'Deal "Echo Valley" moved to Negotiating — proposed fee $35,000, director Tom Brennan reviewing contract',
    time: '3h ago',
    vertical: 'composer'
  },
  {
    agent: 'Last County Distribution',
    action: 'Influencer DM scripts sent to 12 horror micro-influencers (avg 45K followers) — 3 replied with interest',
    time: '3h 30m ago',
    vertical: 'film'
  },
  {
    agent: 'MulBros Intelligence',
    action: 'Identified 34% audience overlap between Last County viewers and Talise fans — cross-promotion flagged for April newsletter',
    time: '4h ago',
    vertical: 'strategy'
  },
  {
    agent: 'Community Manager',
    action: 'April ecosystem newsletter drafted — 847 subscribers, 3 cross-promotions (Last County, Western Pine, Echo Valley score)',
    time: '5h ago',
    vertical: 'community'
  },
  {
    agent: 'Film Financing — Lead Discovery',
    action: 'Qualified 3 Kickstarter filmmaker leads — pre-production, budgets $120K–$280K, all seeking gap financing',
    time: '6h ago',
    vertical: 'financing'
  }
];

// ─── Campaigns ────────────────────────────────────────────────────────────────

export const campaigns = [
  {
    id: 'film-financing-lead-gen',
    name: 'Film Financing — Lead Gen Q2',
    status: 'Active',
    vertical: 'financing',
    channels: ['Reddit Scraping', 'Stage32 Outreach', 'LinkedIn', 'Free Tax Tool'],
    startDate: 'Apr 1, 2026',
    endDate: 'Jun 30, 2026',
    metrics: { leadsScraped: 312, qualified: 47, inPipeline: 19, deals: 3 },
    agent: 'Film Financing — Lead Discovery',
    progress: 30
  },
  {
    id: 'last-county-horror',
    name: 'Last County — Horror Season Push',
    status: 'Active',
    vertical: 'film',
    channels: ['TikTok', 'Instagram', 'Influencer DMs', 'Reddit'],
    startDate: 'Apr 1, 2026',
    endDate: 'Apr 30, 2026',
    metrics: { impressions: 284000, clicks: 12400, streamingLift: '14%', influencers: 12 },
    agent: 'Last County Distribution',
    progress: 65
  },
  {
    id: 'talise-western-pine',
    name: 'Talise — Western Pine Release',
    status: 'Active',
    vertical: 'music',
    channels: ['Spotify Pitching', 'Instagram', 'TikTok', 'YouTube', 'Apple Music'],
    startDate: 'Mar 15, 2026',
    endDate: 'May 15, 2026',
    metrics: { playlistPitches: 24, saves: 4100, streamGrowth: '+8.2%', fanEmails: 45 },
    agent: 'Talise Marketing Agent',
    progress: 48
  },
  {
    id: 'luke-q2-outbound',
    name: 'Luke — Q2 Composer Outbound',
    status: 'Active',
    vertical: 'composer',
    channels: ['Cold Email', 'IMDb Pro', 'Film Freeway', 'LinkedIn'],
    startDate: 'Apr 1, 2026',
    endDate: 'Jun 30, 2026',
    metrics: { contacted: 68, replied: 11, meetings: 4, pipelineValue: '$127,500' },
    agent: 'Luke Sales Agent',
    progress: 28
  },
  {
    id: 'community-newsletter-april',
    name: 'Ecosystem Newsletter — April',
    status: 'Active',
    vertical: 'community',
    channels: ['Email'],
    startDate: 'Apr 15, 2026',
    endDate: 'Apr 15, 2026',
    metrics: { subscribers: 847, estimatedOpenRate: '26%', crossPromotions: 3 },
    agent: 'Community Manager',
    progress: 80
  },
  {
    id: 'film-financing-free-tool',
    name: 'Tax Incentive Calculator — Lead Magnet',
    status: 'Active',
    vertical: 'financing',
    channels: ['SEO', 'Google Ads', 'Film Communities'],
    startDate: 'Mar 1, 2026',
    endDate: 'Jun 30, 2026',
    metrics: { toolUses: 189, emailsCaptured: 94, qualified: 31, avgBudget: '$215K' },
    agent: 'Film Financing — Incentive Analyst',
    progress: 55
  }
];

// ─── Film Financing Pipeline ──────────────────────────────────────────────────

export const filmFinancingPipeline = {
  discovery: [
    { title: 'Unnamed Sci-Fi Feature', source: 'r/indiefilm', budget: '$180K', country: 'US', daysInStage: 1, signal: 'Asked about Ohio tax credits' },
    { title: 'Road Film (Untitled)', source: 'Kickstarter', budget: '$95K', country: 'Canada', daysInStage: 2, signal: 'Crowdfunding, needs gap financing' },
    { title: 'Drama Feature', source: 'Stage32', budget: '$340K', country: 'US', daysInStage: 3, signal: 'Posted "how do I maximize state incentives?"' },
    { title: 'Horror Short Series', source: 'Facebook Group', budget: '$60K', country: 'UK', daysInStage: 1, signal: 'Asking about BFI grants + US co-production' }
  ],
  contacted: [
    { title: 'The Hollow Ground', director: 'Maria Chen', budget: '$2.1M', country: 'Georgia, US', daysInStage: 4, firstMessage: 'Apr 11', response: 'Opened, no reply yet' },
    { title: 'Neon Requiem', director: 'James Park', budget: '$800K', country: 'New York, US', daysInStage: 6, firstMessage: 'Apr 9', response: 'Replied — wants benchmark' },
    { title: 'Birdsong', director: 'Anika Rao', budget: '$3.5M', country: 'India/US', daysInStage: 2, firstMessage: 'Apr 13', response: 'Opened twice, no reply' }
  ],
  qualified: [
    { title: 'Winter Hymnal', director: 'David Osei', budget: '$1.4M', country: 'Michigan, US', daysInStage: 9, incentiveSavings: '$280K', stage: '40% funded, seeking gap financing' },
    { title: 'Frequencies', director: 'Lena Vasquez', budget: '$5M', country: 'California, US', daysInStage: 5, incentiveSavings: '$900K', stage: 'Pre-production, investor attached' }
  ],
  negotiating: [
    { title: 'Echo Valley', director: 'Tom Brennan', budget: '$2.8M', country: 'New Mexico, US', daysInStage: 7, incentiveSavings: '$560K', fee: 'Success-based 8%', status: 'Reviewing proposal' }
  ],
  closed: [
    { title: 'Saltwater', director: 'Nina Choi', budget: '$900K', country: 'Massachusetts, US', status: 'Tracking production', fee: '$12,000 + 6% success', savedAmount: '$210K' },
    { title: 'Last County', director: 'Barret Mulholland', budget: '$1.2M', country: 'Canada/US', status: 'Tax rebate filed', fee: '$18,000', savedAmount: '$180K' }
  ]
};

// ─── Talent — Luke Pipeline ───────────────────────────────────────────────────

export const lukePipeline = {
  prospecting: [
    { title: 'The Hollow Ground', director: 'Maria Chen', budget: '$2.1M', genre: 'Thriller', country: 'Georgia, US', daysInStage: 3 },
    { title: 'Neon Requiem', director: 'James Park', budget: '$800K', genre: 'Sci-Fi Short', country: 'New York, US', daysInStage: 7 },
    { title: 'Birdsong', director: 'Anika Rao', budget: '$3.5M', genre: 'Drama', country: 'Louisiana, US', daysInStage: 1 }
  ],
  pitched: [
    { title: 'Winter Hymnal', director: 'David Osei', budget: '$1.4M', genre: 'Drama', country: 'Michigan, US', daysInStage: 12, pitchSentDate: 'Mar 28' },
    { title: 'Frequencies', director: 'Lena Vasquez', budget: '$5M', genre: 'Sci-Fi', country: 'California, US', daysInStage: 5, pitchSentDate: 'Apr 4' }
  ],
  negotiating: [
    { title: 'Echo Valley', director: 'Tom Brennan', budget: '$2.8M', genre: 'Western', country: 'New Mexico, US', daysInStage: 8, proposedFee: '$35,000' }
  ],
  closed: [
    { title: 'Last County', director: 'Barret Mulholland', budget: '$1.2M', genre: 'Thriller', country: 'Ontario, Canada', status: 'Delivered', fee: '$18,000' },
    { title: 'Saltwater', director: 'Nina Choi', budget: '$900K', genre: 'Indie Drama', country: 'Massachusetts, US', status: 'In Progress', fee: '$12,000', deadline: 'May 15, 2026' }
  ]
};

// ─── Talent — Talise ──────────────────────────────────────────────────────────

export const taliseBio = "Canadian singer-songwriter rooted in country, folk, and Americana. Drawing inspiration from the Canadian wilderness and a deep reverence for storytelling, Talise blends raw lyricism with rustic instrumentation. Represented by WME. Recently performed at SXSW 2026 (Lamberts, Austin). New single 'Western Pine' released March 2026.";

export const taliseStreamingStats = [
  { platform: 'Spotify Monthly Listeners', value: '85,230', change: '+8.2%' },
  { platform: 'YouTube Subscribers', value: '12,400', change: '+3.1%' },
  { platform: 'Apple Music Plays', value: '34,100', change: '+5.6%' },
  { platform: 'TikTok Followers', value: '45,800', change: '+12.4%' }
];

export const taliseRelationships = [
  { name: 'Sarah Mitchell', role: 'Spotify Editorial Curator', platform: 'Spotify', status: 'Active', lastContact: 'Apr 8, 2026', nextAction: 'Pitch Western Pine for Folk Rising playlist' },
  { name: 'Jake Torres', role: 'YouTube Music Blogger', platform: 'YouTube', status: 'Active', lastContact: 'Apr 5, 2026', nextAction: 'Send lyric video for review' },
  { name: 'Midwest Folk Blog', role: 'Music Blog Editor', platform: 'Blog', status: 'Dormant', lastContact: 'Feb 12, 2026', nextAction: 'Re-engage with Western Pine EP' },
  { name: 'KEXP Radio', role: 'Program Director', platform: 'Radio', status: 'Active', lastContact: 'Mar 28, 2026', nextAction: 'Submit for weekly rotation' },
  { name: 'Amanda Liu', role: 'Apple Music Curator', platform: 'Apple Music', status: 'Dormant', lastContact: 'Jan 15, 2026', nextAction: 'Fresh pitch with new single' },
  { name: 'Lamberts Austin', role: 'Venue Booker', platform: 'Live', status: 'Active', lastContact: 'Mar 14, 2026', nextAction: 'Follow up on fall 2026 dates' }
];

// ─── Luke Mulholland ──────────────────────────────────────────────────────────

export const lukeBio = "Berklee College of Music graduate. Triple citizen (Canadian, American, Irish). Composer and multi-instrumentalist based in Boston. Film scoring credits include 'Last County' (Hulu) and songs in Sony's 'Heaven is for Real'. Has shared stages with Bon Jovi and Carlos Santana. Winner, Boston Music Awards.";

export const lukeMetrics = [
  { label: 'Active Leads', value: '14' },
  { label: 'Pipeline Value', value: '$127,500' },
  { label: 'Revenue (Q1)', value: '$30,000' },
  { label: 'Projects Scored', value: '8' }
];

// ─── Audience Segments ────────────────────────────────────────────────────────

export const fanSegments = [
  { name: 'Filmmaker Leads (Warm)', size: 47, source: 'Reddit / Stage32 / Kickstarter', engagement: 'High', topAction: 'Used tax calculator or replied to outreach', color: 'blue' },
  { name: 'Last County Viewers', size: 1240, source: 'Hulu / Landing Page', engagement: 'High', topAction: 'Watched full film', color: 'emerald' },
  { name: 'Talise Spotify Listeners', size: 890, source: 'Spotify / Social', engagement: 'Medium', topAction: 'Saved Western Pine to library', color: 'amber' },
  { name: 'Talise Social Followers', size: 456, source: 'Instagram / TikTok', engagement: 'High', topAction: 'Commented on SXSW posts', color: 'amber' },
  { name: 'Newsletter Subscribers', size: 847, source: 'Email opt-in (all verticals)', engagement: 'Medium', topAction: 'Opened last email (26% rate)', color: 'purple' },
  { name: 'Cross-Pollinated Audience', size: 289, source: 'Multiple touchpoints', engagement: 'Very High', topAction: 'Engaged with 2+ MulBros assets', color: 'rose' }
];

// ─── Vertical Colors ──────────────────────────────────────────────────────────

export const verticalColors = {
  financing: 'blue-500',
  film:      'emerald-500',
  music:     'amber-500',
  composer:  'amber-500',
  community: 'purple-500',
  strategy:  'rose-500'
};

// ─── Content Types ────────────────────────────────────────────────────────────

export const contentTypes = {
  'Last County (Film)':          ['TikTok Script', 'Instagram Reel Caption', 'Influencer DM', 'Hulu Landing Page Copy', 'Email Campaign', 'Press Release'],
  'Talise (Artist)':             ['TikTok Behind-the-Scenes', 'Instagram Caption', 'Spotify Pitch Email', 'YouTube Description', 'Fan Newsletter', 'Press Bio'],
  'Luke Mulholland (Composer)':  ['Cold Email to Director', 'Portfolio Page Copy', 'LinkedIn Post', 'Case Study', 'Project Proposal', 'Scoring Reel Script'],
  'Film Financing':              ['Filmmaker Outreach DM', 'Tax Incentive Benchmark Report', 'Cold Email to Producer', 'Free Tool Landing Page', 'Case Study — Incentive Savings'],
  'Community (Newsletter)':      ['Monthly Newsletter', 'Welcome Email Sequence', 'Re-engagement Email', 'Cross-Promotion Post']
};

export const tones = ['Professional', 'Casual & Authentic', 'Urgent/Exciting', 'Storytelling', 'Data-Driven', 'Warm & Human'];

// ─── Team ─────────────────────────────────────────────────────────────────────

export const settingsTeam = [
  { name: 'Arghya Chowdhury', role: 'Lead Developer / AI Engineer', allocation: 'Full-Time', status: 'Active' },
  { name: 'Snehaal Dhruv', role: 'Partner / Engagement Lead', allocation: '0.5 FTE', status: 'Active' },
  { name: 'Technical Lead', role: 'Architecture & Shared Layers', allocation: 'Full-Time', status: 'Active' },
  { name: 'AI Engineer A', role: 'Film Financing Vertical', allocation: 'Full-Time', status: 'Active' },
  { name: 'AI Engineer B', role: 'Talent OS Vertical', allocation: 'Full-Time', status: 'Active' }
];
