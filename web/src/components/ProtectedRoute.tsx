import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false
}) => {
  const { user, loading, isAdmin } = useAuth();
  const { selectedAccount, connectWallet } = usePolkadot();
  const [walletRestoreChecked, setWalletRestoreChecked] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for wallet changes
  useEffect(() => {
    const handleWalletChange = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('walletChanged', handleWalletChange);
    return () => window.removeEventListener('walletChanged', handleWalletChange);
  }, []);

  // Wait for wallet restoration (max 3 seconds)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setWalletRestoreChecked(true);
    }, 3000);

    // If wallet restored earlier, clear timeout
    if (selectedAccount) {
      setWalletRestoreChecked(true);
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [selectedAccount, forceUpdate]);

  // Show loading while:
  // 1. Auth is loading, OR
  // 2. Wallet restoration not checked yet
  if (loading || !walletRestoreChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">
            {!walletRestoreChecked ? 'Restoring wallet connection...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // For admin routes, require wallet connection
  if (requireAdmin && !selectedAccount) {
    const handleConnect = async () => {
      await connectWallet();
      // Event is automatically dispatched by handleSetSelectedAccount wrapper
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md">
          <Wallet className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Admin panel requires wallet authentication. Please connect your wallet to continue.
          </p>
          <Button onClick={handleConnect} size="lg" className="bg-green-600 hover:bg-green-700">
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            Your wallet ({selectedAccount?.address.slice(0, 8)}...) does not have admin privileges.
          </p>
          <p className="text-sm text-gray-500">
            Only founder and commission members can access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};