import type { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

/**
 * Referral System Integration with pallet_referral
 *
 * Provides functions to interact with the referral pallet on PezkuwiChain.
 *
 * Workflow:
 * 1. User A calls initiateReferral(userB_address) -> creates pending referral
 * 2. User B completes KYC and gets approved
 * 3. Pallet automatically confirms referral via OnKycApproved hook
 * 4. User A's referral count increases
 */

export interface ReferralInfo {
  referrer: string;
  createdAt: number;
}

export interface ReferralStats {
  referralCount: number;
  referralScore: number;
  whoInvitedMe: string | null;
  pendingReferral: string | null; // Who invited me (if pending)
}

/**
 * Initiate a referral for a new user
 *
 * @param api Polkadot API instance
 * @param signer User's Polkadot account with extension
 * @param referredAddress Address of the user being referred
 * @returns Transaction hash
 */
export async function initiateReferral(
  api: ApiPromise,
  signer: InjectedAccountWithMeta,
  referredAddress: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const tx = api.tx.referral.initiateReferral(referredAddress);

      await tx.signAndSend(
        signer.address,
        { signer: signer.signer },
        ({ status, events, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              const error = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              reject(new Error(error));
            } else {
              reject(new Error(dispatchError.toString()));
            }
            return;
          }

          if (status.isInBlock || status.isFinalized) {
            const hash = status.asInBlock?.toString() || status.asFinalized?.toString() || '';
            resolve(hash);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get the pending referral for a user (who invited them, if they haven't completed KYC)
 *
 * @param api Polkadot API instance
 * @param address User address
 * @returns Referrer address if pending, null otherwise
 */
export async function getPendingReferral(
  api: ApiPromise,
  address: string
): Promise<string | null> {
  try {
    const result = await api.query.referral.pendingReferrals(address);

    if (result.isEmpty) {
      return null;
    }

    return result.toString();
  } catch (error) {
    console.error('Error fetching pending referral:', error);
    return null;
  }
}

/**
 * Get the number of successful referrals for a user
 *
 * @param api Polkadot API instance
 * @param address User address
 * @returns Number of confirmed referrals
 */
export async function getReferralCount(
  api: ApiPromise,
  address: string
): Promise<number> {
  try {
    const count = await api.query.referral.referralCount(address);
    return count.toNumber();
  } catch (error) {
    console.error('Error fetching referral count:', error);
    return 0;
  }
}

/**
 * Get referral info for a user (who referred them, when)
 *
 * @param api Polkadot API instance
 * @param address User address who was referred
 * @returns ReferralInfo if exists, null otherwise
 */
export async function getReferralInfo(
  api: ApiPromise,
  address: string
): Promise<ReferralInfo | null> {
  try {
    const result = await api.query.referral.referrals(address);

    if (result.isEmpty) {
      return null;
    }

    const data = result.toJSON() as any;
    return {
      referrer: data.referrer,
      createdAt: parseInt(data.createdAt),
    };
  } catch (error) {
    console.error('Error fetching referral info:', error);
    return null;
  }
}

/**
 * Calculate referral score based on referral count
 *
 * This mirrors the logic in pallet_referral::ReferralScoreProvider
 * Score calculation:
 * - 0 referrals = 0 points
 * - 1-10 referrals = count * 10 points (10, 20, 30, ..., 100)
 * - 11-50 referrals = 100 + (count - 10) * 5 points (105, 110, ..., 300)
 * - 51-100 referrals = 300 + (count - 50) * 4 points (304, 308, ..., 500)
 * - 101+ referrals = 500 points (maximum capped)
 *
 * @param referralCount Number of confirmed referrals
 * @returns Referral score
 */
export function calculateReferralScore(referralCount: number): number {
  if (referralCount === 0) return 0;
  if (referralCount <= 10) return referralCount * 10;
  if (referralCount <= 50) return 100 + (referralCount - 10) * 5;
  if (referralCount <= 100) return 300 + (referralCount - 50) * 4;
  return 500; // Max score
}

/**
 * Get comprehensive referral statistics for a user
 *
 * @param api Polkadot API instance
 * @param address User address
 * @returns Complete referral stats
 */
export async function getReferralStats(
  api: ApiPromise,
  address: string
): Promise<ReferralStats> {
  try {
    const [referralCount, referralInfo, pendingReferral] = await Promise.all([
      getReferralCount(api, address),
      getReferralInfo(api, address),
      getPendingReferral(api, address),
    ]);

    const referralScore = calculateReferralScore(referralCount);

    return {
      referralCount,
      referralScore,
      whoInvitedMe: referralInfo?.referrer || null,
      pendingReferral,
    };
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return {
      referralCount: 0,
      referralScore: 0,
      whoInvitedMe: null,
      pendingReferral: null,
    };
  }
}

/**
 * Get list of all users who were referred by this user
 * (Note: requires iterating storage which can be expensive)
 *
 * @param api Polkadot API instance
 * @param referrerAddress Referrer's address
 * @returns Array of addresses referred by this user
 */
export async function getMyReferrals(
  api: ApiPromise,
  referrerAddress: string
): Promise<string[]> {
  try {
    const entries = await api.query.referral.referrals.entries();

    const myReferrals = entries
      .filter(([_key, value]) => {
        if (value.isEmpty) return false;
        const data = value.toJSON() as any;
        return data.referrer === referrerAddress;
      })
      .map(([key]) => {
        // Extract the referred address from the storage key
        const addressHex = key.args[0].toString();
        return addressHex;
      });

    return myReferrals;
  } catch (error) {
    console.error('Error fetching my referrals:', error);
    return [];
  }
}

/**
 * Subscribe to referral events for real-time updates
 *
 * @param api Polkadot API instance
 * @param callback Callback function for events
 * @returns Unsubscribe function
 */
export async function subscribeToReferralEvents(
  api: ApiPromise,
  callback: (event: { type: 'initiated' | 'confirmed'; referrer: string; referred: string; count?: number }) => void
): Promise<() => void> {
  const unsub = await api.query.system.events((events) => {
    events.forEach((record) => {
      const { event } = record;

      if (event.section === 'referral') {
        if (event.method === 'ReferralInitiated') {
          const [referrer, referred] = event.data as any;
          callback({
            type: 'initiated',
            referrer: referrer.toString(),
            referred: referred.toString(),
          });
        } else if (event.method === 'ReferralConfirmed') {
          const [referrer, referred, newCount] = event.data as any;
          callback({
            type: 'confirmed',
            referrer: referrer.toString(),
            referred: referred.toString(),
            count: newCount.toNumber(),
          });
        }
      }
    });
  });

  return unsub;
}
