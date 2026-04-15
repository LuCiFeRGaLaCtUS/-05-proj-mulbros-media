import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { FilmFinancingView } from './components/verticals/FilmFinancingView';
import { ProductionsView } from './components/verticals/ProductionsView';
import { MusicView } from './components/verticals/MusicView';
import { AgentChat } from './components/agents/AgentChat';
import { Settings } from './components/settings/Settings';
import { FloatingChatbot } from './components/chatbot/FloatingChatbot';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [preselectedAgent, setPreselectedAgent] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [messages, setMessages] = useState([]);
  const [target, setTarget] = useState('Film Financing');
  const [contentType, setContentType] = useState('Filmmaker Outreach DM');

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
      case 'dashboard':   return <Dashboard onAgentClick={handleAgentClick} setActivePage={setActivePage} />;
      case 'financing':   return <FilmFinancingView />;
      case 'productions': return <ProductionsView />;
      case 'music':       return <MusicView onAgentClick={handleAgentClick} />;
      case 'agents':      return <AgentChat preselectedAgentId={preselectedAgent} onClose={() => setPreselectedAgent(null)} />;
      case 'settings':    return <Settings />;
      default:            return <Dashboard onAgentClick={handleAgentClick} />;
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
