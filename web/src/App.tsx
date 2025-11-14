import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { AppProvider } from '@/contexts/AppContext';
import { PolkadotProvider } from '@/contexts/PolkadotContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { IdentityProvider } from '@/contexts/IdentityContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/toaster';
import './App.css';
import './i18n/config';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <AppProvider>
          <PolkadotProvider endpoint="ws://127.0.0.1:9944">
            <WalletProvider>
              <WebSocketProvider>
                <IdentityProvider>
                  <Router>
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/email-verification" element={<EmailVerification />} />
                    <Route path="/reset-password" element={<PasswordReset />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/be-citizen" element={<BeCitizen />} />
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Router>
                </IdentityProvider>
              </WebSocketProvider>
            </WalletProvider>
          </PolkadotProvider>
        </AppProvider>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;