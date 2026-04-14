import { subDays, format } from 'date-fns';

export const kpiData = [
  {
    id: 'last-county',
    title: 'Last County — Hulu Streams',
    value: '142,847',
    change: '+12.4%',
    changeDirection: 'up',
    subtitle: 'Streaming on Hulu, Prime, YouTube',
    icon: 'Film',
    color: 'blue'
  },
  {
    id: 'talise',
    title: 'Talise — Monthly Listeners',
    value: '85,230',
    change: '+8.2%',
    changeDirection: 'up',
    subtitle: 'Spotify · YouTube · Apple Music',
    icon: 'Music',
    color: 'amber'
  },
  {
    id: 'luke',
    title: 'Luke — Active Scoring Leads',
    value: '14',
    change: '+2 this week',
    changeDirection: 'up',
    subtitle: 'Composer · Film/TV Scoring',
    icon: 'Piano',
    color: 'emerald'
  }
];

export const generateChartData = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'MMM dd'),
      lastCounty: Math.floor(Math.random() * 3000) + 2000,
      talise: Math.floor(Math.random() * 2000) + 1500,
      luke: Math.floor(Math.random() * 500) + 200,
    });
  }
  return data;
};

export const activities = [
  { agent: 'Talise Marketing Agent', action: "Generated 5 Instagram captions for new single 'Western Pine'", time: '12 min ago', vertical: 'music' },
  { agent: 'Luke Sales Agent', action: 'Identified 3 indie films in pre-production needing composers', time: '28 min ago', vertical: 'composer' },
  { agent: 'Distribution Marketing Agent', action: 'Created Last County TikTok campaign — 4 video scripts ready', time: '1h ago', vertical: 'film' },
  { agent: 'Community Manager', action: 'Monthly newsletter draft ready — 847 subscribers', time: '1h ago', vertical: 'community' },
  { agent: 'Influencer Outreach Agent', action: 'Sent DM scripts to 12 horror micro-influencers for Last County', time: '2h ago', vertical: 'film' },
  { agent: 'Talise BDR Agent', action: 'Welcome email sequence sent to 45 new Spotify followers', time: '2h ago', vertical: 'music' },
  { agent: 'Cross-Vertical Intelligence', action: 'Identified synergy: Last County viewers 34% overlap with Talise fans', time: '3h ago', vertical: 'strategy' },
  { agent: 'Luke Marketing Agent', action: "Updated portfolio page SEO — targeting 'indie film composer Boston'", time: '3h ago', vertical: 'composer' },
  { agent: 'Distribution Marketing Agent', action: 'Hulu streaming funnel page updated — CTR improved 8%', time: '4h ago', vertical: 'film' },
  { agent: 'Talise Marketing Agent', action: 'Spotify playlist pitch sent to 8 editorial curators', time: '5h ago', vertical: 'music' },
  { agent: 'Luke Sales Agent', action: "Cold email drafted for director of 'The Hollow Ground' ($2.1M budget)", time: '6h ago', vertical: 'composer' },
  { agent: 'Community Manager', action: 'Fan segment analysis complete — 3 new micro-segments identified', time: '8h ago', vertical: 'community' }
];

export const campaigns = [
  {
    id: 'last-county-horror',
    name: 'Last County — Horror Season Push',
    status: 'Active',
    vertical: 'film',
    channels: ['TikTok', 'Instagram', 'Influencer DMs'],
    startDate: 'Apr 1, 2026',
    endDate: 'Apr 30, 2026',
    metrics: { impressions: 284000, clicks: 12400, conversions: 890, spend: 1200 },
    agent: 'Distribution Marketing Agent',
    progress: 65
  },
  {
    id: 'talise-western-pine',
    name: 'Talise — Western Pine Release',
    status: 'Active',
    vertical: 'music',
    channels: ['Spotify Pitching', 'Instagram', 'TikTok', 'YouTube'],
    startDate: 'Mar 15, 2026',
    endDate: 'May 15, 2026',
    metrics: { impressions: 156000, clicks: 8900, conversions: 2100, spend: 450 },
    agent: 'Talise Marketing Agent',
    progress: 45
  },
  {
    id: 'luke-q2-outbound',
    name: 'Luke — Q2 Outbound Blitz',
    status: 'Active',
    vertical: 'composer',
    channels: ['Cold Email', 'LinkedIn', 'Portfolio SEO'],
    startDate: 'Apr 1, 2026',
    endDate: 'Jun 30, 2026',
    metrics: { impressions: 0, clicks: 0, conversions: 3, spend: 0 },
    agent: 'Luke Sales Agent',
    progress: 25
  },
  {
    id: 'newsletter-april',
    name: 'Ecosystem Newsletter — April Edition',
    status: 'Scheduled',
    vertical: 'community',
    channels: ['Email'],
    startDate: 'Apr 15, 2026',
    endDate: 'Apr 15, 2026',
    metrics: { subscribers: 847, estimatedOpenRate: '24%' },
    agent: 'Community Manager Agent',
    progress: 80
  }
];

export const fanSegments = [
  { name: 'Last County Viewers', size: 1240, source: 'Hulu/Landing Page', engagement: 'High', topAction: 'Watched full film', color: 'blue' },
  { name: 'Talise Spotify Listeners', size: 890, source: 'Spotify/Social', engagement: 'Medium', topAction: 'Saved to library', color: 'amber' },
  { name: 'Talise Social Followers', size: 456, source: 'Instagram/TikTok', engagement: 'High', topAction: 'Commented on posts', color: 'amber' },
  { name: 'Luke Portfolio Visitors', size: 178, source: 'Google/Direct', engagement: 'Low', topAction: 'Viewed reel page', color: 'emerald' },
  { name: 'Newsletter Subscribers', size: 847, source: 'Email opt-in', engagement: 'Medium', topAction: 'Opened last email', color: 'purple' },
  { name: 'Cross-Pollinated Fans', size: 236, source: 'Multiple touchpoints', engagement: 'Very High', topAction: 'Engaged with 2+ assets', color: 'rose' }
];

export const lukePipeline = {
  prospecting: [
    { title: 'The Hollow Ground', director: 'Maria Chen', budget: '$2.1M', genre: 'Thriller', state: 'Georgia', daysInStage: 3 },
    { title: 'Neon Requiem', director: 'James Park', budget: '$800K', genre: 'Sci-Fi Short', state: 'New York', daysInStage: 7 },
    { title: 'Birdsong', director: 'Anika Rao', budget: '$3.5M', genre: 'Drama', state: 'Louisiana', daysInStage: 1 }
  ],
  pitched: [
    { title: 'Winter Hymnal', director: 'David Osei', budget: '$1.4M', genre: 'Drama', state: 'Michigan', daysInStage: 12, pitchSentDate: 'Mar 28' },
    { title: 'Frequencies', director: 'Lena Vasquez', budget: '$5M', genre: 'Sci-Fi', state: 'California', daysInStage: 5, pitchSentDate: 'Apr 4' }
  ],
  negotiating: [
    { title: 'Echo Valley', director: 'Tom Brennan', budget: '$2.8M', genre: 'Western', state: 'New Mexico', daysInStage: 8, proposedFee: '$35,000' }
  ],
  closed: [
    { title: 'Last County', director: 'Barret Mulholland', budget: '$1.2M', genre: 'Thriller', state: 'Ontario', status: 'Delivered', fee: '$18,000' },
    { title: 'Saltwater', director: 'Nina Choi', budget: '$900K', genre: 'Indie Drama', state: 'Massachusetts', status: 'In Progress', fee: '$12,000', deadline: 'May 15, 2026' }
  ]
};

export const taliseRelationships = [
  { name: 'Sarah Mitchell', role: 'Spotify Editorial Curator', platform: 'Spotify', status: 'Active', lastContact: 'Apr 8, 2026', nextAction: 'Pitch new single' },
  { name: 'Jake Torres', role: 'YouTube Music Blogger', platform: 'YouTube', status: 'Active', lastContact: 'Apr 5, 2026', nextAction: 'Send lyric video' },
  { name: 'Midwest Folk Blog', role: 'Music Blog Editor', platform: 'Blog', status: 'Dormant', lastContact: 'Feb 12, 2026', nextAction: 'Re-engage with new EP' },
  { name: 'KEXP Radio', role: 'Program Director', platform: 'Radio', status: 'Active', lastContact: 'Mar 28, 2026', nextAction: 'Submit for rotation' },
  { name: 'Amanda Liu', role: 'Apple Music Curator', platform: 'Apple Music', status: 'Dormant', lastContact: 'Jan 15, 2026', nextAction: 'New pitch needed' },
  { name: 'Lamberts Austin', role: 'Venue Booker', platform: 'Live', status: 'Active', lastContact: 'Mar 14, 2026', nextAction: 'Follow up on fall dates' }
];

export const taliseBio = "Canadian singer-songwriter rooted in country, folk, and Americana. Drawing inspiration from the Canadian wilderness and a deep reverence for storytelling, Talise blends raw lyricism with rustic instrumentation. Represented by WME. Recently performed at SXSW 2026 (Lamberts, Austin).";

export const taliseStreamingStats = [
  { platform: 'Spotify Monthly Listeners', value: '85,230' },
  { platform: 'YouTube Subscribers', value: '12,400' },
  { platform: 'Apple Music Plays', value: '34,100' },
  { platform: 'TikTok Followers', value: '45,800' }
];

export const lukeBio = "Berklee College of Music graduate. Triple citizen (Canadian, American, Irish). Composer and multi-instrumentalist based in Boston. Film scoring credits include 'Last County' (Hulu) and songs in Sony's 'Heaven is for Real'. Has shared stages with Bon Jovi and Carlos Santana. Winner, Boston Music Awards.";

export const lukeMetrics = [
  { label: 'Active Leads', value: '14' },
  { label: 'Projects Scored', value: '8' },
  { label: 'Revenue (Q1)', value: '$30,000' }
];

export const verticalColors = {
  film: 'blue-500',
  music: 'amber-500',
  composer: 'emerald-500',
  community: 'purple-500',
  strategy: 'rose-500'
};

export const settingsTeam = [
  { name: 'Snehaal', role: 'Partner / Engagement Lead', allocation: '0.5 FTE', status: 'Active' },
  { name: 'Technical Lead', role: 'Architecture & Shared Layers', allocation: 'Full-Time', status: 'Active' },
  { name: 'AI Engineer A', role: 'Film Financing Vertical', allocation: 'Full-Time', status: 'Active' },
  { name: 'AI Engineer B', role: 'Film Production Vertical', allocation: 'Full-Time', status: 'Active' },
  { name: 'AI Engineer C', role: 'Music Vertical', allocation: 'Full-Time', status: 'Active' }
];

export const contentTypes = {
  'Last County (Film)': ['TikTok Script', 'Instagram Reel Caption', 'Influencer DM', 'Hulu Landing Page Copy', 'Email Campaign'],
  'Talise (Artist)': ['TikTok Behind-the-Scenes', 'Instagram Caption', 'Spotify Pitch Email', 'YouTube Description', 'Fan Newsletter'],
  'Luke Mulholland (Composer)': ['Cold Email to Director', 'Portfolio Page Copy', 'LinkedIn Post', 'Case Study', 'Project Proposal'],
  'Community (Newsletter)': ['Monthly Newsletter', 'Welcome Email Sequence', 'Re-engagement Email', 'Cross-Promotion Post']
};

export const tones = ['Professional', 'Casual & Authentic', 'Urgent/Exciting', 'Storytelling', 'Data-Driven'];