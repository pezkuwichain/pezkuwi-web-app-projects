import React, { useState, useEffect } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { X, Plus, AlertCircle, Loader2, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PoolInfo } from '@/types/dex';
import { parseTokenInput, formatTokenBalance, quote } from '@pezkuwi/utils/dex';

interface AddLiquidityModalProps {
  isOpen: boolean;
  pool: PoolInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type TransactionStatus = 'idle' | 'signing' | 'submitting' | 'success' | 'error';

export const AddLiquidityModal: React.FC<AddLiquidityModalProps> = ({
  isOpen,
  pool,
  onClose,
  onSuccess,
}) => {
  const { api, isApiReady } = usePolkadot();
  const { account, signer } = useWallet();

  const [amount1Input, setAmount1Input] = useState('');
  const [amount2Input, setAmount2Input] = useState('');
  const [slippage, setSlippage] = useState(1); // 1% default

  const [balance1, setBalance1] = useState<string>('0');
  const [balance2, setBalance2] = useState<string>('0');

  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset form when modal closes or pool changes
  useEffect(() => {
    if (!isOpen || !pool) {
      setAmount1Input('');
      setAmount2Input('');
      setTxStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, pool]);

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!api || !isApiReady || !account || !pool) return;

      try {
        const balance1Data = await api.query.assets.account(pool.asset1, account);
        const balance2Data = await api.query.assets.account(pool.asset2, account);

        setBalance1(balance1Data.isSome ? balance1Data.unwrap().balance.toString() : '0');
        setBalance2(balance2Data.isSome ? balance2Data.unwrap().balance.toString() : '0');
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      }
    };

    fetchBalances();
  }, [api, isApiReady, account, pool]);

  // Auto-calculate amount2 when amount1 changes
  const handleAmount1Change = (value: string) => {
    setAmount1Input(value);

    if (!pool || !value || parseFloat(value) === 0) {
      setAmount2Input('');
      return;
    }

    try {
      const amount1Raw = parseTokenInput(value, pool.asset1Decimals);
      const amount2Raw = quote(amount1Raw, pool.reserve2, pool.reserve1);
      const amount2Display = formatTokenBalance(amount2Raw, pool.asset2Decimals, 6);
      setAmount2Input(amount2Display);
    } catch (error) {
      console.error('Failed to calculate amount2:', error);
    }
  };

  // Auto-calculate amount1 when amount2 changes
  const handleAmount2Change = (value: string) => {
    setAmount2Input(value);

    if (!pool || !value || parseFloat(value) === 0) {
      setAmount1Input('');
      return;
    }

    try {
      const amount2Raw = parseTokenInput(value, pool.asset2Decimals);
      const amount1Raw = quote(amount2Raw, pool.reserve1, pool.reserve2);
      const amount1Display = formatTokenBalance(amount1Raw, pool.asset1Decimals, 6);
      setAmount1Input(amount1Display);
    } catch (error) {
      console.error('Failed to calculate amount1:', error);
    }
  };

  const validateInputs = (): string | null => {
    if (!pool) return 'No pool selected';
    if (!amount1Input || !amount2Input) return 'Please enter amounts';

    const amount1Raw = parseTokenInput(amount1Input, pool.asset1Decimals);
    const amount2Raw = parseTokenInput(amount2Input, pool.asset2Decimals);

    if (BigInt(amount1Raw) <= BigInt(0) || BigInt(amount2Raw) <= BigInt(0)) {
      return 'Amounts must be greater than zero';
    }

    if (BigInt(amount1Raw) > BigInt(balance1)) {
      return `Insufficient ${pool.asset1Symbol} balance`;
    }

    if (BigInt(amount2Raw) > BigInt(balance2)) {
      return `Insufficient ${pool.asset2Symbol} balance`;
    }

    return null;
  };

  const handleAddLiquidity = async () => {
    if (!api || !isApiReady || !signer || !account || !pool) {
      setErrorMessage('Wallet not connected');
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const amount1Raw = parseTokenInput(amount1Input, pool.asset1Decimals);
    const amount2Raw = parseTokenInput(amount2Input, pool.asset2Decimals);

    // Calculate minimum amounts with slippage tolerance
    const minAmount1 = (BigInt(amount1Raw) * BigInt(100 - slippage * 100)) / BigInt(10000);
    const minAmount2 = (BigInt(amount2Raw) * BigInt(100 - slippage * 100)) / BigInt(10000);

    try {
      setTxStatus('signing');
      setErrorMessage('');

      const tx = api.tx.assetConversion.addLiquidity(
        pool.asset1,
        pool.asset2,
        amount1Raw,
        amount2Raw,
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
      console.error('Add liquidity failed:', error);
      setErrorMessage(error.message || 'Transaction failed');
      setTxStatus('error');
    }
  };

  if (!isOpen || !pool) return null;

  const shareOfPool =
    amount1Input && parseFloat(amount1Input) > 0
      ? (
          (parseFloat(
            formatTokenBalance(
              parseTokenInput(amount1Input, pool.asset1Decimals),
              pool.asset1Decimals,
              6
            )
          ) /
            (parseFloat(formatTokenBalance(pool.reserve1, pool.asset1Decimals, 6)) +
              parseFloat(
                formatTokenBalance(
                  parseTokenInput(amount1Input, pool.asset1Decimals),
                  pool.asset1Decimals,
                  6
                )
              ))) *
          100
        ).toFixed(4)
      : '0';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">
              Add Liquidity
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
              Add liquidity in proportion to the pool's current ratio. You'll receive LP tokens representing your share.
            </span>
          </div>

          {/* Token 1 Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">{pool.asset1Symbol}</label>
              <span className="text-xs text-gray-500">
                Balance: {formatTokenBalance(balance1, pool.asset1Decimals, 4)}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={amount1Input}
                onChange={(e) => handleAmount1Change(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={txStatus === 'signing' || txStatus === 'submitting'}
              />
              <button
                onClick={() =>
                  handleAmount1Change(formatTokenBalance(balance1, pool.asset1Decimals, 6))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded border border-green-600/30 transition-colors"
                disabled={txStatus === 'signing' || txStatus === 'submitting'}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Plus Icon */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
              <Plus className="w-5 h-5 text-green-400" />
            </div>
          </div>

          {/* Token 2 Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">{pool.asset2Symbol}</label>
              <span className="text-xs text-gray-500">
                Balance: {formatTokenBalance(balance2, pool.asset2Decimals, 4)}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={amount2Input}
                onChange={(e) => handleAmount2Change(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={txStatus === 'signing' || txStatus === 'submitting'}
              />
              <button
                onClick={() =>
                  handleAmount2Change(formatTokenBalance(balance2, pool.asset2Decimals, 6))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded border border-green-600/30 transition-colors"
                disabled={txStatus === 'signing' || txStatus === 'submitting'}
              >
                MAX
              </button>
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

          {/* Pool Share Preview */}
          {amount1Input && amount2Input && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Share of Pool</span>
                <span className="text-white font-mono">{shareOfPool}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Exchange Rate</span>
                <span className="text-cyan-400 font-mono">
                  1 {pool.asset1Symbol} ={' '}
                  {(
                    parseFloat(formatTokenBalance(pool.reserve2, pool.asset2Decimals, 6)) /
                    parseFloat(formatTokenBalance(pool.reserve1, pool.asset1Decimals, 6))
                  ).toFixed(6)}{' '}
                  {pool.asset2Symbol}
                </span>
              </div>
            </div>
          )}

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
                Liquidity added successfully!
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
              onClick={handleAddLiquidity}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              disabled={
                txStatus === 'signing' ||
                txStatus === 'submitting' ||
                txStatus === 'success'
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
                  Adding...
                </>
              )}
              {txStatus === 'idle' && 'Add Liquidity'}
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
