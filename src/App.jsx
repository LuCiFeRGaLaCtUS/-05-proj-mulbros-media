import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { FilmFinancingView } from './components/verticals/FilmFinancingView';
import { ProductionsView } from './components/verticals/ProductionsView';
import { MusicView } from './components/verticals/MusicView';
import { AgentChat } from './components/agents/AgentChat';
import { Settings } from './components/settings/Settings';
import { FloatingChatbot } from './components/chatbot/FloatingChatbot';
import { useTheme } from './utils/useTheme';

// Toaster that reacts to theme changes via the mulbros-theme custom event
const ThemedToaster = () => {
  const theme = useTheme();
  const isLight = theme === 'light';
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: isLight
          ? { background: '#ffffff', color: '#18181b', border: '1px solid #d4d4d8' }
          : { background: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46' },
        success: { iconTheme: { primary: '#10b981', secondary: isLight ? '#ffffff' : '#18181b' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: isLight ? '#ffffff' : '#18181b' } },
      }}
    />
  );
};

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
    <>
      <Layout activePage={activePage} setActivePage={setActivePage} setPreselectedAgent={setPreselectedAgent}>
        {renderPage()}
        <FloatingChatbot appState={appState} />
      </Layout>
      <ThemedToaster />
    </>
  );
}

export default App;
