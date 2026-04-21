import React, { useState, lazy, Suspense, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { FloatingChatbot } from './components/chatbot/FloatingChatbot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './utils/useTheme';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { LoginPage, ResetPasswordPage } from './components/auth/LoginPage';

// ── Route-level code splitting ────────────────────────────────────────────────
const Dashboard         = lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const FilmFinancingView = lazy(() => import('./components/verticals/FilmFinancingView').then(m => ({ default: m.FilmFinancingView })));
const ProductionsView   = lazy(() => import('./components/verticals/ProductionsView').then(m => ({ default: m.ProductionsView })));
const MusicView         = lazy(() => import('./components/verticals/MusicView').then(m => ({ default: m.MusicView })));
const CalendarView      = lazy(() => import('./components/verticals/CalendarView').then(m => ({ default: m.CalendarView })));
const AgentChat         = lazy(() => import('./components/agents/AgentChat').then(m => ({ default: m.AgentChat })));
const Settings          = lazy(() => import('./components/settings/Settings').then(m => ({ default: m.Settings })));
const OnboardingFlow    = lazy(() => import('./components/onboarding/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));

// ── App-level context — shared state without prop drilling ────────────────────
export const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

// ── Loaders ───────────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
  </div>
);

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F7FA' }}>
    <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
  </div>
);

// ── Placeholder for views not yet built ───────────────────────────────────────
const ComingSoon = ({ label }) => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
        <span className="text-lg font-black text-amber-400">M</span>
      </div>
      <p className="text-zinc-400 text-sm font-mono uppercase tracking-widest">{label}</p>
      <p className="text-zinc-600 text-xs">Coming soon — check the day plan</p>
    </div>
  </div>
);

// ── Themed Toaster ────────────────────────────────────────────────────────────
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

// ── Inner app — needs router context so useNavigate works ─────────────────────
function AppInner({ session, user, loading: authLoading, signOut, authEvent }) {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, updateProfile } = useProfile(user);
  const [preselectedAgent, setPreselectedAgent] = useState(null);

  // Password-reset link clicked — detected synchronously from the URL hash
  // (implicit flow) or from the onAuthStateChange event (PKCE flow).
  // Must be checked BEFORE the loading gate so the race with getSession()
  // cannot send the user to the dashboard first.
  if (authEvent === 'PASSWORD_RECOVERY') return <ResetPasswordPage />;

  // Wait for auth, then wait for profile if logged in
  const loading = authLoading || (!!session && profileLoading);
  if (loading) return <FullScreenLoader />;

  // Not authenticated
  if (!session) return <LoginPage />;

  // Authenticated but onboarding not complete → lock to /onboarding
  // OnboardingFlow calls useAppContext() so it needs the Provider even here.
  if (profile && !profile.onboarding_complete) {
    return (
      <AppContext.Provider value={{ profile, updateProfile, user, navigate,
                                    preselectedAgent, setPreselectedAgent }}>
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingFlow />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Routes>
        </Suspense>
        <ThemedToaster />
      </AppContext.Provider>
    );
  }

  // Legacy compat: Dashboard and MusicView still call setActivePage(pageId).
  // This wrapper maps old IDs → new paths so those components don't need touching yet.
  const legacySetActivePage = (pageId) => {
    const pathMap = {
      dashboard:   '/dashboard',
      financing:   '/vertical/filmmaker',
      productions: '/vertical/productions',
      music:       '/vertical/musician',
      agents:      '/agents',
      calendar:    '/calendar',
      settings:    '/settings',
    };
    navigate(pathMap[pageId] || '/dashboard');
  };

  const handleAgentClick = (agentId) => {
    setPreselectedAgent(agentId);
    navigate('/agents');
  };

  const contextValue = {
    profile,
    updateProfile,
    user,
    preselectedAgent,
    setPreselectedAgent,
    navigate,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Layout
        profile={profile}
        user={user}
        signOut={signOut}
        setPreselectedAgent={setPreselectedAgent}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Root */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Core */}
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    user={user}
                    onAgentClick={handleAgentClick}
                    setActivePage={legacySetActivePage}
                  />
                }
              />

              {/* Existing vertical views */}
              <Route path="/vertical/filmmaker"    element={<FilmFinancingView user={user} />} />
              <Route path="/vertical/productions"  element={<ProductionsView />} />
              <Route path="/vertical/musician"     element={<MusicView onAgentClick={handleAgentClick} user={user} />} />

              {/* Future vertical placeholders (built in later days) */}
              <Route path="/vertical/composer"     element={<ComingSoon label="Composer — coming soon" />} />
              <Route path="/vertical/actor"        element={<ComingSoon label="Actor — coming soon" />} />
              <Route path="/vertical/screenwriter" element={<ComingSoon label="Screenwriter — coming soon" />} />
              <Route path="/vertical/crew"         element={<ComingSoon label="Film Crew — coming soon" />} />
              <Route path="/vertical/artist"       element={<ComingSoon label="Visual Artist — coming soon" />} />
              <Route path="/vertical/writer"       element={<ComingSoon label="Writer — coming soon" />} />
              <Route path="/vertical/artsorg"      element={<ComingSoon label="Arts Organization — coming soon" />} />

              {/* Legacy redirects — old activePage string IDs */}
              <Route path="/financing"   element={<Navigate to="/vertical/filmmaker"   replace />} />
              <Route path="/productions" element={<Navigate to="/vertical/productions" replace />} />
              <Route path="/music"       element={<Navigate to="/vertical/musician"    replace />} />

              {/* Tools */}
              <Route
                path="/agents"
                element={
                  <AgentChat
                    user={user}
                    preselectedAgentId={preselectedAgent}
                    onClose={() => setPreselectedAgent(null)}
                  />
                }
              />
              <Route path="/calendar" element={<CalendarView user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />

              {/* Future pages */}
              <Route path="/crm"   element={<ComingSoon label="Lead Pipeline — coming Day 21" />} />
              <Route path="/admin" element={<ComingSoon label="Admin Dashboard — coming Day 31" />} />

              {/* 404 fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>

        <FloatingChatbot
          appState={{
            activePage:         'router',
            setActivePage:      legacySetActivePage,
            preselectedAgent,
            setPreselectedAgent,
          }}
        />
      </Layout>
      <ThemedToaster />
    </AppContext.Provider>
  );
}

// ── Root — provides auth, then renders AppInner inside BrowserRouter ──────────
function App() {
  const auth = useAuth();
  return <AppInner {...auth} />;
}

export default App;
