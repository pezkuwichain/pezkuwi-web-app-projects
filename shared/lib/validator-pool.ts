/**
 * ValidatorPool Pallet Integration
 *
 * This module provides helper functions for interacting with the ValidatorPool pallet,
 * which handles:
 * - 3-category validator pool system (Stake, Parliamentary, Merit)
 * - Era-based validator selection
 * - Performance metrics tracking
 * - Reputation scoring
 */

import type { ApiPromise } from '@polkadot/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ValidatorPoolCategory = 'StakeValidator' | 'ParliamentaryValidator' | 'MeritValidator';

export interface ValidatorPerformance {
  blocksProduced: number;
  blocksMissed: number;
  eraPoints: number;
  lastActiveEra: number;
  reputationScore: number; // 0-100
}

export interface ValidatorSet {
  eraIndex: number;
  stakeValidators: string[];
  parliamentaryValidators: string[];
  meritValidators: string[];
}

export interface PoolMember {
  account: string;
  category: ValidatorPoolCategory;
  performance: ValidatorPerformance;
  isActive: boolean;
}

export interface PoolStats {
  currentEra: number;
  poolSize: number;
  eraLength: number;
  eraStartBlock: number;
  currentBlock: number;
  blocksUntilNewEra: number;
}

// ============================================================================
// QUERY FUNCTIONS (Read-only)
// ============================================================================

/**
 * Get current era number
 */
export async function getCurrentEra(api: ApiPromise): Promise<number> {
  const era = await api.query.validatorPool.currentEra();
  return (era.toJSON() as number) || 0;
}

/**
 * Get era length in blocks
 */
export async function getEraLength(api: ApiPromise): Promise<number> {
  const length = await api.query.validatorPool.eraLength();
  return (length.toJSON() as number) || 0;
}

/**
 * Get era start block
 */
export async function getEraStartBlock(api: ApiPromise): Promise<number> {
  const start = await api.query.validatorPool.eraStart();
  return (start.toJSON() as number) || 0;
}

/**
 * Get pool statistics
 */
export async function getPoolStats(api: ApiPromise): Promise<PoolStats> {
  const [currentEra, poolSize, eraLength, eraStart, header] = await Promise.all([
    api.query.validatorPool.currentEra(),
    api.query.validatorPool.poolSize(),
    api.query.validatorPool.eraLength(),
    api.query.validatorPool.eraStart(),
    api.rpc.chain.getHeader(),
  ]);

  const currentBlock = header.number.toNumber();
  const eraStartBlock = (eraStart.toJSON() as number) || 0;
  const eraLen = (eraLength.toJSON() as number) || 0;
  const blocksUntilNewEra = Math.max(0, eraStartBlock + eraLen - currentBlock);

  return {
    currentEra: (currentEra.toJSON() as number) || 0,
    poolSize: (poolSize.toJSON() as number) || 0,
    eraLength: eraLen,
    eraStartBlock,
    currentBlock,
    blocksUntilNewEra,
  };
}

/**
 * Get current validator set
 */
export async function getCurrentValidatorSet(api: ApiPromise): Promise<ValidatorSet> {
  const validatorSet = await api.query.validatorPool.currentValidatorSet();

  if (!validatorSet || validatorSet.isEmpty) {
    return {
      eraIndex: 0,
      stakeValidators: [],
      parliamentaryValidators: [],
      meritValidators: [],
    };
  }

  const data = validatorSet.toJSON() as any;

  return {
    eraIndex: data.eraIndex || 0,
    stakeValidators: data.stakeValidators || [],
    parliamentaryValidators: data.parliamentaryValidators || [],
    meritValidators: data.meritValidators || [],
  };
}

/**
 * Check if account is in validator pool
 */
export async function isInPool(api: ApiPromise, accountAddress: string): Promise<boolean> {
  const category = await api.query.validatorPool.poolMembers(accountAddress);
  return category.isSome;
}

/**
 * Get validator's pool category
 */
export async function getValidatorCategory(
  api: ApiPromise,
  accountAddress: string
): Promise<ValidatorPoolCategory | null> {
  const category = await api.query.validatorPool.poolMembers(accountAddress);

  if (category.isNone) {
    return null;
  }

  const categoryData = category.unwrap().toJSON() as string;
  return categoryData as ValidatorPoolCategory;
}

/**
 * Get validator performance metrics
 */
export async function getValidatorPerformance(
  api: ApiPromise,
  accountAddress: string
): Promise<ValidatorPerformance | null> {
  const metrics = await api.query.validatorPool.performanceMetrics(accountAddress);

  if (metrics.isNone || metrics.isEmpty) {
    return null;
  }

  const data = metrics.toJSON() as any;

  return {
    blocksProduced: data.blocksProduced || 0,
    blocksMissed: data.blocksMissed || 0,
    eraPoints: data.eraPoints || 0,
    lastActiveEra: data.lastActiveEra || 0,
    reputationScore: data.reputationScore || 0,
  };
}

/**
 * Get all pool members with their details
 */
export async function getAllPoolMembers(api: ApiPromise): Promise<PoolMember[]> {
  const entries = await api.query.validatorPool.poolMembers.entries();

  const members: PoolMember[] = [];

  for (const [key, value] of entries) {
    const account = (key.args[0] as any).toString();
    const category = value.toJSON() as ValidatorPoolCategory;

    // Get performance metrics
    const metricsOption = await api.query.validatorPool.performanceMetrics(account);
    const metricsData = metricsOption.isSome ? (metricsOption.unwrap().toJSON() as any) : null;

    const performance: ValidatorPerformance = metricsData
      ? {
          blocksProduced: metricsData.blocksProduced || 0,
          blocksMissed: metricsData.blocksMissed || 0,
          eraPoints: metricsData.eraPoints || 0,
          lastActiveEra: metricsData.lastActiveEra || 0,
          reputationScore: metricsData.reputationScore || 0,
        }
      : {
          blocksProduced: 0,
          blocksMissed: 0,
          eraPoints: 0,
          lastActiveEra: 0,
          reputationScore: 0,
        };

    members.push({
      account,
      category,
      performance,
      isActive: performance.reputationScore >= 70,
    });
  }

  return members;
}

/**
 * Get pool members by category
 */
export async function getPoolMembersByCategory(
  api: ApiPromise,
  category: ValidatorPoolCategory
): Promise<PoolMember[]> {
  const allMembers = await getAllPoolMembers(api);
  return allMembers.filter((m) => m.category === category);
}

/**
 * Get selection history for a validator
 */
export async function getSelectionHistory(api: ApiPromise, accountAddress: string): Promise<number[]> {
  const history = await api.query.validatorPool.selectionHistory(accountAddress);

  if (history.isNone || history.isEmpty) {
    return [];
  }

  return (history.toJSON() as number[]) || [];
}

// ============================================================================
// TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Join validator pool
 */
export async function joinValidatorPool(
  api: ApiPromise,
  signerAddress: string,
  category: ValidatorPoolCategory
): Promise<void> {
  const tx = api.tx.validatorPool.joinValidatorPool(category);

  return new Promise((resolve, reject) => {
    tx.signAndSend(signerAddress, ({ status, dispatchError }) => {
      if (status.isInBlock) {
        if (dispatchError) {
          reject(dispatchError);
        } else {
          resolve();
        }
      }
    });
  });
}

/**
 * Leave validator pool
 */
export async function leaveValidatorPool(api: ApiPromise, signerAddress: string): Promise<void> {
  const tx = api.tx.validatorPool.leaveValidatorPool();

  return new Promise((resolve, reject) => {
    tx.signAndSend(signerAddress, ({ status, dispatchError }) => {
      if (status.isInBlock) {
        if (dispatchError) {
          reject(dispatchError);
        } else {
          resolve();
        }
      }
    });
  });
}

/**
 * Update validator category
 */
export async function updateCategory(
  api: ApiPromise,
  signerAddress: string,
  newCategory: ValidatorPoolCategory
): Promise<void> {
  const tx = api.tx.validatorPool.updateCategory(newCategory);

  return new Promise((resolve, reject) => {
    tx.signAndSend(signerAddress, ({ status, dispatchError }) => {
      if (status.isInBlock) {
        if (dispatchError) {
          reject(dispatchError);
        } else {
          resolve();
        }
      }
    });
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category label
 */
export function getCategoryLabel(category: ValidatorPoolCategory): {
  en: string;
  kmr: string;
  description: string;
} {
  const labels = {
    StakeValidator: {
      en: 'Stake Validator',
      kmr: 'Validatorê Stake',
      description: 'Economic commitment through token staking',
    },
    ParliamentaryValidator: {
      en: 'Parliamentary Validator',
      kmr: 'Validatorê Parlamentoyê',
      description: 'Governance participation capability',
    },
    MeritValidator: {
      en: 'Merit Validator',
      kmr: 'Validatorê Şayisteyê',
      description: 'Community recognition and engagement',
    },
  };

  return labels[category] || { en: category, kmr: category, description: '' };
}

/**
 * Get category requirements description
 */
export function getCategoryRequirements(category: ValidatorPoolCategory): string[] {
  const requirements = {
    StakeValidator: [
      'Minimum stake amount (economic commitment)',
      'Trust score above threshold',
      'No slashing history',
    ],
    ParliamentaryValidator: ['Parlementer Tiki (governance role)', 'Active participation record'],
    MeritValidator: [
      'Special community Tikis',
      'Minimum referral count',
      'Community engagement metrics',
    ],
  };

  return requirements[category] || [];
}

/**
 * Calculate estimated rewards based on era points
 */
export function estimateEraRewards(eraPoints: number, totalEraPoints: number, totalRewards: number): number {
  if (totalEraPoints === 0) return 0;
  return (eraPoints / totalEraPoints) * totalRewards;
}

/**
 * Get reputation status
 */
export function getReputationStatus(score: number): {
  label: string;
  color: string;
  canValidate: boolean;
} {
  if (score >= 90) {
    return { label: 'Excellent', color: 'green', canValidate: true };
  } else if (score >= 70) {
    return { label: 'Good', color: 'blue', canValidate: true };
  } else if (score >= 50) {
    return { label: 'Fair', color: 'yellow', canValidate: false };
  } else {
    return { label: 'Poor', color: 'red', canValidate: false };
  }
}

/**
 * Convert blocks to time estimate (6 seconds per block)
 */
export function blocksToTime(blocks: number): {
  days: number;
  hours: number;
  minutes: number;
} {
  const seconds = blocks * 6;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return { days, hours, minutes };
}
