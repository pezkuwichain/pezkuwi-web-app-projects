import React, { useEffect, useState } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, WifiOff, Users, Box, TrendingUp } from 'lucide-react';

export const NetworkStats: React.FC = () => {
  const { api, isApiReady, error } = usePolkadot();
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const [blockHash, setBlockHash] = useState<string>('');
  const [finalizedBlock, setFinalizedBlock] = useState<number>(0);
  const [validatorCount, setValidatorCount] = useState<number>(0);
  const [nominatorCount, setNominatorCount] = useState<number>(0);
  const [peers, setPeers] = useState<number>(0);

  useEffect(() => {
    if (!api || !isApiReady) return;

    let unsubscribeNewHeads: () => void;
    let unsubscribeFinalizedHeads: () => void;
    let intervalId: NodeJS.Timeout;

    const subscribeToBlocks = async () => {
      try {
        // Subscribe to new blocks
        unsubscribeNewHeads = await api.rpc.chain.subscribeNewHeads((header) => {
          setBlockNumber(header.number.toNumber());
          setBlockHash(header.hash.toHex());
        });

        // Subscribe to finalized blocks
        unsubscribeFinalizedHeads = await api.rpc.chain.subscribeFinalizedHeads((header) => {
          setFinalizedBlock(header.number.toNumber());
        });

        // Update validator count, nominator count, and peer count every 3 seconds
        const updateNetworkStats = async () => {
          try {
            const validators = await api.query.session.validators();
            const health = await api.rpc.system.health();

            // Count nominators
            let nominatorCount = 0;
            try {
              const nominators = await api.query.staking.nominators.entries();
              nominatorCount = nominators.length;
            } catch (err) {
              console.warn('Staking pallet not available, nominators = 0');
            }

            setValidatorCount(validators.length);
            setNominatorCount(nominatorCount);
            setPeers(health.peers.toNumber());
          } catch (err) {
            console.error('Failed to update network stats:', err);
          }
        };

        // Initial update
        await updateNetworkStats();

        // Update every 3 seconds
        intervalId = setInterval(updateNetworkStats, 3000);

      } catch (err) {
        console.error('Failed to subscribe to blocks:', err);
      }
    };

    subscribeToBlocks();

    return () => {
      if (unsubscribeNewHeads) unsubscribeNewHeads();
      if (unsubscribeFinalizedHeads) unsubscribeFinalizedHeads();
      if (intervalId) clearInterval(intervalId);
    };
  }, [api, isApiReady]);

  if (error) {
    return (
      <Card className="bg-red-950/50 border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <WifiOff className="w-5 h-5" />
            Network Disconnected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-red-400 text-xs mt-2">
            Make sure your validator node is running at ws://127.0.0.1:9944
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isApiReady) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            Connecting to Network...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* Connection Status */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              Connected
            </Badge>
            <span className="text-xs text-gray-500">{peers} peers</span>
          </div>
        </CardContent>
      </Card>

      {/* Latest Block */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-500" />
            Latest Block
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white">
              #{blockNumber.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 font-mono truncate">
              {blockHash.slice(0, 10)}...{blockHash.slice(-8)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finalized Block */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            Finalized Block
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            #{finalizedBlock.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {blockNumber - finalizedBlock} blocks behind
          </div>
        </CardContent>
      </Card>

      {/* Validators */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-yellow-500" />
            Active Validators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {validatorCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Securing the network - LIVE
          </div>
        </CardContent>
      </Card>

      {/* Nominators */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-500" />
            Active Nominators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {nominatorCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Staking to validators
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
