import React, { useState, useEffect, lazy, Suspense, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { useStytch } from '@stytch/react';
import { Layout } from './components/layout/Layout';
import { FloatingChatbot } from './components/chatbot/FloatingChatbot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './utils/useTheme';
import { useAuth } from './hooks/useAuth';
import { useSupabaseSession } from './hooks/useSupabaseSession';
import { LoginPage, ResetPasswordPage } from './components/auth/LoginPage';

// ── Route-level code splitting ────────────────────────────────────────────────
const Dashboard         = lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const FilmFinancingView = lazy(() => import('./components/verticals/FilmFinancingView').then(m => ({ default: m.FilmFinancingView })));
const ProductionsView   = lazy(() => import('./components/verticals/ProductionsView').then(m => ({ default: m.ProductionsView })));
const MusicView         = lazy(() => import('./components/verticals/MusicView').then(m => ({ default: m.MusicView })));
const CalendarView      = lazy(() => import('./components/verticals/CalendarView').then(m => ({ default: m.CalendarView })));
const CrewView          = lazy(() => import('./components/verticals/CrewView').then(m => ({ default: m.CrewView })));
const ComposerView      = lazy(() => import('./components/verticals/ComposerView').then(m => ({ default: m.ComposerView })));
const ActorView         = lazy(() => import('./components/verticals/ActorView').then(m => ({ default: m.ActorView })));
const ScreenwriterView  = lazy(() => import('./components/verticals/ScreenwriterView').then(m => ({ default: m.ScreenwriterView })));
const ArtistView        = lazy(() => import('./components/verticals/ArtistView').then(m => ({ default: m.ArtistView })));
const WriterView        = lazy(() => import('./components/verticals/WriterView').then(m => ({ default: m.WriterView })));
const ArtsOrgView       = lazy(() => import('./components/verticals/ArtsOrgView').then(m => ({ default: m.ArtsOrgView })));
const Invoices          = lazy(() => import('./components/backoffice/Invoices').then(m => ({ default: m.Invoices })));
const Contracts         = lazy(() => import('./components/backoffice/Contracts').then(m => ({ default: m.Contracts })));
const Payments          = lazy(() => import('./components/backoffice/Payments').then(m => ({ default: m.Payments })));
const CRMView           = lazy(() => import('./components/crm/CRMView').then(m => ({ default: m.CRMView })));
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
      <p className="text-zinc-600 text-sm font-mono uppercase tracking-widest">{label}</p>
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

// ── Magic Link Handler — authenticates email verification links ───────────────
// Stytch redirects here with ?stytch_token_type=login&token=xxx after user
// clicks the verification email. We authenticate the token, which verifies the
// email AND creates a session. useStytchSession then fires and routes normally.
const MagicLinkHandler = ({ token }) => {
  const stytchClient = useStytch();
  const [error, setError] = useState('');

  useEffect(() => {
    stytchClient.magicLinks.authenticate({
      token,
      session_duration_minutes: 10080,
    }).then(() => {
      // Session active — clear the magic link token from URL so App.jsx
      // stops matching stytch_token_type=login and routes to dashboard.
      window.history.replaceState({}, '', '/');
    }).catch(err => setError(err.message || 'Verification failed. The link may have expired.'));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7F7FA' }}>
      <div className="text-center space-y-3">
        {error ? (
          <>
            <p className="text-sm font-semibold text-zinc-900">Verification failed</p>
            <p className="text-xs text-red-500 max-w-xs">{error}</p>
            <a href="/" className="text-xs text-amber-600 hover:text-amber-700 transition-colors underline">
              ← Back to sign in
            </a>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-zinc-500" style={{ fontFamily: 'var(--font-mono)' }}>
              Verifying your email…
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// ── Email Verification Pending ────────────────────────────────────────────────
// Shown when a user has a session but email is not yet verified.
const EmailVerificationPending = ({ email, onSignOut }) => (
  <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7F7FA' }}>
    <div className="w-full max-w-sm text-center space-y-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <Mail size={22} className="text-amber-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-900 mb-1">Verify your email</p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          We sent a verification link to{' '}
          <span className="text-zinc-700 font-medium">{email}</span>.<br />
          Click it to access your account.
        </p>
      </div>
      <p className="text-xs text-zinc-600" style={{ fontFamily: 'var(--font-mono)' }}>
        Check spam if you don't see it.
      </p>
      <button
        onClick={onSignOut}
        className="text-xs text-zinc-600 hover:text-amber-600 transition-colors underline"
      >
        Use a different email
      </button>
    </div>
  </div>
);

// ── Inner app — needs router context so useNavigate works ─────────────────────
function AppInner({ session, user, loading: authLoading, signOut }) {
  const navigate = useNavigate();
  // Bridge Stytch session → Supabase JWT (single source: server-side profile lookup/create + JWT mint)
  const { profile, loading: profileLoading, profileError, updateProfile } = useSupabaseSession(user);
  const [preselectedAgent, setPreselectedAgent] = useState(null);

  // Detect Stytch URL tokens — must be checked BEFORE loading gate
  const params          = new URLSearchParams(window.location.search);
  const stytchTokenType = params.get('stytch_token_type');
  const stytchToken     = params.get('token');

  // Email verification magic link click
  if (stytchTokenType === 'login' && stytchToken) {
    return <MagicLinkHandler token={stytchToken} />;
  }
  // Password reset link click
  if (stytchTokenType === 'reset_password') return <ResetPasswordPage />;

  // Wait for auth, then wait for profile if logged in
  const loading = authLoading || (!!session && profileLoading);
  if (loading) return <FullScreenLoader />;

  // Not authenticated
  if (!session) return <LoginPage />;

  // Supabase profile fetch or create failed — show error instead of infinite spinner
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FAFAF9' }}>
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <span style={{ fontSize: 24 }}>⚠️</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#0C0A09', marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(12,10,9,0.55)', lineHeight: 1.6, marginBottom: 20 }}>
            {profileError}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#f59e0b', color: '#0C0A09', fontWeight: 600, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  // Session exists but profile is null — still loading from Supabase
  if (!profile) return <FullScreenLoader />;

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
              <Route path="/vertical/composer"     element={<ComposerView />} />
              <Route path="/vertical/actor"        element={<ActorView />} />
              <Route path="/vertical/screenwriter" element={<ScreenwriterView />} />
              <Route path="/vertical/crew"         element={<CrewView />} />
              <Route path="/vertical/artist"       element={<ArtistView />} />
              <Route path="/vertical/writer"       element={<WriterView />} />
              <Route path="/vertical/artsorg"      element={<ArtsOrgView />} />

              {/* Back-office */}
              <Route path="/invoices"  element={<Invoices />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/payments"  element={<Payments />} />

              {/* CRM */}
              <Route path="/crm" element={<CRMView />} />

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
