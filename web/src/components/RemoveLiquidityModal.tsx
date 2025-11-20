import React, { useState, useEffect } from 'react';
import { X, Minus, AlertCircle, Info } from 'lucide-react';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ASSET_IDS, getAssetSymbol } from '@pezkuwi/lib/wallet';

// Helper to get display name for tokens (users see HEZ not wHEZ, USDT not wUSDT)
const getDisplayTokenName = (assetId: number): string => {
  if (assetId === ASSET_IDS.WHEZ || assetId === 0) return 'HEZ';
  if (assetId === ASSET_IDS.PEZ || assetId === 1) return 'PEZ';
  if (assetId === ASSET_IDS.WUSDT || assetId === 2) return 'USDT';
  return getAssetSymbol(assetId);
};

// Helper to get decimals for each asset
const getAssetDecimals = (assetId: number): number => {
  if (assetId === ASSET_IDS.WUSDT) return 6; // wUSDT has 6 decimals
  return 12; // wHEZ, PEZ have 12 decimals
};

interface RemoveLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpPosition: {
    lpTokenBalance: number;
    share: number;
    asset0Amount: number;
    asset1Amount: number;
  };
  lpTokenId: number;
  asset0: number;  // First asset ID in the pool
  asset1: number;  // Second asset ID in the pool
}

export const RemoveLiquidityModal: React.FC<RemoveLiquidityModalProps> = ({
  isOpen,
  onClose,
  lpPosition,
  asset0,
  asset1,
}) => {
  const { api, selectedAccount } = usePolkadot();
  const { refreshBalances } = useWallet();

  const [percentage, setPercentage] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [minBalance0, setMinBalance0] = useState<number>(0);
  const [minBalance1, setMinBalance1] = useState<number>(0);
  const [maxRemovablePercentage, setMaxRemovablePercentage] = useState<number>(100);

  // Fetch minimum balances for both assets
  useEffect(() => {
    if (!api || !isOpen) return;

    const fetchMinBalances = async () => {
      try {
        if (import.meta.env.DEV) console.log(`🔍 Fetching minBalances for pool: asset0=${asset0} (${getDisplayTokenName(asset0)}), asset1=${asset1} (${getDisplayTokenName(asset1)})`);

        // For wHEZ (asset ID 0), we need to fetch from assets pallet
        // For native HEZ, we would need existentialDeposit from balances
        // But in our pools, we only use wHEZ, wUSDT, PEZ (all wrapped assets)

        if (asset0 === ASSET_IDS.WHEZ || asset0 === 0) {
          // wHEZ is an asset in the assets pallet
          const assetDetails0 = await api.query.assets.asset(ASSET_IDS.WHEZ);
          if (assetDetails0.isSome) {
            const details0 = assetDetails0.unwrap().toJSON() as Record<string, unknown>;
            const min0 = Number(details0.minBalance) / Math.pow(10, getAssetDecimals(asset0));
            setMinBalance0(min0);
            if (import.meta.env.DEV) console.log(`📊 ${getDisplayTokenName(asset0)} minBalance: ${min0}`);
          }
        } else {
          // Other assets (PEZ, wUSDT, etc.)
          const assetDetails0 = await api.query.assets.asset(asset0);
          if (assetDetails0.isSome) {
            const details0 = assetDetails0.unwrap().toJSON() as Record<string, unknown>;
            const min0 = Number(details0.minBalance) / Math.pow(10, getAssetDecimals(asset0));
            setMinBalance0(min0);
            if (import.meta.env.DEV) console.log(`📊 ${getDisplayTokenName(asset0)} minBalance: ${min0}`);
          }
        }

        if (asset1 === ASSET_IDS.WHEZ || asset1 === 0) {
          // wHEZ is an asset in the assets pallet
          const assetDetails1 = await api.query.assets.asset(ASSET_IDS.WHEZ);
          if (assetDetails1.isSome) {
            const details1 = assetDetails1.unwrap().toJSON() as Record<string, unknown>;
            const min1 = Number(details1.minBalance) / Math.pow(10, getAssetDecimals(asset1));
            setMinBalance1(min1);
            if (import.meta.env.DEV) console.log(`📊 ${getDisplayTokenName(asset1)} minBalance: ${min1}`);
          }
        } else {
          // Other assets (PEZ, wUSDT, etc.)
          const assetDetails1 = await api.query.assets.asset(asset1);
          if (assetDetails1.isSome) {
            const details1 = assetDetails1.unwrap().toJSON() as Record<string, unknown>;
            const min1 = Number(details1.minBalance) / Math.pow(10, getAssetDecimals(asset1));
            setMinBalance1(min1);
            if (import.meta.env.DEV) console.log(`📊 ${getDisplayTokenName(asset1)} minBalance: ${min1}`);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Error fetching minBalances:', err);
      }
    };

    fetchMinBalances();
  }, [api, isOpen, asset0, asset1]);

  // Calculate maximum removable percentage based on minBalance requirements
  useEffect(() => {
    if (minBalance0 === 0 || minBalance1 === 0) return;

    // Calculate what percentage would leave exactly minBalance
    const maxPercent0 = ((lpPosition.asset0Amount - minBalance0) / lpPosition.asset0Amount) * 100;
    const maxPercent1 = ((lpPosition.asset1Amount - minBalance1) / lpPosition.asset1Amount) * 100;

    // Take the lower of the two (most restrictive)
    const maxPercent = Math.min(maxPercent0, maxPercent1, 100);

    // Round down to be safe
    const safeMaxPercent = Math.floor(maxPercent * 10) / 10;

    setMaxRemovablePercentage(safeMaxPercent > 0 ? safeMaxPercent : 99);

    if (import.meta.env.DEV) console.log(`🔒 Max removable: ${safeMaxPercent}% (asset0: ${maxPercent0.toFixed(2)}%, asset1: ${maxPercent1.toFixed(2)}%)`);
  }, [minBalance0, minBalance1, lpPosition.asset0Amount, lpPosition.asset1Amount]);

  const handleRemoveLiquidity = async () => {
    if (!api || !selectedAccount) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get the signer from the extension
      const injector = await web3FromAddress(selectedAccount.address);

      // Get decimals for each asset
      const asset0Decimals = getAssetDecimals(asset0);
      const asset1Decimals = getAssetDecimals(asset1);

      // Calculate LP tokens to remove
      const lpToRemove = (lpPosition.lpTokenBalance * percentage) / 100;
      const lpToRemoveBN = BigInt(Math.floor(lpToRemove * 1e12));

      // Calculate expected token amounts (with 95% slippage tolerance)
      const expectedAsset0BN = BigInt(Math.floor((lpPosition.asset0Amount * percentage) / 100 * Math.pow(10, asset0Decimals)));
      const expectedAsset1BN = BigInt(Math.floor((lpPosition.asset1Amount * percentage) / 100 * Math.pow(10, asset1Decimals)));

      const minAsset0BN = (expectedAsset0BN * BigInt(95)) / BigInt(100);
      const minAsset1BN = (expectedAsset1BN * BigInt(95)) / BigInt(100);

      // Remove liquidity transaction
      const removeLiquidityTx = api.tx.assetConversion.removeLiquidity(
        asset0,
        asset1,
        lpToRemoveBN.toString(),
        minAsset0BN.toString(),
        minAsset1BN.toString(),
        selectedAccount.address
      );

      // Check if we need to unwrap wHEZ back to HEZ
      const hasWHEZ = asset0 === ASSET_IDS.WHEZ || asset1 === ASSET_IDS.WHEZ;
      let tx;

      if (hasWHEZ) {
        // Unwrap wHEZ back to HEZ
        const whezAmount = asset0 === ASSET_IDS.WHEZ ? minAsset0BN : minAsset1BN;
        const unwrapTx = api.tx.tokenWrapper.unwrap(whezAmount.toString());
        // Batch transactions: removeLiquidity + unwrap
        tx = api.tx.utility.batchAll([removeLiquidityTx, unwrapTx]);
      } else {
        // No unwrap needed for pools without wHEZ
        tx = removeLiquidityTx;
      }

      await tx.signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        ({ status, events }) => {
          if (status.isInBlock) {
            if (import.meta.env.DEV) console.log('Transaction in block');
          } else if (status.isFinalized) {
            if (import.meta.env.DEV) console.log('Transaction finalized');

            // Check for errors
            const hasError = events.some(({ event }) =>
              api.events.system.ExtrinsicFailed.is(event)
            );

            if (hasError) {
              setError('Transaction failed');
              setIsLoading(false);
            } else {
              setSuccess(true);
              setIsLoading(false);
              refreshBalances();

              setTimeout(() => {
                setSuccess(false);
                onClose();
              }, 2000);
            }
          }
        }
      );
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error removing liquidity:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove liquidity');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get display names for the assets
  const asset0Name = getDisplayTokenName(asset0);
  const asset1Name = getDisplayTokenName(asset1);

  const asset0ToReceive = (lpPosition.asset0Amount * percentage) / 100;
  const asset1ToReceive = (lpPosition.asset1Amount * percentage) / 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Remove Liquidity</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <Alert className="mb-4 bg-red-900/20 border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-900/20 border-green-500">
            <AlertDescription>Liquidity removed successfully!</AlertDescription>
          </Alert>
        )}

        <Alert className="mb-4 bg-blue-900/20 border-blue-500">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Remove your liquidity to receive back your tokens.{' '}
            {(asset0 === ASSET_IDS.WHEZ || asset1 === ASSET_IDS.WHEZ) && 'wHEZ will be automatically unwrapped to HEZ.'}
          </AlertDescription>
        </Alert>

        {maxRemovablePercentage < 100 && (
          <Alert className="mb-4 bg-yellow-900/20 border-yellow-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Maximum removable: {maxRemovablePercentage.toFixed(1)}% - Pool must maintain minimum balance of {minBalance0.toFixed(6)} {asset0Name} and {minBalance1.toFixed(6)} {asset1Name}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Percentage Selector */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Amount to Remove</label>
              <span className="text-2xl font-bold text-white">{percentage}%</span>
            </div>

            <input
              type="range"
              min="1"
              max={maxRemovablePercentage}
              value={Math.min(percentage, maxRemovablePercentage)}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              disabled={isLoading}
            />

            <div className="flex justify-between mt-2">
              {[25, 50, 75, 100].map((p) => {
                const effectiveP = p === 100 ? Math.floor(maxRemovablePercentage) : p;
                const isDisabled = p > maxRemovablePercentage;
                return (
                  <button
                    key={p}
                    onClick={() => setPercentage(Math.min(effectiveP, maxRemovablePercentage))}
                    className={`px-3 py-1 rounded text-sm ${
                      percentage === effectiveP
                        ? 'bg-blue-600 text-white'
                        : isDisabled
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    disabled={isLoading || isDisabled}
                  >
                    {p === 100 ? 'MAX' : `${p}%`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* You Will Receive */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-300 mb-2">You Will Receive</h3>

            <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-xs text-gray-400">{asset0Name}</p>
                <p className="text-xl font-bold text-white">
                  {asset0ToReceive.toFixed(4)}
                </p>
              </div>
              <Minus className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-xs text-gray-400">{asset1Name}</p>
                <p className="text-xl font-bold text-white">
                  {asset1ToReceive.toFixed(4)}
                </p>
              </div>
              <Minus className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* LP Token Info */}
          <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>LP Tokens to Burn</span>
              <span>{((lpPosition.lpTokenBalance * percentage) / 100).toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Remaining LP Tokens</span>
              <span>
                {((lpPosition.lpTokenBalance * (100 - percentage)) / 100).toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Remaining {asset0Name}</span>
              <span className={asset0ToReceive >= lpPosition.asset0Amount - minBalance0 ? 'text-yellow-400' : ''}>
                {(lpPosition.asset0Amount - asset0ToReceive).toFixed(6)} (min: {minBalance0.toFixed(6)})
              </span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Remaining {asset1Name}</span>
              <span className={asset1ToReceive >= lpPosition.asset1Amount - minBalance1 ? 'text-yellow-400' : ''}>
                {(lpPosition.asset1Amount - asset1ToReceive).toFixed(6)} (min: {minBalance1.toFixed(6)})
              </span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Slippage Tolerance</span>
              <span>5%</span>
            </div>
          </div>

          <Button
            onClick={handleRemoveLiquidity}
            disabled={isLoading || percentage === 0 || percentage > maxRemovablePercentage}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-12"
          >
            {isLoading ? 'Removing Liquidity...' : 'Remove Liquidity'}
          </Button>
        </div>
      </div>
    </div>
  );
};
