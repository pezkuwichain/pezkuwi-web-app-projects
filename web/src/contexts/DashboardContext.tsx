import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { supabase } from '@/lib/supabase';
import { getAllTikiNFTDetails, generateCitizenNumber, type TikiNFTDetails } from '@pezkuwi/lib/tiki';
import { getKycStatus } from '@pezkuwi/lib/kyc';

interface DashboardData {
  profile: any | null;
  nftDetails: { citizenNFT: TikiNFTDetails | null; roleNFTs: TikiNFTDetails[]; totalNFTs: number };
  kycStatus: string;
  citizenNumber: string;
  loading: boolean;
}

const DashboardContext = createContext<DashboardData | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const [profile, setProfile] = useState<any>(null);
  const [nftDetails, setNftDetails] = useState<{ citizenNFT: TikiNFTDetails | null; roleNFTs: TikiNFTDetails[]; totalNFTs: number }>({
    citizenNFT: null,
    roleNFTs: [],
    totalNFTs: 0
  });
  const [kycStatus, setKycStatus] = useState<string>('NotStarted');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    if (selectedAccount && api && isApiReady) {
      fetchScoresAndTikis();
    }
  }, [user, selectedAccount, api, isApiReady]);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch error (this is normal if Supabase is not configured):', error.message);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.warn('Error fetching profile (this is normal if Supabase is not configured):', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScoresAndTikis = async () => {
    if (!selectedAccount || !api) return;

    setLoading(true);
    try {
      const status = await getKycStatus(api, selectedAccount.address);
      setKycStatus(status);

      const details = await getAllTikiNFTDetails(api, selectedAccount.address);
      setNftDetails(details);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const citizenNumber = nftDetails.citizenNFT
    ? generateCitizenNumber(nftDetails.citizenNFT.owner, nftDetails.citizenNFT.collectionId, nftDetails.citizenNFT.itemId)
    : 'N/A';

  return (
    <DashboardContext.Provider value={{ profile, nftDetails, kycStatus, citizenNumber, loading }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
