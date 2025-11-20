import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';
import {
  getReferralStats,
  getMyReferrals,
  initiateReferral,
  subscribeToReferralEvents,
  type ReferralStats,
} from '@pezkuwi/lib/referral';

interface ReferralContextValue {
  stats: ReferralStats | null;
  myReferrals: string[];
  loading: boolean;
  inviteUser: (referredAddress: string) => Promise<boolean>;
  refreshStats: () => Promise<void>;
}

const ReferralContext = createContext<ReferralContextValue | undefined>(undefined);

export function ReferralProvider({ children }: { children: ReactNode }) {
  const { api, isApiReady } = usePolkadot();
  const { account } = useWallet();
  const { toast } = useToast();

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [myReferrals, setMyReferrals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch referral statistics
  const fetchStats = useCallback(async () => {
    if (!api || !isApiReady || !account) {
      setStats(null);
      setMyReferrals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [fetchedStats, fetchedReferrals] = await Promise.all([
        getReferralStats(api, account),
        getMyReferrals(api, account),
      ]);

      setStats(fetchedStats);
      setMyReferrals(fetchedReferrals);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching referral stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referral statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [api, isApiReady, account, toast]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Subscribe to referral events for real-time updates
  useEffect(() => {
    if (!api || !isApiReady || !account) return;

    let unsub: (() => void) | undefined;

    subscribeToReferralEvents(api, (event) => {
      // If this user is involved in the event, refresh stats
      if (event.referrer === account || event.referred === account) {
        if (event.type === 'initiated') {
          toast({
            title: 'Referral Sent',
            description: `Invitation sent to ${event.referred.slice(0, 8)}...`,
          });
        } else if (event.type === 'confirmed') {
          toast({
            title: 'Referral Confirmed!',
            description: `Your referral completed KYC. Total: ${event.count}`,
            variant: 'default',
          });
        }
        fetchStats();
      }
    }).then((unsubFn) => {
      unsub = unsubFn;
    });

    return () => {
      if (unsub) unsub();
    };
  }, [api, isApiReady, account, toast, fetchStats]);

  // Invite a new user
  const inviteUser = async (referredAddress: string): Promise<boolean> => {
    if (!api || !account) {
      toast({
        title: 'Error',
        description: 'Wallet not connected',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Validate address format
      if (!referredAddress || referredAddress.length < 47) {
        toast({
          title: 'Invalid Address',
          description: 'Please enter a valid Polkadot address',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sending Invitation',
        description: 'Please sign the transaction...',
      });

      await initiateReferral(api, { address: account, meta: { source: 'polkadot-js' } } as Record<string, unknown>, referredAddress);

      toast({
        title: 'Success!',
        description: 'Referral invitation sent successfully',
      });

      // Refresh stats after successful invitation
      await fetchStats();
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error inviting user:', error);

      let errorMessage = 'Failed to send referral invitation';
      if (error.message) {
        if (error.message.includes('SelfReferral')) {
          errorMessage = 'You cannot refer yourself';
        } else if (error.message.includes('AlreadyReferred')) {
          errorMessage = 'This user has already been referred';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const value: ReferralContextValue = {
    stats,
    myReferrals,
    loading,
    inviteUser,
    refreshStats: fetchStats,
  };

  return <ReferralContext.Provider value={value}>{children}</ReferralContext.Provider>;
}

export function useReferral() {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
}
