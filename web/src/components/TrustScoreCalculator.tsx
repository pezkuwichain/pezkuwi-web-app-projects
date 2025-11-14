import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Users, BookOpen, Award } from 'lucide-react';

const TrustScoreCalculator: React.FC = () => {
  const [stakedAmount, setStakedAmount] = useState(100);
  const [stakingMonths, setStakingMonths] = useState(6);
  const [referralCount, setReferralCount] = useState(5);
  const [perwerdeScore, setPerwerdeScore] = useState(30);
  const [tikiScore, setTikiScore] = useState(40);
  const [finalScore, setFinalScore] = useState(0);

  // Calculate base amount score based on pallet_staking_score logic
  const getAmountScore = (amount: number) => {
    if (amount <= 100) return 20;
    if (amount <= 250) return 30;
    if (amount <= 750) return 40;
    return 50; // 751+ HEZ
  };

  // Calculate staking multiplier based on months
  const getStakingMultiplier = (months: number) => {
    if (months < 1) return 1.0;
    if (months < 3) return 1.2;
    if (months < 6) return 1.4;
    if (months < 12) return 1.7;
    return 2.0;
  };

  // Calculate referral score
  const getReferralScore = (count: number) => {
    if (count === 0) return 0;
    if (count <= 5) return count * 4;
    if (count <= 20) return 20 + ((count - 5) * 2);
    return 50;
  };

  useEffect(() => {
    const amountScore = getAmountScore(stakedAmount);
    const multiplier = getStakingMultiplier(stakingMonths);
    const adjustedStaking = Math.min(amountScore * multiplier, 100);
    const adjustedReferral = getReferralScore(referralCount);

    const weightedSum =
      adjustedStaking * 100 +
      adjustedReferral * 300 +
      perwerdeScore * 300 +
      tikiScore * 300;

    const score = (adjustedStaking * weightedSum) / 1000;
    setFinalScore(Math.round(score));
  }, [stakedAmount, stakingMonths, referralCount, perwerdeScore, tikiScore]);

  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Trust Score Calculator
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Simulate your trust score based on staking, referrals, education, and roles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Inputs */}
          <div className="space-y-6">
            {/* Staking Score */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Staking Amount</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Staked Amount (HEZ)</label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={stakedAmount}
                    onChange={(e) => setStakedAmount(parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-cyan-400">{stakedAmount} HEZ</span>
                    <span className="text-purple-400">Score: {getAmountScore(stakedAmount)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Staking Duration (Months)</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={stakingMonths}
                    onChange={(e) => setStakingMonths(parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-cyan-400">{stakingMonths} months</span>
                    <span className="text-purple-400">×{getStakingMultiplier(stakingMonths).toFixed(1)} multiplier</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Score */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-cyan-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Referral Score</h3>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm">Number of Referrals</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={referralCount}
                  onChange={(e) => setReferralCount(parseInt(e.target.value) || 0)}
                  className="w-full mt-2 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-cyan-500 focus:outline-none"
                />
                <div className="mt-2 text-sm text-cyan-400">
                  Score: {getReferralScore(referralCount)} points
                </div>
              </div>
            </div>

            {/* Other Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-5 h-5 text-teal-400 mr-3" />
                  <h3 className="text-sm font-semibold text-white">Perwerde Score</h3>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={perwerdeScore}
                  onChange={(e) => setPerwerdeScore(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center mt-2 text-teal-400">{perwerdeScore}</div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <div className="flex items-center mb-4">
                  <Award className="w-5 h-5 text-purple-400 mr-3" />
                  <h3 className="text-sm font-semibold text-white">Tiki Score</h3>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tikiScore}
                  onChange={(e) => setTikiScore(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center mt-2 text-purple-400">{tikiScore}</div>
              </div>
            </div>
          </div>

          {/* Results and Formula */}
          <div className="space-y-6">
            {/* Final Score */}
            <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 backdrop-blur-sm rounded-xl border border-purple-500/50 p-8 text-center">
              <Calculator className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">Final Trust Score</h3>
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {finalScore}
              </div>
              <div className="mt-4 text-gray-400">
                Out of theoretical maximum
              </div>
            </div>

            {/* Formula Breakdown */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Formula Breakdown</h3>
              
              <div className="bg-gray-950/50 rounded-lg p-4 font-mono text-sm">
                <div className="text-purple-400 mb-2">
                  weighted_sum = 
                </div>
                <div className="text-gray-300 ml-4">
                  staking × 100 +
                </div>
                <div className="text-gray-300 ml-4">
                  referral × 300 +
                </div>
                <div className="text-gray-300 ml-4">
                  perwerde × 300 +
                </div>
                <div className="text-gray-300 ml-4 mb-2">
                  tiki × 300
                </div>
                <div className="text-cyan-400">
                  final_score = staking × weighted_sum / 1000
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Staking Component:</span>
                  <span className="text-purple-400">{Math.min(Math.round(getAmountScore(stakedAmount) * getStakingMultiplier(stakingMonths)), 100)} × 100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Referral Component:</span>
                  <span className="text-cyan-400">{getReferralScore(referralCount)} × 300</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Perwerde Component:</span>
                  <span className="text-teal-400">{perwerdeScore} × 300</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tiki Component:</span>
                  <span className="text-purple-400">{tikiScore} × 300</span>
                </div>
              </div>
            </div>

            {/* Score Impact */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Score Impact</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Monthly Rewards Eligibility</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${finalScore > 100 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {finalScore > 100 ? 'Eligible' : 'Not Eligible'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Governance Voting Weight</span>
                  <span className="text-cyan-400 font-semibold">{Math.min(Math.floor(finalScore / 100), 10)}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustScoreCalculator;