import React, { useState, useEffect } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { X, Minus, AlertCircle, Loader2, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PoolInfo } from '@/types/dex';
import { formatTokenBalance } from '@pezkuwi/utils/dex';

interface RemoveLiquidityModalProps {
  isOpen: boolean;
  pool: PoolInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type TransactionStatus = 'idle' | 'signing' | 'submitting' | 'success' | 'error';

export const RemoveLiquidityModal: React.FC<RemoveLiquidityModalProps> = ({
  isOpen,
  pool,
  onClose,
  onSuccess,
}) => {
  const { api, isApiReady } = usePolkadot();
  const { account, signer } = useWallet();

  const [lpTokenBalance, setLpTokenBalance] = useState<string>('0');
  const [removePercentage, setRemovePercentage] = useState(25);
  const [slippage, setSlippage] = useState(1); // 1% default

  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset form when modal closes or pool changes
  useEffect(() => {
    if (!isOpen || !pool) {
      setRemovePercentage(25);
      setTxStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, pool]);

  // Fetch LP token balance
  useEffect(() => {
    const fetchLPBalance = async () => {
      if (!api || !isApiReady || !account || !pool) return;

      try {
        // Get pool account
        const poolAccount = await api.query.assetConversion.pools([
          pool.asset1,
          pool.asset2,
        ]);

        if (poolAccount.isNone) {
          setLpTokenBalance('0');
          return;
        }

        // LP token ID is derived from pool ID
        // For now, we'll query the pool's LP token supply
        // In a real implementation, you'd need to query the specific LP token for the user
        const lpAssetId = api.query.assetConversion.nextPoolAssetId
          ? await api.query.assetConversion.nextPoolAssetId()
          : null;

        // This is a simplified version - you'd need to track LP tokens properly
        setLpTokenBalance('0'); // Placeholder
      } catch (error) {
        console.error('Failed to fetch LP balance:', error);
        setLpTokenBalance('0');
      }
    };

    fetchLPBalance();
  }, [api, isApiReady, account, pool]);

  const calculateOutputAmounts = () => {
    if (!pool || BigInt(lpTokenBalance) === BigInt(0)) {
      return { amount1: '0', amount2: '0' };
    }

    // Calculate amounts based on percentage
    const lpAmount = (BigInt(lpTokenBalance) * BigInt(removePercentage)) / BigInt(100);

    // Simplified calculation - in reality, this depends on total LP supply
    const totalLiquidity = BigInt(pool.reserve1) + BigInt(pool.reserve2);
    const userShare = lpAmount;

    // Proportional amounts
    const amount1 = (BigInt(pool.reserve1) * userShare) / totalLiquidity;
    const amount2 = (BigInt(pool.reserve2) * userShare) / totalLiquidity;

    return {
      amount1: amount1.toString(),
      amount2: amount2.toString(),
    };
  };

  const handleRemoveLiquidity = async () => {
    if (!api || !isApiReady || !signer || !account || !pool) {
      setErrorMessage('Wallet not connected');
      return;
    }

    if (BigInt(lpTokenBalance) === BigInt(0)) {
      setErrorMessage('No liquidity to remove');
      return;
    }

    const lpAmount = (BigInt(lpTokenBalance) * BigInt(removePercentage)) / BigInt(100);
    const { amount1, amount2 } = calculateOutputAmounts();

    // Calculate minimum amounts with slippage tolerance
    const minAmount1 = (BigInt(amount1) * BigInt(100 - slippage * 100)) / BigInt(10000);
    const minAmount2 = (BigInt(amount2) * BigInt(100 - slippage * 100)) / BigInt(10000);

    try {
      setTxStatus('signing');
      setErrorMessage('');

      const tx = api.tx.assetConversion.removeLiquidity(
        pool.asset1,
        pool.asset2,
        lpAmount.toString(),
        minAmount1.toString(),
        minAmount2.toString(),
        account
      );

      setTxStatus('submitting');

      await tx.signAndSend(
        account,
        { signer },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            if (dispatchError) {
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                setErrorMessage(`${decoded.section}.${decoded.name}: ${decoded.docs}`);
              } else {
                setErrorMessage(dispatchError.toString());
              }
              setTxStatus('error');
            } else {
              setTxStatus('success');
              setTimeout(() => {
                onSuccess?.();
                onClose();
              }, 2000);
            }
          }
        }
      );
    } catch (error: any) {
      console.error('Remove liquidity failed:', error);
      setErrorMessage(error.message || 'Transaction failed');
      setTxStatus('error');
    }
  };

  if (!isOpen || !pool) return null;

  const { amount1, amount2 } = calculateOutputAmounts();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">
              Remove Liquidity
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={txStatus === 'signing' || txStatus === 'submitting'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-400 mt-2">
            {pool.asset1Symbol} / {pool.asset2Symbol} Pool
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-blue-400">
              Remove liquidity to receive your tokens back. You'll burn LP tokens in proportion to your withdrawal.
            </span>
          </div>

          {/* LP Token Balance */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Your LP Tokens</div>
            <div className="text-2xl font-bold text-white font-mono">
              {formatTokenBalance(lpTokenBalance, 12, 6)}
            </div>
          </div>

          {/* Percentage Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Remove Amount</label>
              <span className="text-lg font-bold text-white">{removePercentage}%</span>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              value={removePercentage}
              onChange={(e) => setRemovePercentage(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              disabled={txStatus === 'signing' || txStatus === 'submitting'}
            />

            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => setRemovePercentage(value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    removePercentage === value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  disabled={txStatus === 'signing' || txStatus === 'submitting'}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
              <Minus className="w-5 h-5 text-red-400" />
            </div>
          </div>

          {/* Output Preview */}
          <div className="space-y-3">
            <div className="text-sm text-gray-400 mb-2">You will receive</div>

            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{pool.asset1Symbol}</span>
                <span className="text-white font-mono text-lg">
                  {formatTokenBalance(amount1, pool.asset1Decimals, 6)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{pool.asset2Symbol}</span>
                <span className="text-white font-mono text-lg">
                  {formatTokenBalance(amount2, pool.asset2Decimals, 6)}
                </span>
              </div>
            </div>
          </div>

          {/* Slippage Tolerance */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Slippage Tolerance</label>
            <div className="flex gap-2">
              {[0.5, 1, 2].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    slippage === value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  disabled={txStatus === 'signing' || txStatus === 'submitting'}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-400">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {txStatus === 'success' && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-green-400">
                Liquidity removed successfully!
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
              disabled={txStatus === 'signing' || txStatus === 'submitting'}
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveLiquidity}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              disabled={
                txStatus === 'signing' ||
                txStatus === 'submitting' ||
                txStatus === 'success' ||
                BigInt(lpTokenBalance) === BigInt(0)
              }
            >
              {txStatus === 'signing' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing...
                </>
              )}
              {txStatus === 'submitting' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Removing...
                </>
              )}
              {txStatus === 'idle' && 'Remove Liquidity'}
              {txStatus === 'error' && 'Retry'}
              {txStatus === 'success' && (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Success
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
