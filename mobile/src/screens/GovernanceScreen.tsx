import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { usePolkadot } from '../contexts/PolkadotContext';
import { AppColors, KurdistanColors } from '../theme/colors';
import {
  Card,
  Button,
  BottomSheet,
  Badge,
  CardSkeleton,
} from '../components';

interface Proposal {
  index: number;
  proposer: string;
  description: string;
  value: string;
  beneficiary: string;
  bond: string;
  ayes: number;
  nays: number;
  status: 'active' | 'approved' | 'rejected';
  endBlock: number;
}

interface Election {
  id: number;
  type: 'Presidential' | 'Parliamentary' | 'Constitutional Court';
  status: 'Registration' | 'Campaign' | 'Voting' | 'Completed';
  candidates: Candidate[];
  totalVotes: number;
  endBlock: number;
  currentBlock: number;
}

interface Candidate {
  id: string;
  name: string;
  votes: number;
  percentage: number;
  party?: string;
  trustScore: number;
}

type TabType = 'proposals' | 'elections' | 'parliament';

/**
 * Governance Screen
 * View proposals, vote, participate in governance
 * Inspired by Polkadot governance and modern DAO interfaces
 */
export default function GovernanceScreen() {
  const { api, selectedAccount, isApiReady } = usePolkadot();
  const [activeTab, setActiveTab] = useState<TabType>('proposals');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [voteSheetVisible, setVoteSheetVisible] = useState(false);
  const [electionSheetVisible, setElectionSheetVisible] = useState(false);
  const [voting, setVoting] = useState(false);
  const [votedCandidates, setVotedCandidates] = useState<string[]>([]);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);

      if (!api) return;

      // Fetch democracy proposals
      const proposalEntries = await api.query.democracy?.publicProps();

      if (!proposalEntries || proposalEntries.isEmpty) {
        setProposals([]);
        return;
      }

      const proposalsList: Proposal[] = [];

      // Parse proposals
      const publicProps = proposalEntries.toJSON() as unknown[];

      for (const [index, _proposal, proposer] of publicProps as Array<[unknown, unknown, unknown]>) {
        // For demo, create sample proposals
        // In production, decode actual proposal data
        proposalsList.push({
          index: index as number,
          proposer: proposer as string,
          description: `Proposal #${index}: Infrastructure Development`,
          value: '10000',
          beneficiary: '5GrwvaEF...',
          bond: '1000',
          ayes: Math.floor(Math.random() * 1000),
          nays: Math.floor(Math.random() * 200),
          status: 'active',
          endBlock: 1000000,
        });
      }

      setProposals(proposalsList);
    } catch (error) {
      if (__DEV__) console.error('Error fetching proposals:', error);
      Alert.alert('Error', 'Failed to load proposals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  const fetchElections = useCallback(async () => {
    try {
      // Mock elections data
      // In production, this would fetch from pallet-tiki or election pallet
      const mockElections: Election[] = [
        {
          id: 1,
          type: 'Presidential',
          status: 'Voting',
          totalVotes: 45678,
          endBlock: 1000000,
          currentBlock: 995000,
          candidates: [
            { id: '1', name: 'Candidate A', votes: 23456, percentage: 51.3, trustScore: 850 },
            { id: '2', name: 'Candidate B', votes: 22222, percentage: 48.7, trustScore: 780 }
          ]
        },
        {
          id: 2,
          type: 'Parliamentary',
          status: 'Campaign',
          totalVotes: 12340,
          endBlock: 1200000,
          currentBlock: 995000,
          candidates: [
            { id: '3', name: 'Candidate C', votes: 5678, percentage: 46.0, party: 'Green Party', trustScore: 720 },
            { id: '4', name: 'Candidate D', votes: 4567, percentage: 37.0, party: 'Democratic Alliance', trustScore: 690 },
            { id: '5', name: 'Candidate E', votes: 2095, percentage: 17.0, party: 'Independent', trustScore: 650 }
          ]
        }
      ];
      setElections(mockElections);
    } catch (error) {
      if (__DEV__) console.error('Error fetching elections:', error);
    }
  }, []);

  useEffect(() => {
    if (isApiReady && selectedAccount) {
      void fetchProposals();
      void fetchElections();
    }
  }, [isApiReady, selectedAccount, fetchProposals, fetchElections]);

  const handleVote = async (approve: boolean) => {
    if (!selectedProposal) return;

    try {
      setVoting(true);

      if (!api || !selectedAccount) return;

      // Vote on proposal (referendum)
      const tx = approve
        ? api.tx.democracy.vote(selectedProposal.index, { Standard: { vote: { aye: true, conviction: 'None' }, balance: '1000000000000' } })
        : api.tx.democracy.vote(selectedProposal.index, { Standard: { vote: { aye: false, conviction: 'None' }, balance: '1000000000000' } });

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock) {
          Alert.alert(
            'Success',
            `Vote ${approve ? 'FOR' : 'AGAINST'} recorded successfully!`
          );
          setVoteSheetVisible(false);
          setSelectedProposal(null);
          fetchProposals();
        }
      });
    } catch (error: unknown) {
      if (__DEV__) console.error('Voting error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const handleElectionVote = (candidateId: string) => {
    if (!selectedElection) return;

    if (selectedElection.type === 'Parliamentary') {
      // Multiple selection for Parliamentary
      setVotedCandidates(prev =>
        prev.includes(candidateId)
          ? prev.filter(id => id !== candidateId)
          : [...prev, candidateId]
      );
    } else {
      // Single selection for Presidential
      setVotedCandidates([candidateId]);
    }
  };

  const submitElectionVote = async () => {
    if (votedCandidates.length === 0) {
      Alert.alert('Error', 'Please select at least one candidate');
      return;
    }

    if (!api || !selectedAccount || !selectedElection) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    try {
      setVoting(true);

      // Submit vote to blockchain via pallet-welati
      // For single vote (Presidential): api.tx.welati.voteInElection(electionId, candidateId)
      // For multiple votes (Parliamentary): submit each vote separately
      const electionId = selectedElection.id;

      if (selectedElection.type === 'Parliamentary') {
        // Submit multiple votes for parliamentary elections
        const txs = votedCandidates.map(candidateId =>
          api.tx.welati.voteInElection(electionId, candidateId)
        );

        // Batch all votes together
        const batchTx = api.tx.utility.batch(txs);

        await batchTx.signAndSend(selectedAccount.address, ({ status, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              throw new Error(`${decoded.section}.${decoded.name}: ${decoded.docs}`);
            } else {
              throw new Error(dispatchError.toString());
            }
          }

          if (status.isInBlock) {
            Alert.alert('Success', `Your ${votedCandidates.length} votes have been recorded!`);
            setElectionSheetVisible(false);
            setSelectedElection(null);
            setVotedCandidates([]);
            fetchElections();
          }
        });
      } else {
        // Single vote for presidential/other elections
        const candidateId = votedCandidates[0];
        const tx = api.tx.welati.voteInElection(electionId, candidateId);

        await tx.signAndSend(selectedAccount.address, ({ status, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              throw new Error(`${decoded.section}.${decoded.name}: ${decoded.docs}`);
            } else {
              throw new Error(dispatchError.toString());
            }
          }

          if (status.isInBlock) {
            Alert.alert('Success', 'Your vote has been recorded!');
            setElectionSheetVisible(false);
            setSelectedElection(null);
            setVotedCandidates([]);
            fetchElections();
          }
        });
      }
    } catch (error: unknown) {
      if (__DEV__) console.error('Election voting error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading && proposals.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Governance</Text>
        <Text style={styles.headerSubtitle}>
          Participate in digital democracy
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'proposals' && styles.activeTab]}
          onPress={() => setActiveTab('proposals')}
        >
          <Text style={[styles.tabText, activeTab === 'proposals' && styles.activeTabText]}>
            Proposals ({proposals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'elections' && styles.activeTab]}
          onPress={() => setActiveTab('elections')}
        >
          <Text style={[styles.tabText, activeTab === 'elections' && styles.activeTabText]}>
            Elections ({elections.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'parliament' && styles.activeTab]}
          onPress={() => setActiveTab('parliament')}
        >
          <Text style={[styles.tabText, activeTab === 'parliament' && styles.activeTabText]}>
            Parliament
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProposals();
              fetchElections();
            }}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{proposals.length}</Text>
            <Text style={styles.statLabel}>Active Proposals</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{elections.length}</Text>
            <Text style={styles.statLabel}>Active Elections</Text>
          </Card>
        </View>

        {/* Tab Content */}
        {activeTab === 'proposals' && (
          <>
            <Text style={styles.sectionTitle}>Active Proposals</Text>
            {proposals.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No active proposals</Text>
                <Text style={styles.emptySubtext}>
                  Check back later for new governance proposals
                </Text>
              </Card>
            ) : (
              proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.index}
                  proposal={proposal}
                  onPress={() => {
                    setSelectedProposal(proposal);
                    setVoteSheetVisible(true);
                  }}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'elections' && (
          <>
            <Text style={styles.sectionTitle}>Active Elections</Text>
            {elections.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No active elections</Text>
                <Text style={styles.emptySubtext}>
                  Check back later for upcoming elections
                </Text>
              </Card>
            ) : (
              elections.map((election) => (
                <ElectionCard
                  key={election.id}
                  election={election}
                  onPress={() => {
                    setSelectedElection(election);
                    setVotedCandidates([]);
                    setElectionSheetVisible(true);
                  }}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'parliament' && (
          <>
            <Text style={styles.sectionTitle}>Parliament Status</Text>
            <Card style={styles.parliamentCard}>
              <View style={styles.parliamentRow}>
                <Text style={styles.parliamentLabel}>Active Members</Text>
                <Text style={styles.parliamentValue}>0 / 27</Text>
              </View>
              <View style={styles.parliamentRow}>
                <Text style={styles.parliamentLabel}>Current Session</Text>
                <Badge label="In Session" variant="success" size="small" />
              </View>
              <View style={styles.parliamentRow}>
                <Text style={styles.parliamentLabel}>Pending Votes</Text>
                <Text style={styles.parliamentValue}>5</Text>
              </View>
            </Card>

            <Text style={styles.sectionTitle}>Dîwan (Constitutional Court)</Text>
            <Card style={styles.parliamentCard}>
              <View style={styles.parliamentRow}>
                <Text style={styles.parliamentLabel}>Active Judges</Text>
                <Text style={styles.parliamentValue}>0 / 9</Text>
              </View>
              <View style={styles.parliamentRow}>
                <Text style={styles.parliamentLabel}>Pending Reviews</Text>
                <Text style={styles.parliamentValue}>3</Text>
              </View>
              <View style={styles.parliamentRow}>
                <Text style={styles.parliamentLabel}>Recent Decisions</Text>
                <Text style={styles.parliamentValue}>12</Text>
              </View>
            </Card>
          </>
        )}

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <Text style={styles.infoTitle}>🗳️ How Voting Works</Text>
          <Text style={styles.infoText}>
            Each HEZ token equals one vote. Your vote helps shape the future of Digital Kurdistan. Proposals need majority approval to pass.
          </Text>
        </Card>
      </ScrollView>

      {/* Vote Bottom Sheet */}
      <BottomSheet
        visible={voteSheetVisible}
        onClose={() => setVoteSheetVisible(false)}
        title="Vote on Proposal"
        height={500}
      >
        {selectedProposal && (
          <View>
            <Text style={styles.proposalTitle}>
              {selectedProposal.description}
            </Text>
            <View style={styles.proposalDetails}>
              <DetailRow label="Requested" value={`${selectedProposal.value} HEZ`} />
              <DetailRow label="Beneficiary" value={selectedProposal.beneficiary} />
              <DetailRow label="Current Votes" value={`${selectedProposal.ayes} For / ${selectedProposal.nays} Against`} />
            </View>

            {/* Vote Progress */}
            <View style={styles.voteProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(selectedProposal.ayes / (selectedProposal.ayes + selectedProposal.nays)) * 100}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.ayesLabel}>{selectedProposal.ayes} For</Text>
                <Text style={styles.naysLabel}>{selectedProposal.nays} Against</Text>
              </View>
            </View>

            {/* Vote Buttons */}
            <View style={styles.voteButtons}>
              <Button
                title="Vote FOR"
                onPress={() => handleVote(true)}
                loading={voting}
                disabled={voting}
                variant="primary"
                fullWidth
              />
              <Button
                title="Vote AGAINST"
                onPress={() => handleVote(false)}
                loading={voting}
                disabled={voting}
                variant="danger"
                fullWidth
              />
            </View>
          </View>
        )}
      </BottomSheet>

      {/* Election Vote Bottom Sheet */}
      <BottomSheet
        visible={electionSheetVisible}
        onClose={() => setElectionSheetVisible(false)}
        title={selectedElection ? `${selectedElection.type} Election` : 'Election'}
        height={600}
      >
        {selectedElection && (
          <View>
            <View style={styles.electionHeader}>
              <Badge
                label={selectedElection.status}
                variant={selectedElection.status === 'Voting' ? 'info' : 'success'}
                size="small"
              />
              <Text style={styles.electionVotes}>
                {selectedElection.totalVotes.toLocaleString()} votes cast
              </Text>
            </View>

            <Text style={styles.electionInstruction}>
              {selectedElection.type === 'Parliamentary'
                ? 'You can select multiple candidates'
                : 'Select one candidate'}
            </Text>

            {/* Candidates List */}
            <ScrollView style={styles.candidatesList}>
              {selectedElection.candidates.map((candidate) => (
                <TouchableOpacity
                  key={candidate.id}
                  style={[
                    styles.candidateCard,
                    votedCandidates.includes(candidate.id) && styles.candidateCardSelected
                  ]}
                  onPress={() => handleElectionVote(candidate.id)}
                >
                  <View style={styles.candidateHeader}>
                    <View>
                      <Text style={styles.candidateName}>{candidate.name}</Text>
                      {candidate.party && (
                        <Text style={styles.candidateParty}>{candidate.party}</Text>
                      )}
                      <Text style={styles.candidateTrust}>
                        Trust Score: {candidate.trustScore}
                      </Text>
                    </View>
                    <View style={styles.candidateStats}>
                      <Text style={styles.candidatePercentage}>
                        {candidate.percentage.toFixed(1)}%
                      </Text>
                      <Text style={styles.candidateVotes}>
                        {candidate.votes.toLocaleString()} votes
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${candidate.percentage}%` }
                      ]}
                    />
                  </View>
                  {votedCandidates.includes(candidate.id) && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedText}>✓ Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Submit Vote Button */}
            <Button
              title={`Submit ${votedCandidates.length > 0 ? `(${votedCandidates.length})` : ''} Vote`}
              onPress={submitElectionVote}
              loading={voting}
              disabled={voting || votedCandidates.length === 0}
              variant="primary"
              fullWidth
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const ElectionCard: React.FC<{
  election: Election;
  onPress: () => void;
}> = ({ election, onPress }) => {
  const blocksLeft = election.endBlock - election.currentBlock;

  return (
    <Card onPress={onPress} style={styles.electionCard}>
      <View style={styles.electionCardHeader}>
        <View>
          <Text style={styles.electionType}>{election.type}</Text>
          <Text style={styles.electionStatus}>{election.status}</Text>
        </View>
        <Badge
          label={election.status}
          variant={election.status === 'Voting' ? 'info' : 'warning'}
          size="small"
        />
      </View>

      <View style={styles.electionStats}>
        <View style={styles.electionStat}>
          <Text style={styles.electionStatLabel}>Candidates</Text>
          <Text style={styles.electionStatValue}>{election.candidates.length}</Text>
        </View>
        <View style={styles.electionStat}>
          <Text style={styles.electionStatLabel}>Total Votes</Text>
          <Text style={styles.electionStatValue}>
            {election.totalVotes.toLocaleString()}
          </Text>
        </View>
        <View style={styles.electionStat}>
          <Text style={styles.electionStatLabel}>Blocks Left</Text>
          <Text style={styles.electionStatValue}>
            {blocksLeft.toLocaleString()}
          </Text>
        </View>
      </View>

      {election.candidates.length > 0 && (
        <View style={styles.leadingCandidate}>
          <Text style={styles.leadingLabel}>Leading:</Text>
          <Text style={styles.leadingName}>
            {election.candidates[0].name} ({election.candidates[0].percentage.toFixed(1)}%)
          </Text>
        </View>
      )}
    </Card>
  );
};

const ProposalCard: React.FC<{
  proposal: Proposal;
  onPress: () => void;
}> = ({ proposal, onPress }) => {
  const totalVotes = proposal.ayes + proposal.nays;
  const approvalRate = totalVotes > 0 ? (proposal.ayes / totalVotes) * 100 : 0;

  return (
    <Card onPress={onPress} style={styles.proposalCard}>
      <View style={styles.proposalHeader}>
        <Badge
          label={`#${proposal.index}`}
          variant="primary"
          size="small"
        />
        <Badge
          label={proposal.status}
          variant={proposal.status === 'active' ? 'info' : 'success'}
          size="small"
        />
      </View>
      <Text style={styles.proposalDescription} numberOfLines={2}>
        {proposal.description}
      </Text>
      <View style={styles.proposalStats}>
        <View style={styles.proposalStat}>
          <Text style={styles.proposalStatLabel}>Requested</Text>
          <Text style={styles.proposalStatValue}>{proposal.value} HEZ</Text>
        </View>
        <View style={styles.proposalStat}>
          <Text style={styles.proposalStatLabel}>Approval</Text>
          <Text
            style={[
              styles.proposalStatValue,
              { color: approvalRate > 50 ? KurdistanColors.kesk : KurdistanColors.sor },
            ]}
          >
            {approvalRate.toFixed(0)}%
          </Text>
        </View>
      </View>
    </Card>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: KurdistanColors.kesk,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  proposalCard: {
    marginBottom: 12,
  },
  proposalHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  proposalDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 12,
  },
  proposalStats: {
    flexDirection: 'row',
    gap: 24,
  },
  proposalStat: {
    flex: 1,
  },
  proposalStatLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  proposalStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  infoCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 16,
  },
  proposalDetails: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  voteProgress: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: AppColors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: KurdistanColors.kesk,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ayesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: KurdistanColors.kesk,
  },
  naysLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: KurdistanColors.sor,
  },
  voteButtons: {
    gap: 12,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: AppColors.background,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: KurdistanColors.kesk,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: KurdistanColors.kesk,
  },
  electionCard: {
    marginBottom: 12,
    padding: 16,
  },
  electionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  electionType: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  electionStatus: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  electionStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  electionStat: {
    flex: 1,
  },
  electionStatLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  electionStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  leadingCandidate: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  leadingLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginRight: 8,
  },
  leadingName: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.kesk,
  },
  electionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  electionVotes: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  electionInstruction: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  candidatesList: {
    maxHeight: 350,
  },
  candidateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.border,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  candidateCardSelected: {
    borderColor: KurdistanColors.kesk,
    backgroundColor: '#F0F9F4',
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  candidateParty: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  candidateTrust: {
    fontSize: 11,
    color: '#666',
  },
  candidateStats: {
    alignItems: 'flex-end',
  },
  candidatePercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: KurdistanColors.kesk,
    marginBottom: 2,
  },
  candidateVotes: {
    fontSize: 11,
    color: AppColors.textSecondary,
  },
  selectedBadge: {
    marginTop: 8,
    padding: 8,
    backgroundColor: KurdistanColors.kesk,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  parliamentCard: {
    marginBottom: 16,
    padding: 16,
  },
  parliamentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  parliamentLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  parliamentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
});
