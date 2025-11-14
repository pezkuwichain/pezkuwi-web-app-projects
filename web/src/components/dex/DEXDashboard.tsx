import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TokenSwap from '@/components/TokenSwap';
import PoolDashboard from '@/components/PoolDashboard';
import { CreatePoolModal } from './CreatePoolModal';
import { InitializeHezPoolModal } from './InitializeHezPoolModal';
import { ArrowRightLeft, Droplet, Settings } from 'lucide-react';
import { isFounderWallet } from '@/utils/auth';

export const DEXDashboard: React.FC = () => {
  const { account } = useWallet();
  const [activeTab, setActiveTab] = useState('swap');

  // Admin modal states
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [showInitializeHezPoolModal, setShowInitializeHezPoolModal] = useState(false);

  const isFounder = account ? isFounderWallet(account) : false;

  const handleCreatePool = () => {
    setShowCreatePoolModal(true);
  };

  const handleModalClose = () => {
    setShowCreatePoolModal(false);
    setShowInitializeHezPoolModal(false);
  };

  const handleSuccess = async () => {
    // Pool modals will refresh their own data
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/30 via-yellow-900/30 to-red-900/30 border-b border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 bg-clip-text text-transparent">
            Pezkuwi DEX
          </h1>
          <p className="text-gray-400 text-lg">
            Decentralized exchange for trading tokens on PezkuwiChain
          </p>

          {/* Wallet status */}
          {account && (
            <div className="mt-4 flex items-center gap-4">
              <div className="px-4 py-2 bg-gray-900/80 rounded-lg border border-gray-800">
                <span className="text-xs text-gray-400">Connected: </span>
                <span className="text-sm font-mono text-white">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
              {isFounder && (
                <div className="px-4 py-2 bg-green-600/20 border border-green-600/30 rounded-lg">
                  <span className="text-xs text-green-400 font-semibold">
                    FOUNDER ACCESS
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!account ? (
          <div className="text-center py-12">
            <div className="mb-4 text-gray-400 text-lg">
              Please connect your Polkadot wallet to use the DEX
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${isFounder ? 'grid-cols-3' : 'grid-cols-2'} gap-2 bg-gray-900/50 p-1 rounded-lg mb-8`}>
              <TabsTrigger value="swap" className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Swap</span>
              </TabsTrigger>
              <TabsTrigger value="pools" className="flex items-center gap-2">
                <Droplet className="w-4 h-4" />
                <span className="hidden sm:inline">Pools</span>
              </TabsTrigger>
              {isFounder && (
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="swap" className="mt-6">
              <TokenSwap />
            </TabsContent>

            <TabsContent value="pools" className="mt-6">
              <PoolDashboard />
            </TabsContent>

            {isFounder && (
              <TabsContent value="admin" className="mt-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="p-6 bg-gray-900 border border-blue-900/30 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-2">Token Wrapping</h3>
                    <p className="text-gray-400 mb-6">
                      Convert native HEZ to wrapped wHEZ for use in DEX pools
                    </p>
                    <button
                      onClick={() => setShowInitializeHezPoolModal(true)}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Wrap HEZ to wHEZ
                    </button>
                  </div>

                  <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-2">Pool Management</h3>
                    <p className="text-gray-400 mb-6">
                      Create new liquidity pools for token pairs on PezkuwiChain
                    </p>
                    <button
                      onClick={handleCreatePool}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Create New Pool
                    </button>
                  </div>

                  <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-2">Pool Statistics</h3>
                    <p className="text-gray-400 text-sm">
                      View detailed pool statistics in the Pools tab
                    </p>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>

      {/* Admin Modals */}
      <CreatePoolModal
        isOpen={showCreatePoolModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />

      <InitializeHezPoolModal
        isOpen={showInitializeHezPoolModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
