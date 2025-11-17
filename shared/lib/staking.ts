// ========================================
// Staking Helper Functions
// ========================================
// Helper functions for pallet_staking and pallet_staking_score integration

import { ApiPromise } from '@polkadot/api';
import { formatBalance } from './wallet';

export interface StakingLedger {
  stash: string;
  total: string;
  active: string;
  unlocking: { value: string; era: number }[];
  claimedRewards: number[];
}

export interface NominatorInfo {
  targets: string[];
  submittedIn: number;
  suppressed: boolean;
}

export interface ValidatorPrefs {
  commission: number;
  blocked: boolean;
}

export interface EraRewardPoints {
  total: number;
  individual: Record<string, number>;
}

export interface PezRewardInfo {
  currentEpoch: number;
  epochStartBlock: number;
  claimableRewards: { epoch: number; amount: string }[]; // Unclaimed rewards from completed epochs
  totalClaimable: string;
  hasPendingClaim: boolean;
}

export interface StakingInfo {
  bonded: string;
  active: string;
  unlocking: { amount: string; era: number; blocksRemaining: number }[];
  redeemable: string;
  nominations: string[];
  stakingScore: number | null;
  stakingDuration: number | null; // Duration in blocks
  hasStartedScoreTracking: boolean;
  isValidator: boolean;
  pezRewards: PezRewardInfo | null; // PEZ rewards information
}

/**
 * Get staking ledger for an account
 * In Substrate staking, we need to query using the controller account.
 * If stash == controller (modern setup), we can query directly.
 */
export async function getStakingLedger(
  api: ApiPromise,
  address: string
): Promise<StakingLedger | null> {
  try {
    // Method 1: Try direct ledger query (modern Substrate where stash == controller)
    let ledgerResult = await api.query.staking.ledger(address);

    // Method 2: If not found, check if address is a stash and get controller
    if (ledgerResult.isNone) {
      const bondedController = await api.query.staking.bonded(address);
      if (bondedController.isSome) {
        const controllerAddress = bondedController.unwrap().toString();
        console.log(`Found controller ${controllerAddress} for stash ${address}`);
        ledgerResult = await api.query.staking.ledger(controllerAddress);
      }
    }

    if (ledgerResult.isNone) {
      console.warn(`No staking ledger found for ${address}`);
      return null;
    }

    const ledger = ledgerResult.unwrap();
    const ledgerJson = ledger.toJSON() as any;

    console.log('Staking ledger:', ledgerJson);

    return {
      stash: ledgerJson.stash?.toString() || address,
      total: ledgerJson.total?.toString() || '0',
      active: ledgerJson.active?.toString() || '0',
      unlocking: (ledgerJson.unlocking || []).map((u: any) => ({
        value: u.value?.toString() || '0',
        era: u.era || 0
      })),
      claimedRewards: ledgerJson.claimedRewards || []
    };
  } catch (error) {
    console.error('Error fetching staking ledger:', error);
    return null;
  }
}

/**
 * Get nominations for an account
 */
export async function getNominations(
  api: ApiPromise,
  address: string
): Promise<NominatorInfo | null> {
  try {
    const nominatorsOption = await api.query.staking.nominators(address);

    if (nominatorsOption.isNone) {
      return null;
    }

    const nominator = nominatorsOption.unwrap();
    const nominatorJson = nominator.toJSON() as any;

    return {
      targets: nominatorJson.targets || [],
      submittedIn: nominatorJson.submittedIn || 0,
      suppressed: nominatorJson.suppressed || false
    };
  } catch (error) {
    console.error('Error fetching nominations:', error);
    return null;
  }
}

/**
 * Get current active era
 */
export async function getCurrentEra(api: ApiPromise): Promise<number> {
  try {
    const activeEraOption = await api.query.staking.activeEra();
    if (activeEraOption.isNone) {
      return 0;
    }
    const activeEra = activeEraOption.unwrap();
    return Number(activeEra.index.toString());
  } catch (error) {
    console.error('Error fetching current era:', error);
    return 0;
  }
}

/**
 * Get blocks remaining until an era
 */
export async function getBlocksUntilEra(
  api: ApiPromise,
  targetEra: number
): Promise<number> {
  try {
    const currentEra = await getCurrentEra(api);
    if (targetEra <= currentEra) {
      return 0;
    }

    const activeEraOption = await api.query.staking.activeEra();
    if (activeEraOption.isNone) {
      return 0;
    }

    const activeEra = activeEraOption.unwrap();
    const eraStartBlock = Number(activeEra.start.unwrapOr(0).toString());

    // Get session length and sessions per era
    const sessionLength = api.consts.babe?.epochDuration || api.consts.timestamp?.minimumPeriod || 600;
    const sessionsPerEra = api.consts.staking.sessionsPerEra;

    const blocksPerEra = Number(sessionLength.toString()) * Number(sessionsPerEra.toString());
    const currentBlock = Number((await api.query.system.number()).toString());

    const erasRemaining = targetEra - currentEra;
    const blocksIntoCurrentEra = currentBlock - eraStartBlock;
    const blocksRemainingInCurrentEra = blocksPerEra - blocksIntoCurrentEra;

    return blocksRemainingInCurrentEra + (blocksPerEra * (erasRemaining - 1));
  } catch (error) {
    console.error('Error calculating blocks until era:', error);
    return 0;
  }
}

/**
 * Get PEZ rewards information for an account
 */
export async function getPezRewards(
  api: ApiPromise,
  address: string
): Promise<PezRewardInfo | null> {
  try {
    // Check if pezRewards pallet exists
    if (!api.query.pezRewards || !api.query.pezRewards.epochInfo) {
      console.warn('PezRewards pallet not available');
      return null;
    }

    // Get current epoch info
    const epochInfoResult = await api.query.pezRewards.epochInfo();

    if (!epochInfoResult) {
      console.warn('No epoch info found');
      return null;
    }

    const epochInfo = epochInfoResult.toJSON() as any;
    const currentEpoch = epochInfo.currentEpoch || 0;
    const epochStartBlock = epochInfo.epochStartBlock || 0;

    // Check for claimable rewards from completed epochs
    const claimableRewards: { epoch: number; amount: string }[] = [];
    let totalClaimable = BigInt(0);

    // Check last 3 completed epochs for unclaimed rewards
    for (let i = Math.max(0, currentEpoch - 3); i < currentEpoch; i++) {
      try {
        // Check if user has claimed this epoch already
        const claimedResult = await api.query.pezRewards.claimedRewards(i, address);

        if (claimedResult.isNone) {
          // User hasn't claimed - check if they have rewards
          const userScoreResult = await api.query.pezRewards.userEpochScores(i, address);

          if (userScoreResult.isSome) {
            // User has a score for this epoch - calculate their reward
            const epochPoolResult = await api.query.pezRewards.epochRewardPools(i);

            if (epochPoolResult.isSome) {
              const epochPool = epochPoolResult.unwrap().toJSON() as any;
              const userScore = BigInt(userScoreResult.unwrap().toString());
              const rewardPerPoint = BigInt(epochPool.rewardPerTrustPoint || '0');

              const rewardAmount = userScore * rewardPerPoint;
              const rewardFormatted = formatBalance(rewardAmount.toString());

              if (parseFloat(rewardFormatted) > 0) {
                claimableRewards.push({
                  epoch: i,
                  amount: rewardFormatted
                });
                totalClaimable += rewardAmount;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Error checking epoch ${i} rewards:`, err);
      }
    }

    return {
      currentEpoch,
      epochStartBlock,
      claimableRewards,
      totalClaimable: formatBalance(totalClaimable.toString()),
      hasPendingClaim: claimableRewards.length > 0
    };
  } catch (error) {
    console.warn('PEZ rewards not available:', error);
    return null;
  }
}

/**
 * Get comprehensive staking info for an account
 */
export async function getStakingInfo(
  api: ApiPromise,
  address: string
): Promise<StakingInfo> {
  const ledger = await getStakingLedger(api, address);
  const nominations = await getNominations(api, address);
  const currentEra = await getCurrentEra(api);

  const unlocking = ledger?.unlocking || [];
  const unlockingWithBlocks = await Promise.all(
    unlocking.map(async (u) => {
      const blocks = await getBlocksUntilEra(api, u.era);
      return {
        amount: formatBalance(u.value),
        era: u.era,
        blocksRemaining: blocks
      };
    })
  );

  // Calculate redeemable (unlocking chunks where era has passed)
  const redeemableChunks = unlocking.filter(u => u.era <= currentEra);
  const redeemable = redeemableChunks.reduce((sum, u) => {
    return sum + BigInt(u.value);
  }, BigInt(0));

  // Get staking score if available
  //
  // IMPORTANT: This calculation MUST match pallet_staking_score::get_staking_score() exactly!
  // The pallet calculates this score and reports it to pallet_pez_rewards.
  // Any changes here must be synchronized with pallets/staking-score/src/lib.rs
  //
  // Score Formula:
  // 1. Amount Score (20-50 points based on staked HEZ)
  //    - 0-100 HEZ: 20 points
  //    - 101-250 HEZ: 30 points
  //    - 251-750 HEZ: 40 points
  //    - 751+ HEZ: 50 points
  // 2. Duration Multiplier (based on time staked)
  //    - < 1 month: x1.0
  //    - 1-2 months: x1.2
  //    - 3-5 months: x1.4
  //    - 6-11 months: x1.7
  //    - 12+ months: x2.0
  // 3. Final Score = min(100, floor(amountScore * durationMultiplier))
  //
  let stakingScore: number | null = null;
  let stakingDuration: number | null = null;
  let hasStartedScoreTracking = false;

  try {
    if (api.query.stakingScore && api.query.stakingScore.stakingStartBlock) {
      // Check if user has started score tracking
      const scoreResult = await api.query.stakingScore.stakingStartBlock(address);

      if (scoreResult.isSome) {
        hasStartedScoreTracking = true;
        const startBlock = Number(scoreResult.unwrap().toString());
        const currentBlock = Number((await api.query.system.number()).toString());
        const durationInBlocks = currentBlock - startBlock;
        stakingDuration = durationInBlocks;

        // Calculate amount-based score (20-50 points)
        const stakedHEZ = ledger ? parseFloat(formatBalance(ledger.total)) : 0;
        let amountScore = 20; // Default

        if (stakedHEZ <= 100) {
          amountScore = 20;
        } else if (stakedHEZ <= 250) {
          amountScore = 30;
        } else if (stakedHEZ <= 750) {
          amountScore = 40;
        } else {
          amountScore = 50; // 751+ HEZ
        }

        // Calculate duration multiplier
        const MONTH_IN_BLOCKS = 30 * 24 * 60 * 10; // 432,000 blocks (~30 days, 6s per block)
        let durationMultiplier = 1.0;

        if (durationInBlocks >= 12 * MONTH_IN_BLOCKS) {
          durationMultiplier = 2.0; // 12+ months
        } else if (durationInBlocks >= 6 * MONTH_IN_BLOCKS) {
          durationMultiplier = 1.7; // 6-11 months
        } else if (durationInBlocks >= 3 * MONTH_IN_BLOCKS) {
          durationMultiplier = 1.4; // 3-5 months
        } else if (durationInBlocks >= MONTH_IN_BLOCKS) {
          durationMultiplier = 1.2; // 1-2 months
        } else {
          durationMultiplier = 1.0; // < 1 month
        }

        // Final score calculation (max 100)
        // This MUST match the pallet's integer math: amount_score * multiplier_numerator / multiplier_denominator
        stakingScore = Math.min(100, Math.floor(amountScore * durationMultiplier));

        console.log('Staking score calculated:', {
          stakedHEZ,
          amountScore,
          durationInBlocks,
          durationMultiplier,
          finalScore: stakingScore
        });
      }
    }
  } catch (error) {
    console.warn('Staking score not available:', error);
  }

  // Check if validator
  const validatorsOption = await api.query.staking.validators(address);
  const isValidator = validatorsOption.isSome;

  // Get PEZ rewards information
  const pezRewards = await getPezRewards(api, address);

  return {
    bonded: ledger ? formatBalance(ledger.total) : '0',
    active: ledger ? formatBalance(ledger.active) : '0',
    unlocking: unlockingWithBlocks,
    redeemable: formatBalance(redeemable.toString()),
    nominations: nominations?.targets || [],
    stakingScore,
    stakingDuration,
    hasStartedScoreTracking,
    isValidator,
    pezRewards
  };
}

/**
 * Get list of active validators
 * For Pezkuwi, we query staking.validators.entries() to get all registered validators
 */
export async function getActiveValidators(api: ApiPromise): Promise<string[]> {
  try {
    // Try multiple methods to get validators

    // Method 1: Try validatorPool.currentValidatorSet() if available
    if (api.query.validatorPool && api.query.validatorPool.currentValidatorSet) {
      try {
        const currentSetOption = await api.query.validatorPool.currentValidatorSet();
        if (currentSetOption.isSome) {
          const validatorSet = currentSetOption.unwrap() as any;
          // Extract validators array from the set structure
          if (validatorSet.validators && Array.isArray(validatorSet.validators)) {
            const validators = validatorSet.validators.map((v: any) => v.toString());
            if (validators.length > 0) {
              console.log(`Found ${validators.length} validators from validatorPool.currentValidatorSet`);
              return validators;
            }
          }
        }
      } catch (err) {
        console.warn('validatorPool.currentValidatorSet query failed:', err);
      }
    }

    // Method 2: Query staking.validators.entries() to get all registered validators
    try {
      const validatorEntries = await api.query.staking.validators.entries();
      if (validatorEntries.length > 0) {
        const validators = validatorEntries.map(([key]) => key.args[0].toString());
        console.log(`Found ${validators.length} validators from staking.validators.entries()`);
        return validators;
      }
    } catch (err) {
      console.warn('staking.validators.entries() query failed:', err);
    }

    // Method 3: Fallback to session.validators()
    const sessionValidators = await api.query.session.validators();
    const validators = sessionValidators.map(v => v.toString());
    console.log(`Found ${validators.length} validators from session.validators()`);
    return validators;
  } catch (error) {
    console.error('Error fetching validators:', error);
    return [];
  }
}

/**
 * Get minimum nominator bond
 */
export async function getMinNominatorBond(api: ApiPromise): Promise<string> {
  try {
    const minBond = await api.query.staking.minNominatorBond();
    return formatBalance(minBond.toString());
  } catch (error) {
    console.error('Error fetching min nominator bond:', error);
    return '0';
  }
}

/**
 * Get bonding duration in eras
 */
export async function getBondingDuration(api: ApiPromise): Promise<number> {
  try {
    const duration = api.consts.staking.bondingDuration;
    return Number(duration.toString());
  } catch (error) {
    console.error('Error fetching bonding duration:', error);
    return 28; // Default 28 eras
  }
}

/**
 * Claim PEZ rewards for specific epochs
 */
export async function claimPezRewards(
  api: ApiPromise,
  signerAddress: string,
  epochs: number[]
): Promise<void> {
  if (!api.tx.pezRewards || !api.tx.pezRewards.claimReward) {
    throw new Error('PezRewards pallet not available');
  }

  // Claim each epoch individually (pallet doesn't support batch claims)
  // We'll use utility.batch for efficiency if available
  const txs = epochs.map(epoch => api.tx.pezRewards.claimReward(epoch));

  let finalTx;
  if (txs.length === 1) {
    finalTx = txs[0];
  } else if (api.tx.utility && api.tx.utility.batch) {
    finalTx = api.tx.utility.batch(txs);
  } else {
    // Fallback: just claim the first one
    finalTx = txs[0];
  }

  return new Promise((resolve, reject) => {
    finalTx.signAndSend(signerAddress, ({ status, dispatchError }) => {
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
 * Start staking score tracking
 */
export async function startScoreTracking(
  api: ApiPromise,
  signerAddress: string
): Promise<void> {
  if (!api.tx.stakingScore || !api.tx.stakingScore.startStakingScoreTracking) {
    throw new Error('StakingScore pallet not available');
  }

  const tx = api.tx.stakingScore.startStakingScoreTracking();

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
 * Parse amount to blockchain format (12 decimals for HEZ)
 */
export function parseAmount(amount: string | number, decimals: number = 12): string {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Invalid amount');
  }
  const value = BigInt(Math.floor(amountNum * Math.pow(10, decimals)));
  return value.toString();
}
