/**
 * Welati (Elections & Governance) Pallet Integration
 *
 * This module provides helper functions for interacting with the Welati pallet,
 * which handles:
 * - Presidential and Parliamentary Elections
 * - Speaker and Constitutional Court Elections
 * - Official Appointments (Ministers, Diwan)
 * - Collective Proposals (Parliament/Diwan voting)
 */

import type { ApiPromise } from '@polkadot/api';
import type { Option, Vec } from '@polkadot/types';
import type { AccountId, BlockNumber } from '@polkadot/types/interfaces';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ElectionType = 'Presidential' | 'Parliamentary' | 'SpeakerElection' | 'ConstitutionalCourt';

export type ElectionStatus = 'CandidacyPeriod' | 'CampaignPeriod' | 'VotingPeriod' | 'Completed';

export type VoteChoice = 'Aye' | 'Nay' | 'Abstain';

export type CollectiveDecisionType =
  | 'ParliamentSimpleMajority'
  | 'ParliamentSuperMajority'
  | 'ParliamentAbsoluteMajority'
  | 'ConstitutionalReview'
  | 'ConstitutionalUnanimous'
  | 'ExecutiveDecision';

export type ProposalPriority = 'Urgent' | 'High' | 'Normal' | 'Low';

export type ProposalStatus = 'Active' | 'Approved' | 'Rejected' | 'Expired' | 'Executed';

export type MinisterRole =
  | 'WezireDarayiye'    // Finance
  | 'WezireParez'       // Defense
  | 'WezireDad'         // Justice
  | 'WezireBelaw'       // Education
  | 'WezireTend'        // Health
  | 'WezireAva'         // Water Resources
  | 'WezireCand';       // Culture

export type GovernmentPosition = 'Serok' | 'SerokWeziran' | 'MeclisBaskanı';

export interface ElectionInfo {
  electionId: number;
  electionType: ElectionType;
  status: ElectionStatus;
  startBlock: number;
  candidacyEndBlock: number;
  campaignEndBlock: number;
  votingEndBlock: number;
  totalCandidates: number;
  totalVotes: number;
  turnoutPercentage: number;
  districtCount?: number;
}

export interface CandidateInfo {
  account: string;
  districtId?: number;
  registeredAt: number;
  endorsersCount: number;
  voteCount: number;
  depositPaid: string;
}

export interface ElectionResult {
  electionId: number;
  winners: string[];
  totalVotes: number;
  turnoutPercentage: number;
  finalizedAt: number;
  runoffRequired: boolean;
}

export interface ParliamentMember {
  account: string;
  electedAt: number;
  termEndsAt: number;
  votesParticipated: number;
  totalVotesEligible: number;
  participationRate: number;
  committees: string[];
}

export interface CollectiveProposal {
  proposalId: number;
  proposer: string;
  title: string;
  description: string;
  proposedAt: number;
  votingStartsAt: number;
  expiresAt: number;
  decisionType: CollectiveDecisionType;
  status: ProposalStatus;
  ayeVotes: number;
  nayVotes: number;
  abstainVotes: number;
  threshold: number;
  votesCast: number;
  priority: ProposalPriority;
}

export interface AppointmentProcess {
  processId: number;
  nominee: string;
  role: string;
  nominator: string;
  justification: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: number;
  deadline: number;
}

export interface GovernanceMetrics {
  totalElectionsHeld: number;
  activeElections: number;
  parliamentSize: number;
  diwanSize: number;
  activeProposals: number;
  totalProposalsSubmitted: number;
  averageTurnout: number;
}

// ============================================================================
// QUERY FUNCTIONS (Read-only)
// ============================================================================

/**
 * Get current government officials
 */
export async function getCurrentOfficials(api: ApiPromise): Promise<{
  serok?: string;
  serokWeziran?: string;
  meclisBaskanı?: string;
}> {
  const [serok, serokWeziran, speaker] = await Promise.all([
    api.query.welati.currentOfficials('Serok'),
    api.query.welati.currentOfficials('SerokWeziran'),
    api.query.welati.currentOfficials('MeclisBaskanı'),
  ]);

  return {
    serok: serok.isSome ? serok.unwrap().toString() : undefined,
    serokWeziran: serokWeziran.isSome ? serokWeziran.unwrap().toString() : undefined,
    meclisBaskanı: speaker.isSome ? speaker.unwrap().toString() : undefined,
  };
}

/**
 * Get current cabinet ministers
 */
export async function getCurrentMinisters(api: ApiPromise): Promise<Record<MinisterRole, string | undefined>> {
  const roles: MinisterRole[] = [
    'WezireDarayiye',
    'WezireParez',
    'WezireDad',
    'WezireBelaw',
    'WezireTend',
    'WezireAva',
    'WezireCand',
  ];

  const ministers = await Promise.all(
    roles.map(role => api.query.welati.currentMinisters(role))
  );

  const result: Record<string, string | undefined> = {};
  roles.forEach((role, index) => {
    result[role] = ministers[index].isSome ? ministers[index].unwrap().toString() : undefined;
  });

  return result as Record<MinisterRole, string | undefined>;
}

/**
 * Get parliament members list
 */
export async function getParliamentMembers(api: ApiPromise): Promise<ParliamentMember[]> {
  const members = await api.query.welati.parliamentMembers();

  if (!members || members.isEmpty) {
    return [];
  }

  const memberList: ParliamentMember[] = [];
  const accountIds = members.toJSON() as string[];

  for (const accountId of accountIds) {
    // In a real implementation, fetch detailed member info
    // For now, return basic structure
    memberList.push({
      account: accountId,
      electedAt: 0,
      termEndsAt: 0,
      votesParticipated: 0,
      totalVotesEligible: 0,
      participationRate: 0,
      committees: [],
    });
  }

  return memberList;
}

/**
 * Get Diwan (Constitutional Court) members
 */
export async function getDiwanMembers(api: ApiPromise): Promise<string[]> {
  const members = await api.query.welati.diwanMembers();

  if (!members || members.isEmpty) {
    return [];
  }

  return (members.toJSON() as string[]) || [];
}

/**
 * Get active elections
 */
export async function getActiveElections(api: ApiPromise): Promise<ElectionInfo[]> {
  const nextId = await api.query.welati.nextElectionId();
  const currentId = (nextId.toJSON() as number) || 0;

  const elections: ElectionInfo[] = [];

  // Query last 10 elections
  for (let i = Math.max(0, currentId - 10); i < currentId; i++) {
    const election = await api.query.welati.activeElections(i);

    if (election.isSome) {
      const data = election.unwrap().toJSON() as any;

      elections.push({
        electionId: i,
        electionType: data.electionType as ElectionType,
        status: data.status as ElectionStatus,
        startBlock: data.startBlock,
        candidacyEndBlock: data.candidacyEndBlock,
        campaignEndBlock: data.campaignEndBlock,
        votingEndBlock: data.votingEndBlock,
        totalCandidates: data.totalCandidates || 0,
        totalVotes: data.totalVotes || 0,
        turnoutPercentage: data.turnoutPercentage || 0,
        districtCount: data.districtCount,
      });
    }
  }

  return elections.filter(e => e.status !== 'Completed');
}

/**
 * Get election by ID
 */
export async function getElectionById(api: ApiPromise, electionId: number): Promise<ElectionInfo | null> {
  const election = await api.query.welati.activeElections(electionId);

  if (election.isNone) {
    return null;
  }

  const data = election.unwrap().toJSON() as any;

  return {
    electionId,
    electionType: data.electionType as ElectionType,
    status: data.status as ElectionStatus,
    startBlock: data.startBlock,
    candidacyEndBlock: data.candidacyEndBlock,
    campaignEndBlock: data.campaignEndBlock,
    votingEndBlock: data.votingEndBlock,
    totalCandidates: data.totalCandidates || 0,
    totalVotes: data.totalVotes || 0,
    turnoutPercentage: data.turnoutPercentage || 0,
    districtCount: data.districtCount,
  };
}

/**
 * Get candidates for an election
 */
export async function getElectionCandidates(
  api: ApiPromise,
  electionId: number
): Promise<CandidateInfo[]> {
  const entries = await api.query.welati.electionCandidates.entries(electionId);

  const candidates: CandidateInfo[] = [];

  for (const [key, value] of entries) {
    const data = value.toJSON() as any;
    const account = (key.args[1] as AccountId).toString();

    candidates.push({
      account,
      districtId: data.districtId,
      registeredAt: data.registeredAt,
      endorsersCount: data.endorsers?.length || 0,
      voteCount: data.voteCount || 0,
      depositPaid: data.depositPaid?.toString() || '0',
    });
  }

  return candidates.sort((a, b) => b.voteCount - a.voteCount);
}

/**
 * Check if user has voted in an election
 */
export async function hasVoted(
  api: ApiPromise,
  electionId: number,
  voterAddress: string
): Promise<boolean> {
  const vote = await api.query.welati.electionVotes(electionId, voterAddress);
  return vote.isSome;
}

/**
 * Get election results
 */
export async function getElectionResults(
  api: ApiPromise,
  electionId: number
): Promise<ElectionResult | null> {
  const result = await api.query.welati.electionResults(electionId);

  if (result.isNone) {
    return null;
  }

  const data = result.unwrap().toJSON() as any;

  return {
    electionId,
    winners: data.winners || [],
    totalVotes: data.totalVotes || 0,
    turnoutPercentage: data.turnoutPercentage || 0,
    finalizedAt: data.finalizedAt || 0,
    runoffRequired: data.runoffRequired || false,
  };
}

/**
 * Get active proposals
 */
export async function getActiveProposals(api: ApiPromise): Promise<CollectiveProposal[]> {
  const nextId = await api.query.welati.nextProposalId();
  const currentId = (nextId.toJSON() as number) || 0;

  const proposals: CollectiveProposal[] = [];

  // Query last 50 proposals
  for (let i = Math.max(0, currentId - 50); i < currentId; i++) {
    const proposal = await api.query.welati.activeProposals(i);

    if (proposal.isSome) {
      const data = proposal.unwrap().toJSON() as any;

      proposals.push({
        proposalId: i,
        proposer: data.proposer,
        title: data.title,
        description: data.description,
        proposedAt: data.proposedAt,
        votingStartsAt: data.votingStartsAt,
        expiresAt: data.expiresAt,
        decisionType: data.decisionType as CollectiveDecisionType,
        status: data.status as ProposalStatus,
        ayeVotes: data.ayeVotes || 0,
        nayVotes: data.nayVotes || 0,
        abstainVotes: data.abstainVotes || 0,
        threshold: data.threshold || 0,
        votesCast: data.votesCast || 0,
        priority: data.priority as ProposalPriority,
      });
    }
  }

  return proposals.filter(p => p.status === 'Active').reverse();
}

/**
 * Get proposal by ID
 */
export async function getProposalById(
  api: ApiPromise,
  proposalId: number
): Promise<CollectiveProposal | null> {
  const proposal = await api.query.welati.activeProposals(proposalId);

  if (proposal.isNone) {
    return null;
  }

  const data = proposal.unwrap().toJSON() as any;

  return {
    proposalId,
    proposer: data.proposer,
    title: data.title,
    description: data.description,
    proposedAt: data.proposedAt,
    votingStartsAt: data.votingStartsAt,
    expiresAt: data.expiresAt,
    decisionType: data.decisionType as CollectiveDecisionType,
    status: data.status as ProposalStatus,
    ayeVotes: data.ayeVotes || 0,
    nayVotes: data.nayVotes || 0,
    abstainVotes: data.abstainVotes || 0,
    threshold: data.threshold || 0,
    votesCast: data.votesCast || 0,
    priority: data.priority as ProposalPriority,
  };
}

/**
 * Check if user has voted on a proposal
 */
export async function hasVotedOnProposal(
  api: ApiPromise,
  proposalId: number,
  voterAddress: string
): Promise<boolean> {
  const vote = await api.query.welati.collectiveVotes(proposalId, voterAddress);
  return vote.isSome;
}

/**
 * Get user's vote on a proposal
 */
export async function getProposalVote(
  api: ApiPromise,
  proposalId: number,
  voterAddress: string
): Promise<VoteChoice | null> {
  const vote = await api.query.welati.collectiveVotes(proposalId, voterAddress);

  if (vote.isNone) {
    return null;
  }

  const data = vote.unwrap().toJSON() as any;
  return data.vote as VoteChoice;
}

/**
 * Get pending appointments
 */
export async function getPendingAppointments(api: ApiPromise): Promise<AppointmentProcess[]> {
  const nextId = await api.query.welati.nextAppointmentId();
  const currentId = (nextId.toJSON() as number) || 0;

  const appointments: AppointmentProcess[] = [];

  for (let i = Math.max(0, currentId - 20); i < currentId; i++) {
    const appointment = await api.query.welati.appointmentProcesses(i);

    if (appointment.isSome) {
      const data = appointment.unwrap().toJSON() as any;

      if (data.status === 'Pending') {
        appointments.push({
          processId: i,
          nominee: data.nominee,
          role: data.role,
          nominator: data.nominator,
          justification: data.justification,
          status: data.status,
          createdAt: data.createdAt,
          deadline: data.deadline,
        });
      }
    }
  }

  return appointments;
}

/**
 * Get governance statistics
 */
export async function getGovernanceStats(api: ApiPromise): Promise<GovernanceMetrics> {
  const stats = await api.query.welati.governanceStats();

  if (!stats || stats.isEmpty) {
    return {
      totalElectionsHeld: 0,
      activeElections: 0,
      parliamentSize: 0,
      diwanSize: 0,
      activeProposals: 0,
      totalProposalsSubmitted: 0,
      averageTurnout: 0,
    };
  }

  const data = stats.toJSON() as any;

  return {
    totalElectionsHeld: data.totalElectionsHeld || 0,
    activeElections: data.activeElections || 0,
    parliamentSize: data.parliamentSize || 0,
    diwanSize: data.diwanSize || 0,
    activeProposals: data.activeProposals || 0,
    totalProposalsSubmitted: data.totalProposalsSubmitted || 0,
    averageTurnout: data.averageTurnout || 0,
  };
}

/**
 * Get current block number
 */
export async function getCurrentBlock(api: ApiPromise): Promise<number> {
  const header = await api.rpc.chain.getHeader();
  return header.number.toNumber();
}

/**
 * Calculate remaining blocks until deadline
 */
export async function getRemainingBlocks(api: ApiPromise, deadlineBlock: number): Promise<number> {
  const currentBlock = await getCurrentBlock(api);
  return Math.max(0, deadlineBlock - currentBlock);
}

/**
 * Convert blocks to approximate time (6 seconds per block average)
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get election type label
 */
export function getElectionTypeLabel(type: ElectionType): { en: string; kmr: string } {
  const labels = {
    Presidential: { en: 'Presidential Election', kmr: 'Hilbijartina Serokî' },
    Parliamentary: { en: 'Parliamentary Election', kmr: 'Hilbijartina Parlamentoyê' },
    SpeakerElection: { en: 'Speaker Election', kmr: 'Hilbijartina Serokê Parlamentoyê' },
    ConstitutionalCourt: { en: 'Constitutional Court Election', kmr: 'Hilbijartina Dadgeha Destûrî' },
  };

  return labels[type] || { en: type, kmr: type };
}

/**
 * Get election status label
 */
export function getElectionStatusLabel(status: ElectionStatus): { en: string; kmr: string } {
  const labels = {
    CandidacyPeriod: { en: 'Candidate Registration Open', kmr: 'Qeydkirina Berendam Vekirî ye' },
    CampaignPeriod: { en: 'Campaign Period', kmr: 'Dema Kampanyayê' },
    VotingPeriod: { en: 'Voting Open', kmr: 'Dengdan Vekirî ye' },
    Completed: { en: 'Completed', kmr: 'Temam bû' },
  };

  return labels[status] || { en: status, kmr: status };
}

/**
 * Get minister role label
 */
export function getMinisterRoleLabel(role: MinisterRole): { en: string; kmr: string } {
  const labels = {
    WezireDarayiye: { en: 'Minister of Finance', kmr: 'Wezîrê Darayiyê' },
    WezireParez: { en: 'Minister of Defense', kmr: 'Wezîrê Parezê' },
    WezireDad: { en: 'Minister of Justice', kmr: 'Wezîrê Dadê' },
    WezireBelaw: { en: 'Minister of Education', kmr: 'Wezîrê Perwerdeyê' },
    WezireTend: { en: 'Minister of Health', kmr: 'Wezîrê Tendirustiyê' },
    WezireAva: { en: 'Minister of Water Resources', kmr: 'Wezîrê Avê' },
    WezireCand: { en: 'Minister of Culture', kmr: 'Wezîrê Çandî' },
  };

  return labels[role] || { en: role, kmr: role };
}

/**
 * Get proposal decision type threshold
 */
export function getDecisionTypeThreshold(type: CollectiveDecisionType, totalMembers: number): number {
  switch (type) {
    case 'ParliamentSimpleMajority':
      return Math.floor(totalMembers / 2) + 1; // > 50%
    case 'ParliamentSuperMajority':
    case 'ConstitutionalReview':
      return Math.ceil((totalMembers * 2) / 3); // > 66.67%
    case 'ParliamentAbsoluteMajority':
      return Math.ceil((totalMembers * 3) / 4); // > 75%
    case 'ConstitutionalUnanimous':
      return totalMembers; // 100%
    default:
      return Math.floor(totalMembers / 2) + 1;
  }
}
