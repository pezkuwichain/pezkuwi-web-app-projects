import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Vote, Trophy, Clock, AlertCircle, CheckCircle } from 'lucide-react';

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

const ElectionsInterface: React.FC = () => {
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [votedCandidates, setVotedCandidates] = useState<string[]>([]);

  const activeElections: Election[] = [
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
      status: 'Registration',
      totalVotes: 0,
      endBlock: 1200000,
      currentBlock: 995000,
      candidates: []
    }
  ];

  const handleVote = (candidateId: string, electionType: string) => {
    if (electionType === 'Parliamentary') {
      setVotedCandidates(prev => 
        prev.includes(candidateId) 
          ? prev.filter(id => id !== candidateId)
          : [...prev, candidateId]
      );
    } else {
      setVotedCandidates([candidateId]);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Elections</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeElections.map(election => (
            <Card key={election.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{election.type} Election</CardTitle>
                    <CardDescription>
                      {election.status === 'Voting' 
                        ? `${election.totalVotes.toLocaleString()} votes cast`
                        : `Registration ends in ${(election.endBlock - election.currentBlock).toLocaleString()} blocks`}
                    </CardDescription>
                  </div>
                  <Badge variant={election.status === 'Voting' ? 'default' : 'secondary'}>
                    {election.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {election.status === 'Voting' && (
                  <div className="space-y-4">
                    {election.candidates.map(candidate => (
                      <div key={candidate.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{candidate.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Trust Score: {candidate.trustScore}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{candidate.percentage}%</p>
                            <p className="text-sm text-muted-foreground">
                              {candidate.votes.toLocaleString()} votes
                            </p>
                          </div>
                        </div>
                        <Progress value={candidate.percentage} className="h-2" />
                        <Button
                          size="sm"
                          variant={votedCandidates.includes(candidate.id) ? "default" : "outline"}
                          onClick={() => handleVote(candidate.id, election.type)}
                          className="w-full"
                        >
                          {votedCandidates.includes(candidate.id) ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Voted
                            </>
                          ) : (
                            <>
                              <Vote className="w-4 h-4 mr-2" />
                              Vote
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                    {election.type === 'Parliamentary' && (
                      <p className="text-sm text-muted-foreground text-center">
                        You can select multiple candidates
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Registration</CardTitle>
              <CardDescription>
                Register as a candidate for upcoming elections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Requirements
                    </p>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1">
                      <li>• Minimum Trust Score: 300 (Parliamentary) / 600 (Presidential)</li>
                      <li>• KYC Approved Status</li>
                      <li>• Endorsements: 10 (Parliamentary) / 50 (Presidential)</li>
                      <li>• Deposit: 1000 PEZ</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button className="w-full" size="lg">
                Register as Candidate
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Election Results</CardTitle>
              <CardDescription>Historical election outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">Presidential Election 2024</p>
                      <p className="text-sm text-muted-foreground">Completed 30 days ago</p>
                    </div>
                    <Badge variant="outline">
                      <Trophy className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Winner: Candidate A</span>
                      <span className="font-bold">52.8%</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total Votes</span>
                      <span>89,234</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Turnout</span>
                      <span>67.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ElectionsInterface;