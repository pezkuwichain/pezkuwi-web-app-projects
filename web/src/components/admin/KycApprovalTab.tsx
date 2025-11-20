import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { Loader2, CheckCircle, XCircle, Clock, User, Mail, FileText, AlertTriangle } from 'lucide-react';
import { COMMISSIONS } from '@/config/commissions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PendingApplication {
  address: string;
  cids: string[];
  notes: string;
  timestamp?: number;
}

interface IdentityInfo {
  name: string;
  email: string;
}

export function KycApprovalTab() {
  const { api, isApiReady, selectedAccount, connectWallet } = usePolkadot();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pendingApps, setPendingApps] = useState<PendingApplication[]>([]);
  const [identities, setIdentities] = useState<Map<string, IdentityInfo>>(new Map());
  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load pending KYC applications
  useEffect(() => {
    if (!api || !isApiReady) {
      return;
    }

    loadPendingApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, isApiReady]);
     

  const loadPendingApplications = async () => {
    if (!api || !isApiReady) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get all pending applications
      const entries = await api.query.identityKyc.pendingKycApplications.entries();

      const apps: PendingApplication[] = [];
      const identityMap = new Map<string, IdentityInfo>();

      for (const [key, value] of entries) {
        const address = key.args[0].toString();
        const application = value.toJSON() as Record<string, unknown>;

        // Get identity info for this address
        try {
          const identity = await api.query.identityKyc.identities(address);
          if (!identity.isEmpty) {
            const identityData = identity.toJSON() as Record<string, unknown>;
            identityMap.set(address, {
              name: identityData.name || 'Unknown',
              email: identityData.email || 'No email'
            });
          }
        } catch (err) {
          if (import.meta.env.DEV) console.error('Error fetching identity for', address, err);
        }

        apps.push({
          address,
          cids: application.cids || [],
          notes: application.notes || 'No notes provided',
          timestamp: application.timestamp || Date.now()
        });
      }

      setPendingApps(apps);
      setIdentities(identityMap);

      if (import.meta.env.DEV) console.log(`Loaded ${apps.length} pending KYC applications`);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading pending applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: PendingApplication) => {
    if (!api || !selectedAccount) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your admin wallet first',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      if (import.meta.env.DEV) console.log('Proposing KYC approval for:', application.address);
      if (import.meta.env.DEV) console.log('Commission member wallet:', selectedAccount.address);

      // Check if user is a member of DynamicCommissionCollective
      const members = await api.query.dynamicCommissionCollective.members();
      const memberList = members.toJSON() as string[];
      const isMember = memberList.includes(selectedAccount.address);

      if (!isMember) {
        toast({
          title: 'Not a Commission Member',
          description: 'You are not a member of the KYC Approval Commission',
          variant: 'destructive',
        });
        setProcessing(false);
        return;
      }

      if (import.meta.env.DEV) console.log('✅ User is commission member');

      // Create proposal for KYC approval
      const proposal = api.tx.identityKyc.approveKyc(application.address);
      const lengthBound = proposal.encodedLength;

      // Create proposal directly (no proxy needed)
      if (import.meta.env.DEV) console.log('Creating commission proposal for KYC approval');
      if (import.meta.env.DEV) console.log('Applicant:', application.address);
      if (import.meta.env.DEV) console.log('Threshold:', COMMISSIONS.KYC.threshold);

      const tx = api.tx.dynamicCommissionCollective.propose(
        COMMISSIONS.KYC.threshold,
        proposal,
        lengthBound
      );

      if (import.meta.env.DEV) console.log('Transaction created:', tx.toHuman());

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(
          selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError, events }) => {
            if (import.meta.env.DEV) console.log('Transaction status:', status.type);

            if (status.isInBlock || status.isFinalized) {
              if (dispatchError) {
                let errorMessage = 'Transaction failed';

                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(dispatchError.asModule);
                  errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                } else {
                  errorMessage = dispatchError.toString();
                }

                if (import.meta.env.DEV) console.error('Approval error:', errorMessage);
                toast({
                  title: 'Approval Failed',
                  description: errorMessage,
                  variant: 'destructive',
                });
                reject(new Error(errorMessage));
                return;
              }

              // Check for Proposed event
              if (import.meta.env.DEV) console.log('All events:', events.map(e => `${e.event.section}.${e.event.method}`));
              const proposedEvent = events.find(({ event }) =>
                event.section === 'dynamicCommissionCollective' && event.method === 'Proposed'
              );

              if (proposedEvent) {
                if (import.meta.env.DEV) console.log('✅ KYC Approval proposal created');
                toast({
                  title: 'Proposal Created',
                  description: `KYC approval proposed for ${application.address.slice(0, 8)}... Waiting for other commission members to vote.`,
                });
                resolve();
              } else {
                if (import.meta.env.DEV) console.warn('Transaction included but no Proposed event');
                resolve();
              }
            }
          }
        ).catch((error) => {
          if (import.meta.env.DEV) console.error('Failed to sign and send:', error);
          toast({
            title: 'Transaction Error',
            description: error instanceof Error ? error.message : 'Failed to submit transaction',
            variant: 'destructive',
          });
          reject(error);
        });
      });

      // Reload applications after approval
      setTimeout(() => {
        loadPendingApplications();
        setShowDetailsModal(false);
        setSelectedApp(null);
      }, 2000);

    } catch (error) {
      if (import.meta.env.DEV) console.error('Error approving KYC:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve KYC',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (application: PendingApplication) => {
    if (!api || !selectedAccount) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your admin wallet first',
        variant: 'destructive',
      });
      return;
    }

    const confirmReject = window.confirm(
      `Are you sure you want to REJECT KYC for ${application.address}?\n\nThis will slash their deposit.`
    );

    if (!confirmReject) return;

    setProcessing(true);
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      if (import.meta.env.DEV) console.log('Rejecting KYC for:', application.address);

      const tx = api.tx.identityKyc.rejectKyc(application.address);

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
                  title: 'Rejection Failed',
                  description: errorMessage,
                  variant: 'destructive',
                });
                reject(new Error(errorMessage));
                return;
              }

              const rejectedEvent = events.find(({ event }) =>
                event.section === 'identityKyc' && event.method === 'KycRejected'
              );

              if (rejectedEvent) {
                toast({
                  title: 'Rejected',
                  description: `KYC rejected for ${application.address.slice(0, 8)}...`,
                });
                resolve();
              } else {
                resolve();
              }
            }
          }
        ).catch(reject);
      });

      setTimeout(() => {
        loadPendingApplications();
        setShowDetailsModal(false);
        setSelectedApp(null);
      }, 2000);

    } catch (error) {
      if (import.meta.env.DEV) console.error('Error rejecting KYC:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject KYC',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openDetailsModal = (app: PendingApplication) => {
    setSelectedApp(app);
    setShowDetailsModal(true);
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
              Please connect your admin wallet to view and approve KYC applications.
              <Button onClick={connectWallet} variant="outline" className="ml-4">
                Connect Wallet
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending KYC Applications</CardTitle>
          <Button onClick={loadPendingApplications} variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : pendingApps.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-400">No pending applications</p>
              <p className="text-sm text-gray-600 mt-2">All KYC applications have been processed</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApps.map((app) => {
                  const identity = identities.get(app.address);
                  return (
                    <TableRow key={app.address}>
                      <TableCell className="font-mono text-xs">
                        {app.address.slice(0, 6)}...{app.address.slice(-4)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {identity?.name || 'Loading...'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {identity?.email || 'Loading...'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <FileText className="w-3 h-3 mr-1" />
                          {app.cids.length} CID(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailsModal(app)}
                          >
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>KYC Application Details</DialogTitle>
            <DialogDescription>
              Review application before approving or rejecting
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Applicant Address</Label>
                  <p className="font-mono text-sm mt-1">{selectedApp.address}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Name</Label>
                  <p className="text-sm mt-1">{identities.get(selectedApp.address)?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Email</Label>
                  <p className="text-sm mt-1">{identities.get(selectedApp.address)?.email || 'No email'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Application Time</Label>
                  <p className="text-sm mt-1">
                    {selectedApp.timestamp
                      ? new Date(selectedApp.timestamp).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-gray-400">Notes</Label>
                <p className="text-sm mt-1 p-3 bg-gray-800/50 rounded border border-gray-700">
                  {selectedApp.notes}
                </p>
              </div>

              <div>
                <Label className="text-gray-400">IPFS Documents ({selectedApp.cids.length})</Label>
                <div className="mt-2 space-y-2">
                  {selectedApp.cids.map((cid, index) => (
                    <div key={index} className="p-2 bg-gray-800/50 rounded border border-gray-700">
                      <p className="font-mono text-xs">{cid}</p>
                      <a
                        href={`https://ipfs.io/ipfs/${cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 text-xs"
                      >
                        View on IPFS →
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <Alert className="bg-yellow-500/10 border-yellow-500/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Approving this application will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Unreserve the applicant&apos;s deposit</li>
                    <li>Mint a Welati (Citizen) NFT automatically</li>
                    <li>Enable trust score tracking</li>
                    <li>Grant governance voting rights</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedApp && handleReject(selectedApp)}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject
            </Button>
            <Button
              onClick={() => selectedApp && handleApprove(selectedApp)}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}
