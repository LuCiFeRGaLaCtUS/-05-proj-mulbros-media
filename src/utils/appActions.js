export const createActionHandlers = (appState) => {
  const { setActivePage, setCampaigns, setMessages, setTarget, setContentType } = appState;

  const actions = {
    navigate: (page) => {
      const pageNames = {
        dashboard: 'Dashboard',
        talent: 'Talent Manager',
        content: 'Content Studio',
        campaigns: 'Campaigns',
        community: 'Community Hub',
        agents: 'Agent Chat',
        analytics: 'Analytics Hub',
        settings: 'Settings'
      };
      setActivePage(page);
      return `Navigated to ${pageNames[page] || page}`;
    },

    openAgentChat: (agentId) => {
      setActivePage('agents');
      return `Opened Agent Chat with ${agentId}. You can now chat with the agent.`;
    },

    openContentStudio: (target, contentType) => {
      setActivePage('content');
      if (target) setTarget(target);
      if (contentType) setContentType(contentType);
      return `Opened Content Studio for ${target || 'Last County'}`;
    },

    getNavigationOptions: () => [
      { name: 'Dashboard', page: 'dashboard', description: 'View KPIs and engagement charts' },
      { name: 'Talent Manager', page: 'talent', description: 'Manage Talise and Luke profiles' },
      { name: 'Content Studio', page: 'content', description: 'Generate marketing content with AI' },
      { name: 'Campaigns', page: 'campaigns', description: 'View and create campaigns' },
      { name: 'Community Hub', page: 'community', description: 'Fan segments and newsletters' },
      { name: 'Agent Chat', page: 'agents', description: 'Chat with specific AI agents' },
      { name: 'Analytics', page: 'analytics', description: 'Detailed analytics across all assets' },
      { name: 'Settings', page: 'settings', description: 'API keys and configurations' }
    ]
  };

  return actions;
};

export const parseUserIntent = (userMessage) => {
  const message = userMessage.toLowerCase();
  
  const patterns = [
    { regex: /how much (did |is) luke (make|earn|revenue)/i, action: 'lukeRevenue' },
    { regex: /luke'?s (revenue|money|earnings|income)/i, action: 'lukeRevenue' },
    { regex: /luke (pipeline|deals|leads)/i, action: 'lukePipeline' },
    { regex: /talise (stats|listeners|streams|followers)/i, action: 'taliseStats' },
    { regex: /talise'?s (stats|numbers|metrics)/i, action: 'taliseStats' },
    { regex: /(last county|streams|hulu)/i, action: 'lastCounty' },
    { regex: /campaigns?/i, action: 'campaigns' },
    { regex: /community|fans?|segments?|subscribers?/i, action: 'community' },
    { regex: /go to|navigate|open (the )?(dashboard|talent|content|campaigns|community|agents|analytics|settings)/i, action: 'navigate' },
    { regex: /chat with (the )?(agent|ai)/i, action: 'agentChat' },
    { regex: /generate|create (content|campaign)/i, action: 'createContent' },
    { regex: /analytics|overview|summary/i, action: 'analytics' },
    { regex: /help|what can you do/i, action: 'help' }
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(message)) {
      return pattern.action;
    }
  }

  return 'general';
};

export const getQuickResponses = (action) => {
  const responses = {
    lukeRevenue: "Luke's total revenue: $42,000 (includes $18K Last County delivered, $12K Saltwater in progress, $35K Echo Valley negotiating). Want me to show the full pipeline?",
    lukePipeline: "Luke's Pipeline:\n- Prospecting: 3 deals (The Hollow Ground, Neon Requiem, Birdsong)\n- Pitched: 2 deals (Winter Hymnal, Frequencies)\n- Negotiating: 1 deal (Echo Valley - $35K)\n- Closed: 2 deals (Last County $18K, Saltwater $12K)",
    taliseStats: "Talise's Streaming Stats:\n- Spotify: 85,230 monthly listeners\n- YouTube: 12,400 subscribers\n- Apple Music: 34,100 plays\n- TikTok: 45,800 followers",
    lastCounty: "Last County (Film):\n- Hulu Streams: 142,847 (+12.4%)\n- Social Impressions: 284K\n- Campaign: Horror Season Push (65% complete)",
    campaigns: "Active Campaigns:\n1. Last County — Horror Season Push (65%)\n2. Talise — Western Pine Release (45%)\n3. Luke — Q2 Outbound Blitz (25%)\n4. Ecosystem Newsletter — April (Scheduled)",
    community: "Community Stats:\n- Total Fans: 2,847\n- Email Subscribers: 847\n- Fan Segments: 6\n- Cross-segment overlap: 34%",
    analytics: "Analytics Overview:\n- Total Impressions: 1.24M\n- Total Engagement: 89.4K\n- Active Campaigns: 4\n- Pipeline Value: $214K",
    agentChat: "I can open the Agent Chat for you. Which agent would you like to chat with? (Distribution, Talise Marketing, Luke Sales, Community, etc.)",
    createContent: "I can open the Content Studio for you. What content would you like to generate? (TikTok script, Instagram caption, email campaign, etc.)",
    help: "I can help you with:\n- Luke's revenue and pipeline\n- Talise's streaming stats\n- Campaign status\n- Community metrics\n- Navigate to any page\n- Generate content\n- Chat with specific agents\n\nJust ask me a question!"
  };

  return responses[action] || responses.help;
};