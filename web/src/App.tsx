import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import EmailVerification from '@/pages/EmailVerification';
import PasswordReset from '@/pages/PasswordReset';
import ProfileSettings from '@/pages/ProfileSettings';
import AdminPanel from '@/pages/AdminPanel';
import WalletDashboard from './pages/WalletDashboard';
import ReservesDashboardPage from './pages/ReservesDashboardPage';
import BeCitizen from './pages/BeCitizen';
import Citizens from './pages/Citizens';
import CitizensIssues from './pages/citizens/CitizensIssues';
import GovernmentEntrance from './pages/citizens/GovernmentEntrance';
import Elections from './pages/Elections';
import EducationPlatform from './pages/EducationPlatform';
import P2PPlatform from './pages/P2PPlatform';
import { DEXDashboard } from './components/dex/DEXDashboard';
import { AppProvider } from '@/contexts/AppContext';
import { PolkadotProvider } from '@/contexts/PolkadotContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { IdentityProvider } from '@/contexts/IdentityContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { ReferralProvider } from '@/contexts/ReferralContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './App.css';
import './i18n/config';

function ReferralHandler() {
  const location = useLocation();

  useEffect(() => {
    // Check for ?ref= parameter in URL
    const params = new URLSearchParams(location.search);
    const refParam = params.get('ref');

    if (refParam) {
      // Store referrer address in localStorage
      localStorage.setItem('referrerAddress', refParam);
      console.log('Referrer address saved:', refParam);
    }
  }, [location]);

  return null;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <AuthProvider>
          <AppProvider>
            <PolkadotProvider endpoint="ws://127.0.0.1:9944">
              <WalletProvider>
                <WebSocketProvider>
                  <IdentityProvider>
                    <DashboardProvider>
                      <ReferralProvider>
                        <Router>
                          <ReferralHandler />
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
