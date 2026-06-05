import React, { useState, useEffect, Suspense, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { useStytch } from '@stytch/react';
import { Layout } from './components/layout/Layout';
// FloatingChatbot removed Sprint 6 — merged into ChatBar in ChatShell.
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './utils/useTheme';
import { useAuth } from './hooks/useAuth';
import { useSupabaseSession } from './hooks/useSupabaseSession';
import { LoginPage, ResetPasswordPage } from './components/auth/LoginPage';
import { lazyRetry } from './lib/lazyRetry';

// ── Route-level code splitting ────────────────────────────────────────────────
// lazyRetry (not bare lazy) so a stale chunk after a deploy auto-recovers
// instead of throwing "Failed to fetch dynamically imported module".
const Dashboard         = lazyRetry(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const FilmFinancingView = lazyRetry(() => import('./components/verticals/FilmFinancingView').then(m => ({ default: m.FilmFinancingView })));
const ProductionsView   = lazyRetry(() => import('./components/verticals/ProductionsView').then(m => ({ default: m.ProductionsView })));
const MusicView         = lazyRetry(() => import('./components/verticals/MusicView').then(m => ({ default: m.MusicView })));
const CalendarView      = lazyRetry(() => import('./components/verticals/CalendarView').then(m => ({ default: m.CalendarView })));
const CrewView          = lazyRetry(() => import('./components/verticals/CrewView').then(m => ({ default: m.CrewView })));
const ComposerView      = lazyRetry(() => import('./components/verticals/ComposerView').then(m => ({ default: m.ComposerView })));
const ActorView         = lazyRetry(() => import('./components/verticals/ActorView').then(m => ({ default: m.ActorView })));
const ScreenwriterView  = lazyRetry(() => import('./components/verticals/ScreenwriterView').then(m => ({ default: m.ScreenwriterView })));
const ArtistView        = lazyRetry(() => import('./components/verticals/ArtistView').then(m => ({ default: m.ArtistView })));
const WriterView        = lazyRetry(() => import('./components/verticals/WriterView').then(m => ({ default: m.WriterView })));
const ArtsOrgView       = lazyRetry(() => import('./components/verticals/ArtsOrgView').then(m => ({ default: m.ArtsOrgView })));
const Invoices          = lazyRetry(() => import('./components/backoffice/Invoices').then(m => ({ default: m.Invoices })));
const Contracts         = lazyRetry(() => import('./components/backoffice/Contracts').then(m => ({ default: m.Contracts })));
const Payments          = lazyRetry(() => import('./components/backoffice/Payments').then(m => ({ default: m.Payments })));
const CRMView           = lazyRetry(() => import('./components/crm/CRMView').then(m => ({ default: m.CRMView })));
const AgentChat         = lazyRetry(() => import('./components/agents/AgentChat').then(m => ({ default: m.AgentChat })));
const Settings          = lazyRetry(() => import('./components/settings/Settings').then(m => ({ default: m.Settings })));
const OnboardingFlow    = lazyRetry(() => import('./components/onboarding/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const VerticalRouteGuard = lazyRetry(() => import('./components/auth/VerticalRouteGuard').then(m => ({ default: m.VerticalRouteGuard })));

// Talent skill pack (Sprint 2)
const AuditionsView       = lazyRetry(() => import('./components/verticals/talent/AuditionsView').then(m => ({ default: m.AuditionsView })));
const SelfTapeView        = lazyRetry(() => import('./components/verticals/talent/SelfTapeView').then(m => ({ default: m.SelfTapeView })));
const AgentInboxView      = lazyRetry(() => import('./components/verticals/talent/AgentInboxView').then(m => ({ default: m.AgentInboxView })));
const IncomeView          = lazyRetry(() => import('./components/verticals/talent/IncomeView').then(m => ({ default: m.IncomeView })));
const IndustryIntelView   = lazyRetry(() => import('./components/verticals/talent/IndustryIntelView').then(m => ({ default: m.IndustryIntelView })));
const ContractReaderView  = lazyRetry(() => import('./components/verticals/talent/ContractReaderView').then(m => ({ default: m.ContractReaderView })));
const IndustryContactsView = lazyRetry(() => import('./components/industry/IndustryContactsView').then(m => ({ default: m.IndustryContactsView })));

// Agency skill pack (Sprint 3)
const RosterView             = lazyRetry(() => import('./components/verticals/agency/RosterView').then(m => ({ default: m.RosterView })));
const CommissionsView        = lazyRetry(() => import('./components/verticals/agency/CommissionsView').then(m => ({ default: m.CommissionsView })));
const SubmissionsView        = lazyRetry(() => import('./components/verticals/agency/SubmissionsView').then(m => ({ default: m.SubmissionsView })));
const CastingFeedView        = lazyRetry(() => import('./components/verticals/agency/CastingFeedView').then(m => ({ default: m.CastingFeedView })));
const ContractNegotiatorView = lazyRetry(() => import('./components/verticals/agency/ContractNegotiatorView').then(m => ({ default: m.ContractNegotiatorView })));
const CommsRelayView         = lazyRetry(() => import('./components/verticals/agency/CommsRelayView').then(m => ({ default: m.CommsRelayView })));
const AgencyAdminView        = lazyRetry(() => import('./components/verticals/agency/AgencyAdminView').then(m => ({ default: m.AgencyAdminView })));
const PlatformAdminView      = lazyRetry(() => import('./components/admin/PlatformAdminView').then(m => ({ default: m.PlatformAdminView })));

// Sprint 6 chat-first shell
const ChatShell              = lazyRetry(() => import('./components/shell/ChatShell').then(m => ({ default: m.ChatShell })));
const ChatHome               = lazyRetry(() => import('./components/shell/ChatHome').then(m => ({ default: m.ChatHome })));
const ChatThread             = lazyRetry(() => import('./components/shell/ChatThread').then(m => ({ default: m.ChatThread })));

// Sprint 6.5 — Integrations
const IntegrationsView       = lazyRetry(() => import('./components/integrations/IntegrationsView').then(m => ({ default: m.IntegrationsView })));

// Sprint 9 — Touring module (musician persona)
const TouringView            = lazyRetry(() => import('./components/verticals/touring/TouringView').then(m => ({ default: m.TouringView })));

// Sprint 10 — Catalogue + royalties (musician persona)
const CatalogueView          = lazyRetry(() => import('./components/verticals/catalogue/CatalogueView').then(m => ({ default: m.CatalogueView })));
const StatementsView         = lazyRetry(() => import('./components/verticals/catalogue/StatementsView').then(m => ({ default: m.StatementsView })));

// Sprint 11 — EPK builder + public page, Team chat
const EPKBuilderView         = lazyRetry(() => import('./components/verticals/epk/EPKBuilderView').then(m => ({ default: m.EPKBuilderView })));
const EPKPublicView          = lazyRetry(() => import('./components/epk/EPKPublicView').then(m => ({ default: m.EPKPublicView })));
const TeamChatView           = lazyRetry(() => import('./components/team/TeamChatView').then(m => ({ default: m.TeamChatView })));

// Sprint 12 — Legal pages (anon, no auth gate)
const PrivacyView            = lazyRetry(() => import('./components/legal/PrivacyView').then(m => ({ default: m.PrivacyView })));
const TermsView              = lazyRetry(() => import('./components/legal/TermsView').then(m => ({ default: m.TermsView })));

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

  // Public EPK page — accessible without auth. RLS allows anon SELECT on public kits.
  if (window.location.pathname.startsWith('/epk/')) {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/epk/:slug" element={<EPKPublicView />} />
        </Routes>
      </Suspense>
    );
  }

  // Public legal pages — anonymous-readable. Privacy + ToS must be visible
  // before sign-up so users can read what they're agreeing to.
  if (window.location.pathname === '/privacy' || window.location.pathname === '/terms') {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/privacy" element={<PrivacyView />} />
          <Route path="/terms"   element={<TermsView />} />
        </Routes>
      </Suspense>
    );
  }

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

  // LegacyShell — wraps non-chat routes in the original TopBar + Sidebar layout.
  // Uses <Outlet /> so React Router can nest the existing routes inside.
  // Old LegacyShell (TopBar + Sidebar) retired Sprint 6.5 — ChatShell wraps
  // every authenticated route now. Kept in repo only via git history.

  return (
    <AppContext.Provider value={contextValue}>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* All authenticated routes live under ChatShell (sidebar + outlet) */}
            <Route element={<ChatShell />}>
              <Route path="/"                  element={<ChatHome />} />
              <Route path="/chat"              element={<ChatThread />} />
              <Route path="/chat/:sessionId"   element={<ChatThread />} />
              {/* Already-onboarded users hitting /onboarding (e.g. direct URL) bounce to ChatHome. */}
              <Route path="/onboarding" element={<Navigate to="/" replace />} />

              {/* /dashboard legacy URL — bounce to chat-first ChatHome.
                  The old Dashboard component is dormant; reintroduce under
                  a different path (/legacy-dashboard) if specifically needed. */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />

              {/* Legacy Dashboard kept at /legacy-dashboard for emergency access. */}
              <Route
                path="/legacy-dashboard"
                element={
                  <Dashboard
                    user={user}
                    onAgentClick={handleAgentClick}
                    setActivePage={legacySetActivePage}
                  />
                }
              />

              {/* Existing vertical views */}
              {/* Vertical routes — wrapped with VerticalRouteGuard.
                  Guard redirects users to their own vertical if they hit a mismatched one
                  (unless admin role or no vertical set). Server-side enforcement still via RLS. */}
              <Route path="/vertical/filmmaker"    element={<VerticalRouteGuard slug="filmmaker"><FilmFinancingView user={user} /></VerticalRouteGuard>} />
              <Route path="/vertical/productions"  element={<VerticalRouteGuard slug="productions"><ProductionsView /></VerticalRouteGuard>} />
              <Route path="/vertical/musician"     element={<VerticalRouteGuard slug="musician"><MusicView onAgentClick={handleAgentClick} user={user} /></VerticalRouteGuard>} />
              <Route path="/vertical/composer"     element={<VerticalRouteGuard slug="composer"><ComposerView /></VerticalRouteGuard>} />
              <Route path="/vertical/actor"        element={<VerticalRouteGuard slug="actor"><ActorView /></VerticalRouteGuard>} />
              <Route path="/vertical/screenwriter" element={<VerticalRouteGuard slug="screenwriter"><ScreenwriterView /></VerticalRouteGuard>} />
              <Route path="/vertical/crew"         element={<VerticalRouteGuard slug="crew"><CrewView /></VerticalRouteGuard>} />
              <Route path="/vertical/artist"       element={<VerticalRouteGuard slug="artist"><ArtistView /></VerticalRouteGuard>} />
              <Route path="/vertical/writer"       element={<VerticalRouteGuard slug="writer"><WriterView /></VerticalRouteGuard>} />
              <Route path="/vertical/artsorg"      element={<VerticalRouteGuard slug="artsorg"><ArtsOrgView /></VerticalRouteGuard>} />

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

              {/* Talent skill pack (Sprint 2 — shipped) */}
              {/* Sprint 9 — Touring (musician persona; admins see it too) */}
              <Route path="/touring" element={<TouringView />} />

              {/* Sprint 10 — Catalogue + royalty statements */}
              <Route path="/catalogue"            element={<CatalogueView />} />
              <Route path="/catalogue/statements" element={<StatementsView />} />

              {/* Sprint 11 — EPK builder + Team chat (all personas) */}
              <Route path="/epk-builder" element={<EPKBuilderView />} />
              <Route path="/team"        element={<TeamChatView />} />

              {/* Sprint 12 — Legal (authed shell also serves these for in-app footer links) */}
              <Route path="/privacy" element={<PrivacyView />} />
              <Route path="/terms"   element={<TermsView />} />

              <Route path="/talent/auditions"  element={<AuditionsView />} />
              <Route path="/talent/self-tape"  element={<SelfTapeView />} />
              <Route path="/talent/inbox"      element={<AgentInboxView />} />
              <Route path="/talent/income"     element={<IncomeView />} />
              <Route path="/talent/intel"      element={<IndustryIntelView />} />
              <Route path="/talent/contracts"  element={<ContractReaderView />} />

              {/* Agency skill pack (Sprint 3 — shipped) */}
              <Route path="/agency/roster"       element={<RosterView />} />
              <Route path="/agency/casting"      element={<CastingFeedView />} />
              <Route path="/agency/submissions"  element={<SubmissionsView />} />
              <Route path="/agency/commissions"  element={<CommissionsView />} />
              <Route path="/agency/contracts"    element={<ContractNegotiatorView />} />
              <Route path="/agency/comms"        element={<CommsRelayView />} />
              <Route path="/agency/admin"        element={<AgencyAdminView />} />

              {/* Shared — Industry Contacts (Sprint 2 shipped) */}
              <Route path="/industry-contacts" element={<IndustryContactsView />} />

              {/* Platform Admin — super_admin/admin only (server enforces via requireRole) */}
              <Route path="/admin" element={<PlatformAdminView />} />

              {/* Sprint 6.5 — Integrations */}
              <Route path="/integrations" element={<IntegrationsView />} />

              {/* 404 fallback inside LegacyShell */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>

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
