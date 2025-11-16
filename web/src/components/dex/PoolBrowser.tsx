import React, { useState, useEffect } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Droplet, BarChart3, Search, Plus } from 'lucide-react';
import { PoolInfo } from '@/types/dex';
import { fetchPools, formatTokenBalance } from '@pezkuwi/utils/dex';
import { isFounderWallet } from '@pezkuwi/utils/auth';
import { LoadingState } from '@pezkuwi/components/AsyncComponent';

interface PoolBrowserProps {
  onAddLiquidity?: (pool: PoolInfo) => void;
  onRemoveLiquidity?: (pool: PoolInfo) => void;
  onSwap?: (pool: PoolInfo) => void;
  onCreatePool?: () => void;
}

export const PoolBrowser: React.FC<PoolBrowserProps> = ({
  onAddLiquidity,
  onRemoveLiquidity,
  onSwap,
  onCreatePool,
}) => {
  const { api, isApiReady } = usePolkadot();
  const { account } = useWallet();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'tvl' | 'volume' | 'apr'>('tvl');

  const isFounder = account ? isFounderWallet(account.address) : false;

  useEffect(() => {
    const loadPools = async () => {
      if (!api || !isApiReady) return;

      try {
        setLoading(true);
        const poolsData = await fetchPools(api);
        setPools(poolsData);
      } catch (error) {
        console.error('Failed to load pools:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPools();

    // Refresh pools every 10 seconds
    const interval = setInterval(loadPools, 10000);
    return () => clearInterval(interval);
  }, [api, isApiReady]);

  const filteredPools = pools.filter((pool) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      pool.asset1Symbol.toLowerCase().includes(search) ||
      pool.asset2Symbol.toLowerCase().includes(search) ||
      pool.id.toLowerCase().includes(search)
    );
  });

  if (loading && pools.length === 0) {
    return <LoadingState message="Loading liquidity pools..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header with search and create */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pools by token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {isFounder && onCreatePool && (
          <button
            onClick={onCreatePool}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Pool
          </button>
        )}
      </div>

      {/* Pools grid */}
      {filteredPools.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              {searchTerm
                ? 'No pools found matching your search'
                : 'No liquidity pools available yet'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onAddLiquidity={onAddLiquidity}
              onRemoveLiquidity={onRemoveLiquidity}
              onSwap={onSwap}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface PoolCardProps {
  pool: PoolInfo;
  onAddLiquidity?: (pool: PoolInfo) => void;
  onRemoveLiquidity?: (pool: PoolInfo) => void;
  onSwap?: (pool: PoolInfo) => void;
}

const PoolCard: React.FC<PoolCardProps> = ({
  pool,
  onAddLiquidity,
  onRemoveLiquidity,
  onSwap,
}) => {
  const reserve1Display = formatTokenBalance(
    pool.reserve1,
    pool.asset1Decimals,
    2
  );
  const reserve2Display = formatTokenBalance(
    pool.reserve2,
    pool.asset2Decimals,
    2
  );

  // Calculate exchange rate
  const rate =
    BigInt(pool.reserve1) > BigInt(0)
      ? (Number(pool.reserve2) / Number(pool.reserve1)).toFixed(4)
      : '0';

  return (
    <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-green-400">{pool.asset1Symbol}</span>
            <span className="text-gray-500">/</span>
            <span className="text-yellow-400">{pool.asset2Symbol}</span>
          </CardTitle>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
            Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Reserves */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Reserve {pool.asset1Symbol}</span>
            <span className="text-white font-mono">
              {reserve1Display} {pool.asset1Symbol}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Reserve {pool.asset2Symbol}</span>
            <span className="text-white font-mono">
              {reserve2Display} {pool.asset2Symbol}
            </span>
          </div>
        </div>

        {/* Exchange rate */}
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Exchange Rate</span>
            <span className="text-cyan-400 font-mono">
              1 {pool.asset1Symbol} = {rate} {pool.asset2Symbol}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800">
          <div className="text-center">
            <div className="text-xs text-gray-500">Fee</div>
            <div className="text-sm font-semibold text-white">
              {pool.feeRate || '0.3'}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Volume 24h</div>
            <div className="text-sm font-semibold text-white">
              {pool.volume24h || 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">APR</div>
            <div className="text-sm font-semibold text-green-400">
              {pool.apr7d || 'N/A'}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {onAddLiquidity && (
            <button
              onClick={() => onAddLiquidity(pool)}
              className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Droplet className="w-3 h-3" />
              Add
            </button>
          )}
          {onRemoveLiquidity && (
            <button
              onClick={() => onRemoveLiquidity(pool)}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-lg text-xs font-medium transition-colors"
            >
              Remove
            </button>
          )}
          {onSwap && (
            <button
              onClick={() => onSwap(pool)}
              className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <TrendingUp className="w-3 h-3" />
              Swap
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
