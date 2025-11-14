import React, { useEffect, useState } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { History, ExternalLink, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ isOpen, onClose }) => {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!api || !isApiReady || !selectedAccount) return;

    setIsLoading(true);
    try {
      console.log('Fetching transactions...');
      const currentBlock = await api.rpc.chain.getBlock();
      const currentBlockNumber = currentBlock.block.header.number.toNumber();

      console.log('Current block number:', currentBlockNumber);
      
      const txList: Transaction[] = [];
      const blocksToCheck = Math.min(200, currentBlockNumber);

      for (let i = 0; i < blocksToCheck && txList.length < 20; i++) {
        const blockNumber = currentBlockNumber - i;
        
        try {
          const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
          const block = await api.rpc.chain.getBlock(blockHash);

          // Try to get timestamp, but don't fail if state is pruned
          let timestamp = 0;
          try {
            const ts = await api.query.timestamp.now.at(blockHash);
            timestamp = ts.toNumber();
          } catch (error) {
            // State pruned, use current time as fallback
            timestamp = Date.now();
          }
          
          console.log(`Block #${blockNumber}: ${block.block.extrinsics.length} extrinsics`);
          
          // Check each extrinsic in the block
          block.block.extrinsics.forEach((extrinsic, index) => {
            // Skip unsigned extrinsics (system calls)
            if (!extrinsic.isSigned) {
              return;
            }

            const { method, signer } = extrinsic;
            
            console.log(`  Extrinsic #${index}: ${method.section}.${method.method}, signer: ${signer.toString()}`);
            
            // Check if transaction involves our account
            const fromAddress = signer.toString();
            const isFromOurAccount = fromAddress === selectedAccount.address;

            // Only track transactions from this account
            if (!isFromOurAccount) {
              return;
            }

            // Parse balances.transfer or balances.transferKeepAlive
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

            // Parse assets.transfer (PEZ, USDT, etc.)
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

            // Parse stakingScore operations
            else if (method.section === 'stakingScore' && method.method === 'startTracking') {
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

            // Parse pezRewards operations
            else if (method.section === 'pezRewards' && method.method === 'claimReward') {
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
          console.warn(`Error processing block #${blockNumber}:`, blockError);
          // Continue to next block
        }
      }
      
      console.log('Found transactions:', txList.length);
      
      setTransactions(txList);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, api, isApiReady, selectedAccount]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white">Transaction History</DialogTitle>
              <DialogDescription className="text-gray-400">
                Recent transactions involving your account
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchTransactions}
              disabled={isLoading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto max-h-[500px]">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-spin" />
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No transactions found</p>
              <p className="text-gray-600 text-sm mt-1">
                Your recent transactions will appear here
              </p>
            </div>
          ) : (
            transactions.map((tx, index) => (
              <div
                key={`${tx.blockNumber}-${tx.extrinsicIndex}`}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
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
                      <div className="text-white font-semibold">
                        {isIncoming(tx) ? 'Received' : 'Sent'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {tx.section}.{tx.method}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">
                      {isIncoming(tx) ? '+' : '-'}{formatAmount(tx.amount || '0')}
                    </div>
                    <div className="text-xs text-gray-400">
                      Block #{tx.blockNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">From:</span>
                    <div className="text-gray-300 font-mono">
                      {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                    </div>
                  </div>
                  {tx.to && (
                    <div>
                      <span className="text-gray-500">To:</span>
                      <div className="text-gray-300 font-mono">
                        {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-500">
                    {formatTimestamp(tx.timestamp)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-400 hover:text-blue-300"
                    onClick={() => {
                      toast({
                        title: "Transaction Details",
                        description: `Block #${tx.blockNumber}, Extrinsic #${tx.extrinsicIndex}`,
                      });
                    }}
                  >
                    View Details
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};