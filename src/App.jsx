import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { TalentManager } from './components/talent/TalentManager';
import { ContentStudio } from './components/content/ContentStudio';
import { CampaignManager } from './components/campaigns/CampaignManager';
import { CommunityHub } from './components/community/CommunityHub';
import { AgentChat } from './components/agents/AgentChat';
import { AnalyticsHub } from './components/analytics/AnalyticsHub';
import { Settings } from './components/settings/Settings';
import { FloatingChatbot } from './components/chatbot/FloatingChatbot';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [preselectedAgent, setPreselectedAgent] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [messages, setMessages] = useState([]);
  const [target, setTarget] = useState('Last County (Film)');
  const [contentType, setContentType] = useState('TikTok Script');

  const handleAgentClick = (agentId) => {
    setPreselectedAgent(agentId);
    setActivePage('agents');
  };

  const appState = {
    activePage,
    setActivePage,
    preselectedAgent,
    setPreselectedAgent,
    campaigns,
    setCampaigns,
    messages,
    setMessages,
    target,
    setTarget,
    contentType,
    setContentType
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onAgentClick={handleAgentClick} />;
      case 'talent':
        return <TalentManager onAgentClick={handleAgentClick} />;
      case 'content':
        return <ContentStudio />;
      case 'campaigns':
        return <CampaignManager />;
      case 'community':
        return <CommunityHub />;
      case 'agents':
        return <AgentChat preselectedAgentId={preselectedAgent} onClose={() => setPreselectedAgent(null)} />;
      case 'analytics':
        return <AnalyticsHub />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onAgentClick={handleAgentClick} />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage} setPreselectedAgent={setPreselectedAgent}>
      {renderPage()}
      <FloatingChatbot appState={appState} />
    </Layout>
  );
}

export default App;