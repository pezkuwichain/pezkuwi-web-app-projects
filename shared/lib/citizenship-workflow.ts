// ========================================
// Citizenship Workflow Library
// ========================================
// Handles citizenship verification, status checks, and workflow logic

import type { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

// ========================================
// TYPE DEFINITIONS
// ========================================

export type KycStatus = 'NotStarted' | 'Pending' | 'Approved' | 'Rejected';

export type Region =
  | 'bakur'       // North (Turkey)
  | 'basur'       // South (Iraq)
  | 'rojava'      // West (Syria)
  | 'rojhelat'    // East (Iran)
  | 'diaspora'    // Diaspora
  | 'kurdistan_a_sor'; // Red Kurdistan (Armenia/Azerbaijan)

export type MaritalStatus = 'zewici' | 'nezewici'; // Married / Unmarried

export interface ChildInfo {
  name: string;
  birthYear: number;
}

export interface CitizenshipData {
  // Personal Identity
  fullName: string;
  fatherName: string;
  grandfatherName: string;
  motherName: string;

  // Tribal Affiliation
  tribe: string;

  // Family Status
  maritalStatus: MaritalStatus;
  childrenCount?: number;
  children?: ChildInfo[];

  // Geographic Origin
  region: Region;

  // Contact & Profession
  email: string;
  profession: string;

  // Referral
  referralCode?: string;

  // Metadata
  walletAddress: string;
  timestamp: number;
}

export interface CitizenshipCommitment {
  commitmentHash: string;    // SHA256 hash of all data
  nullifierHash: string;      // Prevents double-registration
  ipfsCid: string;            // IPFS CID of encrypted data
  publicKey: string;          // User's encryption public key
  timestamp: number;
}

export interface TikiInfo {
  id: string;
  role: string;
  metadata?: any;
}

export interface CitizenshipStatus {
  kycStatus: KycStatus;
  hasCitizenTiki: boolean;
  tikiNumber?: string;
  stakingScoreTracking: boolean;
  ipfsCid?: string;
  nextAction: 'APPLY_KYC' | 'CLAIM_TIKI' | 'START_TRACKING' | 'COMPLETE';
}

// ========================================
// KYC STATUS CHECKS
// ========================================

/**
 * Get KYC status for a wallet address
 */
export async function getKycStatus(
  api: ApiPromise,
  address: string
): Promise<KycStatus> {
  try {
    if (!api?.query?.identityKyc) {
      console.warn('Identity KYC pallet not available');
      return 'NotStarted';
    }

    const status = await api.query.identityKyc.kycStatuses(address);

    if (status.isEmpty) {
      return 'NotStarted';
    }

    const statusStr = status.toString();

    // Map on-chain status to our type
    if (statusStr === 'Approved') return 'Approved';
    if (statusStr === 'Pending') return 'Pending';
    if (statusStr === 'Rejected') return 'Rejected';

    return 'NotStarted';
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    return 'NotStarted';
  }
}

/**
 * Check if user has pending KYC application
 */
export async function hasPendingApplication(
  api: ApiPromise,
  address: string
): Promise<boolean> {
  try {
    if (!api?.query?.identityKyc?.pendingKycApplications) {
      return false;
    }

    const application = await api.query.identityKyc.pendingKycApplications(address);
    return !application.isEmpty;
  } catch (error) {
    console.error('Error checking pending application:', error);
    return false;
  }
}

// ========================================
// TIKI / CITIZENSHIP CHECKS
// ========================================

/**
 * Get all Tiki roles for a user
 */
// Tiki enum mapping from pallet-tiki
const TIKI_ROLES = [
  'Hemwelatî', 'Parlementer', 'SerokiMeclise', 'Serok', 'Wezir', 'EndameDiwane', 'Dadger',
  'Dozger', 'Hiquqnas', 'Noter', 'Xezinedar', 'Bacgir', 'GerinendeyeCavkaniye', 'OperatorêTorê',
  'PisporêEwlehiyaSîber', 'GerinendeyeDaneye', 'Berdevk', 'Qeydkar', 'Balyoz', 'Navbeynkar',
  'ParêzvaneÇandî', 'Mufetîs', 'KalîteKontrolker', 'Mela', 'Feqî', 'Perwerdekar', 'Rewsenbîr',
  'RêveberêProjeyê', 'SerokêKomele', 'ModeratorêCivakê', 'Axa', 'Pêseng', 'Sêwirmend', 'Hekem', 'Mamoste',
  'Bazargan',
  'SerokWeziran', 'WezireDarayiye', 'WezireParez', 'WezireDad', 'WezireBelaw', 'WezireTend', 'WezireAva', 'WezireCand'
];

export async function getUserTikis(
  api: ApiPromise,
  address: string
): Promise<TikiInfo[]> {
  try {
    if (!api?.query?.tiki?.userTikis) {
      console.warn('Tiki pallet not available');
      return [];
    }

    const tikis = await api.query.tiki.userTikis(address);

    if (tikis.isEmpty) {
      return [];
    }

    // userTikis returns a BoundedVec of Tiki enum values (as indices)
    const tikiIndices = tikis.toJSON() as number[];

    return tikiIndices.map((index, i) => ({
      id: `${index}`,
      role: TIKI_ROLES[index] || `Unknown Role (${index})`,
      metadata: {}
    }));
  } catch (error) {
    console.error('Error fetching user tikis:', error);
    return [];
  }
}

/**
 * Check if user has Welati (Citizen) Tiki
 * Backend checks for "Hemwelatî" (actual blockchain role name)
 */
export async function hasCitizenTiki(
  api: ApiPromise,
  address: string
): Promise<{ hasTiki: boolean; tikiNumber?: string }> {
  try {
    const tikis = await getUserTikis(api, address);

    const citizenTiki = tikis.find(t =>
      t.role.toLowerCase() === 'hemwelatî' ||
      t.role.toLowerCase() === 'welati' ||
      t.role.toLowerCase() === 'citizen'
    );

    return {
      hasTiki: !!citizenTiki,
      tikiNumber: citizenTiki?.id
    };
  } catch (error) {
    console.error('Error checking citizen tiki:', error);
    return { hasTiki: false };
  }
}

/**
 * Verify NFT ownership by NFT number
 */
export async function verifyNftOwnership(
  api: ApiPromise,
  nftNumber: string,
  walletAddress: string
): Promise<boolean> {
  try {
    const tikis = await getUserTikis(api, walletAddress);

    return tikis.some(tiki =>
      tiki.id === nftNumber &&
      (
        tiki.role.toLowerCase() === 'hemwelatî' ||
        tiki.role.toLowerCase() === 'welati' ||
        tiki.role.toLowerCase() === 'citizen'
      )
    );
  } catch (error) {
    console.error('Error verifying NFT ownership:', error);
    return false;
  }
}

// ========================================
// STAKING SCORE TRACKING
// ========================================

/**
 * Check if staking score tracking has been started
 */
export async function isStakingScoreTracking(
  api: ApiPromise,
  address: string
): Promise<boolean> {
  try {
    if (!api?.query?.stakingScore?.stakingStartBlock) {
      console.warn('Staking score pallet not available');
      return false;
    }

    const startBlock = await api.query.stakingScore.stakingStartBlock(address);
    return !startBlock.isNone;
  } catch (error) {
    console.error('Error checking staking score tracking:', error);
    return false;
  }
}

/**
 * Check if user is staking
 */
export async function isStaking(
  api: ApiPromise,
  address: string
): Promise<boolean> {
  try {
    if (!api?.query?.staking?.ledger) {
      return false;
    }

    const ledger = await api.query.staking.ledger(address);
    return !ledger.isNone;
  } catch (error) {
    console.error('Error checking staking status:', error);
    return false;
  }
}

// ========================================
// COMPREHENSIVE CITIZENSHIP STATUS
// ========================================

/**
 * Get complete citizenship status and next action needed
 */
export async function getCitizenshipStatus(
  api: ApiPromise,
  address: string
): Promise<CitizenshipStatus> {
  try {
    if (!api || !address) {
      return {
        kycStatus: 'NotStarted',
        hasCitizenTiki: false,
        stakingScoreTracking: false,
        nextAction: 'APPLY_KYC'
      };
    }

    // Fetch all status in parallel
    const [kycStatus, citizenCheck, stakingTracking] = await Promise.all([
      getKycStatus(api, address),
      hasCitizenTiki(api, address),
      isStakingScoreTracking(api, address)
    ]);

    const kycApproved = kycStatus === 'Approved';
    const hasTiki = citizenCheck.hasTiki;

    // Determine next action
    let nextAction: CitizenshipStatus['nextAction'];

    if (!kycApproved) {
      nextAction = 'APPLY_KYC';
    } else if (!hasTiki) {
      nextAction = 'CLAIM_TIKI';
    } else if (!stakingTracking) {
      nextAction = 'START_TRACKING';
    } else {
      nextAction = 'COMPLETE';
    }

    return {
      kycStatus,
      hasCitizenTiki: hasTiki,
      tikiNumber: citizenCheck.tikiNumber,
      stakingScoreTracking: stakingTracking,
      nextAction
    };
  } catch (error) {
    console.error('Error fetching citizenship status:', error);
    return {
      kycStatus: 'NotStarted',
      hasCitizenTiki: false,
      stakingScoreTracking: false,
      nextAction: 'APPLY_KYC'
    };
  }
}

// ========================================
// IPFS COMMITMENT RETRIEVAL
// ========================================

/**
 * Get IPFS CID for citizen data
 */
export async function getCitizenDataCid(
  api: ApiPromise,
  address: string
): Promise<string | null> {
  try {
    if (!api?.query?.identityKyc?.identities) {
      return null;
    }

    // Try to get from identity storage
    // This assumes the pallet stores IPFS CID somewhere
    // Adjust based on actual pallet storage structure
    const identity = await api.query.identityKyc.identities(address);

    if (identity.isNone) {
      return null;
    }

    const identityData = identity.unwrap().toJSON() as any;

    // Try different possible field names
    return identityData.ipfsCid ||
           identityData.cid ||
           identityData.dataCid ||
           null;
  } catch (error) {
    console.error('Error fetching citizen data CID:', error);
    return null;
  }
}

// ========================================
// REFERRAL VALIDATION
// ========================================

/**
 * Validate referral code
 */
export async function validateReferralCode(
  api: ApiPromise,
  referralCode: string
): Promise<boolean> {
  try {
    if (!referralCode || referralCode.trim() === '') {
      return true; // Empty is valid (will use founder)
    }

    // Check if referral code exists in trust pallet
    if (!api?.query?.trust?.referrals) {
      return false;
    }

    // Referral code could be an address or custom code
    // For now, check if it's a valid address format
    // TODO: Implement proper referral code lookup

    return referralCode.length > 0;
  } catch (error) {
    console.error('Error validating referral code:', error);
    return false;
  }
}

// ========================================
// BLOCKCHAIN TRANSACTIONS
// ========================================

/**
 * Submit KYC application to blockchain
 * This is a two-step process:
 * 1. Set identity (name, email)
 * 2. Apply for KYC (IPFS CID, notes)
 */
export async function submitKycApplication(
  api: ApiPromise,
  account: InjectedAccountWithMeta,
  name: string,
  email: string,
  ipfsCid: string,
  notes: string = 'Citizenship application'
): Promise<{ success: boolean; error?: string; blockHash?: string }> {
  try {
    if (!api?.tx?.identityKyc?.setIdentity || !api?.tx?.identityKyc?.applyForKyc) {
      return { success: false, error: 'Identity KYC pallet not available' };
    }

    // Check if user already has a pending KYC application
    const pendingApp = await api.query.identityKyc.pendingKycApplications(account.address);
    if (!pendingApp.isEmpty) {
      console.log('⚠️ User already has a pending KYC application');
      return {
        success: false,
        error: 'You already have a pending citizenship application. Please wait for approval.'
      };
    }

    // Check if user is already approved
    const kycStatus = await api.query.identityKyc.kycStatuses(account.address);
    if (kycStatus.toString() === 'Approved') {
      console.log('✅ User KYC is already approved');
      return {
        success: false,
        error: 'Your citizenship application is already approved!'
      };
    }

    // Get the injector for signing
    const injector = await web3FromAddress(account.address);

    // Debug logging
    console.log('=== submitKycApplication Debug ===');
    console.log('account.address:', account.address);
    console.log('name:', name);
    console.log('email:', email);
    console.log('ipfsCid:', ipfsCid);
    console.log('notes:', notes);
    console.log('===================================');

    // Ensure ipfsCid is a string
    const cidString = String(ipfsCid);
    if (!cidString || cidString === 'undefined' || cidString === '[object Object]') {
      return { success: false, error: `Invalid IPFS CID received: ${cidString}` };
    }

    // Step 1: Set identity first
    console.log('Step 1: Setting identity...');
    const identityResult = await new Promise<{ success: boolean; error?: string }>((resolve, reject) => {
      api.tx.identityKyc
        .setIdentity(name, email)
        .signAndSend(account.address, { signer: injector.signer }, ({ status, dispatchError, events }) => {
          console.log('Identity transaction status:', status.type);

          if (status.isInBlock || status.isFinalized) {
            if (dispatchError) {
              let errorMessage = 'Identity transaction failed';
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              } else {
                errorMessage = dispatchError.toString();
              }
              console.error('Identity transaction error:', errorMessage);
              resolve({ success: false, error: errorMessage });
              return;
            }

            // Check for IdentitySet event
            const identitySetEvent = events.find(({ event }) =>
              event.section === 'identityKyc' && event.method === 'IdentitySet'
            );

            if (identitySetEvent) {
              console.log('✅ Identity set successfully');
              resolve({ success: true });
            } else {
              resolve({ success: true }); // Still consider it success if in block
            }
          }
        })
        .catch((error) => {
          console.error('Failed to sign and send identity transaction:', error);
          reject(error);
        });
    });

    if (!identityResult.success) {
      return identityResult;
    }

    // Step 2: Apply for KYC
    console.log('Step 2: Applying for KYC...');
    const result = await new Promise<{ success: boolean; error?: string; blockHash?: string }>((resolve, reject) => {
      api.tx.identityKyc
        .applyForKyc([cidString], notes)
        .signAndSend(account.address, { signer: injector.signer }, ({ status, dispatchError, events }) => {
          console.log('Transaction status:', status.type);

          if (status.isInBlock || status.isFinalized) {
            if (dispatchError) {
              let errorMessage = 'Transaction failed';

              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              } else {
                errorMessage = dispatchError.toString();
              }

              console.error('Transaction error:', errorMessage);
              resolve({ success: false, error: errorMessage });
              return;
            }

            // Check for KycApplied event
            const kycAppliedEvent = events.find(({ event }) =>
              event.section === 'identityKyc' && event.method === 'KycApplied'
            );

            if (kycAppliedEvent) {
              console.log('✅ KYC Application submitted successfully');
              resolve({
                success: true,
                blockHash: status.asInBlock.toString()
              });
            } else {
              console.warn('Transaction included but KycApplied event not found');
              resolve({ success: true });
            }
          }
        })
        .catch((error) => {
          console.error('Failed to sign and send transaction:', error);
          reject(error);
        });
    });

    return result;
  } catch (error: any) {
    console.error('Error submitting KYC application:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit KYC application'
    };
  }
}

/**
 * Subscribe to KYC approval events for an address
 */
export function subscribeToKycApproval(
  api: ApiPromise,
  address: string,
  onApproved: () => void,
  onError?: (error: string) => void
): () => void {
  try {
    if (!api?.query?.system?.events) {
      console.error('Cannot subscribe to events: system.events not available');
      if (onError) onError('Event subscription not available');
      return () => {};
    }

    const unsubscribe = api.query.system.events((events) => {
      events.forEach((record) => {
        const { event } = record;

        if (event.section === 'identityKyc' && event.method === 'KycApproved') {
          const [approvedAddress] = event.data;

          if (approvedAddress.toString() === address) {
            console.log('✅ KYC Approved for:', address);
            onApproved();
          }
        }
      });
    });

    return unsubscribe as unknown as () => void;
  } catch (error: any) {
    console.error('Error subscribing to KYC approval:', error);
    if (onError) onError(error.message || 'Failed to subscribe to approval events');
    return () => {};
  }
}

// ========================================
// FOUNDER ADDRESS
// ========================================

export const FOUNDER_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Satoshi Qazi Muhammed
