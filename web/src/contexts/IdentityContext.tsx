import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { 
  IdentityProfile, 
  KYCData, 
  Badge, 
  Role,
  calculateReputationScore,
  generateZKProof,
  DEFAULT_BADGES,
  ROLES
} from '@pezkuwi/lib/identity';

interface IdentityContextType {
  profile: IdentityProfile | null;
  isVerifying: boolean;
  startKYC: (data: KYCData) => Promise<void>;
  updatePrivacySettings: (settings: Record<string, boolean>) => void;
  addBadge: (badge: Badge) => void;
  assignRole: (role: Role) => void;
  refreshReputation: () => void;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { account } = useWallet();
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (account) {
      // Load or create profile for connected wallet
      const storedProfile = localStorage.getItem(`identity_${account}`);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        // Create new profile
        const newProfile: IdentityProfile = {
          address: account,
          verificationLevel: 'none',
          kycStatus: 'none',
          reputationScore: 0,
          badges: [],
          roles: [],
          privacySettings: {
            showRealName: false,
            showEmail: false,
            showCountry: true,
            useZKProof: true
          }
        };
        setProfile(newProfile);
        localStorage.setItem(`identity_${account}`, JSON.stringify(newProfile));
      }
    } else {
      setProfile(null);
    }
  }, [account]);

  const startKYC = async (data: KYCData) => {
    if (!profile) return;
    
    setIsVerifying(true);
    try {
      // Simulate KYC verification process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate ZK proof for privacy
      generateZKProof(data);
      
      const updatedProfile: IdentityProfile = {
        ...profile,
        kycStatus: 'approved',
        verificationLevel: data.documentType ? 'verified' : 'basic',
        verificationDate: new Date(),
        badges: [...profile.badges, ...DEFAULT_BADGES],
        roles: [ROLES.verified_user as Role],
        reputationScore: calculateReputationScore(
          [], 
          data.documentType ? 'verified' : 'basic',
          [...profile.badges, ...DEFAULT_BADGES]
        )
      };
      
      setProfile(updatedProfile);
      localStorage.setItem(`identity_${profile.address}`, JSON.stringify(updatedProfile));
    } catch (error) {
      if (import.meta.env.DEV) console.error('KYC verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const updatePrivacySettings = (settings: Record<string, boolean>) => {
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      privacySettings: { ...profile.privacySettings, ...settings }
    };
    
    setProfile(updatedProfile);
    localStorage.setItem(`identity_${profile.address}`, JSON.stringify(updatedProfile));
  };

  const addBadge = (badge: Badge) => {
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      badges: [...profile.badges, badge]
    };
    
    setProfile(updatedProfile);
    localStorage.setItem(`identity_${profile.address}`, JSON.stringify(updatedProfile));
  };

  const assignRole = (role: Role) => {
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      roles: [...profile.roles, role]
    };
    
    setProfile(updatedProfile);
    localStorage.setItem(`identity_${profile.address}`, JSON.stringify(updatedProfile));
  };

  const refreshReputation = () => {
    if (!profile) return;
    
    const newScore = calculateReputationScore([], profile.verificationLevel, profile.badges);
    const updatedProfile = { ...profile, reputationScore: newScore };
    
    setProfile(updatedProfile);
    localStorage.setItem(`identity_${profile.address}`, JSON.stringify(updatedProfile));
  };

  return (
    <IdentityContext.Provider value={{
      profile,
      isVerifying,
      startKYC,
      updatePrivacySettings,
      addBadge,
      assignRole,
      refreshReputation
    }}>
      {children}
    </IdentityContext.Provider>
  );
}

export const useIdentity = () => {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used within IdentityProvider');
  }
  return context;
};