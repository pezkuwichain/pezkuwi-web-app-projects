import React, { useState } from 'react';
import { Gift, Calendar, Users, Timer, DollarSign } from 'lucide-react';

const RewardDistribution: React.FC = () => {
  const [currentEpoch, setCurrentEpoch] = useState(1);
  const [trustScoreInput, setTrustScoreInput] = useState(500);
  const [totalParticipants, setTotalParticipants] = useState(1000);
  const [totalTrustScore, setTotalTrustScore] = useState(500000);

  const epochRewardPool = 1000000; // 1M PEZ per epoch
  const parliamentaryAllocation = epochRewardPool * 0.1; // 10% for NFT holders
  const trustScorePool = epochRewardPool * 0.9; // 90% for trust score rewards
  const rewardPerTrustPoint = trustScorePool / totalTrustScore;
  const userReward = trustScoreInput * rewardPerTrustPoint;
  const nftRewardPerHolder = parliamentaryAllocation / 201;

  const epochPhases = [
    { name: 'Active', duration: '30 days', blocks: 432000, status: 'current' },
    { name: 'Claim Period', duration: '7 days', blocks: 100800, status: 'upcoming' },
    { name: 'Closed', duration: 'Permanent', blocks: 0, status: 'final' }
  ];

  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Reward Distribution System
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Monthly epoch-based rewards distributed by trust score and NFT holdings
          </p>
        </div>

        <div className="mb-8">
          <img
            src="/pezkuwichain_logo.png"
            alt="PezkuwiChain Logo"
            className="w-full h-64 object-cover rounded-xl opacity-80"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Epoch Timeline */}
          <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <div className="flex items-center mb-6">
              <Calendar className="w-6 h-6 text-purple-400 mr-3" />
              <h3 className="text-xl font-semibold text-white">Epoch Timeline</h3>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Current Epoch</span>
                <span className="text-2xl font-bold text-white">#{currentEpoch}</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={currentEpoch}
                onChange={(e) => setCurrentEpoch(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              {epochPhases.map((phase, index) => (
                <div key={phase.name} className="relative">
                  <div className={`p-4 rounded-lg border ${
                    phase.status === 'current' 
                      ? 'bg-kurdish-green/20 border-kurdish-green/50'
                      : 'bg-gray-900/50 border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold ${
                        phase.status === 'current' ? 'text-purple-400' : 'text-gray-300'
                      }`}>
                        {phase.name}
                      </h4>
                      <div className="flex items-center text-sm">
                        <Timer className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="text-gray-400">{phase.duration}</span>
                      </div>
                    </div>
                    {phase.blocks > 0 && (
                      <div className="text-sm text-gray-500">
                        {phase.blocks.toLocaleString()} blocks
                      </div>
                    )}
                  </div>
                  {index < epochPhases.length - 1 && (
                    <div className="absolute left-8 top-full h-4 w-0.5 bg-gray-700"></div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Epoch Start Block</div>
                <div className="text-white font-semibold">
                  #{((currentEpoch - 1) * 432000).toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Claim Deadline Block</div>
                <div className="text-cyan-400 font-semibold">
                  #{((currentEpoch * 432000) + 100800).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Reward Pool Info */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <div className="flex items-center mb-4">
                <Gift className="w-6 h-6 text-cyan-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Epoch Pool</h3>
              </div>
              
              <div className="text-3xl font-bold text-white mb-4">
                {epochRewardPool.toLocaleString()} PEZ
              </div>

              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Trust Score Pool</span>
                  <span className="text-cyan-400 font-semibold">90%</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Parliamentary NFTs</span>
                  <span className="text-purple-400 font-semibold">10%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">NFT Rewards</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total NFTs</span>
                  <span className="text-white">201</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Per NFT Reward</span>
                  <span className="text-purple-400 font-semibold">
                    {Math.floor(nftRewardPerHolder).toLocaleString()} PEZ
                  </span>
                </div>
                <div className="p-3 bg-kurdish-red/20 rounded-lg border border-kurdish-red/30">
                  <div className="text-xs text-purple-400 mb-1">Auto-distributed</div>
                  <div className="text-sm text-gray-300">No claim required</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reward Calculator */}
        <div className="mt-8 bg-gradient-to-br from-purple-900/20 to-cyan-900/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <DollarSign className="w-6 h-6 text-cyan-400 mr-3" />
            Reward Calculator
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Your Trust Score</label>
              <input
                type="number"
                value={trustScoreInput}
                onChange={(e) => setTrustScoreInput(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="text-gray-400 text-sm block mb-2">Total Participants</label>
              <input
                type="number"
                value={totalParticipants}
                onChange={(e) => setTotalParticipants(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="text-gray-400 text-sm block mb-2">Total Trust Score</label>
              <input
                type="number"
                value={totalTrustScore}
                onChange={(e) => setTotalTrustScore(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Reward per Trust Point</div>
                <div className="text-xl font-semibold text-cyan-400">
                  {rewardPerTrustPoint.toFixed(4)} PEZ
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Your Share</div>
                <div className="text-xl font-semibold text-purple-400">
                  {((trustScoreInput / totalTrustScore) * 100).toFixed(3)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Estimated Reward</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {Math.floor(userReward).toLocaleString()} PEZ
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RewardDistribution;