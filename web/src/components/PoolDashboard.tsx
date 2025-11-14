import React, { useState, useEffect } from 'react';
import {  TrendingUp, Droplet, DollarSign, Percent, Info, AlertTriangle, BarChart3, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { ASSET_IDS, getAssetSymbol } from '@pezkuwi/lib/wallet';
import { AddLiquidityModal } from '@/components/AddLiquidityModal';
import { RemoveLiquidityModal } from '@/components/RemoveLiquidityModal';

// Helper function to convert asset IDs to user-friendly display names
// Users should only see HEZ, PEZ, USDT - wrapped tokens are backend details
const getDisplayTokenName = (assetId: number): string => {
  if (assetId === ASSET_IDS.WHEZ || assetId === 0) return 'HEZ';
  if (assetId === ASSET_IDS.PEZ || assetId === 1) return 'PEZ';
  if (assetId === ASSET_IDS.WUSDT || assetId === 2) return 'USDT';
  return getAssetSymbol(assetId); // Fallback for other assets
};

// Helper function to get decimals for each asset
const getAssetDecimals = (assetId: number): number => {
  if (assetId === ASSET_IDS.WUSDT) return 6; // wUSDT has 6 decimals
  return 12; // wHEZ, PEZ have 12 decimals
};

interface PoolData {
  asset0: number;
  asset1: number;
  reserve0: number;
  reserve1: number;
  lpTokenId: number;
  poolAccount: string;
}

interface LPPosition {
  lpTokenBalance: number;
  share: number; // Percentage of pool
  asset0Amount: number;
  asset1Amount: number;
}

const PoolDashboard = () => {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const { balances } = useWallet();

  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [lpPosition, setLPPosition] = useState<LPPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddLiquidityModalOpen, setIsAddLiquidityModalOpen] = useState(false);
  const [isRemoveLiquidityModalOpen, setIsRemoveLiquidityModalOpen] = useState(false);

  // Pool selection state
  const [availablePools, setAvailablePools] = useState<Array<[number, number]>>([]);
  const [selectedPool, setSelectedPool] = useState<string>('1-2'); // Default: PEZ/wUSDT

  // Discover available pools
  useEffect(() => {
    if (!api || !isApiReady) return;

    const discoverPools = async () => {
      try {
        // Check all possible pool combinations
        const possiblePools: Array<[number, number]> = [
          [ASSET_IDS.WHEZ, ASSET_IDS.PEZ],     // wHEZ/PEZ
          [ASSET_IDS.WHEZ, ASSET_IDS.WUSDT],   // wHEZ/wUSDT
          [ASSET_IDS.PEZ, ASSET_IDS.WUSDT],    // PEZ/wUSDT
        ];

        const existingPools: Array<[number, number]> = [];

        for (const [asset0, asset1] of possiblePools) {
          const poolInfo = await api.query.assetConversion.pools([asset0, asset1]);
          if (poolInfo.isSome) {
            existingPools.push([asset0, asset1]);
          }
        }

        setAvailablePools(existingPools);

        // Set default pool to first available if current selection doesn't exist
        if (existingPools.length > 0) {
          const currentPoolKey = selectedPool;
          const poolExists = existingPools.some(
            ([a0, a1]) => `${a0}-${a1}` === currentPoolKey
          );
          if (!poolExists) {
            const [firstAsset0, firstAsset1] = existingPools[0];
            setSelectedPool(`${firstAsset0}-${firstAsset1}`);
          }
        }
      } catch (err) {
        console.error('Error discovering pools:', err);
      }
    };

    discoverPools();
  }, [api, isApiReady]);

  // Fetch pool data
  useEffect(() => {
    if (!api || !isApiReady || !selectedPool) return;

    const fetchPoolData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Parse selected pool (e.g., "1-2" -> [1, 2])
        const [asset1Str, asset2Str] = selectedPool.split('-');
        const asset1 = parseInt(asset1Str);
        const asset2 = parseInt(asset2Str);
        const poolId = [asset1, asset2];

        const poolInfo = await api.query.assetConversion.pools(poolId);

        if (poolInfo.isSome) {
          const lpTokenData = poolInfo.unwrap().toJSON() as any;
          const lpTokenId = lpTokenData.lpToken;

          // Derive pool account using AccountIdConverter
          const { stringToU8a } = await import('@polkadot/util');
          const { blake2AsU8a } = await import('@polkadot/util-crypto');

          // PalletId for AssetConversion: "py/ascon" (8 bytes)
          const PALLET_ID = stringToU8a('py/ascon');

          // Create PoolId tuple (u32, u32)
          const poolIdType = api.createType('(u32, u32)', [asset1, asset2]);

          // Create (PalletId, PoolId) tuple: ([u8; 8], (u32, u32))
          const palletIdType = api.createType('[u8; 8]', PALLET_ID);
          const fullTuple = api.createType('([u8; 8], (u32, u32))', [palletIdType, poolIdType]);

          // Hash the SCALE-encoded tuple
          const accountHash = blake2AsU8a(fullTuple.toU8a(), 256);
          const poolAccountId = api.createType('AccountId32', accountHash);
          const poolAccount = poolAccountId.toString();

          // Get reserves
          const asset0BalanceData = await api.query.assets.account(asset1, poolAccountId);
          const asset1BalanceData = await api.query.assets.account(asset2, poolAccountId);

          let reserve0 = 0;
          let reserve1 = 0;

          // Use dynamic decimals for each asset
          const asset1Decimals = getAssetDecimals(asset1);
          const asset2Decimals = getAssetDecimals(asset2);

          if (asset0BalanceData.isSome) {
            const asset0Data = asset0BalanceData.unwrap().toJSON() as any;
            reserve0 = Number(asset0Data.balance) / Math.pow(10, asset1Decimals);
          }

          if (asset1BalanceData.isSome) {
            const asset1Data = asset1BalanceData.unwrap().toJSON() as any;
            reserve1 = Number(asset1Data.balance) / Math.pow(10, asset2Decimals);
          }

          setPoolData({
            asset0: asset1,
            asset1: asset2,
            reserve0,
            reserve1,
            lpTokenId,
            poolAccount,
          });

          // Get user's LP position if account connected
          if (selectedAccount) {
            await fetchLPPosition(lpTokenId, reserve0, reserve1);
          }
        } else {
          setError('Pool not found');
        }
      } catch (err) {
        console.error('Error fetching pool data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pool data');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchLPPosition = async (lpTokenId: number, reserve0: number, reserve1: number) => {
      if (!api || !selectedAccount) return;

      try {
        // Query user's LP token balance
        const lpBalance = await api.query.poolAssets.account(lpTokenId, selectedAccount.address);

        if (lpBalance.isSome) {
          const lpData = lpBalance.unwrap().toJSON() as any;
          const userLpBalance = Number(lpData.balance) / 1e12;

          // Query total LP supply
          const lpAssetData = await api.query.poolAssets.asset(lpTokenId);

          if (lpAssetData.isSome) {
            const assetInfo = lpAssetData.unwrap().toJSON() as any;
            const totalSupply = Number(assetInfo.supply) / 1e12;

            // Calculate user's share
            const sharePercentage = (userLpBalance / totalSupply) * 100;

            // Calculate user's actual token amounts
            const asset0Amount = (sharePercentage / 100) * reserve0;
            const asset1Amount = (sharePercentage / 100) * reserve1;

            setLPPosition({
              lpTokenBalance: userLpBalance,
              share: sharePercentage,
              asset0Amount,
              asset1Amount,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching LP position:', err);
      }
    };

    fetchPoolData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPoolData, 30000);

    return () => clearInterval(interval);
  }, [api, isApiReady, selectedAccount, selectedPool]);

  // Calculate metrics
  const constantProduct = poolData ? poolData.reserve0 * poolData.reserve1 : 0;
  const currentPrice = poolData ? poolData.reserve1 / poolData.reserve0 : 0;
  const totalLiquidityUSD = poolData ? poolData.reserve0 * 2 : 0; // Simplified: assumes 1:1 USD peg

  // APR calculation (simplified - would need 24h volume data)
  const estimateAPR = () => {
    if (!poolData) return 0;

    // Estimate based on pool size and typical volume
    // This is a simplified calculation
    // Real APR = (24h fees × 365) / TVL
    const dailyVolumeEstimate = totalLiquidityUSD * 0.1; // Assume 10% daily turnover
    const dailyFees = dailyVolumeEstimate * 0.03; // 3% fee
    const annualFees = dailyFees * 365;
    const apr = (annualFees / totalLiquidityUSD) * 100;

    return apr;
  };

  // Impermanent loss calculator
  const calculateImpermanentLoss = (priceChange: number) => {
    // IL formula: 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
    const priceRatio = 1 + priceChange / 100;
    const il = ((2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1) * 100;
    return il;
  };

  if (isLoading && !poolData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading pool data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-900/20 border-red-500">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!poolData) {
    return (
      <Alert className="bg-yellow-900/20 border-yellow-500">
        <Info className="h-4 w-4" />
        <AlertDescription>No pool data available</AlertDescription>
      </Alert>
    );
  }

  // Get asset symbols for the selected pool (using display names)
  const asset0Symbol = poolData ? getDisplayTokenName(poolData.asset0) : '';
  const asset1Symbol = poolData ? getDisplayTokenName(poolData.asset1) : '';

  return (
    <div className="space-y-6">
      {/* Pool Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Pool Dashboards</h3>
            <Select value={selectedPool} onValueChange={setSelectedPool}>
              <SelectTrigger className="w-[240px] bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Select pool" />
              </SelectTrigger>
              <SelectContent>
                {availablePools.map(([asset0, asset1]) => {
                  const symbol0 = getDisplayTokenName(asset0);
                  const symbol1 = getDisplayTokenName(asset1);
                  return (
                    <SelectItem key={`${asset0}-${asset1}`} value={`${asset0}-${asset1}`}>
                      {symbol0}/{symbol1}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Live
        </Badge>
      </div>

      {/* Pool Dashboard Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Droplet className="h-6 w-6 text-blue-400" />
            {asset0Symbol}/{asset1Symbol} Pool Dashboard
          </h2>
          <p className="text-gray-400 mt-1">Monitor liquidity pool metrics and your position</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liquidity */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Liquidity</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${totalLiquidityUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {poolData.reserve0.toLocaleString()} {asset0Symbol} + {poolData.reserve1.toLocaleString()} {asset1Symbol}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        {/* Current Price */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">{asset0Symbol} Price</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${currentPrice.toFixed(4)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                1 {asset1Symbol} = {(1 / currentPrice).toFixed(4)} {asset0Symbol}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        {/* APR */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">Estimated APR</p>
              <p className="text-2xl font-bold text-white mt-1">
                {estimateAPR().toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                From swap fees
              </p>
            </div>
            <Percent className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>

        {/* Constant Product */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">Constant (k)</p>
              <p className="text-2xl font-bold text-white mt-1">
                {(constantProduct / 1e9).toFixed(1)}B
              </p>
              <p className="text-xs text-gray-500 mt-1">
                x × y = k
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="reserves" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="reserves">Reserves</TabsTrigger>
          <TabsTrigger value="position">Your Position</TabsTrigger>
          <TabsTrigger value="calculator">IL Calculator</TabsTrigger>
        </TabsList>

        {/* Reserves Tab */}
        <TabsContent value="reserves" className="space-y-4">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Pool Reserves</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">{asset0Symbol} Reserve</p>
                  <p className="text-2xl font-bold text-white">{poolData.reserve0.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
                <Badge variant="outline">Asset 1</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">{asset1Symbol} Reserve</p>
                  <p className="text-2xl font-bold text-white">{poolData.reserve1.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
                <Badge variant="outline">Asset 2</Badge>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-blue-400 mb-1">AMM Formula</p>
                  <p>Pool maintains constant product: x × y = k</p>
                  <p className="mt-2 font-mono text-xs">
                    {poolData.reserve0.toFixed(2)} × {poolData.reserve1.toFixed(2)} = {constantProduct.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Your Position Tab */}
        <TabsContent value="position" className="space-y-4">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Your Liquidity Position</h3>

            {!selectedAccount ? (
              <Alert className="bg-yellow-900/20 border-yellow-500">
                <Info className="h-4 w-4" />
                <AlertDescription>Connect wallet to view your position</AlertDescription>
              </Alert>
            ) : !lpPosition ? (
              <div className="text-center py-8 text-gray-400">
                <Droplet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No liquidity position found</p>
                <Button
                  onClick={() => setIsAddLiquidityModalOpen(true)}
                  className="mt-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Add Liquidity
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-400">LP Tokens</p>
                    <p className="text-xl font-bold text-white">{lpPosition.lpTokenBalance.toFixed(4)}</p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-400">Pool Share</p>
                    <p className="text-xl font-bold text-white">{lpPosition.share.toFixed(4)}%</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Your Position Value</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">{asset0Symbol}:</span>
                      <span className="text-white font-semibold">{lpPosition.asset0Amount.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">{asset1Symbol}:</span>
                      <span className="text-white font-semibold">{lpPosition.asset1Amount.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Estimated Earnings (APR {estimateAPR().toFixed(2)}%)</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Daily:</span>
                      <span className="text-green-400">~{((lpPosition.asset0Amount * 2 * estimateAPR()) / 365 / 100).toFixed(4)} {asset0Symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Monthly:</span>
                      <span className="text-green-400">~{((lpPosition.asset0Amount * 2 * estimateAPR()) / 12 / 100).toFixed(4)} {asset0Symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Yearly:</span>
                      <span className="text-green-400">~{((lpPosition.asset0Amount * 2 * estimateAPR()) / 100).toFixed(4)} {asset0Symbol}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => setIsAddLiquidityModalOpen(true)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    Add More
                  </Button>
                  <Button
                    onClick={() => setIsRemoveLiquidityModalOpen(true)}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Impermanent Loss Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Impermanent Loss Calculator</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-3">If {asset0Symbol} price changes by:</p>

                <div className="space-y-2">
                  {[10, 25, 50, 100, 200].map((change) => {
                    const il = calculateImpermanentLoss(change);
                    return (
                      <div key={change} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                        <span className="text-gray-300">+{change}%</span>
                        <Badge
                          variant="outline"
                          className={il < -1 ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'}
                        >
                          {il.toFixed(2)}% Loss
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Alert className="bg-orange-900/20 border-orange-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">What is Impermanent Loss?</p>
                  <p className="text-sm text-gray-300">
                    Impermanent loss occurs when the price ratio of tokens in the pool changes.
                    The larger the price change, the greater the loss compared to simply holding the tokens.
                    Fees earned from swaps can offset this loss over time.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddLiquidityModal
        isOpen={isAddLiquidityModalOpen}
        onClose={() => setIsAddLiquidityModalOpen(false)}
        asset0={poolData?.asset0}
        asset1={poolData?.asset1}
      />

      {lpPosition && poolData && (
        <RemoveLiquidityModal
          isOpen={isRemoveLiquidityModalOpen}
          onClose={() => setIsRemoveLiquidityModalOpen(false)}
          lpPosition={lpPosition}
          lpTokenId={poolData.lpTokenId}
          asset0={poolData.asset0}
          asset1={poolData.asset1}
        />
      )}
    </div>
  );
};

export default PoolDashboard;
