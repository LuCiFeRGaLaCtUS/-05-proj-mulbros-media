import { 
  kpiData, 
  generateChartData, 
  activities, 
  campaigns, 
  fanSegments, 
  lukePipeline,
  lukeMetrics,
  taliseStreamingStats,
  taliseRelationships,
  settingsTeam,
  lukeBio,
  taliseBio
} from '../config/mockData';

export const getDashboardKPIs = () => kpiData;

export const getEngagementData = () => generateChartData();

export const getActivities = () => activities;

export const getCampaigns = () => campaigns;

export const getFanSegments = () => fanSegments;

export const getLukeStats = () => ({
  bio: lukeBio,
  metrics: lukeMetrics,
  pipeline: lukePipeline,
  closedDeals: lukePipeline.closed,
  activeLeads: lukePipeline.prospecting.length + lukePipeline.pitched.length + lukePipeline.negotiating.length,
  totalRevenue: '$30,000', // confirmed: $18K delivered + $12K in progress; Echo Valley ($35K) still negotiating
  revenueBreakdown: [
    { project: 'Last County', fee: '$18,000', status: 'Delivered' },
    { project: 'Saltwater', fee: '$12,000', status: 'In Progress (May 15)' },
    { project: 'Echo Valley', fee: '$35,000', status: 'Negotiating' }
  ]
});

export const getTaliseStats = () => ({
  bio: taliseBio,
  streaming: taliseStreamingStats,
  relationships: taliseRelationships,
  totalListeners: '85,230',
  platforms: {
    spotify: '85,230 monthly listeners',
    youtube: '12,400 subscribers',
    appleMusic: '34,100 plays',
    tiktok: '45,800 followers'
  }
});

export const getTeam = () => settingsTeam;

export const getAnalyticsSummary = () => ({
  impressions: '1.24M',
  engagement: '89.4K',
  subscribers: '847',
  campaigns: String(campaigns.length),
  pipelineValue: '$214K'
});

export const getQuickStats = () => ({
  lastCounty: { streams: '142,847', change: '+12.4%' },
  talise: { listeners: '85,230', change: '+8.2%' },
  luke: { leads: '14', revenue: '$30K' },
  community: { fans: '2,847', emailSubs: '847' }
});

// M15: read calendar posts saved by CalendarView so chatbot knows scheduled content
const getCalendarSummary = () => {
  try {
    const posts = JSON.parse(localStorage.getItem('mulbros_calendar_v1') || '[]');
    if (!posts.length) return 'No posts scheduled yet.';
    const byStatus = posts.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    const lines = Object.entries(byStatus).map(([s, n]) => `  ${n} ${s}`).join('\n');
    return `${posts.length} total posts:\n${lines}`;
  } catch { return 'Unavailable.'; }
};

export const formatDataForAI = () => {
  const lukeStats = getLukeStats();
  const taliseStats = getTaliseStats();
  const analytics = getAnalyticsSummary();
  const quickStats = getQuickStats();
  const allCampaigns = getCampaigns();
  const segments = getFanSegments();

  return `
=== MULBROS MARKETING OS DATA ===

DASHBOARD KPIs:
- Last County (Hulu): ${quickStats.lastCounty.streams} streams (${quickStats.lastCounty.change})
- Talise: ${quickStats.talise.listeners} monthly listeners (${quickStats.talise.change})
- Luke: ${quickStats.luke.leads} active scoring leads

TALISE (Artist):
- Spotify: ${taliseStats.platforms.spotify}
- YouTube: ${taliseStats.platforms.youtube}
- Apple Music: ${taliseStats.platforms.appleMusic}
- TikTok: ${taliseStats.platforms.tiktok}
- Relationships: ${taliseStats.relationships.length} contacts

LUKE (Composer):
- Revenue: ${lukeStats.totalRevenue}
  - Last County: $18,000 (Delivered)
  - Saltwater: $12,000 (In Progress - May 15)
  - Echo Valley: $35,000 (Negotiating)
- Pipeline: ${lukeStats.activeLeads} active leads
- Deals in pipeline: ${lukeStats.pipeline.prospecting.length} prospecting, ${lukeStats.pipeline.pitched.length} pitched, ${lukeStats.pipeline.negotiating.length} negotiating

CAMPAIGNS (${allCampaigns.length}):
${allCampaigns.map(c => `- ${c.name}: ${c.status} (${c.progress}% complete)`).join('\n')}

COMMUNITY:
- Total Fans: ${quickStats.community.fans}
- Email Subscribers: ${quickStats.community.emailSubs}
- Fan Segments: ${segments.length} segments
- Cross-segment overlap: 34%

ANALYTICS:
- Total Impressions: ${analytics.impressions}
- Total Engagement: ${analytics.engagement}
- Pipeline Value: ${analytics.pipelineValue}

CONTENT CALENDAR:
${getCalendarSummary()}
`;
};