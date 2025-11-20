import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { web3FromAddress } from '@polkadot/extension-dapp';
import {
  getStakingInfo,
  getActiveValidators,
  getMinNominatorBond,
  getBondingDuration,
  getCurrentEra,
  parseAmount,
  type StakingInfo
} from '@pezkuwi/lib/staking';
import { LoadingState } from '@pezkuwi/components/AsyncComponent';
import { ValidatorPoolDashboard } from './ValidatorPoolDashboard';
import { handleBlockchainError, handleBlockchainSuccess } from '@pezkuwi/lib/error-handler';

export const StakingDashboard: React.FC = () => {
  const { api, selectedAccount, isApiReady } = usePolkadot();
  const { balances, refreshBalances } = useWallet();

  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [validators, setValidators] = useState<string[]>([]);
  const [minNominatorBond, setMinNominatorBond] = useState('0');
  const [bondingDuration, setBondingDuration] = useState(28);

  const [bondAmount, setBondAmount] = useState('');
  const [unbondAmount, setUnbondAmount] = useState('');
  const [selectedValidators, setSelectedValidators] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch staking data
  useEffect(() => {
    const fetchStakingData = async () => {
      if (!api || !isApiReady || !selectedAccount) {
        return;
      }

      setIsLoadingData(true);
      try {
        const [info, activeVals, minBond, duration, era] = await Promise.all([
          getStakingInfo(api, selectedAccount.address),
          getActiveValidators(api),
          getMinNominatorBond(api),
          getBondingDuration(api),
          getCurrentEra(api)
        ]);

        setStakingInfo(info);
        setValidators(activeVals);
        setMinNominatorBond(minBond);
        setBondingDuration(duration);
        // Track current era for future use
        if (import.meta.env.DEV) console.log('Current era:', era);

        // Pre-select current nominations if any
        if (info.nominations.length > 0) {
          setSelectedValidators(info.nominations);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to fetch staking data:', error);
        toast.error('Failed to fetch staking information');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchStakingData();
    const interval = setInterval(fetchStakingData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [api, isApiReady, selectedAccount]);

  const handleBond = async () => {
    if (!api || !selectedAccount || !bondAmount) return;

    setIsLoading(true);
    try {
      const amount = parseAmount(bondAmount);

      // Validate
      if (parseFloat(bondAmount) < parseFloat(minNominatorBond)) {
        throw new Error(`Minimum bond is ${minNominatorBond} HEZ`);
      }

      if (parseFloat(bondAmount) > parseFloat(balances.HEZ)) {
        throw new Error('Insufficient HEZ balance');
      }

      const injector = await web3FromAddress(selectedAccount.address);

      // If already bonded, use bondExtra, otherwise use bond
      let tx;
      if (stakingInfo && parseFloat(stakingInfo.bonded) > 0) {
        tx = api.tx.staking.bondExtra(amount);
      } else {
        // For new bond, also need to specify reward destination
        tx = api.tx.staking.bond(amount, 'Staked'); // Auto-compound rewards
      }

      await tx.signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            if (import.meta.env.DEV) console.log('Transaction in block:', status.asInBlock.toHex());

            if (dispatchError) {
              handleBlockchainError(dispatchError, api, toast);
              setIsLoading(false);
            } else {
              handleBlockchainSuccess('staking.bonded', toast, { amount: bondAmount });
              setBondAmount('');
              refreshBalances();
              // Refresh staking data after a delay
              setTimeout(() => {
                if (api && selectedAccount) {
                  getStakingInfo(api, selectedAccount.address).then(setStakingInfo);
                }
              }, 3000);
              setIsLoading(false);
            }
          }
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) console.error('Bond failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to bond tokens');
      setIsLoading(false);
    }
  };

  const handleNominate = async () => {
    if (!api || !selectedAccount || selectedValidators.length === 0) return;

    if (!stakingInfo || parseFloat(stakingInfo.bonded) === 0) {
      toast.error('You must bond tokens before nominating validators');
      return;
    }

    setIsLoading(true);
    try {
      const injector = await web3FromAddress(selectedAccount.address);

      const tx = api.tx.staking.nominate(selectedValidators);

      await tx.signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            if (dispatchError) {
              handleBlockchainError(dispatchError, api, toast);
              setIsLoading(false);
            } else {
              handleBlockchainSuccess('staking.nominated', toast, { count: selectedValidators.length.toString() });
              // Refresh staking data
              setTimeout(() => {
                if (api && selectedAccount) {
                  getStakingInfo(api, selectedAccount.address).then(setStakingInfo);
                }
              }, 3000);
              setIsLoading(false);
            }
          }
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) console.error('Nomination failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to nominate validators');
      setIsLoading(false);
    }
  };

  const handleUnbond = async () => {
    if (!api || !selectedAccount || !unbondAmount) return;

    setIsLoading(true);
    try {
      const amount = parseAmount(unbondAmount);

      if (!stakingInfo || parseFloat(unbondAmount) > parseFloat(stakingInfo.active)) {
        throw new Error('Insufficient staked amount');
      }

      const injector = await web3FromAddress(selectedAccount.address);
      const tx = api.tx.staking.unbond(amount);

      await tx.signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            if (dispatchError) {
              handleBlockchainError(dispatchError, api, toast);
              setIsLoading(false);
            } else {
              handleBlockchainSuccess('staking.unbonded', toast, {
                amount: unbondAmount,
                duration: bondingDuration.toString()
              });
              setUnbondAmount('');
              setTimeout(() => {
                if (api && selectedAccount) {
                  getStakingInfo(api, selectedAccount.address).then(setStakingInfo);
                }
              }, 3000);
              setIsLoading(false);
            }
          }
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) console.error('Unbond failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unbond tokens');
      setIsLoading(false);
    }
  };

  const handleWithdrawUnbonded = async () => {
    if (!api || !selectedAccount) return;

    if (!stakingInfo || parseFloat(stakingInfo.redeemable) === 0) {
      toast.info('No tokens available to withdraw');
      return;
    }

    setIsLoading(true);
    try {
      const injector = await web3FromAddress(selectedAccount.address);

      // Number of slashing spans (usually 0)
      const tx = api.tx.staking.withdrawUnbonded(0);

      await tx.signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            if (dispatchError) {
              let errorMessage = 'Withdrawal failed';
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              }
              toast.error(errorMessage);
              setIsLoading(false);
            } else {
              toast.success(`Withdrew ${stakingInfo.redeemable} HEZ`);
              refreshBalances();
              setTimeout(() => {
                if (api && selectedAccount) {
                  getStakingInfo(api, selectedAccount.address).then(setStakingInfo);
                }
              }, 3000);
              setIsLoading(false);
            }
          }
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) console.error('Withdrawal failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to withdraw tokens');
      setIsLoading(false);
    }
  };

  const handleStartScoreTracking = async () => {
    if (!api || !selectedAccount) return;

    if (!stakingInfo || parseFloat(stakingInfo.bonded) === 0) {
      toast.error('You must bond tokens before starting score tracking');
      return;
    }

    setIsLoading(true);
    try {
      const injector = await web3FromAddress(selectedAccount.address);
      const tx = api.tx.stakingScore.startScoreTracking();

      await tx.signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            if (dispatchError) {
              let errorMessage = 'Failed to start score tracking';
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              }
              toast.error(errorMessage);
              setIsLoading(false);
            } else {
              toast.success('Score tracking started successfully! Your staking score will now accumulate over time.');
              // Refresh staking data after a delay
              setTimeout(() => {
                if (api && selectedAccount) {
                  getStakingInfo(api, selectedAccount.address).then(setStakingInfo);
                }
              }, 3000);
              setIsLoading(false);
            }
          }
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) console.error('Start score tracking failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start score tracking');
      setIsLoading(false);
    }
  };

  const toggleValidator = (validator: string) => {
    setSelectedValidators(prev => {
      if (prev.includes(validator)) {
        return prev.filter(v => v !== validator);
      } else {
        // Max 16 nominations
        if (prev.length >= 16) {
          toast.info('Maximum 16 validators can be nominated');
          return prev;
        }
        return [...prev, validator];
      }
    });
  };

  if (isLoadingData) {
    return <LoadingState message="Loading staking data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">Total Bonded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stakingInfo?.bonded || '0'} HEZ
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Active: {stakingInfo?.active || '0'} HEZ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">Unlocking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stakingInfo?.unlocking.reduce((sum, u) => sum + parseFloat(u.amount), 0).toFixed(2) || '0'} HEZ
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stakingInfo?.unlocking.length || 0} chunk(s)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">Redeemable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stakingInfo?.redeemable || '0'} HEZ
            </div>
            <Button
              size="sm"
              onClick={handleWithdrawUnbonded}
              disabled={!stakingInfo || parseFloat(stakingInfo.redeemable) === 0 || isLoading}
              className="mt-2 w-full"
            >
              Withdraw
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">Staking Score</CardTitle>
          </CardHeader>
          <CardContent>
            {stakingInfo?.hasStartedScoreTracking ? (
              <>
                <div className="text-2xl font-bold text-purple-500">
                  {stakingInfo.stakingScore}/100
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Duration: {stakingInfo.stakingDuration
                    ? `${Math.floor(stakingInfo.stakingDuration / (24 * 60 * 10))} days`
                    : '0 days'}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-500">Not Started</div>
                <Button
                  size="sm"
                  onClick={handleStartScoreTracking}
                  disabled={!stakingInfo || parseFloat(stakingInfo.bonded) === 0 || isLoading}
                  className="mt-2 w-full bg-purple-600 hover:bg-purple-700"
                >
                  Start Score Tracking
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">PEZ Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            {stakingInfo?.pezRewards && stakingInfo.pezRewards.hasPendingClaim ? (
              <>
                <div className="text-2xl font-bold text-orange-500">
                  {parseFloat(stakingInfo.pezRewards.totalClaimable).toFixed(2)} PEZ
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stakingInfo.pezRewards.claimableRewards.length} epoch(s) to claim
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.info('Claim PEZ rewards functionality will be available soon');
                  }}
                  disabled={isLoading}
                  className="mt-2 w-full bg-orange-600 hover:bg-orange-700"
                >
                  Claim Rewards
                </Button>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-500">0 PEZ</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stakingInfo?.pezRewards
                    ? `Epoch ${stakingInfo.pezRewards.currentEpoch}`
                    : 'No rewards available'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Staking Interface */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl text-white">Staking</CardTitle>
          <CardDescription className="text-gray-400">
            Stake HEZ to secure the network and earn rewards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stake">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stake">Stake</TabsTrigger>
              <TabsTrigger value="nominate">Nominate</TabsTrigger>
              <TabsTrigger value="pool">Validator Pool</TabsTrigger>
              <TabsTrigger value="unstake">Unstake</TabsTrigger>
            </TabsList>

            {/* STAKE TAB */}
            <TabsContent value="stake" className="space-y-4">
              <Alert className="bg-blue-900/20 border-blue-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Minimum bond: {minNominatorBond} HEZ. Bonded tokens are locked and earn rewards when nominated validators produce blocks.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Amount to Bond (HEZ)</Label>
                <Input
                  type="number"
                  placeholder={`Min: ${minNominatorBond}`}
                  value={bondAmount}
                  onChange={(e) => setBondAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  disabled={isLoading}
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Available: {balances.HEZ} HEZ</span>
                  <button
                    onClick={() => setBondAmount(balances.HEZ)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Max
                  </button>
                </div>
              </div>

              <Button
                onClick={handleBond}
                disabled={isLoading || !bondAmount || parseFloat(bondAmount) < parseFloat(minNominatorBond)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {stakingInfo && parseFloat(stakingInfo.bonded) > 0 ? 'Bond Additional' : 'Bond Tokens'}
              </Button>
            </TabsContent>

            {/* NOMINATE TAB */}
            <TabsContent value="nominate" className="space-y-4">
              <Alert className="bg-purple-900/20 border-purple-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Select up to 16 validators to nominate. Your stake will be distributed to active validators.
                  {stakingInfo && parseFloat(stakingInfo.bonded) === 0 && ' You must bond tokens first.'}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Active Validators ({validators.length})</Label>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-700 rounded-lg p-3 bg-gray-800">
                  {validators.map((validator) => (
                    <div
                      key={validator}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedValidators.includes(validator)
                          ? 'bg-purple-900/30 border border-purple-500'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => toggleValidator(validator)}
                    >
                      <span className="text-sm font-mono truncate flex-1">
                        {validator.slice(0, 8)}...{validator.slice(-8)}
                      </span>
                      {selectedValidators.includes(validator) && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400 ml-2" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  Selected: {selectedValidators.length}/16
                </p>
              </div>

              <Button
                onClick={handleNominate}
                disabled={isLoading || selectedValidators.length === 0 || !stakingInfo || parseFloat(stakingInfo.bonded) === 0}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Nominate Validators
              </Button>
            </TabsContent>

            {/* VALIDATOR POOL TAB */}
            <TabsContent value="pool" className="space-y-4">
              <ValidatorPoolDashboard />
            </TabsContent>

            {/* UNSTAKE TAB */}
            <TabsContent value="unstake" className="space-y-4">
              <Alert className="bg-yellow-900/20 border-yellow-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Unbonded tokens will be locked for {bondingDuration} eras (~{Math.floor(bondingDuration / 4)} days) before withdrawal.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Amount to Unbond (HEZ)</Label>
                <Input
                  type="number"
                  placeholder={`Max: ${stakingInfo?.active || '0'}`}
                  value={unbondAmount}
                  onChange={(e) => setUnbondAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  disabled={isLoading}
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Staked: {stakingInfo?.active || '0'} HEZ</span>
                  <button
                    onClick={() => setUnbondAmount(stakingInfo?.active || '0')}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Max
                  </button>
                </div>
              </div>

              {stakingInfo && stakingInfo.unlocking.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                  <Label className="text-sm">Unlocking Chunks</Label>
                  {stakingInfo.unlocking.map((chunk, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-400">{chunk.amount} HEZ</span>
                      <span className="text-gray-500">
                        Era {chunk.era} ({chunk.blocksRemaining > 0 ? `~${Math.floor(chunk.blocksRemaining / 600)} blocks` : 'Ready'})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleUnbond}
                disabled={isLoading || !unbondAmount || !stakingInfo || parseFloat(stakingInfo.active) === 0}
                className="w-full bg-red-600 hover:bg-red-700"
                variant="destructive"
              >
                Unbond Tokens
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
