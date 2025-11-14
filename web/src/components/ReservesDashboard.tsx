import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Shield, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { getWUSDTTotalSupply, checkReserveHealth, formatWUSDT } from '@/lib/usdt';
import { MultisigMembers } from './MultisigMembers';

interface ReservesDashboardProps {
  specificAddresses?: Record<string, string>;
  offChainReserveAmount?: number; // Manual input for MVP
}

export const ReservesDashboard: React.FC<ReservesDashboardProps> = ({
  specificAddresses = {},
  offChainReserveAmount = 0,
}) => {
  const { api, isApiReady } = usePolkadot();

  const [wusdtSupply, setWusdtSupply] = useState(0);
  const [offChainReserve, setOffChainReserve] = useState(offChainReserveAmount);
  const [collateralRatio, setCollateralRatio] = useState(0);
  const [isHealthy, setIsHealthy] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch reserve data
  const fetchReserveData = async () => {
    if (!api || !isApiReady) return;

    setLoading(true);
    try {
      const supply = await getWUSDTTotalSupply(api);
      setWusdtSupply(supply);

      const health = await checkReserveHealth(api, offChainReserve);
      setCollateralRatio(health.collateralRatio);
      setIsHealthy(health.isHealthy);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching reserve data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserveData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReserveData, 30000);
    return () => clearInterval(interval);
  }, [api, isApiReady, offChainReserve]);

  const getHealthColor = () => {
    if (collateralRatio >= 105) return 'text-green-500';
    if (collateralRatio >= 100) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthStatus = () => {
    if (collateralRatio >= 105) return 'Healthy';
    if (collateralRatio >= 100) return 'Warning';
    return 'Critical';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            USDT Reserves Dashboard
          </h2>
          <p className="text-gray-400 mt-1">Real-time reserve status and multisig info</p>
        </div>
        <Button
          onClick={fetchReserveData}
          variant="outline"
          size="sm"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Supply */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">Total wUSDT Supply</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${formatWUSDT(wusdtSupply)}
              </p>
              <p className="text-xs text-gray-500 mt-1">On-chain (Assets pallet)</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        {/* Off-chain Reserve */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">Off-chain USDT Reserve</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${formatWUSDT(offChainReserve)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={offChainReserve}
                  onChange={(e) => setOffChainReserve(parseFloat(e.target.value) || 0)}
                  className="w-24 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                  placeholder="Amount"
                />
                <Button size="sm" variant="ghost" onClick={fetchReserveData} className="text-xs h-6">
                  Update
                </Button>
              </div>
            </div>
            <Shield className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        {/* Collateral Ratio */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">Collateral Ratio</p>
              <p className={`text-2xl font-bold mt-1 ${getHealthColor()}`}>
                {collateralRatio.toFixed(2)}%
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={isHealthy ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {getHealthStatus()}
                </Badge>
              </div>
            </div>
            <TrendingUp className={`h-8 w-8 ${getHealthColor()}`} />
          </div>
        </Card>
      </div>

      {/* Health Alert */}
      {!isHealthy && (
        <Alert className="bg-red-900/20 border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold">Under-collateralized!</p>
            <p className="text-sm">
              Reserve ratio is below 100%. Off-chain USDT reserves ({formatWUSDT(offChainReserve)})
              are less than on-chain wUSDT supply ({formatWUSDT(wusdtSupply)}).
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="multisig">Multisig</TabsTrigger>
          <TabsTrigger value="proof">Proof of Reserves</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Reserve Details</h3>

            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-gray-900/50 rounded">
                <span className="text-gray-300">On-chain wUSDT</span>
                <span className="text-white font-semibold">${formatWUSDT(wusdtSupply)}</span>
              </div>

              <div className="flex justify-between p-3 bg-gray-900/50 rounded">
                <span className="text-gray-300">Off-chain USDT</span>
                <span className="text-white font-semibold">${formatWUSDT(offChainReserve)}</span>
              </div>

              <div className="flex justify-between p-3 bg-gray-900/50 rounded">
                <span className="text-gray-300">Backing Ratio</span>
                <span className={`font-semibold ${getHealthColor()}`}>
                  {collateralRatio.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between p-3 bg-gray-900/50 rounded">
                <span className="text-gray-300">Status</span>
                <Badge variant={isHealthy ? 'default' : 'destructive'}>
                  {getHealthStatus()}
                </Badge>
              </div>

              <div className="flex justify-between p-3 bg-gray-900/50 rounded">
                <span className="text-gray-300">Last Updated</span>
                <span className="text-gray-400 text-sm">{lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>

            <Alert className="mt-4 bg-blue-900/20 border-blue-500">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-1">1:1 Backing</p>
                <p className="text-sm">
                  Every wUSDT is backed by real USDT held in the multisig treasury.
                  Target ratio: ≥100% (ideally 105% for safety buffer).
                </p>
              </AlertDescription>
            </Alert>
          </Card>
        </TabsContent>

        {/* Multisig Tab */}
        <TabsContent value="multisig">
          <MultisigMembers
            specificAddresses={specificAddresses}
            showMultisigAddress={true}
          />
        </TabsContent>

        {/* Proof of Reserves Tab */}
        <TabsContent value="proof" className="space-y-4">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Proof of Reserves</h3>

            <div className="space-y-4">
              <Alert className="bg-green-900/20 border-green-500">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">How to Verify Reserves:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Check on-chain wUSDT supply via Polkadot.js Apps</li>
                    <li>Verify multisig account balance (if reserves on-chain)</li>
                    <li>Compare with off-chain treasury (bank/exchange account)</li>
                    <li>Ensure ratio ≥ 100%</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-3">Quick Links:</p>
                <div className="space-y-2">
                  <a
                    href="https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944#/assets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View wUSDT Asset on Polkadot.js
                  </a>
                  <a
                    href="https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944#/accounts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Multisig Account
                  </a>
                </div>
              </div>

              <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <p className="text-sm font-semibold text-orange-400 mb-2">
                  Note: Off-chain Reserves
                </p>
                <p className="text-sm text-gray-300">
                  In this MVP implementation, off-chain USDT reserves are manually reported.
                  For full decentralization, consider integrating with oracle services or
                  using XCM bridge for on-chain verification.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
