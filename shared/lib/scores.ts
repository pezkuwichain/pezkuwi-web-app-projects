// ========================================
// Score Systems Integration
// ========================================
// Centralized score fetching from blockchain pallets

import type { ApiPromise } from '@polkadot/api';

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface UserScores {
  trustScore: number;
  referralScore: number;
  stakingScore: number;
  tikiScore: number;
  totalScore: number;
}

export interface TrustScoreDetails {
  totalScore: number;
  stakingPoints: number;
  referralPoints: number;
  tikiPoints: number;
  activityPoints: number;
  historyLength: number;
}

// ========================================
// TRUST SCORE (pallet_trust)
// ========================================

/**
 * Fetch user's trust score from blockchain
 * pallet_trust::TrustScores storage
 */
export async function getTrustScore(
  api: ApiPromise,
  address: string
): Promise<number> {
  try {
    if (!api?.query?.trust) {
      console.warn('Trust pallet not available');
      return 0;
    }

    const score = await api.query.trust.trustScores(address);

    if (score.isEmpty) {
      return 0;
    }

    return Number(score.toString());
  } catch (error) {
    console.error('Error fetching trust score:', error);
    return 0;
  }
}

/**
 * Fetch detailed trust score breakdown
 * pallet_trust::ScoreHistory storage
 */
export async function getTrustScoreDetails(
  api: ApiPromise,
  address: string
): Promise<TrustScoreDetails | null> {
  try {
    if (!api?.query?.trust) {
      return null;
    }

    const totalScore = await getTrustScore(api, address);

    // Get score history to show detailed breakdown
    const historyResult = await api.query.trust.scoreHistory(address);

    if (historyResult.isEmpty) {
      return {
        totalScore,
        stakingPoints: 0,
        referralPoints: 0,
        tikiPoints: 0,
        activityPoints: 0,
        historyLength: 0
      };
    }

    const history = historyResult.toJSON() as any[];

    // Calculate points from history
    // History format: [{blockNumber, score, reason}]
    let stakingPoints = 0;
    let referralPoints = 0;
    let tikiPoints = 0;
    let activityPoints = 0;

    for (const entry of history) {
      const reason = entry.reason || '';
      const score = entry.score || 0;

      if (reason.includes('Staking')) stakingPoints += score;
      else if (reason.includes('Referral')) referralPoints += score;
      else if (reason.includes('Tiki') || reason.includes('Role')) tikiPoints += score;
      else activityPoints += score;
    }

    return {
      totalScore,
      stakingPoints,
      referralPoints,
      tikiPoints,
      activityPoints,
      historyLength: history.length
    };
  } catch (error) {
    console.error('Error fetching trust score details:', error);
    return null;
  }
}

// ========================================
// REFERRAL SCORE (pallet_trust)
// ========================================

/**
 * Fetch user's referral score
 * pallet_trust::ReferralScores storage
 */
export async function getReferralScore(
  api: ApiPromise,
  address: string
): Promise<number> {
  try {
    if (!api?.query?.trust?.referralScores) {
      if (import.meta.env.DEV) console.warn('Referral scores not available in trust pallet');
      return 0;
    }

    const score = await api.query.trust.referralScores(address);

    if (score.isEmpty) {
      return 0;
    }

    return Number(score.toString());
  } catch (error) {
    console.error('Error fetching referral score:', error);
    return 0;
  }
}

/**
 * Get referral count for user
 * pallet_trust::Referrals storage
 */
export async function getReferralCount(
  api: ApiPromise,
  address: string
): Promise<number> {
  try {
    if (!api?.query?.trust?.referrals) {
      return 0;
    }

    const referrals = await api.query.trust.referrals(address);

    if (referrals.isEmpty) {
      return 0;
    }

    const referralList = referrals.toJSON() as any[];
    return Array.isArray(referralList) ? referralList.length : 0;
  } catch (error) {
    console.error('Error fetching referral count:', error);
    return 0;
  }
}

// ========================================
// STAKING SCORE (pallet_staking_score)
// ========================================

/**
 * Get staking score from pallet_staking_score
 * This is already implemented in lib/staking.ts
 * Re-exported here for consistency
 */
export async function getStakingScoreFromPallet(
  api: ApiPromise,
  address: string
): Promise<number> {
  try {
    if (!api?.query?.stakingScore) {
      console.warn('Staking score pallet not available');
      return 0;
    }

    // Check if user has started score tracking
    const scoreResult = await api.query.stakingScore.stakingStartBlock(address);

    if (scoreResult.isNone) {
      return 0;
    }

    // Get staking info from staking pallet
    const ledger = await api.query.staking.ledger(address);

    if (ledger.isNone) {
      return 0;
    }

    const ledgerData = ledger.unwrap().toJSON() as any;
    const stakedAmount = Number(ledgerData.total || 0) / 1e12; // Convert to HEZ

    // Get duration
    const startBlock = Number(scoreResult.unwrap().toString());
    const currentBlock = Number((await api.query.system.number()).toString());
    const durationInBlocks = currentBlock - startBlock;

    // Calculate score based on amount and duration
    // Amount-based score (20-50 points)
    let amountScore = 20;
    if (stakedAmount <= 100) amountScore = 20;
    else if (stakedAmount <= 250) amountScore = 30;
    else if (stakedAmount <= 750) amountScore = 40;
    else amountScore = 50;

    // Duration multiplier
    const MONTH_IN_BLOCKS = 30 * 24 * 60 * 10; // ~30 days
    let durationMultiplier = 1.0;

    if (durationInBlocks >= 12 * MONTH_IN_BLOCKS) durationMultiplier = 2.0;
    else if (durationInBlocks >= 6 * MONTH_IN_BLOCKS) durationMultiplier = 1.7;
    else if (durationInBlocks >= 3 * MONTH_IN_BLOCKS) durationMultiplier = 1.4;
    else if (durationInBlocks >= MONTH_IN_BLOCKS) durationMultiplier = 1.2;

    return Math.min(100, Math.floor(amountScore * durationMultiplier));
  } catch (error) {
    console.error('Error fetching staking score:', error);
    return 0;
  }
}

// ========================================
// TIKI SCORE (from lib/tiki.ts)
// ========================================

/**
 * Calculate Tiki score from user's roles
 * Import from lib/tiki.ts
 */
import { fetchUserTikis, calculateTikiScore } from './tiki';

export async function getTikiScore(
  api: ApiPromise,
  address: string
): Promise<number> {
  try {
    const tikis = await fetchUserTikis(api, address);
    return calculateTikiScore(tikis);
  } catch (error) {
    console.error('Error fetching tiki score:', error);
    return 0;
  }
}

// ========================================
// COMPREHENSIVE SCORE FETCHING
// ========================================

/**
 * Fetch all scores for a user in one call
 */
export async function getAllScores(
  api: ApiPromise,
  address: string
): Promise<UserScores> {
  try {
    if (!api || !address) {
      return {
        trustScore: 0,
        referralScore: 0,
        stakingScore: 0,
        tikiScore: 0,
        totalScore: 0
      };
    }

    // Fetch all scores in parallel
    const [trustScore, referralScore, stakingScore, tikiScore] = await Promise.all([
      getTrustScore(api, address),
      getReferralScore(api, address),
      getStakingScoreFromPallet(api, address),
      getTikiScore(api, address)
    ]);

    const totalScore = trustScore + referralScore + stakingScore + tikiScore;

    return {
      trustScore,
      referralScore,
      stakingScore,
      tikiScore,
      totalScore
    };
  } catch (error) {
    console.error('Error fetching all scores:', error);
    return {
      trustScore: 0,
      referralScore: 0,
      stakingScore: 0,
      tikiScore: 0,
      totalScore: 0
    };
  }
}

// ========================================
// SCORE DISPLAY HELPERS
// ========================================

/**
 * Get color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 200) return 'text-purple-500';
  if (score >= 150) return 'text-pink-500';
  if (score >= 100) return 'text-blue-500';
  if (score >= 70) return 'text-cyan-500';
  if (score >= 40) return 'text-teal-500';
  if (score >= 20) return 'text-green-500';
  return 'text-gray-500';
}

/**
 * Get score rating label
 */
export function getScoreRating(score: number): string {
  if (score >= 250) return 'Legendary';
  if (score >= 200) return 'Excellent';
  if (score >= 150) return 'Very Good';
  if (score >= 100) return 'Good';
  if (score >= 70) return 'Average';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Low';
  return 'Very Low';
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score.toFixed(0);
}
