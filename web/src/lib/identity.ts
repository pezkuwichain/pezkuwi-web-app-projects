// Identity verification types and utilities
export interface IdentityProfile {
  address: string;
  verificationLevel: 'none' | 'basic' | 'advanced' | 'verified';
  kycStatus: 'pending' | 'approved' | 'rejected' | 'none';
  reputationScore: number;
  badges: Badge[];
  roles: Role[];
  verificationDate?: Date;
  privacySettings: PrivacySettings;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedDate: Date;
  category: 'governance' | 'contribution' | 'verification' | 'achievement';
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  assignedDate: Date;
  expiryDate?: Date;
}

export interface PrivacySettings {
  showRealName: boolean;
  showEmail: boolean;
  showCountry: boolean;
  useZKProof: boolean;
}

export interface KYCData {
  firstName?: string;
  lastName?: string;
  email?: string;
  country?: string;
  documentType?: 'passport' | 'driver_license' | 'national_id';
  documentHash?: string;
  zkProof?: string;
}

export const VERIFICATION_LEVELS = {
  none: { label: 'Unverified', color: 'gray', minScore: 0 },
  basic: { label: 'Basic', color: 'blue', minScore: 100 },
  advanced: { label: 'Advanced', color: 'purple', minScore: 500 },
  verified: { label: 'Verified', color: 'green', minScore: 1000 }
};

export const DEFAULT_BADGES: Badge[] = [
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during genesis phase',
    icon: '🚀',
    color: 'purple',
    earnedDate: new Date(),
    category: 'achievement'
  },
  {
    id: 'governance_participant',
    name: 'Active Voter',
    description: 'Participated in 10+ proposals',
    icon: '🗳️',
    color: 'blue',
    earnedDate: new Date(),
    category: 'governance'
  }
];

export const ROLES = {
  validator: {
    id: 'validator',
    name: 'Validator',
    permissions: ['validate_blocks', 'propose_blocks', 'vote_proposals']
  },
  council_member: {
    id: 'council_member',
    name: 'Council Member',
    permissions: ['create_proposals', 'fast_track_proposals', 'emergency_actions']
  },
  verified_user: {
    id: 'verified_user',
    name: 'Verified User',
    permissions: ['vote_proposals', 'create_basic_proposals']
  }
};

export function calculateReputationScore(
  activities: any[],
  verificationLevel: string,
  badges: Badge[]
): number {
  let score = 0;
  
  // Base score from verification
  switch (verificationLevel) {
    case 'basic': score += 100; break;
    case 'advanced': score += 500; break;
    case 'verified': score += 1000; break;
  }
  
  // Score from badges
  score += badges.length * 50;
  
  // Score from activities (placeholder)
  score += activities.length * 10;
  
  return Math.min(score, 2000); // Cap at 2000
}

export function generateZKProof(data: KYCData): string {
  // Simplified ZK proof generation (in production, use actual ZK library)
  const hash = btoa(JSON.stringify({
    ...data,
    timestamp: Date.now(),
    nonce: Math.random()
  }));
  return `zk_${hash.substring(0, 32)}`;
}

export function verifyZKProof(proof: string, expectedData?: any): boolean {
  // Simplified verification (in production, use actual ZK verification)
  return proof.startsWith('zk_') && proof.length > 32;
}