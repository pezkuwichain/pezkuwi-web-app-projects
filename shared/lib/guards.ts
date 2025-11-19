// ========================================
// Route Guards & Permission Checking
// ========================================
// Functions to check user permissions for protected routes

import type { ApiPromise } from '@polkadot/api';

// ========================================
// CITIZENSHIP STATUS CHECK
// ========================================

/**
 * Check if user has approved citizenship (KYC approved)
 * Required for: Voting, Education, Validator Pool, etc.
 */
export async function checkCitizenStatus(
  api: ApiPromise | null,
  address: string | null | undefined
): Promise<boolean> {
  if (!api || !address) {
    return false;
  }

  try {
    // Check if Identity KYC pallet exists
    if (!api.query?.identityKyc?.kycStatuses) {
      console.warn('Identity KYC pallet not available');
      return false;
    }

    const kycStatus = await api.query.identityKyc.kycStatuses(address);

    if (kycStatus.isEmpty) {
      return false;
    }

    const statusStr = kycStatus.toString();
    return statusStr === 'Approved';
  } catch (error) {
    console.error('Error checking citizen status:', error);
    return false;
  }
}

// ========================================
// VALIDATOR POOL STATUS CHECK
// ========================================

/**
 * Check if user is registered in validator pool
 * Required for: Validator Pool dashboard, validator settings
 */
export async function checkValidatorStatus(
  api: ApiPromise | null,
  address: string | null | undefined
): Promise<boolean> {
  if (!api || !address) {
    return false;
  }

  try {
    // Check if ValidatorPool pallet exists
    if (!api.query?.validatorPool?.poolMembers) {
      console.warn('ValidatorPool pallet not available');
      return false;
    }

    const poolMember = await api.query.validatorPool.poolMembers(address);
    return !poolMember.isEmpty;
  } catch (error) {
    console.error('Error checking validator status:', error);
    return false;
  }
}

// ========================================
// TIKI ROLE CHECK
// ========================================

// Tiki role enum mapping (from pallet-tiki)
// IMPORTANT: Must match /Pezkuwi-SDK/pezkuwi/pallets/tiki/src/lib.rs
const TIKI_ROLES = [
  'Welati',              // 0 - Citizen
  'Parlementer',         // 1 - Parliament Member
  'SerokiMeclise',       // 2 - Speaker of Parliament
  'Serok',               // 3 - President
  'Wezir',               // 4 - Minister
  'EndameDiwane',        // 5 - Dîwan Member (Constitutional Court)
  'Dadger',              // 6 - Judge
  'Dozger',              // 7 - Prosecutor
  'Hiquqnas',            // 8 - Lawyer
  'Noter',               // 9 - Notary
  'Xezinedar',           // 10 - Treasurer
  'Bacgir',              // 11 - Tax Collector
  'GerinendeyeCavkaniye',// 12 - Resource Manager
  'OperatorêTorê',       // 13 - Network Operator
  'PisporêEwlehiyaSîber',// 14 - Cyber Security Expert
  'GerinendeyeDaneye',   // 15 - Data Manager
  'Berdevk',             // 16 - Spokesperson
  'Qeydkar',             // 17 - Registrar
  'Balyoz',              // 18 - Ambassador
  'Navbeynkar',          // 19 - Mediator
  'ParêzvaneÇandî',      // 20 - Cultural Protector
  'Mufetîs',             // 21 - Inspector
  'KalîteKontrolker',    // 22 - Quality Controller
  'Mela',                // 23 - Mullah
  'Feqî',                // 24 - Religious Scholar
  'Perwerdekar',         // 25 - Educator
  'Rewsenbîr',           // 26 - Intellectual
  'RêveberêProjeyê',     // 27 - Project Manager
  'SerokêKomele',        // 28 - Community Leader
  'ModeratorêCivakê',    // 29 - Society Moderator
  'Axa',                 // 30 - Lord/Landowner
  'Pêseng',              // 31 - Pioneer
  'Sêwirmend',           // 32 - Counselor
  'Hekem',               // 33 - Wise Person
  'Mamoste',             // 34 - Teacher
  'Bazargan',            // 35 - Merchant
  'SerokWeziran',        // 36 - Prime Minister
  'WezireDarayiye',      // 37 - Finance Minister
  'WezireParez',         // 38 - Defense Minister
  'WezireDad',           // 39 - Justice Minister
  'WezireBelaw',         // 40 - Publication Minister
  'WezireTend',          // 41 - Health Minister
  'WezireAva',           // 42 - Infrastructure Minister
  'WezireCand',          // 43 - Education Minister
];

/**
 * Check if user has specific Tiki role
 * @param role - Kurdish name of role (e.g., 'Welati', 'Perwerdekar')
 */
export async function checkTikiRole(
  api: ApiPromise | null,
  address: string | null | undefined,
  role: string
): Promise<boolean> {
  if (!api || !address) {
    return false;
  }

  try {
    // Check if Tiki pallet exists
    if (!api.query?.tiki?.userTikis) {
      console.warn('Tiki pallet not available');
      return false;
    }

    const tikis = await api.query.tiki.userTikis(address);

    if (tikis.isEmpty) {
      return false;
    }

    // userTikis returns BoundedVec of Tiki enum indices
    const tikiIndices = tikis.toJSON() as number[];

    // Find role index
    const roleIndex = TIKI_ROLES.indexOf(role);
    if (roleIndex === -1) {
      console.warn(`Unknown Tiki role: ${role}`);
      return false;
    }

    // Check if user has this role
    return tikiIndices.includes(roleIndex);
  } catch (error) {
    console.error('Error checking Tiki role:', error);
    return false;
  }
}

/**
 * Check if user has ANY Tiki role from a list
 * Useful for checking multiple acceptable roles
 */
export async function checkAnyTikiRole(
  api: ApiPromise | null,
  address: string | null | undefined,
  roles: string[]
): Promise<boolean> {
  if (!api || !address) {
    return false;
  }

  try {
    for (const role of roles) {
      const hasRole = await checkTikiRole(api, address, role);
      if (hasRole) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking any Tiki role:', error);
    return false;
  }
}

/**
 * Check if user is an educator (Perwerdekar)
 * Required for: Creating courses in Perwerde
 */
export async function checkEducatorRole(
  api: ApiPromise | null,
  address: string | null | undefined
): Promise<boolean> {
  return checkAnyTikiRole(api, address, [
    'Perwerdekar',      // Educator
    'Mamoste',          // Teacher
    'WezireCand',       // Education Minister
    'Rewsenbîr',        // Intellectual
  ]);
}

/**
 * Check if user can moderate (ModeratorêCivakê or higher)
 * Required for: Forum moderation, governance moderation
 */
export async function checkModeratorRole(
  api: ApiPromise | null,
  address: string | null | undefined
): Promise<boolean> {
  return checkAnyTikiRole(api, address, [
    'ModeratorêCivakê',  // Society Moderator
    'Berdevk',           // Spokesperson
    'Serok',             // President
    'SerokWeziran',      // Prime Minister
  ]);
}

/**
 * Check if user can participate in governance (citizen or higher)
 * Required for: Voting, proposing, elections
 */
export async function checkGovernanceParticipation(
  api: ApiPromise | null,
  address: string | null | undefined
): Promise<boolean> {
  // Any citizen with approved KYC can participate
  return checkCitizenStatus(api, address);
}

/**
 * Check if user can create proposals
 * Required for: Creating referendum proposals
 */
export async function checkProposalCreationRights(
  api: ApiPromise | null,
  address: string | null | undefined
): Promise<boolean> {
  // Citizen + certain roles can create proposals
  const isCitizen = await checkCitizenStatus(api, address);
  if (!isCitizen) {
    return false;
  }

  // Additional check: has any leadership role
  return checkAnyTikiRole(api, address, [
    'Parlementer',       // Parliament Member
    'SerokiMeclise',     // Speaker
    'Serok',             // President
    'SerokWeziran',      // Prime Minister
    'Wezir',             // Minister
    'SerokêKomele',      // Community Leader
    'RêveberêProjeyê',   // Project Manager
  ]);
}

// ========================================
// STAKING SCORE CHECK
// ========================================

/**
 * Check if user has started staking score tracking
 * Required for: Advanced staking features
 */
export async function checkStakingScoreTracking(
  api: ApiPromise | null,
  address: string | null | undefined
): Promise<boolean> {
  if (!api || !address) {
    return false;
  }

  try {
    if (!api.query?.stakingScore?.stakingStartBlock) {
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

// ========================================
// COMBINED PERMISSION CHECKS
// ========================================

export interface UserPermissions {
  isCitizen: boolean;
  isValidator: boolean;
  hasStakingScore: boolean;
  canVote: boolean;
  canCreateProposals: boolean;
  canModerate: boolean;
  canCreateCourses: boolean;
  tikis: string[];
}

/**
 * Get all user permissions at once
 * Useful for dashboard/profile pages
 */
export async function getUserPermissions(
  api: ApiPromise | null,
  address: string | null | undefined
): Promise<UserPermissions> {
  if (!api || !address) {
    return {
      isCitizen: false,
      isValidator: false,
      hasStakingScore: false,
      canVote: false,
      canCreateProposals: false,
      canModerate: false,
      canCreateCourses: false,
      tikis: [],
    };
  }

  try {
    // Fetch all in parallel
    const [
      isCitizen,
      isValidator,
      hasStakingScore,
      canCreateProposals,
      canModerate,
      canCreateCourses,
      tikiData,
    ] = await Promise.all([
      checkCitizenStatus(api, address),
      checkValidatorStatus(api, address),
      checkStakingScoreTracking(api, address),
      checkProposalCreationRights(api, address),
      checkModeratorRole(api, address),
      checkEducatorRole(api, address),
      api.query?.tiki?.userTikis?.(address),
    ]);

    // Parse tikis
    const tikiIndices = tikiData?.isEmpty ? [] : (tikiData?.toJSON() as number[]);
    const tikis = tikiIndices.map((index) => TIKI_ROLES[index] || `Unknown(${index})`);

    return {
      isCitizen,
      isValidator,
      hasStakingScore,
      canVote: isCitizen, // Citizens can vote
      canCreateProposals,
      canModerate,
      canCreateCourses,
      tikis,
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {
      isCitizen: false,
      isValidator: false,
      hasStakingScore: false,
      canVote: false,
      canCreateProposals: false,
      canModerate: false,
      canCreateCourses: false,
      tikis: [],
    };
  }
}
