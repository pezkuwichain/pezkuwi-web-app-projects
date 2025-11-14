import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { AccountBalance } from '@/components/AccountBalance';
import { TransferModal } from '@/components/TransferModal';
import { ReceiveModal } from '@/components/ReceiveModal';
import { TransactionHistory } from '@/components/TransactionHistory';
import { NftList } from '@/components/NftList';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, History, ArrowLeft, RefreshCw } from 'lucide-react';

interface Transaction {
  blockNumber: number;
  extrinsicIndex: number;
  hash: string;
  method: string;
  section: string;
  from: string;
  to?: string;
  amount?: string;
  success: boolean;
  timestamp?: number;
}

const WalletDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // Fetch recent transactions
  const fetchRecentTransactions = async () => {
    if (!api || !isApiReady || !selectedAccount) return;

    setIsLoadingRecent(true);
    try {
      const currentBlock = await api.rpc.chain.getBlock();
      const currentBlockNumber = currentBlock.block.header.number.toNumber();

      const txList: Transaction[] = [];
      const blocksToCheck = Math.min(100, currentBlockNumber);

      for (let i = 0; i < blocksToCheck && txList.length < 5; i++) {
        const blockNumber = currentBlockNumber - i;

        try {
          const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
          const block = await api.rpc.chain.getBlock(blockHash);

          let timestamp = 0;
          try {
            const ts = await api.query.timestamp.now.at(blockHash);
            timestamp = ts.toNumber();
          } catch (error) {
            timestamp = Date.now();
          }

          block.block.extrinsics.forEach((extrinsic, index) => {
            if (!extrinsic.isSigned) return;

            const { method, signer } = extrinsic;
            const fromAddress = signer.toString();
            const isFromOurAccount = fromAddress === selectedAccount.address;

            // Only track this account's transactions
            if (!isFromOurAccount) return;

            // Parse balances.transfer
            if (method.section === 'balances' &&
                (method.method === 'transfer' || method.method === 'transferKeepAlive')) {
              const [dest, value] = method.args;
              txList.push({
                blockNumber,
                extrinsicIndex: index,
                hash: extrinsic.hash.toHex(),
                method: method.method,
                section: method.section,
                from: fromAddress,
                to: dest.toString(),
                amount: value.toString(),
                success: true,
                timestamp: timestamp,
              });
            }

            // Parse assets.transfer
            else if (method.section === 'assets' && method.method === 'transfer') {
              const [assetId, dest, value] = method.args;
              txList.push({
                blockNumber,
                extrinsicIndex: index,
                hash: extrinsic.hash.toHex(),
                method: `${method.method} (Asset ${assetId.toString()})`,
                section: method.section,
                from: fromAddress,
                to: dest.toString(),
                amount: value.toString(),
                success: true,
                timestamp: timestamp,
              });
            }

            // Parse staking operations
            else if (method.section === 'staking') {
              if (method.method === 'bond' || method.method === 'bondExtra') {
                const value = method.args[method.method === 'bond' ? 1 : 0];
                txList.push({
                  blockNumber,
                  extrinsicIndex: index,
                  hash: extrinsic.hash.toHex(),
                  method: method.method,
                  section: method.section,
                  from: fromAddress,
                  amount: value.toString(),
                  success: true,
                  timestamp: timestamp,
                });
              } else if (method.method === 'unbond') {
                const [value] = method.args;
                txList.push({
                  blockNumber,
                  extrinsicIndex: index,
                  hash: extrinsic.hash.toHex(),
                  method: method.method,
                  section: method.section,
                  from: fromAddress,
                  amount: value.toString(),
                  success: true,
                  timestamp: timestamp,
                });
              } else if (method.method === 'nominate' || method.method === 'withdrawUnbonded' || method.method === 'chill') {
                txList.push({
                  blockNumber,
                  extrinsicIndex: index,
                  hash: extrinsic.hash.toHex(),
                  method: method.method,
                  section: method.section,
                  from: fromAddress,
                  success: true,
                  timestamp: timestamp,
                });
              }
            }

            // Parse DEX operations
            else if (method.section === 'dex') {
              if (method.method === 'swap') {
                const [path, amountIn] = method.args;
                txList.push({
                  blockNumber,
                  extrinsicIndex: index,
                  hash: extrinsic.hash.toHex(),
                  method: method.method,
                  section: method.section,
                  from: fromAddress,
                  amount: amountIn.toString(),
                  success: true,
                  timestamp: timestamp,
                });
              } else if (method.method === 'addLiquidity' || method.method === 'removeLiquidity') {
                txList.push({
                  blockNumber,
                  extrinsicIndex: index,
                  hash: extrinsic.hash.toHex(),
                  method: method.method,
                  section: method.section,
                  from: fromAddress,
                  success: true,
                  timestamp: timestamp,
                });
              }
            }

            // Parse stakingScore & pezRewards
            else if ((method.section === 'stakingScore' && method.method === 'startTracking') ||
                     (method.section === 'pezRewards' && method.method === 'claimReward')) {
              txList.push({
                blockNumber,
                extrinsicIndex: index,
                hash: extrinsic.hash.toHex(),
                method: method.method,
                section: method.section,
                from: fromAddress,
                success: true,
                timestamp: timestamp,
              });
            }
          });
        } catch (blockError) {
          // Continue to next block
        }
      }

      setRecentTransactions(txList);
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  useEffect(() => {
    if (selectedAccount && api && isApiReady) {
      fetchRecentTransactions();
    }
  }, [selectedAccount, api, isApiReady]);

  const formatAmount = (amount: string, decimals: number = 12) => {
    const value = parseInt(amount) / Math.pow(10, decimals);
    return value.toFixed(4);
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const isIncoming = (tx: Transaction) => {
    return tx.to === selectedAccount?.address;
  };

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Wallet Not Connected</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wallet Dashboard</h1>
          <p className="text-gray-400">Manage your HEZ and PEZ tokens</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Balance */}
          <div className="lg:col-span-1">
            <AccountBalance />
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              <Button
                onClick={() => setIsTransferModalOpen(true)}
                className="bg-gradient-to-r from-green-600 to-yellow-400 hover:from-green-700 hover:to-yellow-500 h-24 flex flex-col items-center justify-center"
              >
                <ArrowUpRight className="w-6 h-6 mb-2" />
                <span>Send</span>
              </Button>

              <Button
                onClick={() => setIsReceiveModalOpen(true)}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800 h-24 flex flex-col items-center justify-center"
              >
                <ArrowDownRight className="w-6 h-6 mb-2" />
                <span>Receive</span>
              </Button>

              <Button
                onClick={() => setIsHistoryModalOpen(true)}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800 h-24 flex flex-col items-center justify-center"
              >
                <History className="w-6 h-6 mb-2" />
                <span>History</span>
              </Button>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchRecentTransactions}
                  disabled={isLoadingRecent}
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRecent ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {isLoadingRecent ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-400">Loading transactions...</p>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No recent transactions</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Your transaction history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx, index) => (
                    <div
                      key={`${tx.blockNumber}-${tx.extrinsicIndex}`}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isIncoming(tx) ? (
                            <div className="bg-green-500/20 p-2 rounded-lg">
                              <ArrowDownRight className="w-4 h-4 text-green-400" />
                            </div>
                          ) : (
                            <div className="bg-yellow-500/20 p-2 rounded-lg">
                              <ArrowUpRight className="w-4 h-4 text-yellow-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-white font-semibold text-sm">
                              {isIncoming(tx) ? 'Received' : 'Sent'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Block #{tx.blockNumber}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-mono text-sm">
                            {isIncoming(tx) ? '+' : '-'}{formatAmount(tx.amount || '0')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {tx.section}.{tx.method}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setIsHistoryModalOpen(true)}
                variant="outline"
                className="mt-4 w-full border-gray-700 hover:bg-gray-800"
              >
                View All Transactions
              </Button>
            </div>

            {/* NFT Collection */}
            <NftList />
          </div>
        </div>
      </div>

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <ReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
      />

      <TransactionHistory
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
};

export default WalletDashboard;