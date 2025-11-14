import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReservesDashboard } from '@/components/ReservesDashboard';
import { USDTBridge } from '@/components/USDTBridge';

// USDT Treasury Multisig Member Addresses
const SPECIFIC_ADDRESSES = {
  // Non-unique roles - manually specified
  Noter: '5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3',
  Berdevk: '5F4V6dzpe72dE2C7YN3y7VGznMTWPFeSKL3ANhp4XasXjfvj',
};

const ReservesDashboardPage = () => {
  const navigate = useNavigate();
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);
  const [offChainReserve, setOffChainReserve] = useState(10000); // Example: $10,000 USDT

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-12">
      <div className="container mx-auto px-4 py-8 relative">
        {/* Back Button */}
        <button
          onClick={() => navigate('/wallet')}
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Wallet</span>
        </button>

        {/* Bridge Button */}
        <div className="absolute top-4 right-4">
          <Button
            onClick={() => setIsBridgeOpen(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Deposit/Withdraw USDT
          </Button>
        </div>

        {/* Main Content */}
        <ReservesDashboard
          specificAddresses={SPECIFIC_ADDRESSES}
          offChainReserveAmount={offChainReserve}
        />

        {/* Bridge Modal */}
        <USDTBridge
          isOpen={isBridgeOpen}
          onClose={() => setIsBridgeOpen(false)}
          specificAddresses={SPECIFIC_ADDRESSES}
        />
      </div>
    </div>
  );
};

export default ReservesDashboardPage;
