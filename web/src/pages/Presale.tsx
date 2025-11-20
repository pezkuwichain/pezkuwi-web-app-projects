import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Timer, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Presale() {
  const { t } = useTranslation();
  const { api, selectedAccount, isApiReady } = usePolkadot();
  const { balances } = useWallet();

  const [wusdtAmount, setWusdtAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalRaised, setTotalRaised] = useState('0');
  const [myContribution, setMyContribution] = useState('0');
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contributorsCount, setContributorsCount] = useState(0);

  useEffect(() => {
    if (isApiReady) {
      loadPresaleData();
      const interval = setInterval(loadPresaleData, 10000);
      return () => clearInterval(interval);
    }
  }, [api, selectedAccount, isApiReady]);

  const loadPresaleData = async () => {
    if (!api) return;

    try {
      // Check if presale active
      const isActive = await api.query.presale.presaleActive();
      setActive(isActive.toHuman() as boolean);

      // Check if paused
      const isPaused = await api.query.presale.paused();
      setPaused(isPaused.toHuman() as boolean);

      if (!isActive.toHuman()) return;

      // Get start block and calculate time remaining
      const startBlock = await api.query.presale.presaleStartBlock();
      const currentBlock = await api.query.system.number();

      if (startBlock.isSome) {
        const start = startBlock.unwrap().toNumber();
        const current = currentBlock.toNumber();
        const duration = 45 * 24 * 60 * 10; // 45 days in blocks (6s blocks)
        const end = start + duration;
        const remaining = Math.max(0, end - current);
        setTimeRemaining(remaining * 6); // blocks to seconds
      }

      // Get total raised
      const raised = await api.query.presale.totalRaised();
      const raisedValue = raised.toString();
      setTotalRaised((parseInt(raisedValue) / 1_000_000).toFixed(2)); // 6 decimals to USDT

      // Get contributors count
      const contributors = await api.query.presale.contributors();
      const contributorsList = contributors.toHuman() as string[];
      setContributorsCount(contributorsList?.length || 0);

      // Get my contribution if wallet connected
      if (selectedAccount) {
        const contribution = await api.query.presale.contributions(selectedAccount.address);
        const contributionValue = contribution.toString();
        setMyContribution((parseInt(contributionValue) / 1_000_000).toFixed(2));
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading presale data:', error);
    }
  };

  const handleContribute = async () => {
    if (!api || !selectedAccount) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!wusdtAmount || parseFloat(wusdtAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(wusdtAmount);
    const wusdtBalance = parseFloat(balances.USDT);

    if (amount > wusdtBalance) {
      toast.error(`Insufficient wUSDT balance. You have ${wusdtBalance} wUSDT`);
      return;
    }

    setLoading(true);

    try {
      const amountWithDecimals = Math.floor(amount * 1_000_000); // 6 decimals

      const tx = api.tx.presale.contribute(amountWithDecimals);

      await tx.signAndSend(selectedAccount.address, ({ status, events }) => {
        if (status.isInBlock) {
          if (import.meta.env.DEV) {
            console.log(`Transaction included in block: ${status.asInBlock}`);
          }

          // Check for errors
          events.forEach(({ event }) => {
            if (api.events.system.ExtrinsicFailed.is(event)) {
              const [dispatchError] = event.data;
              let errorMsg = 'Transaction failed';

              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMsg = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }

              toast.error(errorMsg);
              setLoading(false);
            } else if (api.events.presale?.Contributed?.is(event)) {
              toast.success(`Successfully contributed ${amount} wUSDT!`);
              setWusdtAmount('');
              loadPresaleData();
              setLoading(false);
            }
          });
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Contribution error:', error);
      toast.error('Contribution failed. Please try again.');
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const calculatePezReceived = (wusdtAmount: string): number => {
    const amount = parseFloat(wusdtAmount);
    return isNaN(amount) ? 0 : amount * 100; // 1 wUSDT = 100 PEZ
  };

  const progressPercentage = () => {
    const target = 1_000_000; // Target: $1M
    const current = parseFloat(totalRaised);
    return Math.min(100, (current / target) * 100);
  };

  if (!active) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="p-8 text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Timer className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">PEZ Token Pre-Sale</h1>
            <p className="text-muted-foreground">
              {t('presale.notStarted', 'The pre-sale has not started yet. Please check back soon!')}
            </p>
          </div>

          <div className="p-6 bg-muted rounded-lg mt-6">
            <h3 className="font-semibold mb-3">Pre-Sale Details</h3>
            <div className="space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">45 Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conversion Rate:</span>
                <span className="font-medium">1 wUSDT = 100 PEZ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accepted Token:</span>
                <span className="font-medium">wUSDT</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
            PEZ Token Pre-Sale
          </h1>
          <p className="text-muted-foreground">
            Contribute wUSDT and receive PEZ tokens at a special rate
          </p>
        </div>

        {paused && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-600 dark:text-yellow-400">
              Pre-sale is temporarily paused. Contributions are disabled.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-muted-foreground">Time Remaining</h3>
              <Timer className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-400">{formatTime(timeRemaining)}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-muted-foreground">Total Raised</h3>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-400">${totalRaised}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-muted-foreground">Contributors</h3>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{contributorsCount}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-muted-foreground">Your Contribution</h3>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">${myContribution}</p>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Fundraising Progress</h3>
            <span className="text-sm text-muted-foreground">{progressPercentage().toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage()} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            Target: $1,000,000 USDT
          </p>
        </Card>

        {/* Contribution Form */}
        <Card className="p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Contribute to Pre-Sale</h2>

          {!selectedAccount ? (
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-600 dark:text-blue-400">
                Please connect your PezkuwiChain wallet to participate in the pre-sale.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Your wUSDT Balance</label>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-lg font-semibold">{balances.USDT} wUSDT</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">wUSDT Amount</label>
                <Input
                  type="number"
                  value={wusdtAmount}
                  onChange={(e) => setWusdtAmount(e.target.value)}
                  placeholder="100"
                  min="0"
                  step="0.01"
                  disabled={paused || loading}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  You will receive: <span className="font-semibold text-green-500">{calculatePezReceived(wusdtAmount).toLocaleString()} PEZ</span>
                </p>
              </div>

              <Button
                onClick={handleContribute}
                className="w-full"
                size="lg"
                disabled={!selectedAccount || !wusdtAmount || paused || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Contributing...' : 'Contribute wUSDT'}
              </Button>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  Pre-Sale Terms
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversion Rate:</span>
                    <span className="font-medium">1 wUSDT = 100 PEZ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distribution:</span>
                    <span className="font-medium">After 45 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lock Period:</span>
                    <span className="font-medium">None</span>
                  </div>
                </div>
              </div>

              {parseFloat(balances.USDT) === 0 && (
                <Alert className="mt-4 border-yellow-500/50 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                    You don't have wUSDT. Please bridge USDT to wUSDT first.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8 max-w-4xl mx-auto">
          <Card className="p-6">
            <h3 className="font-semibold mb-3">How to Participate</h3>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Connect your PezkuwiChain wallet</li>
              <li>Ensure you have wUSDT (bridge if needed)</li>
              <li>Enter the amount you want to contribute</li>
              <li>Confirm the transaction</li>
              <li>Receive PEZ after 45 days</li>
            </ol>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Important Notes</h3>
            <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
              <li>Minimum contribution: 1 wUSDT</li>
              <li>PEZ will be distributed automatically after presale ends</li>
              <li>Contributions are final and non-refundable</li>
              <li>Pre-sale duration: 45 days</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
