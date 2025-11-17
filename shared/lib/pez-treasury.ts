/**
 * PezTreasury Pallet Integration
 *
 * This module provides helper functions for interacting with the PezTreasury pallet,
 * which handles:
 * - PEZ token treasury management
 * - Budget allocation and tracking
 * - Treasury proposals
 * - Fund distribution
 */

import type { ApiPromise } from '@polkadot/api';
import { formatBalance } from './wallet';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ProposalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Executed';

export interface TreasuryInfo {
  totalBalance: string; // Total PEZ in treasury
  totalAllocated: string; // Total PEZ allocated to proposals
  availableBalance: string; // Unallocated PEZ
  proposalCount: number;
  activeProposals: number;
}

export interface TreasuryProposal {
  proposalId: number;
  proposer: string;
  beneficiary: string;
  amount: string; // PEZ amount requested
  description: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  createdAt: number; // Block number
  executedAt?: number; // Block number
}

export interface BudgetAllocation {
  category: string;
  allocated: string;
  spent: string;
  remaining: string;
}

// ============================================================================
// QUERY FUNCTIONS (Read-only)
// ============================================================================

/**
 * Get treasury balance info
 */
export async function getTreasuryInfo(api: ApiPromise): Promise<TreasuryInfo> {
  try {
    // Check if pezTreasury pallet exists
    if (!api.query.pezTreasury) {
      console.warn('PezTreasury pallet not available, using fallback');
      return {
        totalBalance: '0',
        totalAllocated: '0',
        availableBalance: '0',
        proposalCount: 0,
        activeProposals: 0,
      };
    }

    // Get treasury account balance (if pallet stores it)
    let totalBalance = BigInt(0);
    try {
      const balanceResult = await api.query.pezTreasury.treasuryBalance?.();
      if (balanceResult) {
        totalBalance = BigInt(balanceResult.toString());
      }
    } catch (err) {
      console.warn('treasuryBalance query not available');
    }

    // Get proposal count
    let proposalCount = 0;
    let activeProposals = 0;
    let totalAllocated = BigInt(0);

    try {
      const nextIdResult = await api.query.pezTreasury.nextProposalId?.();
      if (nextIdResult) {
        proposalCount = Number(nextIdResult.toString());
      }

      // Count active proposals and calculate total allocated
      for (let i = 0; i < proposalCount; i++) {
        const proposalResult = await api.query.pezTreasury.proposals?.(i);
        if (proposalResult && proposalResult.isSome) {
          const proposal = proposalResult.unwrap().toJSON() as any;
          if (proposal.status === 'Pending' || proposal.status === 'Approved') {
            activeProposals++;
            totalAllocated += BigInt(proposal.amount || '0');
          }
        }
      }
    } catch (err) {
      console.warn('Proposal queries not available:', err);
    }

    const availableBalance = totalBalance - totalAllocated;

    return {
      totalBalance: formatBalance(totalBalance.toString()),
      totalAllocated: formatBalance(totalAllocated.toString()),
      availableBalance: formatBalance(availableBalance.toString()),
      proposalCount,
      activeProposals,
    };
  } catch (error) {
    console.error('Error fetching treasury info:', error);
    return {
      totalBalance: '0',
      totalAllocated: '0',
      availableBalance: '0',
      proposalCount: 0,
      activeProposals: 0,
    };
  }
}

/**
 * Get all treasury proposals
 */
export async function getAllProposals(api: ApiPromise): Promise<TreasuryProposal[]> {
  try {
    if (!api.query.pezTreasury || !api.query.pezTreasury.proposals) {
      console.warn('PezTreasury proposals not available');
      return [];
    }

    const nextIdResult = await api.query.pezTreasury.nextProposalId();
    const proposalCount = Number(nextIdResult.toString());

    const proposals: TreasuryProposal[] = [];

    for (let i = 0; i < proposalCount; i++) {
      const proposalResult = await api.query.pezTreasury.proposals(i);

      if (proposalResult.isSome) {
        const proposalData = proposalResult.unwrap().toJSON() as any;

        proposals.push({
          proposalId: i,
          proposer: proposalData.proposer,
          beneficiary: proposalData.beneficiary,
          amount: formatBalance(proposalData.amount || '0'),
          description: hexToString(proposalData.description || ''),
          status: proposalData.status as ProposalStatus,
          votesFor: proposalData.votesFor || 0,
          votesAgainst: proposalData.votesAgainst || 0,
          createdAt: proposalData.createdAt || 0,
          executedAt: proposalData.executedAt,
        });
      }
    }

    return proposals;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
}

/**
 * Get active (pending/approved) proposals
 */
export async function getActiveProposals(api: ApiPromise): Promise<TreasuryProposal[]> {
  const allProposals = await getAllProposals(api);
  return allProposals.filter((p) => p.status === 'Pending' || p.status === 'Approved');
}

/**
 * Get proposal by ID
 */
export async function getProposal(api: ApiPromise, proposalId: number): Promise<TreasuryProposal | null> {
  try {
    if (!api.query.pezTreasury || !api.query.pezTreasury.proposals) {
      return null;
    }

    const proposalResult = await api.query.pezTreasury.proposals(proposalId);

    if (proposalResult.isNone) {
      return null;
    }

    const proposalData = proposalResult.unwrap().toJSON() as any;

    return {
      proposalId,
      proposer: proposalData.proposer,
      beneficiary: proposalData.beneficiary,
      amount: formatBalance(proposalData.amount || '0'),
      description: hexToString(proposalData.description || ''),
      status: proposalData.status as ProposalStatus,
      votesFor: proposalData.votesFor || 0,
      votesAgainst: proposalData.votesAgainst || 0,
      createdAt: proposalData.createdAt || 0,
      executedAt: proposalData.executedAt,
    };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
}

/**
 * Get treasury statistics
 */
export async function getTreasuryStats(api: ApiPromise): Promise<{
  totalProposals: number;
  approvedProposals: number;
  rejectedProposals: number;
  totalDistributed: string;
  averageProposalAmount: string;
}> {
  try {
    const allProposals = await getAllProposals(api);

    let totalDistributed = BigInt(0);
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const proposal of allProposals) {
      if (proposal.status === 'Executed') {
        totalDistributed += BigInt(proposal.amount.replace(/,/g, ''));
        approvedCount++;
      } else if (proposal.status === 'Rejected') {
        rejectedCount++;
      }
    }

    const avgAmount = approvedCount > 0 ? totalDistributed / BigInt(approvedCount) : BigInt(0);

    return {
      totalProposals: allProposals.length,
      approvedProposals: approvedCount,
      rejectedProposals: rejectedCount,
      totalDistributed: formatBalance(totalDistributed.toString()),
      averageProposalAmount: formatBalance(avgAmount.toString()),
    };
  } catch (error) {
    console.error('Error calculating treasury stats:', error);
    return {
      totalProposals: 0,
      approvedProposals: 0,
      rejectedProposals: 0,
      totalDistributed: '0',
      averageProposalAmount: '0',
    };
  }
}

// ============================================================================
// TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Submit a treasury proposal
 */
export async function submitProposal(
  api: ApiPromise,
  signerAddress: string,
  beneficiary: string,
  amount: string,
  description: string
): Promise<void> {
  if (!api.tx.pezTreasury || !api.tx.pezTreasury.submitProposal) {
    throw new Error('PezTreasury pallet not available');
  }

  const tx = api.tx.pezTreasury.submitProposal(beneficiary, amount, description);

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
 * Vote on a treasury proposal
 */
export async function voteOnProposal(
  api: ApiPromise,
  signerAddress: string,
  proposalId: number,
  approve: boolean
): Promise<void> {
  if (!api.tx.pezTreasury || !api.tx.pezTreasury.voteProposal) {
    throw new Error('PezTreasury pallet not available');
  }

  const tx = api.tx.pezTreasury.voteProposal(proposalId, approve);

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
 * Execute an approved proposal
 */
export async function executeProposal(
  api: ApiPromise,
  signerAddress: string,
  proposalId: number
): Promise<void> {
  if (!api.tx.pezTreasury || !api.tx.pezTreasury.executeProposal) {
    throw new Error('PezTreasury pallet not available');
  }

  const tx = api.tx.pezTreasury.executeProposal(proposalId);

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
 * Convert hex string to UTF-8 string
 */
function hexToString(hex: any): string {
  if (!hex) return '';

  // If it's already a string, return it
  if (typeof hex === 'string' && !hex.startsWith('0x')) {
    return hex;
  }

  // If it's a hex string, convert it
  const hexStr = hex.toString().replace(/^0x/, '');
  let str = '';

  for (let i = 0; i < hexStr.length; i += 2) {
    const code = parseInt(hexStr.substr(i, 2), 16);
    if (code !== 0) {
      // Skip null bytes
      str += String.fromCharCode(code);
    }
  }

  return str.trim();
}

/**
 * Get proposal status label with styling
 */
export function getProposalStatusLabel(status: ProposalStatus): {
  label: string;
  color: string;
  description: string;
} {
  const labels = {
    Pending: {
      label: 'Pending',
      color: 'yellow',
      description: 'Awaiting votes',
    },
    Approved: {
      label: 'Approved',
      color: 'green',
      description: 'Approved for execution',
    },
    Rejected: {
      label: 'Rejected',
      color: 'red',
      description: 'Rejected by votes',
    },
    Executed: {
      label: 'Executed',
      color: 'blue',
      description: 'Funds distributed',
    },
  };

  return labels[status] || { label: status, color: 'gray', description: '' };
}

/**
 * Calculate health score based on treasury metrics
 */
export function calculateHealthScore(totalBalance: string, totalAllocated: string): number {
  const balance = parseFloat(totalBalance.replace(/,/g, ''));
  const allocated = parseFloat(totalAllocated.replace(/,/g, ''));

  if (balance === 0) return 0;
  if (allocated === 0) return 100;

  // Health score based on available/total ratio
  const availableRatio = ((balance - allocated) / balance) * 100;

  if (availableRatio >= 70) return 100;
  if (availableRatio >= 50) return 80;
  if (availableRatio >= 30) return 60;
  if (availableRatio >= 10) return 40;
  return 20;
}
