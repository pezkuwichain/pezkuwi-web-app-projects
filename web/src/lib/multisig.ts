// ========================================
// Multisig Utilities for USDT Treasury
// ========================================
// Full on-chain multisig using Substrate pallet-multisig

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { Tiki } from './tiki';
import { encodeAddress, sortAddresses } from '@polkadot/util-crypto';

// ========================================
// MULTISIG CONFIGURATION
// ========================================

export interface MultisigMember {
  role: string;
  tiki: Tiki;
  isUnique: boolean;
  address?: string; // For non-unique roles, hardcoded address
}

export const USDT_MULTISIG_CONFIG = {
  threshold: 3,
  members: [
    { role: 'Founder/President', tiki: Tiki.Serok, isUnique: true },
    { role: 'Parliament Speaker', tiki: Tiki.SerokiMeclise, isUnique: true },
    { role: 'Treasurer', tiki: Tiki.Xezinedar, isUnique: true },
    { role: 'Notary', tiki: Tiki.Noter, isUnique: false, address: '' }, // Will be set at runtime
    { role: 'Spokesperson', tiki: Tiki.Berdevk, isUnique: false, address: '' },
  ] as MultisigMember[],
};

// ========================================
// MULTISIG MEMBER QUERIES
// ========================================

/**
 * Get all multisig members from on-chain tiki holders
 * @param api - Polkadot API instance
 * @param specificAddresses - Addresses for non-unique roles {tiki: address}
 * @returns Sorted array of member addresses
 */
export async function getMultisigMembers(
  api: ApiPromise,
  specificAddresses: Record<string, string> = {}
): Promise<string[]> {
  const members: string[] = [];

  for (const memberConfig of USDT_MULTISIG_CONFIG.members) {
    if (memberConfig.isUnique) {
      // Query from chain for unique roles
      try {
        const holder = await api.query.tiki.tikiHolder(memberConfig.tiki);
        if (holder.isSome) {
          const address = holder.unwrap().toString();
          members.push(address);
        } else {
          console.warn(`No holder found for unique role: ${memberConfig.tiki}`);
        }
      } catch (error) {
        console.error(`Error querying ${memberConfig.tiki}:`, error);
      }
    } else {
      // Use hardcoded address for non-unique roles
      const address = specificAddresses[memberConfig.tiki] || memberConfig.address;
      if (address) {
        members.push(address);
      } else {
        console.warn(`No address specified for non-unique role: ${memberConfig.tiki}`);
      }
    }
  }

  // Multisig requires sorted addresses
  return sortAddresses(members);
}

/**
 * Calculate deterministic multisig account address
 * @param members - Sorted array of member addresses
 * @param threshold - Signature threshold (default: 3)
 * @param ss58Format - SS58 format for address encoding (default: 42)
 * @returns Multisig account address
 */
export function calculateMultisigAddress(
  members: string[],
  threshold: number = USDT_MULTISIG_CONFIG.threshold,
  ss58Format: number = 42
): string {
  // Sort members (multisig requires sorted order)
  const sortedMembers = sortAddresses(members);

  // Create multisig address
  // Formula: blake2(b"modlpy/utilisuba" + concat(sorted_members) + threshold)
  const multisigId = encodeAddress(
    new Uint8Array([
      ...Buffer.from('modlpy/utilisuba'),
      ...sortedMembers.flatMap((addr) => Array.from(Buffer.from(addr, 'hex'))),
      threshold,
    ]),
    ss58Format
  );

  return multisigId;
}

/**
 * Check if an address is a multisig member
 * @param api - Polkadot API instance
 * @param address - Address to check
 * @param specificAddresses - Addresses for non-unique roles
 * @returns boolean
 */
export async function isMultisigMember(
  api: ApiPromise,
  address: string,
  specificAddresses: Record<string, string> = {}
): Promise<boolean> {
  const members = await getMultisigMembers(api, specificAddresses);
  return members.includes(address);
}

/**
 * Get multisig member info for display
 * @param api - Polkadot API instance
 * @param specificAddresses - Addresses for non-unique roles
 * @returns Array of member info objects
 */
export async function getMultisigMemberInfo(
  api: ApiPromise,
  specificAddresses: Record<string, string> = {}
): Promise<Array<{ role: string; tiki: Tiki; address: string; isUnique: boolean }>> {
  const memberInfo = [];

  for (const memberConfig of USDT_MULTISIG_CONFIG.members) {
    let address = '';

    if (memberConfig.isUnique) {
      try {
        const holder = await api.query.tiki.tikiHolder(memberConfig.tiki);
        if (holder.isSome) {
          address = holder.unwrap().toString();
        }
      } catch (error) {
        console.error(`Error querying ${memberConfig.tiki}:`, error);
      }
    } else {
      address = specificAddresses[memberConfig.tiki] || memberConfig.address || '';
    }

    if (address) {
      memberInfo.push({
        role: memberConfig.role,
        tiki: memberConfig.tiki,
        address,
        isUnique: memberConfig.isUnique,
      });
    }
  }

  return memberInfo;
}

// ========================================
// MULTISIG TRANSACTION HELPERS
// ========================================

export interface MultisigTimepoint {
  height: number;
  index: number;
}

/**
 * Create a new multisig transaction (first signature)
 * @param api - Polkadot API instance
 * @param call - The extrinsic to execute via multisig
 * @param otherSignatories - Other multisig members (excluding current signer)
 * @param threshold - Signature threshold
 * @returns Multisig transaction
 */
export function createMultisigTx(
  api: ApiPromise,
  call: SubmittableExtrinsic<'promise'>,
  otherSignatories: string[],
  threshold: number = USDT_MULTISIG_CONFIG.threshold
) {
  const maxWeight = {
    refTime: 1000000000,
    proofSize: 64 * 1024,
  };

  return api.tx.multisig.asMulti(
    threshold,
    sortAddresses(otherSignatories),
    null, // No timepoint for first call
    call,
    maxWeight
  );
}

/**
 * Approve an existing multisig transaction
 * @param api - Polkadot API instance
 * @param call - The original extrinsic
 * @param otherSignatories - Other multisig members
 * @param timepoint - Block height and index of the first approval
 * @param threshold - Signature threshold
 * @returns Approval transaction
 */
export function approveMultisigTx(
  api: ApiPromise,
  call: SubmittableExtrinsic<'promise'>,
  otherSignatories: string[],
  timepoint: MultisigTimepoint,
  threshold: number = USDT_MULTISIG_CONFIG.threshold
) {
  const maxWeight = {
    refTime: 1000000000,
    proofSize: 64 * 1024,
  };

  return api.tx.multisig.asMulti(
    threshold,
    sortAddresses(otherSignatories),
    timepoint,
    call,
    maxWeight
  );
}

/**
 * Cancel a multisig transaction
 * @param api - Polkadot API instance
 * @param callHash - Hash of the call to cancel
 * @param otherSignatories - Other multisig members
 * @param timepoint - Block height and index of the call
 * @param threshold - Signature threshold
 * @returns Cancel transaction
 */
export function cancelMultisigTx(
  api: ApiPromise,
  callHash: string,
  otherSignatories: string[],
  timepoint: MultisigTimepoint,
  threshold: number = USDT_MULTISIG_CONFIG.threshold
) {
  return api.tx.multisig.cancelAsMulti(
    threshold,
    sortAddresses(otherSignatories),
    timepoint,
    callHash
  );
}

// ========================================
// MULTISIG STORAGE QUERIES
// ========================================

/**
 * Get pending multisig calls
 * @param api - Polkadot API instance
 * @param multisigAddress - The multisig account address
 * @returns Array of pending calls
 */
export async function getPendingMultisigCalls(
  api: ApiPromise,
  multisigAddress: string
): Promise<any[]> {
  try {
    const multisigs = await api.query.multisig.multisigs.entries(multisigAddress);

    return multisigs.map(([key, value]) => {
      const callHash = key.args[1].toHex();
      const multisigData = value.toJSON() as any;

      return {
        callHash,
        when: multisigData.when,
        deposit: multisigData.deposit,
        depositor: multisigData.depositor,
        approvals: multisigData.approvals,
      };
    });
  } catch (error) {
    console.error('Error fetching pending multisig calls:', error);
    return [];
  }
}

// ========================================
// DISPLAY HELPERS
// ========================================

/**
 * Format multisig address for display
 * @param address - Full multisig address
 * @returns Shortened address
 */
export function formatMultisigAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

/**
 * Get approval status text
 * @param approvals - Number of approvals
 * @param threshold - Required threshold
 * @returns Status text
 */
export function getApprovalStatus(approvals: number, threshold: number): string {
  if (approvals >= threshold) return 'Ready to Execute';
  return `${approvals}/${threshold} Approvals`;
}

/**
 * Get approval status color
 * @param approvals - Number of approvals
 * @param threshold - Required threshold
 * @returns Tailwind color class
 */
export function getApprovalStatusColor(approvals: number, threshold: number): string {
  if (approvals >= threshold) return 'text-green-500';
  if (approvals >= threshold - 1) return 'text-yellow-500';
  return 'text-gray-500';
}
