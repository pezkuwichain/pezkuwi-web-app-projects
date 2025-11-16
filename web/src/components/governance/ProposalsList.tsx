import React, { useState } from 'react';
import { FileText, Vote, Clock, TrendingUp, Users, AlertCircle, Loader2, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { useGovernance } from '@/hooks/useGovernance';
import { formatNumber } from '@/lib/utils';
import { LoadingState } from '@pezkuwi/components/AsyncComponent';

interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  type: 'treasury' | 'executive' | 'constitutional' | 'simple';
  status: 'active' | 'passed' | 'rejected' | 'pending';
  ayeVotes: number;
  nayVotes: number;
  totalVotes: number;
  quorum: number;
  deadline: string;
  requestedAmount?: string;
}

const ProposalsList: React.FC = () => {
  const { proposals: treasuryProposals, referenda, loading, error } = useGovernance();

  // Format token amounts from blockchain units (12 decimals for HEZ)
  const formatTokenAmount = (amount: string) => {
    const value = BigInt(amount);
    return formatNumber(Number(value) / 1e12, 2);
  };

  // Convert blockchain data to UI format
  const proposals: Proposal[] = [
    // Treasury proposals
    ...treasuryProposals.map(p => ({
      id: p.proposalIndex,
      title: `Treasury Proposal #${p.proposalIndex}`,
      description: `Requesting ${formatTokenAmount(p.value)} HEZ for ${p.beneficiary.substring(0, 10)}...`,
      proposer: p.proposer,
      type: 'treasury' as const,
      status: p.status as 'active' | 'passed' | 'rejected' | 'pending',
      ayeVotes: 0, // Treasury proposals don't have votes until they become referenda
      nayVotes: 0,
      totalVotes: 0,
      quorum: 0,
      deadline: 'Pending referendum',
      requestedAmount: `${formatTokenAmount(p.value)} HEZ`
    })),
    // Democracy referenda
    ...referenda.map(r => ({
      id: r.index,
      title: `Referendum #${r.index}`,
      description: `Voting on proposal with ${r.threshold} threshold`,
      proposer: 'Democracy',
      type: 'executive' as const,
      status: r.status as 'active' | 'passed' | 'rejected' | 'pending',
      ayeVotes: Number(BigInt(r.ayeVotes) / BigInt(1e12)),
      nayVotes: Number(BigInt(r.nayVotes) / BigInt(1e12)),
      totalVotes: Number((BigInt(r.ayeVotes) + BigInt(r.nayVotes)) / BigInt(1e12)),
      quorum: 50,
      deadline: `Block ${r.end}`,
    }))
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge className="bg-blue-500/10 text-blue-400">Active</Badge>;
      case 'passed': return <Badge className="bg-green-500/10 text-green-400">Passed</Badge>;
      case 'rejected': return <Badge className="bg-red-500/10 text-red-400">Rejected</Badge>;
      default: return <Badge className="bg-gray-500/10 text-gray-400">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'treasury': return <Badge className="bg-yellow-500/10 text-yellow-400">Treasury</Badge>;
      case 'executive': return <Badge className="bg-kurdish-red/10 text-kurdish-red">Executive</Badge>;
      case 'constitutional': return <Badge className="bg-cyan-500/10 text-cyan-400">Constitutional</Badge>;
      default: return <Badge className="bg-gray-500/10 text-gray-400">Simple</Badge>;
    }
  };

  if (loading) {
    return <LoadingState message="Loading proposals from blockchain..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load proposals: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Data Badge */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <Activity className="h-3 w-3 mr-1" />
          Live Blockchain Data
        </Badge>
        <span className="text-sm text-muted-foreground">
          {proposals.length} active proposals & referenda
        </span>
      </div>

      {proposals.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="pt-6 text-center text-gray-500">
            No active proposals or referenda found on the blockchain.
          </CardContent>
        </Card>
      ) : (
        proposals.map((proposal) => {
        const ayePercentage = (proposal.ayeVotes / proposal.totalVotes) * 100;
        const nayPercentage = (proposal.nayVotes / proposal.totalVotes) * 100;
        const quorumReached = (proposal.totalVotes / 300) * 100 >= proposal.quorum;

        return (
          <Card key={proposal.id} className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">#{proposal.id}</span>
                    {getTypeBadge(proposal.type)}
                    {getStatusBadge(proposal.status)}
                  </div>
                  <CardTitle className="text-white text-lg">{proposal.title}</CardTitle>
                  <p className="text-gray-400 text-sm">{proposal.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {proposal.deadline}
                  </div>
                  {proposal.requestedAmount && (
                    <div className="mt-2 text-yellow-400 font-semibold">
                      {proposal.requestedAmount}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Voting Progress</span>
                  <span className="text-white">{proposal.totalVotes} votes</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 text-xs w-12">Aye</span>
                    <Progress value={ayePercentage} className="flex-1 h-2" />
                    <span className="text-white text-sm w-12 text-right">{ayePercentage.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400 text-xs w-12">Nay</span>
                    <Progress value={nayPercentage} className="flex-1 h-2" />
                    <span className="text-white text-sm w-12 text-right">{nayPercentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="text-gray-400">Proposer: {proposal.proposer}</span>
                  </div>
                  <div className="flex items-center">
                    {quorumReached ? (
                      <span className="text-green-400">✓ Quorum reached</span>
                    ) : (
                      <span className="text-yellow-400">⚠ Quorum: {proposal.quorum}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" className="border-gray-700">
                    View Details
                  </Button>
                  <Button size="sm" className="bg-kurdish-green hover:bg-kurdish-green/80">
                    Cast Vote
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })
      )}
    </div>
  );
};

export default ProposalsList;