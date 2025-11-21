/**
 * Mock Data Generators
 * Based on blockchain pallet test scenarios
 * Generates consistent test data matching on-chain state
 */

export type KYCStatus = 'NotStarted' | 'Pending' | 'Approved' | 'Rejected';
export type CourseStatus = 'Active' | 'Archived';
export type ElectionType = 'Presidential' | 'Parliamentary' | 'ConstitutionalCourt' | 'SpeakerElection';
export type ElectionStatus = 'CandidacyPeriod' | 'CampaignPeriod' | 'VotingPeriod' | 'Finalization';
export type ProposalStatus = 'Pending' | 'Voting' | 'Approved' | 'Rejected' | 'Executed';

// ============================================================================
// 1. IDENTITY & KYC
// ============================================================================

export const generateMockIdentity = (name?: string, email?: string) => ({
  name: name || 'Pezkuwi User',
  email: email || `user${Math.floor(Math.random() * 1000)}@pezkuwi.com`,
});

export const generateMockKYCApplication = (status: KYCStatus = 'Pending') => ({
  cids: ['QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'],
  notes: 'My KYC documents',
  depositAmount: 10_000_000_000_000n, // 10 HEZ
  status,
  appliedAt: Date.now(),
});

export const generateMockCitizenNFT = (id: number = 0) => ({
  nftId: id,
  owner: `5${Math.random().toString(36).substring(2, 15)}`,
  welatiRole: true,
  mintedAt: Date.now(),
});

// ============================================================================
// 2. EDUCATION (PERWERDE)
// ============================================================================

export const generateMockCourse = (status: CourseStatus = 'Active', id?: number) => ({
  courseId: id ?? Math.floor(Math.random() * 1000),
  title: `Course ${id ?? Math.floor(Math.random() * 100)}`,
  description: 'Learn about blockchain technology and Digital Kurdistan',
  contentUrl: 'https://example.com/course',
  status,
  owner: `5${Math.random().toString(36).substring(2, 15)}`,
  createdAt: Date.now(),
});

export const generateMockEnrollment = (courseId: number, completed: boolean = false) => ({
  student: `5${Math.random().toString(36).substring(2, 15)}`,
  courseId,
  enrolledAt: Date.now(),
  completedAt: completed ? Date.now() + 86400000 : null,
  pointsEarned: completed ? Math.floor(Math.random() * 100) : 0,
});

export const generateMockCourseList = (count: number = 5, activeCount: number = 3) => {
  const courses = [];
  for (let i = 0; i < count; i++) {
    courses.push(generateMockCourse(i < activeCount ? 'Active' : 'Archived', i));
  }
  return courses;
};

// ============================================================================
// 3. GOVERNANCE (WELATI) - ELECTIONS
// ============================================================================

export const generateMockElection = (
  type: ElectionType = 'Presidential',
  status: ElectionStatus = 'VotingPeriod'
) => ({
  electionId: Math.floor(Math.random() * 100),
  electionType: type,
  status,
  startBlock: 1,
  endBlock: 777601,
  candidacyPeriodEnd: 86401,
  campaignPeriodEnd: 345601,
  votingPeriodEnd: 777601,
  candidates: generateMockCandidates(type === 'Presidential' ? 2 : 5),
  totalVotes: Math.floor(Math.random() * 10000),
  turnoutPercentage: 45.2,
  requiredTurnout: type === 'Presidential' ? 50 : 40,
});

export const generateMockCandidate = (electionType: ElectionType) => ({
  candidateId: Math.floor(Math.random() * 1000),
  address: `5${Math.random().toString(36).substring(2, 15)}`,
  name: `Candidate ${Math.floor(Math.random() * 100)}`,
  party: electionType === 'Parliamentary' ? ['Green Party', 'Democratic Alliance', 'Independent'][Math.floor(Math.random() * 3)] : undefined,
  endorsements: electionType === 'Presidential' ? 100 + Math.floor(Math.random() * 50) : 50 + Math.floor(Math.random() * 30),
  votes: Math.floor(Math.random() * 5000),
  percentage: Math.random() * 100,
  trustScore: 600 + Math.floor(Math.random() * 200),
});

export const generateMockCandidates = (count: number = 3) => {
  return Array.from({ length: count }, () => generateMockCandidate('Presidential'));
};

// ============================================================================
// 4. GOVERNANCE - PROPOSALS
// ============================================================================

export const generateMockProposal = (status: ProposalStatus = 'Voting') => ({
  proposalId: Math.floor(Math.random() * 1000),
  index: Math.floor(Math.random() * 100),
  proposer: `5${Math.random().toString(36).substring(2, 15)}`,
  title: 'Budget Amendment',
  description: 'Increase education budget by 10%',
  value: '10000000000000000', // 10,000 HEZ
  beneficiary: `5${Math.random().toString(36).substring(2, 15)}`,
  bond: '1000000000000000', // 1,000 HEZ
  ayes: Math.floor(Math.random() * 1000),
  nays: Math.floor(Math.random() * 200),
  status: status === 'Voting' ? 'active' as const : status.toLowerCase() as any,
  endBlock: 1000000,
  priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
  decisionType: 'ParliamentSimpleMajority',
});

// ============================================================================
// 5. P2P TRADING (WELATI)
// ============================================================================

export const generateMockP2POffer = () => ({
  offerId: Math.floor(Math.random() * 1000),
  creator: `5${Math.random().toString(36).substring(2, 15)}`,
  offerType: Math.random() > 0.5 ? 'Buy' as const : 'Sell' as const,
  cryptoAmount: Math.floor(Math.random() * 1000000000000000),
  fiatAmount: Math.floor(Math.random() * 10000),
  fiatCurrency: ['USD', 'EUR', 'TRY'][Math.floor(Math.random() * 3)],
  paymentMethod: 'Bank Transfer',
  minAmount: Math.floor(Math.random() * 1000),
  maxAmount: Math.floor(Math.random() * 5000) + 1000,
  trustLevel: Math.floor(Math.random() * 100),
  active: true,
  createdAt: Date.now(),
});

export const generateMockP2POffers = (count: number = 10) => {
  return Array.from({ length: count }, () => generateMockP2POffer());
};

// ============================================================================
// 6. REFERRAL SYSTEM
// ============================================================================

export const generateMockReferralInfo = (referralCount: number = 0) => {
  // Score tiers from tests
  let score: number;
  if (referralCount <= 10) {
    score = referralCount * 10;
  } else if (referralCount <= 50) {
    score = 100 + (referralCount - 10) * 5;
  } else if (referralCount <= 100) {
    score = 300 + (referralCount - 50) * 4;
  } else {
    score = 500; // capped
  }

  return {
    referrer: `5${Math.random().toString(36).substring(2, 15)}`,
    referralCount,
    referralScore: score,
    pendingReferrals: Array.from({ length: Math.floor(Math.random() * 3) }, () =>
      `5${Math.random().toString(36).substring(2, 15)}`
    ),
    confirmedReferrals: Array.from({ length: referralCount }, () =>
      `5${Math.random().toString(36).substring(2, 15)}`
    ),
  };
};

// ============================================================================
// 7. STAKING & REWARDS
// ============================================================================

export const generateMockStakingScore = (stakeAmount: number = 500) => {
  // Amount tiers from tests
  let baseScore: number;
  const amountInHEZ = stakeAmount / 1_000_000_000_000;

  if (amountInHEZ < 100) baseScore = 0;
  else if (amountInHEZ < 250) baseScore = 20;
  else if (amountInHEZ < 750) baseScore = 30;
  else baseScore = 40;

  // Duration multipliers (mock 3 months = 1.4x)
  const durationMultiplier = 1.4;
  const finalScore = Math.min(baseScore * durationMultiplier, 100); // capped at 100

  return {
    stakeAmount: BigInt(stakeAmount * 1_000_000_000_000),
    baseScore,
    trackingStartBlock: 100,
    currentBlock: 1396100, // 3 months later
    durationBlocks: 1296000, // 3 months
    durationMultiplier,
    finalScore: Math.floor(finalScore),
  };
};

export const generateMockEpochReward = (epochIndex: number = 0) => ({
  epochIndex,
  status: ['Open', 'ClaimPeriod', 'Closed'][Math.floor(Math.random() * 3)] as 'Open' | 'ClaimPeriod' | 'Closed',
  startBlock: epochIndex * 100 + 1,
  endBlock: (epochIndex + 1) * 100,
  totalRewardPool: 1000000000000000000n,
  totalTrustScore: 225,
  participantsCount: 3,
  claimDeadline: (epochIndex + 1) * 100 + 100,
  userTrustScore: 100,
  userReward: 444444444444444444n,
  claimed: false,
});

// ============================================================================
// 8. TREASURY
// ============================================================================

export const generateMockTreasuryState = (period: number = 0) => {
  const baseMonthlyAmount = 50104166666666666666666n;
  const halvingFactor = BigInt(2 ** period);
  const monthlyAmount = baseMonthlyAmount / halvingFactor;

  return {
    currentPeriod: period,
    monthlyAmount,
    totalReleased: 0n,
    nextReleaseMonth: 0,
    incentivePotBalance: 0n,
    governmentPotBalance: 0n,
    periodStartBlock: 1,
    blocksPerMonth: 432000,
    lastReleaseBlock: 0,
  };
};

// ============================================================================
// 9. TIKI (GOVERNANCE ROLES)
// ============================================================================

export const TikiRoles = [
  'Welati', 'Parlementer', 'Serok', 'SerokiMeclise', 'Wezir',
  'Dadger', 'Dozger', 'Axa', 'Mamoste', 'Rewsenbîr'
] as const;

export const TikiRoleScores: Record<string, number> = {
  Axa: 250,
  RêveberêProjeyê: 250,
  Serok: 200,
  ModeratorêCivakê: 200,
  EndameDiwane: 175,
  SerokiMeclise: 150,
  Dadger: 150,
  Dozger: 120,
  Wezir: 100,
  Parlementer: 100,
  Welati: 10,
};

export const generateMockTikiData = (roles: string[] = ['Welati']) => {
  const totalScore = roles.reduce((sum, role) => sum + (TikiRoleScores[role] || 5), 0);

  return {
    citizenNftId: Math.floor(Math.random() * 1000),
    roles,
    roleAssignments: roles.reduce((acc, role) => {
      acc[role] = role === 'Welati' ? 'Automatic' :
                  role === 'Parlementer' || role === 'Serok' ? 'Elected' :
                  role === 'Axa' || role === 'Mamoste' ? 'Earned' :
                  'Appointed';
      return acc;
    }, {} as Record<string, string>),
    totalScore,
    scoreBreakdown: roles.reduce((acc, role) => {
      acc[role] = TikiRoleScores[role] || 5;
      return acc;
    }, {} as Record<string, number>),
  };
};

// ============================================================================
// 10. TRUST SCORE
// ============================================================================

export const generateMockTrustScore = () => {
  const staking = 100;
  const referral = 50;
  const perwerde = 30;
  const tiki = 20;

  // Formula: weighted_sum = (staking × 100) + (referral × 300) + (perwerde × 300) + (tiki × 300)
  // trust_score = staking × weighted_sum / 1000
  const weightedSum = (staking * 100) + (referral * 300) + (perwerde * 300) + (tiki * 300);
  const totalScore = (staking * weightedSum) / 1000;

  return {
    totalScore,
    components: { staking, referral, perwerde, tiki },
    weights: {
      staking: 100,
      referral: 300,
      perwerde: 300,
      tiki: 300,
    },
    lastUpdated: Date.now(),
  };
};

// ============================================================================
// 11. VALIDATOR POOL
// ============================================================================

export const generateMockValidatorPool = () => ({
  poolSize: 15,
  currentEra: 5,
  eraStartBlock: 500,
  eraLength: 100,
  validatorSet: {
    stakeValidators: [1, 2, 3],
    parliamentaryValidators: [4, 5],
    meritValidators: [6, 7],
    totalCount: 7,
  },
  userMembership: {
    category: 'StakeValidator' as const,
    metrics: {
      blocksProduced: 90,
      blocksMissed: 10,
      eraPoints: 500,
      reputationScore: 90, // (90 * 100) / (90 + 10)
    },
  },
});

// ============================================================================
// 12. TOKEN WRAPPER
// ============================================================================

export const generateMockWrapperState = () => ({
  hezBalance: 1000000000000000n,
  whezBalance: 500000000000000n,
  totalLocked: 5000000000000000000n,
  wrapAmount: 100000000000000n,
  unwrapAmount: 50000000000000n,
});

// ============================================================================
// 13. PRESALE
// ============================================================================

export const generateMockPresaleState = (active: boolean = true) => ({
  active,
  startBlock: 1,
  endBlock: 101,
  currentBlock: active ? 50 : 101,
  totalRaised: 300000000n, // 300 wUSDT (6 decimals)
  paused: false,
  ratio: 100, // 100 wUSDT = 10,000 PEZ
});

export const generateMockPresaleContribution = (amount: number = 100) => ({
  contributor: `5${Math.random().toString(36).substring(2, 15)}`,
  amount: amount * 1000000n, // wUSDT has 6 decimals
  pezToReceive: BigInt(amount * 100) * 1_000_000_000_000n, // PEZ has 12 decimals
  contributedAt: Date.now(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const formatBalance = (amount: bigint | string, decimals: number = 12): string => {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = 10n ** BigInt(decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  return `${integerPart}.${fractionalStr.slice(0, 4)}`; // Show 4 decimals
};

export const parseAmount = (amount: string, decimals: number = 12): bigint => {
  const [integer, fractional = ''] = amount.split('.');
  const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer + paddedFractional);
};

export const randomAddress = (): string => {
  return `5${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
};

export const randomHash = (): string => {
  return `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
};
