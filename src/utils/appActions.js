export const createActionHandlers = (appState) => {
  const { setActivePage } = appState;

  const actions = {
    navigate: (page) => {
      // Map aliases → real App.jsx routes
      const aliases = {
        talent:    'music',
        composer:  'music',
        content:   'agents',
        campaigns: 'financing',
        community: 'music',
        analytics: 'dashboard',
      };
      const pageNames = {
        dashboard:   'Dashboard',
        financing:   'Film Financing',
        productions: 'Productions & Distribution',
        music:       'Music & Composition',
        agents:      'Agent Chat',
        settings:    'Settings',
      };
      const resolved = aliases[page] || page;
      setActivePage(resolved);
      return `Navigated to ${pageNames[resolved] || resolved}`;
    },

    openAgentChat: (agentId) => {
      setActivePage('agents');
      return `Opened Agent Chat${agentId ? ` — look for ${agentId} in the sidebar` : ''}.`;
    },

    getNavigationOptions: () => [
      { name: 'Dashboard',                  page: 'dashboard',   description: 'KPIs, engagement charts, activity feed' },
      { name: 'Film Financing',             page: 'financing',   description: 'Lead gen, incentive analyst, pipeline' },
      { name: 'Productions & Distribution', page: 'productions', description: 'Active productions and Last County distribution' },
      { name: 'Music & Composition',        page: 'music',       description: 'Talise (sync artist) and Luke (film composer)' },
      { name: 'Agent Chat',                 page: 'agents',      description: 'Chat with any AI agent directly' },
      { name: 'Settings',                   page: 'settings',    description: 'API keys and configuration' },
    ],
  };

  return actions;
};

export const parseUserIntent = (userMessage) => {
  const message = userMessage.toLowerCase();

  const patterns = [
    { regex: /how much (did |is )?luke (make|earn|revenue)/i,        action: 'lukeRevenue' },
    { regex: /luke'?s (revenue|money|earnings|income)/i,             action: 'lukeRevenue' },
    { regex: /luke (pipeline|deals|leads)/i,                         action: 'lukePipeline' },
    { regex: /talise (stats|listeners|streams|followers)/i,          action: 'taliseStats' },
    { regex: /talise'?s (stats|numbers|metrics)/i,                   action: 'taliseStats' },
    { regex: /(last county|hulu streams)/i,                          action: 'lastCounty' },
    { regex: /campaigns?/i,                                          action: 'campaigns' },
    { regex: /community|fans?|segments?|subscribers?/i,              action: 'community' },
    { regex: /go to|navigate|open (the )?(dashboard|film financing|productions|music|agents|settings)/i, action: 'navigate' },
    { regex: /chat with|open agent/i,                                action: 'agentChat' },
    { regex: /analytics|overview|summary/i,                          action: 'analytics' },
    { regex: /help|what can you do/i,                                action: 'help' },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(message)) return pattern.action;
  }
  return 'general';
};

export const getQuickResponses = (action) => {
  const responses = {
    lukeRevenue:  "Luke's confirmed revenue: $30,000 ($18K Last County — delivered, $12K Saltwater — in progress). Echo Valley ($35K) is still in negotiation. Want to see the full pipeline?",
    lukePipeline: "Luke's Pipeline:\n• Prospecting: The Hollow Ground, Neon Requiem, Birdsong\n• Pitched: Winter Hymnal, Frequencies\n• Negotiating: Echo Valley ($35K proposed fee)\n• Closed: Last County ($18K ✓), Saltwater ($12K, May 15)",
    taliseStats:  "Talise's Streaming Stats:\n• Spotify: 85,230 monthly listeners (+8.2%)\n• YouTube: 12,400 subscribers\n• Apple Music: 34,100 plays\n• TikTok: 45,800 followers",
    lastCounty:   "Last County:\n• Hulu Streams: 142,847 (+12.4%)\n• Social Impressions: 284K\n• Streaming on Hulu, Prime, YouTube\n• Premiered: Blood in the Snow Film Festival",
    campaigns:    "Active Campaigns (6 total):\n1. Last County — Horror Season Push (65%)\n2. Talise — Western Pine Release (45%)\n3. Luke — Q2 Composer Outbound (25%)\n4. Ecosystem Newsletter — April (Active)\n5. Film Financing — Lead Gen Q2\n6. Tax Incentive Calculator — Lead Magnet",
    community:    "Community Stats:\n• Email Subscribers: 847\n• Fan Segments: 6\n• Cross-segment overlap: 34%",
    analytics:    "Analytics Overview:\n• Total Impressions: 1.24M\n• Total Engagement: 89.4K\n• Active Campaigns: 6\n• Pipeline Value: $214K",
    agentChat:    "Which agent do you want to chat with?\n• Film Financing — Lead Discovery\n• Film Financing — Incentive Analyst\n• Last County Distribution\n• Talise Marketing / Sync & Licensing\n• Luke Marketing / Luke Sales\n• Community Manager\n• MulBros Intelligence\n\nJust say 'chat with [agent name]' or click Agent Chat in the sidebar.",
    help:         "I can help you with:\n• Luke's revenue and pipeline\n• Talise's streaming stats\n• Campaign status\n• Community metrics\n• Navigate to any page (Film Financing, Productions, Music, etc.)\n• Chat with specific agents\n\nJust ask!",
  };

  return responses[action] || responses.help;
};
