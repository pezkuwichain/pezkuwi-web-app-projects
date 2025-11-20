/**
 * Welati Elections & Governance Page
 *
 * Features:
 * - View active elections (Presidential, Parliamentary, Speaker, Constitutional Court)
 * - Register as candidate
 * - Cast votes
 * - View proposals & vote on them
 * - See government officials
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Vote,
  Users,
  Trophy,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Crown,
  Scale,
  Building,
} from 'lucide-react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { toast } from '@/components/ui/use-toast';
import { LoadingState } from '@pezkuwi/components/AsyncComponent';
import {
  getActiveElections,
  getElectionCandidates,
  getActiveProposals,
  getCurrentOfficials,
  getCurrentMinisters,
  getElectionTypeLabel,
  getElectionStatusLabel,
  getMinisterRoleLabel,
  blocksToTime,
  getRemainingBlocks,
  type ElectionInfo,
  type CollectiveProposal,
  type CandidateInfo,
} from '@pezkuwi/lib/welati';
// import { handleBlockchainError, handleBlockchainSuccess } from '@pezkuwi/lib/error-handler';
// import { web3FromAddress } from '@polkadot/extension-dapp';

export default function Elections() {
  const { api, isApiReady } = usePolkadot();

  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState<ElectionInfo[]>([]);
  const [proposals, setProposals] = useState<CollectiveProposal[]>([]);
  const [officials, setOfficials] = useState<Record<string, unknown>>({});
  const [ministers, setMinisters] = useState<Record<string, unknown>>({});

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!api || !isApiReady) return;

      try {
        setLoading(true);
        const [electionsData, proposalsData, officialsData, ministersData] = await Promise.all([
          getActiveElections(api),
          getActiveProposals(api),
          getCurrentOfficials(api),
          getCurrentMinisters(api),
        ]);

        setElections(electionsData);
        setProposals(proposalsData);
        setOfficials(officialsData);
        setMinisters(ministersData);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to load elections data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load elections data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [api, isApiReady]);

  if (loading) {
    return <LoadingState message="Loading elections and governance data..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Welati - Elections & Governance</h1>
        <p className="text-gray-400">
          Democratic governance for Digital Kurdistan. Vote, propose, and participate in building our nation.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="elections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto bg-gray-900">
          <TabsTrigger value="elections">
            <Vote className="w-4 h-4 mr-2" />
            Elections
          </TabsTrigger>
          <TabsTrigger value="proposals">
            <FileText className="w-4 h-4 mr-2" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="government">
            <Crown className="w-4 h-4 mr-2" />
            Government
          </TabsTrigger>
        </TabsList>

        {/* Elections Tab */}
        <TabsContent value="elections" className="space-y-6">
          {elections.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active elections at this time. Check back later for upcoming elections.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6">
              {elections.map((election) => (
                <ElectionCard key={election.electionId} election={election} api={api} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-6">
          {proposals.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active proposals at this time. Parliament members can submit new proposals.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6">
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.proposalId} proposal={proposal} api={api} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Government Tab */}
        <TabsContent value="government" className="space-y-6">
          <GovernmentOfficials officials={officials} ministers={ministers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// ELECTION CARD
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ElectionCard({ election, api }: { election: ElectionInfo; api: any }) {
  const [candidates, setCandidates] = useState<CandidateInfo[]>([]);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const typeLabel = getElectionTypeLabel(election.electionType);
  const statusLabel = getElectionStatusLabel(election.status);

  useEffect(() => {
    if (!api) return;

    // Load candidates
    getElectionCandidates(api, election.electionId).then(setCandidates);

    // Update time left
    const updateTime = async () => {
      let targetBlock = election.votingEndBlock;
      if (election.status === 'CandidacyPeriod') targetBlock = election.candidacyEndBlock;
      else if (election.status === 'CampaignPeriod') targetBlock = election.campaignEndBlock;

      const remaining = await getRemainingBlocks(api, targetBlock);
      setTimeLeft(blocksToTime(remaining));
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [api, election]);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-white">{typeLabel.en}</CardTitle>
            <CardDescription className="text-gray-400 mt-1">{typeLabel.kmr}</CardDescription>
          </div>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
            {statusLabel.en}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Candidates</span>
            </div>
            <div className="text-2xl font-bold text-white">{election.totalCandidates}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Vote className="w-4 h-4" />
              <span className="text-sm">Votes Cast</span>
            </div>
            <div className="text-2xl font-bold text-white">{election.totalVotes.toLocaleString()}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Time Left</span>
            </div>
            <div className="text-lg font-bold text-white">
              {timeLeft ? `${timeLeft.days}d ${timeLeft.hours}h` : '-'}
            </div>
          </div>
        </div>

        {/* Top Candidates */}
        {candidates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">Leading Candidates</h4>
            <div className="space-y-2">
              {candidates.slice(0, 5).map((candidate, idx) => (
                <div
                  key={candidate.account}
                  className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                      <span className="text-green-400 font-bold text-sm">#{idx + 1}</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        {candidate.account.slice(0, 12)}...{candidate.account.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-white font-bold">{candidate.voteCount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {election.status === 'CandidacyPeriod' && (
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              Register as Candidate
            </Button>
          )}
          {election.status === 'VotingPeriod' && (
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              <Vote className="w-4 h-4 mr-2" />
              Cast Your Vote
            </Button>
          )}
          <Button variant="outline" className="flex-1">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PROPOSAL CARD
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProposalCard({ proposal, api }: { proposal: CollectiveProposal; api: any }) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const totalVotes = proposal.ayeVotes + proposal.nayVotes + proposal.abstainVotes;
  const ayePercent = totalVotes > 0 ? Math.round((proposal.ayeVotes / totalVotes) * 100) : 0;
  const nayPercent = totalVotes > 0 ? Math.round((proposal.nayVotes / totalVotes) * 100) : 0;

  useEffect(() => {
    if (!api) return;

    const updateTime = async () => {
      const remaining = await getRemainingBlocks(api, proposal.expiresAt);
      setTimeLeft(blocksToTime(remaining));
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [api, proposal]);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-white">#{proposal.proposalId} {proposal.title}</CardTitle>
            <CardDescription className="text-gray-400 mt-1">{proposal.description}</CardDescription>
          </div>
          <Badge
            className={
              proposal.status === 'Active'
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-gray-500/10 text-gray-400'
            }
          >
            {proposal.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vote Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Aye ({proposal.ayeVotes})</span>
            <span className="text-gray-400">Nay ({proposal.nayVotes})</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
            <div className="bg-green-500" style={{ width: `${ayePercent}%` }} />
            <div className="bg-red-500" style={{ width: `${nayPercent}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{ayePercent}% Aye</span>
            <span>
              {proposal.votesCast} / {proposal.threshold} votes cast
            </span>
            <span>{nayPercent}% Nay</span>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            {timeLeft && `${timeLeft.days}d ${timeLeft.hours}h remaining`}
          </div>
          <Badge variant="outline">{proposal.decisionType}</Badge>
        </div>

        {/* Actions */}
        {proposal.status === 'Active' && (
          <div className="grid grid-cols-3 gap-2">
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Aye
            </Button>
            <Button className="bg-red-600 hover:bg-red-700">
              <XCircle className="w-4 h-4 mr-1" />
              Nay
            </Button>
            <Button variant="outline">Abstain</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// GOVERNMENT OFFICIALS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GovernmentOfficials({ officials, ministers }: { officials: any; ministers: any }) {
  return (
    <div className="space-y-6">
      {/* Executive */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Crown className="w-5 h-5 text-yellow-500" />
            Executive Branch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {officials.serok && (
            <OfficeRow title="Serok (President)" address={officials.serok} icon={Crown} />
          )}
          {officials.serokWeziran && (
            <OfficeRow title="Serok Weziran (Prime Minister)" address={officials.serokWeziran} icon={Building} />
          )}
          {officials.meclisBaskanı && (
            <OfficeRow title="Meclis Başkanı (Speaker)" address={officials.meclisBaskanı} icon={Scale} />
          )}
        </CardContent>
      </Card>

      {/* Cabinet */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Building className="w-5 h-5" />
            Cabinet Ministers
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {Object.entries(ministers).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ([role, address]: [string, any]) =>
              address && (
                <OfficeRow
                  key={role}
                  title={getMinisterRoleLabel(role as Record<string, unknown>).en}
                  address={address}
                  icon={Users}
                />
              )
          )}
          {Object.values(ministers).every((v) => !v) && (
            <div className="text-gray-400 text-sm text-center py-4">No ministers appointed yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OfficeRow({ title, address, icon: Icon }: { title: string; address: string; icon: any }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-green-400" />
        <span className="text-white font-medium">{title}</span>
      </div>
      <span className="text-gray-400 text-sm font-mono">
        {address.slice(0, 8)}...{address.slice(-6)}
      </span>
    </div>
  );
}
