import { useState, useEffect } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import {
  getTreasuryInfo,
  getActiveProposals,
  getTreasuryStats,
  calculateHealthScore,
} from '@pezkuwi/lib/pez-treasury';

export interface TreasuryMetrics {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  pendingProposals: number;
  approvedBudget: number;
  healthScore: number;
}

export interface TreasuryProposal {
  id: string;
  index: number;
  proposer: string;
  beneficiary: string;
  value: string;
  bond: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function useTreasury() {
  const { api, isApiReady } = usePolkadot();
  const [metrics, setMetrics] = useState<TreasuryMetrics>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    pendingProposals: 0,
    approvedBudget: 0,
    healthScore: 0
  });
  const [proposals, setProposals] = useState<TreasuryProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !isApiReady) {
      setLoading(false);
      return;
    }

    const fetchTreasuryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get PezTreasury info
        const [treasuryInfo, activeProposals, stats] = await Promise.all([
          getTreasuryInfo(api),
          getActiveProposals(api),
          getTreasuryStats(api),
        ]);

        // Convert to number format for UI
        const totalBalance = parseFloat(treasuryInfo.totalBalance.replace(/,/g, ''));
        const totalAllocated = parseFloat(treasuryInfo.totalAllocated.replace(/,/g, ''));
        const totalDistributed = parseFloat(stats.totalDistributed.replace(/,/g, ''));

        // Calculate health score
        const healthScore = calculateHealthScore(
          treasuryInfo.totalBalance,
          treasuryInfo.totalAllocated
        );

        // Convert proposals to UI format
        const proposalsList: TreasuryProposal[] = activeProposals.map((p) => ({
          id: `pez-treasury-${p.proposalId}`,
          index: p.proposalId,
          proposer: p.proposer,
          beneficiary: p.beneficiary,
          value: p.amount,
          bond: '0', // PezTreasury might not have bonds
          status: p.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
        }));

        setMetrics({
          totalBalance,
          monthlyIncome: 0, // Could be calculated from historical data
          monthlyExpenses: totalDistributed / 12, // Rough estimate
          pendingProposals: treasuryInfo.activeProposals,
          approvedBudget: totalAllocated,
          healthScore,
        });

        setProposals(proposalsList);

      } catch (err) {
        console.error('Error fetching PezTreasury data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch treasury data');
      } finally {
        setLoading(false);
      }
    };

    fetchTreasuryData();

    // Subscribe to updates
    const interval = setInterval(fetchTreasuryData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [api, isApiReady]);

  return {
    metrics,
    proposals,
    loading,
    error
  };
}
