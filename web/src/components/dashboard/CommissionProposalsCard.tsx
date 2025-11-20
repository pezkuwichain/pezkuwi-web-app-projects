import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { Loader2, ThumbsUp, ThumbsDown, Vote } from 'lucide-react';

interface Proposal {
  hash: string;
  proposalIndex: number;
  threshold: number;
  ayes: string[];
  nays: string[];
  end: number;
  call?: Record<string, unknown>;
}

export function CommissionProposalsCard() {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [voting, setVoting] = useState<string | null>(null);
  const [isCommissionMember, setIsCommissionMember] = useState(false);

  useEffect(() => {
    if (!api || !isApiReady) return;
    checkMembership();
    loadProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, isApiReady, selectedAccount]);

  const checkMembership = async () => {
    if (!api || !selectedAccount) {
      setIsCommissionMember(false);
      return;
    }

    try {
      const members = await api.query.dynamicCommissionCollective.members();
      const memberList = members.toJSON() as string[];
      setIsCommissionMember(memberList.includes(selectedAccount.address));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error checking membership:', error);
      setIsCommissionMember(false);
    }
  };

  const loadProposals = async () => {
    if (!api || !isApiReady) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const proposalHashes = await api.query.dynamicCommissionCollective.proposals();
      const proposalList: Proposal[] = [];

      for (let i = 0; i < proposalHashes.length; i++) {
        const hash = proposalHashes[i];
        const voting = await api.query.dynamicCommissionCollective.voting(hash);

        if (!voting.isEmpty) {
          const voteData = voting.unwrap();
          const proposalOption = await api.query.dynamicCommissionCollective.proposalOf(hash);
          let proposalCall = null;

          if (!proposalOption.isEmpty) {
            proposalCall = proposalOption.unwrap();
          }

          // Get the actual proposal index from the chain
          const proposalIndex = (voteData as Record<string, unknown>).index?.toNumber() || i;

          proposalList.push({
            hash: hash.toHex(),
            proposalIndex: proposalIndex,
            threshold: voteData.threshold.toNumber(),
            ayes: voteData.ayes.map((a: { toString: () => string }) => a.toString()),
            nays: voteData.nays.map((n: { toString: () => string }) => n.toString()),
            end: voteData.end.toNumber(),
            call: proposalCall?.toHuman(),
          });
        }
      }

      setProposals(proposalList);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposal: Proposal, approve: boolean) => {
    if (!api || !selectedAccount) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setVoting(proposal.hash);
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      const tx = api.tx.dynamicCommissionCollective.vote(
        proposal.hash,
        proposal.proposalIndex,
        approve
      );

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(
          selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError, events }) => {
            if (status.isInBlock || status.isFinalized) {
              if (dispatchError) {
                let errorMessage = 'Transaction failed';
                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(dispatchError.asModule);
                  errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                } else {
                  errorMessage = dispatchError.toString();
                }

                toast({
                  title: 'Vote Failed',
                  description: errorMessage,
                  variant: 'destructive',
                });
                reject(new Error(errorMessage));
                return;
              }

              const executedEvent = events.find(({ event }) =>
                event.section === 'dynamicCommissionCollective' && event.method === 'Executed'
              );

              const votedEvent = events.find(({ event }) =>
                event.section === 'dynamicCommissionCollective' && event.method === 'Voted'
              );

              if (executedEvent) {
                toast({
                  title: 'Proposal Passed!',
                  description: 'Threshold reached and executed. KYC approved!',
                });
              } else if (votedEvent) {
                toast({
                  title: 'Vote Recorded',
                  description: `Your ${approve ? 'AYE' : 'NAY'} vote has been recorded`,
                });
              }

              resolve();
            }
          }
        ).catch((error) => {
          toast({
            title: 'Transaction Error',
            description: error instanceof Error ? error.message : 'Failed to submit transaction',
            variant: 'destructive',
          });
          reject(error);
        });
      });

      setTimeout(() => loadProposals(), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to vote',
        variant: 'destructive',
      });
    } finally {
      setVoting(null);
    }
  };

  const handleExecute = async (proposal: Proposal) => {
    if (!api || !selectedAccount) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setVoting(proposal.hash);
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      // Get proposal length bound
      const proposalOption = await api.query.dynamicCommissionCollective.proposalOf(proposal.hash);
      const proposalCall = proposalOption.unwrap();
      const lengthBound = proposalCall.encodedLength;

      const tx = api.tx.dynamicCommissionCollective.close(
        proposal.hash,
        proposal.proposalIndex,
        {
          refTime: 1_000_000_000_000, // 1 trillion for ref time
          proofSize: 64 * 1024, // 64 KB for proof size
        },
        lengthBound
      );

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(
          selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError, events }) => {
            if (status.isInBlock || status.isFinalized) {
              if (dispatchError) {
                let errorMessage = 'Transaction failed';
                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(dispatchError.asModule);
                  errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                } else {
                  errorMessage = dispatchError.toString();
                }

                toast({
                  title: 'Execute Failed',
                  description: errorMessage,
                  variant: 'destructive',
                });
                reject(new Error(errorMessage));
                return;
              }

              const executedEvent = events.find(({ event }) =>
                event.section === 'dynamicCommissionCollective' && event.method === 'Executed'
              );

              const closedEvent = events.find(({ event }) =>
                event.section === 'dynamicCommissionCollective' && event.method === 'Closed'
              );

              if (executedEvent) {
                const eventData = executedEvent.event.data.toHuman();
                if (import.meta.env.DEV) console.log('✅ Proposal executed');
                if (import.meta.env.DEV) console.log('Execute event data:', eventData);
                if (import.meta.env.DEV) console.log('Result:', eventData);

                // Check if execution was successful
                const result = eventData[eventData.length - 1]; // Last parameter is usually the result
                if (result && typeof result === 'object' && 'Err' in result) {
                  if (import.meta.env.DEV) console.error('Execution failed:', result.Err);
                  toast({
                    title: 'Execution Failed',
                    description: `Proposal closed but execution failed: ${JSON.stringify(result.Err)}`,
                    variant: 'destructive',
                  });
                } else {
                  toast({
                    title: 'Proposal Executed!',
                    description: 'KYC approved and NFT minted successfully!',
                  });
                }
              } else if (closedEvent) {
                toast({
                  title: 'Proposal Closed',
                  description: 'Proposal has been closed',
                });
              }

              resolve();
            }
          }
        ).catch((error) => {
          toast({
            title: 'Transaction Error',
            description: error instanceof Error ? error.message : 'Failed to submit transaction',
            variant: 'destructive',
          });
          reject(error);
        });
      });

      setTimeout(() => loadProposals(), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute proposal',
        variant: 'destructive',
      });
    } finally {
      setVoting(null);
    }
  };

  if (!isCommissionMember) {
    return null; // Don't show card if not a commission member
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Commission Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading proposals...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Commission Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">No active proposals</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Vote className="h-5 w-5" />
          Commission Proposals ({proposals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {proposals.map((proposal) => {
          const progress = (proposal.ayes.length / proposal.threshold) * 100;
          const hasVoted = proposal.ayes.includes(selectedAccount?.address || '') ||
                          proposal.nays.includes(selectedAccount?.address || '');

          return (
            <div key={proposal.hash} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Proposal #{proposal.proposalIndex}</p>
                  <p className="text-sm text-muted-foreground">KYC Approval</p>
                </div>
                <Badge variant={progress >= 100 ? 'default' : 'secondary'} className={progress >= 100 ? 'bg-green-600' : ''}>
                  {progress >= 100 ? 'PASSED' : `${progress.toFixed(0)}%`}
                </Badge>
              </div>

              <div className="flex gap-2 items-center text-sm">
                <Badge variant="outline" className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {proposal.ayes.length}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <ThumbsDown className="h-3 w-3" />
                  {proposal.nays.length}
                </Badge>
                <span className="text-muted-foreground">/ {proposal.threshold}</span>
              </div>

              {progress >= 100 ? (
                <Button
                  size="sm"
                  onClick={() => handleExecute(proposal)}
                  disabled={voting === proposal.hash}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  {voting === proposal.hash ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Execute Proposal</>
                  )}
                </Button>
              ) : hasVoted ? (
                <p className="text-sm text-green-600">✓ You already voted</p>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleVote(proposal, true)}
                    disabled={voting === proposal.hash}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {voting === proposal.hash ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Aye
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleVote(proposal, false)}
                    disabled={voting === proposal.hash}
                  >
                    {voting === proposal.hash ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Nay
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
