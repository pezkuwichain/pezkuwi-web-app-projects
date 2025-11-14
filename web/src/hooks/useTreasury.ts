import { useState, useEffect } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';

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
  const { api, isConnected } = usePolkadot();
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
    if (!api || !isConnected) {
      setLoading(false);
      return;
    }

    const fetchTreasuryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get treasury account balance
        const treasuryAccount = await api.query.treasury?.treasury?.();
        let totalBalance = 0;

        if (treasuryAccount) {
          totalBalance = parseInt(treasuryAccount.toString()) / 1e12; // Convert from planck to tokens
        }

        // Fetch all treasury proposals
        const proposalsData = await api.query.treasury?.proposals?.entries();
        const proposalsList: TreasuryProposal[] = [];
        let approvedBudget = 0;
        let pendingCount = 0;

        if (proposalsData) {
          proposalsData.forEach(([key, value]: any) => {
            const index = key.args[0].toNumber();
            const proposal = value.unwrap();
            const valueAmount = parseInt(proposal.value.toString()) / 1e12;

            const proposalItem: TreasuryProposal = {
              id: `treasury-${index}`,
              index,
              proposer: proposal.proposer.toString(),
              beneficiary: proposal.beneficiary.toString(),
              value: proposal.value.toString(),
              bond: proposal.bond.toString(),
              status: 'pending'
            };

            proposalsList.push(proposalItem);
            pendingCount++;
            approvedBudget += valueAmount;
          });
        }

        // Calculate health score (simplified)
        const healthScore = Math.min(100, Math.round((totalBalance / (approvedBudget || 1)) * 100));

        setMetrics({
          totalBalance,
          monthlyIncome: 0, // This would require historical data
          monthlyExpenses: 0, // This would require historical data
          pendingProposals: pendingCount,
          approvedBudget,
          healthScore: isNaN(healthScore) ? 0 : healthScore
        });

        setProposals(proposalsList);

      } catch (err) {
        console.error('Error fetching treasury data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch treasury data');
      } finally {
        setLoading(false);
      }
    };

    fetchTreasuryData();

    // Subscribe to updates
    const interval = setInterval(fetchTreasuryData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [api, isConnected]);

  return {
    metrics,
    proposals,
    loading,
    error
  };
}
