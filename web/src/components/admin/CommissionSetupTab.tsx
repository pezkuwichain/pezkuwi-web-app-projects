import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { Loader2, Plus, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { COMMISSIONS } from '@/config/commissions';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CommissionSetupTab() {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [commissionMembers, setCommissionMembers] = useState<string[]>([]);
  const [proxyMembers, setProxyMembers] = useState<string[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newMemberAddress, setNewMemberAddress] = useState('');

  useEffect(() => {
    if (!api || !isApiReady) return;
    checkSetup();
  }, [api, isApiReady]);

  const checkSetup = async () => {
    if (!api) return;

    setLoading(true);
    try {
      // Check DynamicCommissionCollective members
      const members = await api.query.dynamicCommissionCollective.members();
      const memberList = members.toJSON() as string[];

      setCommissionMembers(memberList);
      // Commission is initialized if there's at least one member
      setSetupComplete(memberList.length > 0);

      console.log('Commission members:', memberList);
      console.log('Setup complete:', memberList.length > 0);
    } catch (error) {
      console.error('Error checking setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!api || !selectedAccount) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your admin wallet',
        variant: 'destructive',
      });
      return;
    }

    if (!newMemberAddress) {
      toast({
        title: 'No Addresses',
        description: 'Please enter at least one address',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      // Parse addresses (one per line, trim whitespace)
      const newAddresses = newMemberAddress
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      if (newAddresses.length === 0) {
        toast({
          title: 'No Valid Addresses',
          description: 'Please enter at least one valid address',
          variant: 'destructive',
        });
        setProcessing(false);
        return;
      }

      // Get current members
      const currentMembers = await api.query.dynamicCommissionCollective.members();
      const memberList = (currentMembers.toJSON() as string[]) || [];

      // Filter out already existing members
      const newMembers = newAddresses.filter(addr => !memberList.includes(addr));

      if (newMembers.length === 0) {
        toast({
          title: 'Already Members',
          description: 'All addresses are already commission members',
          variant: 'destructive',
        });
        setProcessing(false);
        return;
      }

      // Add new members
      const updatedList = [...memberList, ...newMembers];

      console.log('Adding new members:', newMembers);
      console.log('Updated member list:', updatedList);

      const tx = api.tx.sudo.sudo(
        api.tx.dynamicCommissionCollective.setMembers(
          updatedList,
          null,
          updatedList.length
        )
      );

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(
          selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError }) => {
            if (status.isInBlock || status.isFinalized) {
              if (dispatchError) {
                let errorMessage = 'Failed to add member';
                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(dispatchError.asModule);
                  errorMessage = `${decoded.section}.${decoded.name}`;
                }
                toast({
                  title: 'Error',
                  description: errorMessage,
                  variant: 'destructive',
                });
                reject(new Error(errorMessage));
              } else {
                toast({
                  title: 'Success',
                  description: `${newMembers.length} member(s) added successfully!`,
                });
                setNewMemberAddress('');
                setTimeout(() => checkSetup(), 2000);
                resolve();
              }
            }
          }
        );
      });
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleInitializeCommission = async () => {
    if (!api || !selectedAccount) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your admin wallet',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      console.log('Initializing KYC Commission...');
      console.log('Proxy account:', COMMISSIONS.KYC.proxyAccount);

      // Initialize DynamicCommissionCollective with Alice as first member
      // Other members can be added later
      const tx = api.tx.sudo.sudo(
        api.tx.dynamicCommissionCollective.setMembers(
          [selectedAccount.address], // Add caller as first member
          null,
          1
        )
      );

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(
          selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError, events }) => {
            console.log('Transaction status:', status.type);

            if (status.isInBlock || status.isFinalized) {
              if (dispatchError) {
                let errorMessage = 'Transaction failed';

                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(dispatchError.asModule);
                  errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                } else {
                  errorMessage = dispatchError.toString();
                }

                console.error('Setup error:', errorMessage);
                toast({
                  title: 'Setup Failed',
                  description: errorMessage,
                  variant: 'destructive',
                });
                reject(new Error(errorMessage));
                return;
              }

              // Check for Sudid event
              const sudidEvent = events.find(({ event }) =>
                event.section === 'sudo' && event.method === 'Sudid'
              );

              if (sudidEvent) {
                console.log('✅ KYC Commission initialized');
                toast({
                  title: 'Success',
                  description: 'KYC Commission initialized successfully!',
                });
                resolve();
              } else {
                console.warn('Transaction included but no Sudid event');
                resolve();
              }
            }
          }
        ).catch((error) => {
          console.error('Failed to sign and send:', error);
          toast({
            title: 'Transaction Error',
            description: error.message || 'Failed to submit transaction',
            variant: 'destructive',
          });
          reject(error);
        });
      });

      // Reload setup status
      setTimeout(() => checkSetup(), 2000);

    } catch (error: any) {
      console.error('Error initializing commission:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize commission',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!isApiReady) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            <span className="ml-3 text-gray-400">Connecting to blockchain...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedAccount) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your admin wallet to manage commission setup.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Setup Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            KYC Commission Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                  <p className="font-medium">Commission Status</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {setupComplete
                      ? 'Commission is initialized and ready'
                      : 'Commission needs to be initialized'}
                  </p>
                </div>
                {setupComplete ? (
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Not Initialized
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">Proxy Account</p>
                <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                  <p className="font-mono text-xs">{COMMISSIONS.KYC.proxyAccount}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">
                  Commission Members ({commissionMembers.length})
                </p>
                {commissionMembers.length === 0 ? (
                  <div className="p-4 bg-gray-800/50 rounded border border-gray-700 text-center text-gray-500">
                    No members yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {commissionMembers.map((member, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-800/50 rounded border border-gray-700"
                      >
                        <p className="font-mono text-xs">{member}</p>
                        {member === COMMISSIONS.KYC.proxyAccount && (
                          <Badge className="mt-2 bg-cyan-600 text-xs">KYC Proxy</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!setupComplete && (
                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Required:</strong> Initialize the commission before members can join.
                    This requires sudo privileges.
                  </AlertDescription>
                </Alert>
              )}

              {setupComplete && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-400">Add Members</p>
                  <div className="flex gap-2 mb-2">
                    <Button
                      onClick={() => {
                        // Get wallet addresses from Polkadot.js extension
                        // For now, show instruction
                        toast({
                          title: 'Get Addresses',
                          description: 'Copy addresses from Polkadot.js wallet and paste below',
                        });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      How to get addresses
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <textarea
                      placeholder="Member addresses, one per line"
                      value={newMemberAddress}
                      onChange={(e) => setNewMemberAddress(e.target.value)}
                      className="flex-1 font-mono text-sm p-3 bg-gray-800 border border-gray-700 rounded min-h-[120px] placeholder:text-gray-500 placeholder:opacity-50"
                    />
                    <Button
                      onClick={handleAddMember}
                      disabled={processing || !newMemberAddress}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {processing ? 'Adding Members...' : 'Add Members'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleInitializeCommission}
                  disabled={setupComplete || processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : setupComplete ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Already Initialized
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Initialize Commission
                    </>
                  )}
                </Button>

                <Button
                  onClick={checkSetup}
                  variant="outline"
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
            <li>
              <strong className="text-white">Initialize Commission</strong> - Add proxy to
              DynamicCommissionCollective (requires sudo)
            </li>
            <li>
              <strong className="text-white">Join Commission</strong> - Members add proxy rights
              via Commission Voting tab
            </li>
            <li>
              <strong className="text-white">Start Voting</strong> - Create proposals and vote on
              KYC applications
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
