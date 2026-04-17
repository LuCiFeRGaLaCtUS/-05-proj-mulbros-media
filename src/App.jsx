import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { FloatingChatbot } from './components/chatbot/FloatingChatbot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './utils/useTheme';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';

// M4: Route-level code splitting — each view is a separate chunk loaded on demand
const Dashboard         = lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const FilmFinancingView = lazy(() => import('./components/verticals/FilmFinancingView').then(m => ({ default: m.FilmFinancingView })));
const ProductionsView   = lazy(() => import('./components/verticals/ProductionsView').then(m => ({ default: m.ProductionsView })));
const MusicView         = lazy(() => import('./components/verticals/MusicView').then(m => ({ default: m.MusicView })));
const CalendarView      = lazy(() => import('./components/verticals/CalendarView').then(m => ({ default: m.CalendarView })));
const AgentChat         = lazy(() => import('./components/agents/AgentChat').then(m => ({ default: m.AgentChat })));
const Settings          = lazy(() => import('./components/settings/Settings').then(m => ({ default: m.Settings })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
  </div>
);

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
  const { session, user, loading, signOut } = useAuth();

  const [activePage, setActivePage]           = useState('dashboard');
  const [preselectedAgent, setPreselectedAgent] = useState(null);
  // M8: removed dead state (campaigns, messages, target, contentType) — never consumed by any routed page

  const handleAgentClick = (agentId) => {
    setPreselectedAgent(agentId);
    setActivePage('agents');
  };

  // M1: stable object reference — only recreated when navigation state actually changes
  const appState = useMemo(() => ({
    activePage,
    setActivePage,
    preselectedAgent,
    setPreselectedAgent,
  }), [activePage, setActivePage, preselectedAgent, setPreselectedAgent]);

  // Auth loading spinner
  if (loading) return (
    <div className="min-h-screen bg-[#060508] flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
    </div>
  );

  // Auth gate — show login if no session
  if (!session) return <LoginPage />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':   return <Dashboard onAgentClick={handleAgentClick} setActivePage={setActivePage} />;
      case 'financing':   return <FilmFinancingView user={user} />;
      case 'productions': return <ProductionsView />;
      case 'music':       return <MusicView onAgentClick={handleAgentClick} user={user} />;
      case 'calendar':    return <CalendarView user={user} />;
      case 'agents':      return <AgentChat user={user} preselectedAgentId={preselectedAgent} onClose={() => setPreselectedAgent(null)} />;
      case 'settings':    return <Settings user={user} />;
      default:            return <Dashboard onAgentClick={handleAgentClick} />;
    }
  };

  return (
    <>
      <Layout activePage={activePage} setActivePage={setActivePage} setPreselectedAgent={setPreselectedAgent} user={user} signOut={signOut}>
        <ErrorBoundary key={activePage}>
          {/* M4: Suspense boundary wraps lazy-loaded route components */}
          <Suspense fallback={<PageLoader />}>
            {renderPage()}
          </Suspense>
        </ErrorBoundary>
        <FloatingChatbot appState={appState} />
      </Layout>
      <ThemedToaster />
    </>
  );
}

export default App;
