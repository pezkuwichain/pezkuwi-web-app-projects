// ========================================
// Error Handler & User-Friendly Messages
// ========================================
// Convert blockchain errors to human-readable messages

import type { ApiPromise } from '@polkadot/api';
import type { DispatchError } from '@polkadot/types/interfaces';

// ========================================
// ERROR MESSAGE MAPPINGS
// ========================================

interface ErrorMessage {
  en: string;
  kmr: string; // Kurmanji
}

/**
 * User-friendly error messages for common blockchain errors
 * Key format: "palletName.errorName"
 */
const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Staking errors
  'staking.InsufficientBond': {
    en: 'Bond amount too small. Please check minimum staking requirement.',
    kmr: 'Mîqdara bond zêde piçûk e. Ji kerema xwe mîqdara kêmtirîn kontrol bike.',
  },
  'staking.AlreadyBonded': {
    en: 'You have already bonded tokens. Use "Bond More" to add additional stake.',
    kmr: 'We berê token bond kirine. Ji bo zêdekirin "Bond More" bikar bîne.',
  },
  'staking.NotStash': {
    en: 'This account is not a stash account. Please use your staking controller.',
    kmr: 'Ev account stash nîne. Ji kerema xwe controller bikar bîne.',
  },
  'staking.NoMoreChunks': {
    en: 'Too many unbonding chunks. Please wait for previous unbondings to complete.',
    kmr: 'Zêde chunk unbonding hene. Ji kerema xwe li çavkaniyên berê bisekine.',
  },

  // Identity KYC errors
  'identityKyc.AlreadyApplied': {
    en: 'You already have a pending citizenship application. Please wait for approval.',
    kmr: 'We berê serlêdana welatîtiyê heye. Ji kerema xwe li pejirandina bisekine.',
  },
  'identityKyc.AlreadyApproved': {
    en: 'Your citizenship application is already approved!',
    kmr: 'Serlêdana welatîtiya we berê hatiye pejirandin!',
  },
  'identityKyc.NotApproved': {
    en: 'Your KYC is not approved yet. Please complete citizenship application first.',
    kmr: 'KYC-ya we hîn nehatiye pejirandin. Pêşî serlêdana welatîtiyê temam bike.',
  },
  'identityKyc.IdentityNotSet': {
    en: 'Please set your identity information first.',
    kmr: 'Ji kerema xwe pêşî agahdariya nasnameya xwe saz bike.',
  },

  // Tiki errors
  'tiki.RoleAlreadyAssigned': {
    en: 'This role is already assigned to the user.',
    kmr: 'Ev rol berê ji bikarhêner re hatiye veqetandin.',
  },
  'tiki.UnauthorizedRoleAssignment': {
    en: 'You do not have permission to assign this role.',
    kmr: 'We destûra veqetandina vê rolê nîne.',
  },
  'tiki.RoleNotFound': {
    en: 'The specified role does not exist.',
    kmr: 'Rola diyarkirî tune ye.',
  },

  // ValidatorPool errors
  'validatorPool.AlreadyInPool': {
    en: 'You are already registered in the validator pool.',
    kmr: 'We berê di pool-a validator de tomar bûyî.',
  },
  'validatorPool.NotInPool': {
    en: 'You are not registered in the validator pool.',
    kmr: 'We di pool-a validator de tomar nebûyî.',
  },
  'validatorPool.InsufficientStake': {
    en: 'Insufficient stake for validator pool. Please increase your stake.',
    kmr: 'Stake ji bo pool-a validator kêm e. Ji kerema xwe stake-ya xwe zêde bike.',
  },

  // DEX/AssetConversion errors
  'assetConversion.PoolNotFound': {
    en: 'Liquidity pool not found for this token pair.',
    kmr: 'Pool-a liquidity ji bo vê cuda-token nehat dîtin.',
  },
  'assetConversion.InsufficientLiquidity': {
    en: 'Insufficient liquidity in pool. Try a smaller amount.',
    kmr: 'Liquidity-ya pool-ê kêm e. Mîqdareke piçûktir biceribîne.',
  },
  'assetConversion.SlippageTooHigh': {
    en: 'Price impact too high. Increase slippage tolerance or reduce amount.',
    kmr: 'Bandora bihayê zêde mezin e. Toleransa slippage zêde bike an mîqdarê kêm bike.',
  },
  'assetConversion.AmountTooSmall': {
    en: 'Swap amount too small. Minimum swap amount not met.',
    kmr: 'Mîqdara swap zêde piçûk e. Mîqdara kêmtirîn nehatiye gihîştin.',
  },

  // Balance/Asset errors
  'balances.InsufficientBalance': {
    en: 'Insufficient balance. You do not have enough tokens for this transaction.',
    kmr: 'Balance-ya we kêm e. Ji bo vê transaction token-ên we têr nînin.',
  },
  'balances.ExistentialDeposit': {
    en: 'Amount is below existential deposit. Account would be reaped.',
    kmr: 'Mîqdar ji existential deposit kêmtir e. Account dê were jêbirin.',
  },
  'assets.BalanceLow': {
    en: 'Asset balance too low for this operation.',
    kmr: 'Balance-ya asset-ê ji bo vê operation zêde kêm e.',
  },
  'assets.NoPermission': {
    en: 'You do not have permission to perform this operation on this asset.',
    kmr: 'We destûra vê operation-ê li ser vê asset-ê nîne.',
  },

  // Governance errors
  'referenda.NotOngoing': {
    en: 'This referendum is not currently active.',
    kmr: 'Ev referendum niha ne çalak e.',
  },
  'referenda.AlreadyVoted': {
    en: 'You have already voted on this referendum.',
    kmr: 'We berê li ser vê referendum-ê deng da.',
  },
  'convictionVoting.NotVoter': {
    en: 'You are not eligible to vote. Citizenship required.',
    kmr: 'We mafê dengdanê nîne. Welatîtî pêwîst e.',
  },

  // Treasury errors
  'treasury.InsufficientProposersBalance': {
    en: 'Insufficient balance to submit treasury proposal. Bond required.',
    kmr: 'Ji bo pêşniyara treasury-yê balance kêm e. Bond pêwîst e.',
  },

  // Welati (Elections & Governance) errors
  'welati.ElectionNotFound': {
    en: 'Election not found. Please check the election ID.',
    kmr: 'Hilbijartin nehat dîtin. Ji kerema xwe ID-ya hilbijartinê kontrol bike.',
  },
  'welati.ElectionNotActive': {
    en: 'This election is not currently active.',
    kmr: 'Ev hilbijartin niha ne çalak e.',
  },
  'welati.CandidacyPeriodExpired': {
    en: 'Candidate registration period has ended.',
    kmr: 'Dema qeydkirina berendaman qediya.',
  },
  'welati.VotingPeriodNotStarted': {
    en: 'Voting period has not started yet. Please wait.',
    kmr: 'Dema dengdanê hîn dest pê nekiriye. Ji kerema xwe bisekine.',
  },
  'welati.VotingPeriodExpired': {
    en: 'Voting period has ended.',
    kmr: 'Dema dengdanê qediya.',
  },
  'welati.AlreadyCandidate': {
    en: 'You are already registered as a candidate in this election.',
    kmr: 'We berê wekî berendam di vê hilbijartinê de tomar bûyî.',
  },
  'welati.AlreadyVoted': {
    en: 'You have already voted in this election.',
    kmr: 'We berê di vê hilbijartinê de deng da.',
  },
  'welati.InsufficientEndorsements': {
    en: 'Insufficient endorsements. You need more citizen supporters.',
    kmr: 'Piştgiriya têr tune. We piştgiriya zêdetir ji welatiyên pêwîst e.',
  },
  'welati.InsufficientTrustScore': {
    en: 'Your trust score is too low for this election. Build your reputation first.',
    kmr: 'Skora emîniya we ji bo vê hilbijartinê zêde kêm e. Pêşî navê xwe baş bike.',
  },
  'welati.NotACitizen': {
    en: 'You must be a verified citizen (KYC approved) to participate.',
    kmr: 'Divê we welatiyeke pejirandî (KYC pejirandî) bin da beşdar bibin.',
  },
  'welati.DepositRequired': {
    en: 'Candidacy deposit required. Please pay the registration fee.',
    kmr: 'Depozîta berendamiyê pêwîst e. Ji kerema xwe lêçûna qeydkirinê bidin.',
  },
  'welati.NotAuthorizedToNominate': {
    en: 'You are not authorized to nominate officials. Minister or President only.',
    kmr: 'We destûra hilbijartina karbidestan nîne. Tenê Wezîr an Serok.',
  },
  'welati.NotAuthorizedToApprove': {
    en: 'Only the President can approve appointments.',
    kmr: 'Tenê Serok dikare bicîhbûnan bipejirîne.',
  },
  'welati.NotAuthorizedToPropose': {
    en: 'You are not authorized to submit proposals. Parliament members only.',
    kmr: 'We destûra pêşniyaran pêşkêş kirinê nîne. Tenê endamên parlamentoyê.',
  },
  'welati.NotAuthorizedToVote': {
    en: 'You are not authorized to vote on this proposal.',
    kmr: 'We destûra dengdanê li ser vê pêşniyarê nîne.',
  },
  'welati.ProposalNotFound': {
    en: 'Proposal not found. Please check the proposal ID.',
    kmr: 'Pêşniyar nehat dîtin. Ji kerema xwe ID-ya pêşniyarê kontrol bike.',
  },
  'welati.ProposalNotActive': {
    en: 'This proposal is not currently active or voting has ended.',
    kmr: 'Ev pêşniyar niha ne çalak e an dengdan qediya.',
  },
  'welati.ProposalAlreadyVoted': {
    en: 'You have already voted on this proposal.',
    kmr: 'We berê li ser vê pêşniyarê deng da.',
  },
  'welati.QuorumNotMet': {
    en: 'Quorum not met. Insufficient participation for this decision.',
    kmr: 'Quorum nehat bidest xistin. Beşdariya têr ji bo vê biryarê tune ye.',
  },
  'welati.InvalidDistrict': {
    en: 'Invalid electoral district. Please select a valid district.',
    kmr: 'Qeza hilbijartinê nederbasdar e. Ji kerema xwe qezayeke derbasdar hilbijêre.',
  },
  'welati.RoleAlreadyFilled': {
    en: 'This government position is already filled.',
    kmr: 'Ev pozîsyona hukûmetê berê hatiye dagirtin.',
  },

  // Perwerde (Education) errors
  'perwerde.CourseNotFound': {
    en: 'Course not found. Please check the course ID.',
    kmr: 'Ders nehat dîtin. Ji kerema xwe ID-ya dersê kontrol bike.',
  },
  'perwerde.AlreadyEnrolled': {
    en: 'You are already enrolled in this course.',
    kmr: 'We berê di vî dersê de tomar bûyî.',
  },
  'perwerde.NotEnrolled': {
    en: 'You must enroll in this course first before completing it.',
    kmr: 'Pêşî divê we di vî dersê de tomar bibin da ku temam bikin.',
  },
  'perwerde.CourseNotActive': {
    en: 'This course is archived and no longer accepting enrollments.',
    kmr: 'Ev ders di arşîvê de ye û êdî tomaran qebûl nake.',
  },
  'perwerde.CourseAlreadyCompleted': {
    en: 'You have already completed this course.',
    kmr: 'We berê ev ders temam kiriye.',
  },
  'perwerde.NotCourseOwner': {
    en: 'Only the course owner can perform this action.',
    kmr: 'Tenê xwediyê dersê dikare vê çalakiyê bike.',
  },
  'perwerde.TooManyCourses': {
    en: 'Course enrollment limit reached. Please complete some courses first.',
    kmr: 'Sînorê tomarkirina dersê gihîşt. Ji kerema xwe pêşî hin dersan temam bikin.',
  },

  // System/General errors
  'system.CallFiltered': {
    en: 'This action is not permitted by the system filters.',
    kmr: 'Ev çalakî ji hêla fîltireyên sîstemê ve nayê destûrdan.',
  },
  'BadOrigin': {
    en: 'Unauthorized: You do not have permission for this action.',
    kmr: 'Destûrnîn: We destûra vê çalakiyê nîne.',
  },
  'Module': {
    en: 'A blockchain module error occurred. Please try again.',
    kmr: 'Xeletiya module-ya blockchain-ê qewimî. Ji kerema xwe dîsa biceribîne.',
  },
};

// ========================================
// ERROR EXTRACTION & FORMATTING
// ========================================

/**
 * Extract error information from DispatchError
 */
export function extractDispatchError(
  api: ApiPromise,
  dispatchError: DispatchError
): {
  section: string;
  name: string;
  docs: string;
  raw: string;
} {
  if (dispatchError.isModule) {
    const decoded = api.registry.findMetaError(dispatchError.asModule);
    return {
      section: decoded.section,
      name: decoded.name,
      docs: decoded.docs.join(' ').trim(),
      raw: `${decoded.section}.${decoded.name}`,
    };
  } else {
    return {
      section: 'Unknown',
      name: dispatchError.type,
      docs: dispatchError.toString(),
      raw: dispatchError.toString(),
    };
  }
}

/**
 * Get user-friendly error message
 * Falls back to blockchain docs if no custom message exists
 */
export function getUserFriendlyError(
  api: ApiPromise,
  dispatchError: DispatchError,
  language: 'en' | 'kmr' = 'en'
): string {
  const errorInfo = extractDispatchError(api, dispatchError);
  const errorKey = errorInfo.raw;

  // Check if we have a custom message
  const customMessage = ERROR_MESSAGES[errorKey];
  if (customMessage) {
    return customMessage[language];
  }

  // Fallback to blockchain documentation
  if (errorInfo.docs && errorInfo.docs.length > 0) {
    return errorInfo.docs;
  }

  // Final fallback
  return `Transaction failed: ${errorInfo.section}.${errorInfo.name}`;
}

// ========================================
// TOAST HELPER
// ========================================

export interface ToastFunction {
  (options: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  }): void;
}

/**
 * Handle blockchain error with toast notification
 * Automatically extracts user-friendly message
 */
export function handleBlockchainError(
  error: any,
  api: ApiPromise | null,
  toast: ToastFunction,
  language: 'en' | 'kmr' = 'en'
): void {
  console.error('Blockchain error:', error);

  // If it's a dispatch error from transaction callback
  if (error?.isModule !== undefined && api) {
    const userMessage = getUserFriendlyError(api, error, language);
    toast({
      title: language === 'en' ? 'Transaction Failed' : 'Transaction Têk Çû',
      description: userMessage,
      variant: 'destructive',
    });
    return;
  }

  // If it's a standard error object
  if (error?.message) {
    toast({
      title: language === 'en' ? 'Error' : 'Xeletî',
      description: error.message,
      variant: 'destructive',
    });
    return;
  }

  // If it's a string
  if (typeof error === 'string') {
    toast({
      title: language === 'en' ? 'Error' : 'Xeletî',
      description: error,
      variant: 'destructive',
    });
    return;
  }

  // Generic fallback
  toast({
    title: language === 'en' ? 'Error' : 'Xeletî',
    description:
      language === 'en'
        ? 'An unexpected error occurred. Please try again.'
        : 'Xeletîyek nediyar qewimî. Ji kerema xwe dîsa biceribîne.',
    variant: 'destructive',
  });
}

// ========================================
// SUCCESS MESSAGES
// ========================================

export interface SuccessMessage {
  en: string;
  kmr: string;
}

export const SUCCESS_MESSAGES: Record<string, SuccessMessage> = {
  // Staking
  'staking.bonded': {
    en: 'Successfully staked {{amount}} HEZ. Rewards will start in the next era.',
    kmr: '{{amount}} HEZ bi serkeftî stake kirin. Xelat di era pêşîn de dest pê dike.',
  },
  'staking.unbonded': {
    en: 'Unbonded {{amount}} HEZ. Withdrawal available in {{days}} days.',
    kmr: '{{amount}} HEZ unbond kirin. Di {{days}} rojan de derbasdarî dibe.',
  },
  'staking.nominated': {
    en: 'Successfully nominated {{count}} validators.',
    kmr: 'Bi serkeftî {{count}} validator nomînekirin.',
  },
  'staking.scoreStarted': {
    en: 'Staking score tracking started! Your score will accumulate over time.',
    kmr: 'Şopa staking dest pê kir! Xala we dê bi demê re kom bibe.',
  },

  // PEZ Rewards
  'pezRewards.claimed': {
    en: 'Successfully claimed {{amount}} PEZ from {{count}} epoch(s)! Rewards added to your balance.',
    kmr: 'Bi serkeftî {{amount}} PEZ ji {{count}} epoch(an) stendin! Xelat hate zêdekirin.',
  },

  // Citizenship
  'citizenship.applied': {
    en: 'Citizenship application submitted successfully! We will review your application.',
    kmr: 'Serlêdana welatîtiyê bi serkeftî hate şandin! Em ê serlêdana we binirxînin.',
  },

  // Governance
  'governance.voted': {
    en: 'Your vote has been recorded successfully!',
    kmr: 'Deng-a we bi serkeftî hate tomarkirin!',
  },
  'governance.proposed': {
    en: 'Proposal submitted successfully! Voting will begin soon.',
    kmr: 'Pêşniyar bi serkeftî hate şandin! Dengdan hêdî dest pê dike.',
  },

  // DEX
  'dex.swapped': {
    en: 'Successfully swapped {{from}} {{fromToken}} for {{to}} {{toToken}}',
    kmr: 'Bi serkeftî {{from}} {{fromToken}} bo {{to}} {{toToken}} guhertin',
  },
  'dex.liquidityAdded': {
    en: 'Successfully added liquidity to the pool!',
    kmr: 'Bi serkeftî liquidity li pool-ê zêde kir!',
  },
  'dex.liquidityRemoved': {
    en: 'Successfully removed liquidity from the pool!',
    kmr: 'Bi serkeftî liquidity ji pool-ê derxist!',
  },

  // Welati (Elections & Governance)
  'welati.candidateRegistered': {
    en: 'Successfully registered as candidate! Deposit: {{deposit}} HEZ. Good luck!',
    kmr: 'Bi serkeftî wekî berendam tomar bûn! Depozît: {{deposit}} HEZ. Serkeftinê!',
  },
  'welati.voteCast': {
    en: 'Your vote has been cast successfully! Thank you for participating.',
    kmr: 'Deng-a we bi serkeftî hate dayîn! Spas ji bo beşdarî bûnê.',
  },
  'welati.proposalSubmitted': {
    en: 'Proposal submitted successfully! Voting period: {{days}} days.',
    kmr: 'Pêşniyar bi serkeftî hate şandin! Dema dengdanê: {{days}} roj.',
  },
  'welati.proposalVoted': {
    en: 'Vote recorded on proposal #{{id}}. Your voice matters!',
    kmr: 'Deng li ser pêşniyara #{{id}} tomar bû. Deng-a we girîng e!',
  },
  'welati.officialNominated': {
    en: 'Official nominated successfully! Awaiting presidential approval.',
    kmr: 'Karbides bi serkeftî hate hilbijartin! Li pejirandina serokê bisekine.',
  },
  'welati.appointmentApproved': {
    en: 'Appointment approved! {{nominee}} is now {{role}}.',
    kmr: 'Bicîhbûn pejirandî! {{nominee}} niha {{role}} ye.',
  },
  'welati.electionFinalized': {
    en: 'Election finalized! {{winners}} elected. Turnout: {{turnout}}%',
    kmr: 'Hilbijartin temam bû! {{winners}} hate hilbijartin. Beşdarî: {{turnout}}%',
  },

  // Perwerde (Education)
  'perwerde.courseCreated': {
    en: 'Course "{{name}}" created successfully! Course ID: #{{id}}',
    kmr: 'Dersa "{{name}}" bi serkeftî hate afirandin! ID-ya Dersê: #{{id}}',
  },
  'perwerde.enrolled': {
    en: 'Successfully enrolled in course! Start learning now.',
    kmr: 'Bi serkeftî di dersê de tomar bûn! Niha dest bi hînbûnê bike.',
  },
  'perwerde.completed': {
    en: 'Congratulations! Course completed. Points earned: {{points}}',
    kmr: 'Pîroz be! Ders temam bû. Xalên bidestxistî: {{points}}',
  },
  'perwerde.archived': {
    en: 'Course archived successfully. No new enrollments will be accepted.',
    kmr: 'Ders bi serkeftî hate arşîvkirin. Tomarên nû nayên qebûlkirin.',
  },
};

/**
 * Handle successful blockchain transaction
 */
export function handleBlockchainSuccess(
  messageKey: string,
  toast: ToastFunction,
  params: Record<string, string | number> = {},
  language: 'en' | 'kmr' = 'en'
): void {
  const template = SUCCESS_MESSAGES[messageKey];

  if (!template) {
    toast({
      title: language === 'en' ? 'Success' : 'Serkeft',
      description: language === 'en' ? 'Transaction successful!' : 'Transaction serkeftî!',
    });
    return;
  }

  // Replace template variables like {{amount}}
  let message = template[language];
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });

  toast({
    title: language === 'en' ? 'Success' : 'Serkeft',
    description: message,
  });
}
