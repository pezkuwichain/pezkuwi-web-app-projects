import React, { useState, useEffect } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowDownUp, AlertCircle, Loader2, CheckCircle, Info, Settings, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PoolInfo } from '@/types/dex';
import {
  parseTokenInput,
  formatTokenBalance,
  getAmountOut,
  calculatePriceImpact,
} from '@/utils/dex';
import { useToast } from '@/hooks/use-toast';

interface SwapInterfaceProps {
  initialPool?: PoolInfo | null;
  pools: PoolInfo[];
}

type TransactionStatus = 'idle' | 'signing' | 'submitting' | 'success' | 'error';

// User-facing tokens (wHEZ is hidden from users, shown as HEZ)
const USER_TOKENS = [
  { symbol: 'HEZ', emoji: '🟡', assetId: 0, name: 'HEZ', decimals: 12, displaySymbol: 'HEZ' }, // actually wHEZ (asset 0)
  { symbol: 'PEZ', emoji: '🟣', assetId: 1, name: 'PEZ', decimals: 12, displaySymbol: 'PEZ' },
  { symbol: 'USDT', emoji: '💵', assetId: 2, name: 'USDT', decimals: 6, displaySymbol: 'USDT' },
] as const;

export const SwapInterface: React.FC<SwapInterfaceProps> = ({ initialPool, pools }) => {
  const { api, isApiReady } = usePolkadot();
  const { account, signer } = useWallet();
  const { toast } = useToast();

  const [fromToken, setFromToken] = useState('HEZ');
  const [toToken, setToToken] = useState('PEZ');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5); // 0.5% default
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fromBalance, setFromBalance] = useState<string>('0');
  const [toBalance, setToBalance] = useState<string>('0');

  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Get asset IDs (for pool lookup)
  const getAssetId = (symbol: string) => {
    const token = USER_TOKENS.find(t => t.symbol === symbol);
    return token?.assetId ?? null;
  };

  const fromAssetId = getAssetId(fromToken);
  const toAssetId = getAssetId(toToken);

  // Find active pool for selected pair
  const activePool = pools.find(
    (p) =>
      (p.asset1 === fromAssetId && p.asset2 === toAssetId) ||
      (p.asset1 === toAssetId && p.asset2 === fromAssetId)
  );

  // Get token info
  const fromTokenInfo = USER_TOKENS.find(t => t.symbol === fromToken);
  const toTokenInfo = USER_TOKENS.find(t => t.symbol === toToken);

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!api || !isApiReady || !account) return;

      // For HEZ, fetch native balance (not wHEZ asset balance)
      if (fromToken === 'HEZ') {
        try {
          const balance = await api.query.system.account(account);
          const freeBalance = balance.data.free.toString();
          setFromBalance(freeBalance);
        } catch (error) {
          console.error('Failed to fetch HEZ balance:', error);
          setFromBalance('0');
        }
      } else if (fromAssetId !== null) {
        try {
          const balanceData = await api.query.assets.account(fromAssetId, account);
          setFromBalance(balanceData.isSome ? balanceData.unwrap().balance.toString() : '0');
        } catch (error) {
          console.error('Failed to fetch from balance:', error);
          setFromBalance('0');
        }
      }

      // For HEZ, fetch native balance
      if (toToken === 'HEZ') {
        try {
          const balance = await api.query.system.account(account);
          const freeBalance = balance.data.free.toString();
          setToBalance(freeBalance);
        } catch (error) {
          console.error('Failed to fetch HEZ balance:', error);
          setToBalance('0');
        }
      } else if (toAssetId !== null) {
        try {
          const balanceData = await api.query.assets.account(toAssetId, account);
          setToBalance(balanceData.isSome ? balanceData.unwrap().balance.toString() : '0');
        } catch (error) {
          console.error('Failed to fetch to balance:', error);
          setToBalance('0');
        }
      }
    };

    fetchBalances();
  }, [api, isApiReady, account, fromToken, toToken, fromAssetId, toAssetId]);

  // Calculate output amount when input changes
  useEffect(() => {
    if (!fromAmount || !activePool || !fromTokenInfo || !toTokenInfo) {
      setToAmount('');
      return;
    }

    try {
      const fromAmountRaw = parseTokenInput(fromAmount, fromTokenInfo.decimals);

      // Determine direction and calculate output
      const isForward = activePool.asset1 === fromAssetId;
      const reserveIn = isForward ? activePool.reserve1 : activePool.reserve2;
      const reserveOut = isForward ? activePool.reserve2 : activePool.reserve1;

      const toAmountRaw = getAmountOut(fromAmountRaw, reserveIn, reserveOut, 30); // 3% fee
      const toAmountDisplay = formatTokenBalance(toAmountRaw, toTokenInfo.decimals, 6);

      setToAmount(toAmountDisplay);
    } catch (error) {
      console.error('Failed to calculate output:', error);
      setToAmount('');
    }
  }, [fromAmount, activePool, fromTokenInfo, toTokenInfo, fromAssetId, toAssetId]);

  // Calculate price impact
  const priceImpact = React.useMemo(() => {
    if (!fromAmount || !activePool || !fromAssetId || !toAssetId || !fromTokenInfo) {
      return 0;
    }

    try {
      const fromAmountRaw = parseTokenInput(fromAmount, fromTokenInfo.decimals);
      const isForward = activePool.asset1 === fromAssetId;
      const reserveIn = isForward ? activePool.reserve1 : activePool.reserve2;
      const reserveOut = isForward ? activePool.reserve2 : activePool.reserve1;

      return parseFloat(calculatePriceImpact(reserveIn, reserveOut, fromAmountRaw));
    } catch {
      return 0;
    }
  }, [fromAmount, activePool, fromAssetId, toAssetId, fromTokenInfo]);

  // Check if user has insufficient balance
  const hasInsufficientBalance = React.useMemo(() => {
    const fromAmountNum = parseFloat(fromAmount || '0');
    const fromBalanceNum = parseFloat(formatTokenBalance(fromBalance, fromTokenInfo?.decimals ?? 12, 6));
    return fromAmountNum > 0 && fromAmountNum > fromBalanceNum;
  }, [fromAmount, fromBalance, fromTokenInfo]);

  const handleSwapDirection = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    const tempBalance = fromBalance;

    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setFromBalance(toBalance);
    setToBalance(tempBalance);
  };

  const handleMaxClick = () => {
    if (fromTokenInfo) {
      const maxAmount = formatTokenBalance(fromBalance, fromTokenInfo.decimals, 6);
      setFromAmount(maxAmount);
    }
  };

  const handleConfirmSwap = async () => {
    if (!api || !signer || !account || !fromTokenInfo || !toTokenInfo) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    if (!activePool) {
      toast({
        title: 'Error',
        description: 'No liquidity pool available for this pair',
        variant: 'destructive',
      });
      return;
    }

    setTxStatus('signing');
    setShowConfirm(false);
    setErrorMessage('');

    try {
      const amountIn = parseTokenInput(fromAmount, fromTokenInfo.decimals);
      const minAmountOut = parseTokenInput(
        (parseFloat(toAmount) * (1 - slippage / 100)).toString(),
        toTokenInfo.decimals
      );

      console.log('💰 Swap transaction:', {
        from: fromToken,
        to: toToken,
        amount: fromAmount,
        minOut: minAmountOut.toString(),
      });

      let tx;

      if (fromToken === 'HEZ' && toToken === 'PEZ') {
        // HEZ → PEZ: wrap(HEZ→wHEZ) then swap(wHEZ→PEZ)
        const wrapTx = api.tx.tokenWrapper.wrap(amountIn.toString());
        const swapTx = api.tx.assetConversion.swapExactTokensForTokens(
          [0, 1], // wHEZ → PEZ
          amountIn.toString(),
          minAmountOut.toString(),
          account,
          true
        );
        tx = api.tx.utility.batchAll([wrapTx, swapTx]);

      } else if (fromToken === 'PEZ' && toToken === 'HEZ') {
        // PEZ → HEZ: swap(PEZ→wHEZ) then unwrap(wHEZ→HEZ)
        const swapTx = api.tx.assetConversion.swapExactTokensForTokens(
          [1, 0], // PEZ → wHEZ
          amountIn.toString(),
          minAmountOut.toString(),
          account,
          true
        );
        const unwrapTx = api.tx.tokenWrapper.unwrap(minAmountOut.toString());
        tx = api.tx.utility.batchAll([swapTx, unwrapTx]);

      } else if (fromToken === 'HEZ') {
        // HEZ → Any Asset: wrap(HEZ→wHEZ) then swap(wHEZ→Asset)
        const wrapTx = api.tx.tokenWrapper.wrap(amountIn.toString());
        const swapTx = api.tx.assetConversion.swapExactTokensForTokens(
          [0, toAssetId!], // wHEZ → target asset
          amountIn.toString(),
          minAmountOut.toString(),
          account,
          true
        );
        tx = api.tx.utility.batchAll([wrapTx, swapTx]);

      } else if (toToken === 'HEZ') {
        // Any Asset → HEZ: swap(Asset→wHEZ) then unwrap(wHEZ→HEZ)
        const swapTx = api.tx.assetConversion.swapExactTokensForTokens(
          [fromAssetId!, 0], // source asset → wHEZ
          amountIn.toString(),
          minAmountOut.toString(),
          account,
          true
        );
        const unwrapTx = api.tx.tokenWrapper.unwrap(minAmountOut.toString());
        tx = api.tx.utility.batchAll([swapTx, unwrapTx]);

      } else {
        // Direct swap between assets (PEZ ↔ USDT, etc.)
        tx = api.tx.assetConversion.swapExactTokensForTokens(
          [fromAssetId!, toAssetId!],
          amountIn.toString(),
          minAmountOut.toString(),
          account,
          true
        );
      }

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
              toast({
                title: 'Transaction Failed',
                description: errorMessage,
                variant: 'destructive',
              });
            } else {
              setTxStatus('success');
              toast({
                title: 'Success!',
                description: `Swapped ${fromAmount} ${fromToken} for ~${toAmount} ${toToken}`,
              });
              setTimeout(() => {
                setFromAmount('');
                setToAmount('');
                setTxStatus('idle');
              }, 2000);
            }
          }
        }
      );
    } catch (error: any) {
      console.error('Swap failed:', error);
      setErrorMessage(error.message || 'Transaction failed');
      setTxStatus('error');
      toast({
        title: 'Error',
        description: error.message || 'Swap transaction failed',
        variant: 'destructive',
      });
    }
  };

  const exchangeRate = activePool && fromTokenInfo && toTokenInfo
    ? (
        parseFloat(formatTokenBalance(activePool.reserve2, toTokenInfo.decimals, 6)) /
        parseFloat(formatTokenBalance(activePool.reserve1, fromTokenInfo.decimals, 6))
      ).toFixed(6)
    : '0';

  return (
    <div className="max-w-lg mx-auto">
      {/* Transaction Loading Overlay */}
      {(txStatus === 'signing' || txStatus === 'submitting') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-green-400" />
            <p className="text-white text-xl font-semibold">
              {txStatus === 'signing' ? 'Waiting for signature...' : 'Processing swap...'}
            </p>
          </div>
        </div>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">Swap Tokens</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Settings className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {!account && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-300">
                Please connect your wallet to swap tokens
              </AlertDescription>
            </Alert>
          )}

          {/* From Token */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">From</span>
              <span className="text-gray-400">
                Balance: {formatTokenBalance(fromBalance, fromTokenInfo?.decimals ?? 12, 4)} {fromToken}
              </span>
            </div>

            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="text-2xl font-bold border-0 bg-transparent text-white placeholder:text-gray-600 focus-visible:ring-0"
                  disabled={!account}
                />
                <Select
                  value={fromToken}
                  onValueChange={(value) => {
                    setFromToken(value);
                    if (value === toToken) {
                      const otherToken = USER_TOKENS.find(t => t.symbol !== value);
                      if (otherToken) setToToken(otherToken.symbol);
                    }
                  }}
                  disabled={!account}
                >
                  <SelectTrigger className="min-w-[140px] border-gray-600 bg-gray-900">
                    <SelectValue>
                      {(() => {
                        const token = USER_TOKENS.find(t => t.symbol === fromToken);
                        return <span className="flex items-center gap-2">{token?.emoji} {token?.displaySymbol}</span>;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {USER_TOKENS.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <span className="flex items-center gap-2">{token.emoji} {token.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={handleMaxClick}
                className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded border border-green-600/30 transition-colors"
                disabled={!account}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center -my-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapDirection}
              className="rounded-full bg-gray-800 border-2 border-gray-700 hover:bg-gray-700"
              disabled={!account}
            >
              <ArrowDownUp className="h-5 w-5 text-gray-300" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">To</span>
              <span className="text-gray-400">
                Balance: {formatTokenBalance(toBalance, toTokenInfo?.decimals ?? 12, 4)} {toToken}
              </span>
            </div>

            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="text-2xl font-bold border-0 bg-transparent text-white placeholder:text-gray-600 focus-visible:ring-0"
                />
                <Select
                  value={toToken}
                  onValueChange={(value) => {
                    setToToken(value);
                    if (value === fromToken) {
                      const otherToken = USER_TOKENS.find(t => t.symbol !== value);
                      if (otherToken) setFromToken(otherToken.symbol);
                    }
                  }}
                  disabled={!account}
                >
                  <SelectTrigger className="min-w-[140px] border-gray-600 bg-gray-900">
                    <SelectValue>
                      {(() => {
                        const token = USER_TOKENS.find(t => t.symbol === toToken);
                        return <span className="flex items-center gap-2">{token?.emoji} {token?.displaySymbol}</span>;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {USER_TOKENS.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <span className="flex items-center gap-2">{token.emoji} {token.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Exchange Rate
              </span>
              <span className="text-white">
                {activePool ? `1 ${fromToken} = ${exchangeRate} ${toToken}` : 'No pool available'}
              </span>
            </div>

            {fromAmount && parseFloat(fromAmount) > 0 && priceImpact > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <AlertTriangle className={`w-3 h-3 ${
                    priceImpact < 1 ? 'text-green-500' :
                    priceImpact < 5 ? 'text-yellow-500' :
                    'text-red-500'
                  }`} />
                  Price Impact
                </span>
                <span className={`font-semibold ${
                  priceImpact < 1 ? 'text-green-400' :
                  priceImpact < 5 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {priceImpact < 0.01 ? '<0.01%' : `${priceImpact.toFixed(2)}%`}
                </span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">Slippage Tolerance</span>
              <span className="text-blue-400">{slippage}%</span>
            </div>
          </div>

          {/* Warnings */}
          {hasInsufficientBalance && (
            <Alert className="bg-red-900/20 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-300 text-sm">
                Insufficient {fromToken} balance
              </AlertDescription>
            </Alert>
          )}

          {priceImpact >= 5 && !hasInsufficientBalance && (
            <Alert className="bg-red-900/20 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-300 text-sm">
                High price impact! Consider a smaller amount.
              </AlertDescription>
            </Alert>
          )}

          {/* Swap Button */}
          <Button
            className="w-full h-12 text-lg"
            onClick={() => setShowConfirm(true)}
            disabled={
              !account ||
              !fromAmount ||
              parseFloat(fromAmount) <= 0 ||
              !activePool ||
              hasInsufficientBalance ||
              txStatus === 'signing' ||
              txStatus === 'submitting'
            }
          >
            {!account
              ? 'Connect Wallet'
              : hasInsufficientBalance
              ? `Insufficient ${fromToken} Balance`
              : !activePool
              ? 'No Pool Available'
              : 'Swap Tokens'}
          </Button>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Swap Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Slippage Tolerance</label>
              <div className="flex gap-2 mt-2">
                {[0.1, 0.5, 1.0, 2.0].map(val => (
                  <Button
                    key={val}
                    variant={slippage === val ? 'default' : 'outline'}
                    onClick={() => setSlippage(val)}
                    className="flex-1"
                  >
                    {val}%
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Swap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">You Pay</span>
                <span className="font-bold text-white">{fromAmount} {fromToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">You Receive</span>
                <span className="font-bold text-white">{toAmount} {toToken}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                <span className="text-gray-400">Exchange Rate</span>
                <span className="text-gray-400">1 {fromToken} = {exchangeRate} {toToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Slippage</span>
                <span className="text-gray-400">{slippage}%</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleConfirmSwap}
              disabled={txStatus === 'signing' || txStatus === 'submitting'}
            >
              {txStatus === 'signing' ? 'Signing...' : txStatus === 'submitting' ? 'Swapping...' : 'Confirm Swap'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
