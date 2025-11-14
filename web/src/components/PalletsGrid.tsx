import React, { useState } from 'react';
import { Code, Database, TrendingUp, Gift, UserCheck, Award } from 'lucide-react';

interface Pallet {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  image: string;
  extrinsics: string[];
  storage: string[];
}

const pallets: Pallet[] = [
  {
    id: 'pez-treasury',
    name: 'PEZ Treasury',
    icon: <Database className="w-6 h-6" />,
    description: 'Manages token distribution with 48-month synthetic halving mechanism',
    image: 'https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760315321470_3d093f4f.webp',
    extrinsics: ['initialize_treasury', 'release_monthly_funds', 'force_genesis_distribution'],
    storage: ['HalvingInfo', 'MonthlyReleases', 'TreasuryStartBlock']
  },
  {
    id: 'trust',
    name: 'Trust Score',
    icon: <TrendingUp className="w-6 h-6" />,
    description: 'Calculates weighted trust scores from multiple components',
    image: 'https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760315323202_06631fb8.webp',
    extrinsics: ['force_recalculate_trust_score', 'update_all_trust_scores', 'periodic_trust_score_update'],
    storage: ['TrustScores', 'TotalActiveTrustScore', 'BatchUpdateInProgress']
  },
  {
    id: 'staking-score',
    name: 'Staking Score',
    icon: <Award className="w-6 h-6" />,
    description: 'Time-based staking multipliers from 1.0x to 2.0x over 12 months',
    image: 'https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760315324943_84216eda.webp',
    extrinsics: ['start_score_tracking'],
    storage: ['StakingStartBlock']
  },
  {
    id: 'pez-rewards',
    name: 'PEZ Rewards',
    icon: <Gift className="w-6 h-6" />,
    description: 'Monthly epoch-based reward distribution system',
    image: 'https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760315326731_ca5f9a92.webp',
    extrinsics: ['initialize_rewards_system', 'record_trust_score', 'finalize_epoch', 'claim_reward'],
    storage: ['EpochInfo', 'EpochRewardPools', 'UserEpochScores', 'ClaimedRewards']
  }
];

const PalletsGrid: React.FC = () => {
  const [selectedPallet, setSelectedPallet] = useState<Pallet | null>(null);

  return (
    <section id="pallets" className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Core Runtime Pallets
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Modular blockchain components powering PezkuwiChain's advanced features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pallets.map((pallet) => (
            <div
              key={pallet.id}
              onClick={() => setSelectedPallet(pallet)}
              className="group relative bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative p-6">
                <div className="flex items-start space-x-4">
                  <img 
                    src={pallet.image}
                    alt={pallet.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg mr-3">
                        {pallet.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-white">{pallet.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{pallet.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-kurdish-yellow/30 text-kurdish-yellow text-xs rounded-full">
                        {pallet.extrinsics.length} Extrinsics
                      </span>
                      <span className="px-2 py-1 bg-cyan-900/30 text-cyan-400 text-xs rounded-full">
                        {pallet.storage.length} Storage Items
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedPallet && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedPallet(null)}
        >
          <div 
            className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">{selectedPallet.name}</h3>
                <button
                  onClick={() => setSelectedPallet(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-purple-400 mb-3">Extrinsics</h4>
                  <div className="space-y-2">
                    {selectedPallet.extrinsics.map((ext) => (
                      <div key={ext} className="flex items-center p-3 bg-gray-800/50 rounded-lg">
                        <Code className="w-4 h-4 text-cyan-400 mr-3" />
                        <code className="text-gray-300 font-mono text-sm">{ext}()</code>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-cyan-400 mb-3">Storage Items</h4>
                  <div className="space-y-2">
                    {selectedPallet.storage.map((item) => (
                      <div key={item} className="flex items-center p-3 bg-gray-800/50 rounded-lg">
                        <Database className="w-4 h-4 text-purple-400 mr-3" />
                        <code className="text-gray-300 font-mono text-sm">{item}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PalletsGrid;