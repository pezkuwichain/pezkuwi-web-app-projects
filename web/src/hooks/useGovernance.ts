import { useState, useEffect } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';

export interface Proposal {
  id: string;
  proposalIndex: number;
  hash: string;
  proposer: string;
  value: string;
  beneficiary: string;
  bond: string;
  status: 'active' | 'approved' | 'rejected';
  method: string;
  createdAt: number;
}

export interface Referendum {
  id: string;
  index: number;
  hash: string;
  threshold: string;
  delay: number;
  end: number;
  voteCount: number;
  ayeVotes: string;
  nayVotes: string;
  status: 'ongoing' | 'passed' | 'failed';
}

export function useGovernance() {
  const { api, isConnected } = usePolkadot();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [referenda, setReferenda] = useState<Referendum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !isConnected) {
      setLoading(false);
      return;
    }

    const fetchGovernanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Treasury Proposals
        const proposalsData = await api.query.treasury?.proposals?.entries();
        if (proposalsData) {
          const parsedProposals: Proposal[] = proposalsData.map(([key, value]: [unknown, unknown]) => {
            const proposalIndex = key.args[0].toNumber();
            const proposal = value.unwrap();

            return {
              id: `prop-${proposalIndex}`,
              proposalIndex,
              hash: key.toHex(),
              proposer: proposal.proposer.toString(),
              value: proposal.value.toString(),
              beneficiary: proposal.beneficiary.toString(),
              bond: proposal.bond.toString(),
              status: 'active',
              method: 'treasury.approveProposal',
              createdAt: Date.now()
            };
          });
          setProposals(parsedProposals);
        }

        // Fetch Democracy Referenda
        const referendaData = await api.query.democracy?.referendumInfoOf?.entries();
        if (referendaData) {
          const parsedReferenda: Referendum[] = referendaData.map(([key, value]: [unknown, unknown]) => {
            const index = key.args[0].toNumber();
            const info = value.unwrap();

            if (info.isOngoing) {
              const ongoing = info.asOngoing;
              return {
                id: `ref-${index}`,
                index,
                hash: key.toHex(),
                threshold: ongoing.threshold.toString(),
                delay: ongoing.delay.toNumber(),
                end: ongoing.end.toNumber(),
                voteCount: 0,
                ayeVotes: ongoing.tally?.ayes?.toString() || '0',
                nayVotes: ongoing.tally?.nays?.toString() || '0',
                status: 'ongoing' as const
              };
            }

            return null;
          }).filter(Boolean) as Referendum[];

          setReferenda(parsedReferenda);
        }

      } catch (err) {
        if (import.meta.env.DEV) console.error('Error fetching governance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch governance data');
      } finally {
        setLoading(false);
      }
    };

    fetchGovernanceData();

    // Subscribe to updates
    const interval = setInterval(fetchGovernanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [api, isConnected]);

  return {
    proposals,
    referenda,
    loading,
    error
  };
}
