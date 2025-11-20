import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AppProvider } from '@/contexts/AppContext';
import { PolkadotProvider } from '@/contexts/PolkadotContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { IdentityProvider } from '@/contexts/IdentityContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { ReferralProvider } from '@/contexts/ReferralContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initSentry } from '@/lib/sentry';
import './App.css';
import './i18n/config';

// Initialize Sentry error monitoring
initSentry();

// Lazy load pages for code splitting
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const EmailVerification = lazy(() => import('@/pages/EmailVerification'));
const PasswordReset = lazy(() => import('@/pages/PasswordReset'));
const ProfileSettings = lazy(() => import('@/pages/ProfileSettings'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const WalletDashboard = lazy(() => import('./pages/WalletDashboard'));
const ReservesDashboardPage = lazy(() => import('./pages/ReservesDashboardPage'));
const BeCitizen = lazy(() => import('./pages/BeCitizen'));
const Citizens = lazy(() => import('./pages/Citizens'));
const CitizensIssues = lazy(() => import('./pages/citizens/CitizensIssues'));
const GovernmentEntrance = lazy(() => import('./pages/citizens/GovernmentEntrance'));
const Elections = lazy(() => import('./pages/Elections'));
const EducationPlatform = lazy(() => import('./pages/EducationPlatform'));
const P2PPlatform = lazy(() => import('./pages/P2PPlatform'));
const DEXDashboard = lazy(() => import('./components/dex/DEXDashboard').then(m => ({ default: m.DEXDashboard })));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-950">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
  </div>
);

function ReferralHandler() {
  const location = useLocation();

  useEffect(() => {
    // Check for ?ref= parameter in URL
    const params = new URLSearchParams(location.search);
    const refParam = params.get('ref');

    if (refParam) {
      // Store referrer address in localStorage
      localStorage.setItem('referrerAddress', refParam);
      if (import.meta.env.DEV) {
        console.log('Referrer address saved:', refParam);
      }
    }
  }, [location]);

  return null;
}

function App() {
  const endpoint = import.meta.env.VITE_WS_ENDPOINT || 'ws://127.0.0.1:9944';

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <AuthProvider>
          <AppProvider>
            <PolkadotProvider endpoint={endpoint}>
              <WalletProvider>
                <WebSocketProvider>
                  <IdentityProvider>
                    <DashboardProvider>
                      <ReferralProvider>
                        <Router>
                          <ReferralHandler />
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              <Route path="/login" element={<Login />} />
                              <Route path="/email-verification" element={<EmailVerification />} />
                              <Route path="/reset-password" element={<PasswordReset />} />
                              <Route path="/" element={<Index />} />
                              <Route path="/be-citizen" element={<BeCitizen />} />
                              <Route path="/citizens" element={<Citizens />} />
                              <Route path="/citizens/issues" element={<CitizensIssues />} />
                              <Route path="/citizens/government" element={<GovernmentEntrance />} />
                              <Route path="/dashboard" element={
                                <ProtectedRoute>
                                  <Dashboard />
                                </ProtectedRoute>
                              } />
                              <Route path="/profile/settings" element={
                                <ProtectedRoute>
                                  <ProfileSettings />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin" element={
                                <ProtectedRoute requireAdmin>
                                  <AdminPanel />
                                </ProtectedRoute>
                              } />
                              <Route path="/wallet" element={
                                <ProtectedRoute>
                                  <WalletDashboard />
                                </ProtectedRoute>
                              } />
                              <Route path="/reserves" element={
                                <ProtectedRoute>
                                  <ReservesDashboardPage />
                                </ProtectedRoute>
                              } />
                              <Route path="/elections" element={
                                <ProtectedRoute>
                                  <Elections />
                                </ProtectedRoute>
                              } />
                              <Route path="/education" element={
                                <ProtectedRoute>
                                  <EducationPlatform />
                                </ProtectedRoute>
                              } />
                              <Route path="/p2p" element={
                                <ProtectedRoute>
                                  <P2PPlatform />
                                </ProtectedRoute>
                              } />
                              <Route path="/dex" element={
                                <ProtectedRoute>
                                  <DEXDashboard />
                                </ProtectedRoute>
                              } />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </Router>
                      </ReferralProvider>
                    </DashboardProvider>
                  </IdentityProvider>
                </WebSocketProvider>
              </WalletProvider>
            </PolkadotProvider>
          </AppProvider>
        </AuthProvider>
        <Toaster />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
