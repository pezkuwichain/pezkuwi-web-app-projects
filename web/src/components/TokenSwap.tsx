import React, { useState, useEffect } from 'react';
import { ArrowDownUp, Settings, TrendingUp, Clock, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { ASSET_IDS, formatBalance, parseAmount } from '@/lib/wallet';
import { useToast } from '@/hooks/use-toast';
import { KurdistanSun } from './KurdistanSun';
import { PriceChart } from './trading/PriceChart';
import { LimitOrders } from './trading/LimitOrders';

// Available tokens for swap
const AVAILABLE_TOKENS = [
  { symbol: 'HEZ', emoji: '🟡', assetId: 0, name: 'HEZ', badge: true, displaySymbol: 'HEZ' },
  { symbol: 'PEZ', emoji: '🟣', assetId: 1, name: 'PEZ', badge: true, displaySymbol: 'PEZ' },
  { symbol: 'USDT', emoji: '💵', assetId: 2, name: 'USDT', badge: true, displaySymbol: 'USDT' },
] as const;

const TokenSwap = () => {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const { balances, refreshBalances } = useWallet();
  const { toast } = useToast();

  const [fromToken, setFromToken] = useState('PEZ');
  const [toToken, setToToken] = useState('HEZ');
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // DEX availability check
  const [isDexAvailable, setIsDexAvailable] = useState(false);

  // Exchange rate and loading states
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Get balances from wallet context
  console.log('🔍 TokenSwap balances from context:', balances);
  console.log('🔍 fromToken:', fromToken, 'toToken:', toToken);
  const fromBalance = balances[fromToken as keyof typeof balances];
  const toBalance = balances[toToken as keyof typeof balances];
  console.log('🔍 Final balances:', { fromBalance, toBalance });

  // Liquidity pool data
  const [liquidityPools, setLiquidityPools] = useState<any[]>([]);
  const [isLoadingPools, setIsLoadingPools] = useState(false);

  // Transaction history
  interface SwapTransaction {
    blockNumber: number;
    timestamp: number;
    from: string;
    fromToken: string;
    fromAmount: string;
    toToken: string;
    toAmount: string;
    txHash: string;
  }
  const [swapHistory, setSwapHistory] = useState<SwapTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Pool reserves for AMM calculation
  const [poolReserves, setPoolReserves] = useState<{ reserve0: number; reserve1: number; asset0: number; asset1: number } | null>(null);

  // Helper: Get display name for token (USDT instead of wUSDT)
  const getTokenDisplayName = (tokenSymbol: string) => {
    const token = AVAILABLE_TOKENS.find(t => t.symbol === tokenSymbol);
    return token?.displaySymbol || tokenSymbol;
  };

  // Check if user has insufficient balance
  const hasInsufficientBalance = React.useMemo(() => {
    const fromAmountNum = parseFloat(fromAmount || '0');
    const fromBalanceNum = parseFloat(fromBalance?.toString() || '0');
    return fromAmountNum > 0 && fromAmountNum > fromBalanceNum;
  }, [fromAmount, fromBalance]);

  // Calculate toAmount and price impact using AMM constant product formula
  const swapCalculations = React.useMemo(() => {
    if (!fromAmount || !poolReserves || parseFloat(fromAmount) <= 0) {
      return { toAmount: '', priceImpact: 0, minimumReceived: '', lpFee: '' };
    }

    const amountIn = parseFloat(fromAmount);
    const { reserve0, reserve1, asset0, asset1 } = poolReserves;

    // Determine which reserve is input and which is output
    const fromAssetId = fromToken === 'HEZ' ? 0 : ASSET_IDS[fromToken as keyof typeof ASSET_IDS];
    const isAsset0ToAsset1 = fromAssetId === asset0;

    const reserveIn = isAsset0ToAsset1 ? reserve0 : reserve1;
    const reserveOut = isAsset0ToAsset1 ? reserve1 : reserve0;

    // Uniswap V2 AMM formula (matches Substrate runtime exactly)
    // Runtime: amount_in_with_fee = amount_in * (1000 - LPFee) = amount_in * 970
    // LPFee = 30 (3% fee, not 0.3%!)
    // Formula: amountOut = (amountIn * 970 * reserveOut) / (reserveIn * 1000 + amountIn * 970)
    const LP_FEE = 30; // 3% fee
    const amountInWithFee = amountIn * (1000 - LP_FEE); // = amountIn * 970
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000 + amountInWithFee;
    const amountOut = numerator / denominator;

    // Calculate price impact (like Uniswap)
    // Price impact = (amount_in / reserve_in) / (1 + amount_in / reserve_in) * 100
    const priceImpact = (amountIn / (reserveIn + amountIn)) * 100;

    // Calculate LP fee amount
    const lpFeeAmount = (amountIn * (LP_FEE / 1000)).toFixed(4);

    // Calculate minimum received with slippage
    const minReceived = (amountOut * (1 - parseFloat(slippage) / 100)).toFixed(4);

    console.log('🔍 Uniswap V2 AMM:', {
      amountIn,
      amountInWithFee,
      reserveIn,
      reserveOut,
      numerator,
      denominator,
      amountOut,
      priceImpact: priceImpact.toFixed(2) + '%',
      lpFeeAmount,
      minReceived,
      feePercent: LP_FEE / 10 + '%'
    });

    return {
      toAmount: amountOut.toFixed(4),
      priceImpact,
      minimumReceived: minReceived,
      lpFee: lpFeeAmount
    };
  }, [fromAmount, poolReserves, fromToken, slippage]);

  const { toAmount, priceImpact, minimumReceived, lpFee } = swapCalculations;

  // Check if AssetConversion pallet is available
  useEffect(() => {
    console.log('🔍 Checking DEX availability...', { api: !!api, isApiReady });
    if (api && isApiReady) {
      const hasAssetConversion = api.tx.assetConversion !== undefined;
      console.log('🔍 AssetConversion pallet check:', hasAssetConversion);
      setIsDexAvailable(hasAssetConversion);

      if (!hasAssetConversion) {
        console.warn('⚠️ AssetConversion pallet not available in runtime');
      } else {
        console.log('✅ AssetConversion pallet is available!');
      }
    }
  }, [api, isApiReady]);

  // Fetch exchange rate from AssetConversion pool
  // Always use wHEZ/PEZ pool (the only valid pool)
  useEffect(() => {
    const fetchExchangeRate = async () => {
      console.log('🔍 fetchExchangeRate check:', { api: !!api, isApiReady, isDexAvailable, fromToken, toToken });

      if (!api || !isApiReady || !isDexAvailable) {
        console.log('⚠️ Skipping fetchExchangeRate:', { api: !!api, isApiReady, isDexAvailable });
        return;
      }

      console.log('✅ Starting fetchExchangeRate...');
      setIsLoadingRate(true);
      try {
        // Map user-selected tokens to actual pool assets
        // HEZ → wHEZ (Asset 0) behind the scenes
        const getPoolAssetId = (token: string) => {
          if (token === 'HEZ') return 0; // wHEZ
          if (token === 'PEZ') return 1;
          if (token === 'USDT') return 2;
          return ASSET_IDS[token as keyof typeof ASSET_IDS];
        };

        const fromAssetId = getPoolAssetId(fromToken);
        const toAssetId = getPoolAssetId(toToken);

        console.log('🔍 Looking for pool:', { fromToken, toToken, fromAssetId, toAssetId });

        // IMPORTANT: Pool ID must be sorted (smaller asset ID first)
        const [asset1, asset2] = fromAssetId < toAssetId
          ? [fromAssetId, toAssetId]
          : [toAssetId, fromAssetId];

        console.log('🔍 Sorted pool assets:', { asset1, asset2 });

        // Create pool asset tuple [asset1, asset2] - must be sorted!
        const poolAssets = [
          { NativeOrAsset: { Asset: asset1 } },
          { NativeOrAsset: { Asset: asset2 } }
        ];

        console.log('🔍 Pool query with:', poolAssets);

        // Query pool from AssetConversion pallet
        const poolInfo = await api.query.assetConversion.pools(poolAssets);
        console.log('🔍 Pool query result:', poolInfo.toHuman());

        console.log('🔍 Pool isEmpty?', poolInfo.isEmpty, 'exists?', !poolInfo.isEmpty);

        if (poolInfo && !poolInfo.isEmpty) {
          const pool = poolInfo.toJSON() as any;
          console.log('🔍 Pool data:', pool);

          try {
            // New pallet version: reserves are stored in pool account balances
            // AccountIdConverter implementation in substrate:
            // blake2_256(&Encode::encode(&(PalletId, PoolId))[..])
            console.log('🔍 Deriving pool account using AccountIdConverter...');
            const { stringToU8a } = await import('@polkadot/util');
            const { blake2AsU8a } = await import('@polkadot/util-crypto');

            // PalletId for AssetConversion: "py/ascon" (8 bytes)
            const PALLET_ID = stringToU8a('py/ascon');

            // Create PoolId tuple (u32, u32)
            const poolId = api.createType('(u32, u32)', [asset1, asset2]);
            console.log('🔍 Pool ID:', poolId.toHuman());

            // Create (PalletId, PoolId) tuple: ([u8; 8], (u32, u32))
            const palletIdType = api.createType('[u8; 8]', PALLET_ID);
            const fullTuple = api.createType('([u8; 8], (u32, u32))', [palletIdType, poolId]);

            console.log('🔍 Full tuple encoded length:', fullTuple.toU8a().length);
            console.log('🔍 Full tuple bytes:', Array.from(fullTuple.toU8a()));

            // Hash the SCALE-encoded tuple
            const accountHash = blake2AsU8a(fullTuple.toU8a(), 256);
            console.log('🔍 Account hash:', Array.from(accountHash).slice(0, 8));

            const poolAccountId = api.createType('AccountId32', accountHash);
            console.log('🔍 Pool AccountId (NEW METHOD):', poolAccountId.toString());

            // Query pool account's asset balances
            console.log('🔍 Querying reserves for asset', asset1, 'and', asset2);
            const reserve0Query = await api.query.assets.account(asset1, poolAccountId);
            const reserve1Query = await api.query.assets.account(asset2, poolAccountId);

            console.log('🔍 Reserve0 query result:', reserve0Query.toHuman());
            console.log('🔍 Reserve1 query result:', reserve1Query.toHuman());
            console.log('🔍 Reserve0 isEmpty?', reserve0Query.isEmpty);
            console.log('🔍 Reserve1 isEmpty?', reserve1Query.isEmpty);

            const reserve0Data = reserve0Query.toJSON() as any;
            const reserve1Data = reserve1Query.toJSON() as any;

            console.log('🔍 Reserve0 JSON:', reserve0Data);
            console.log('🔍 Reserve1 JSON:', reserve1Data);

            if (reserve0Data && reserve1Data && reserve0Data.balance && reserve1Data.balance) {
              // Parse hex string balances to BigInt, then to number
              const balance0Hex = reserve0Data.balance.toString();
              const balance1Hex = reserve1Data.balance.toString();

              console.log('🔍 Raw hex balances:', { balance0Hex, balance1Hex });

              // Use correct decimals for each asset
              // asset1=0 (wHEZ): 12 decimals
              // asset1=1 (PEZ): 12 decimals
              // asset2=2 (wUSDT): 6 decimals
              const decimals0 = asset1 === 2 ? 6 : 12; // asset1 is the smaller ID
              const decimals1 = asset2 === 2 ? 6 : 12; // asset2 is the larger ID

              const reserve0 = Number(BigInt(balance0Hex)) / (10 ** decimals0);
              const reserve1 = Number(BigInt(balance1Hex)) / (10 ** decimals1);

              console.log('✅ Reserves found:', { reserve0, reserve1, decimals0, decimals1 });

              // Store pool reserves for AMM calculation
              setPoolReserves({
                reserve0,
                reserve1,
                asset0: asset1,  // Sorted pool always has asset1 < asset2
                asset1: asset2
              });

              // Also calculate simple exchange rate for display
              const rate = fromAssetId === asset1
                ? reserve1 / reserve0  // from asset1 to asset2
                : reserve0 / reserve1; // from asset2 to asset1

              console.log('✅ Exchange rate:', rate, 'direction:', fromAssetId === asset1 ? 'asset1→asset2' : 'asset2→asset1');
              setExchangeRate(rate);
            } else {
              console.warn('⚠️ Pool has no reserves - reserve0Data:', reserve0Data, 'reserve1Data:', reserve1Data);
              setExchangeRate(0);
            }
          } catch (err) {
            console.error('❌ Error deriving pool account:', err);
            setExchangeRate(0);
          }
        } else {
          console.warn('No liquidity pool found for this pair');
          setExchangeRate(0);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        setExchangeRate(0);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchExchangeRate();
  }, [api, isApiReady, isDexAvailable, fromToken, toToken]);

  // Fetch liquidity pools
  useEffect(() => {
    const fetchLiquidityPools = async () => {
      if (!api || !isApiReady || !isDexAvailable) {
        return;
      }

      setIsLoadingPools(true);
      try {
        // Query all pools from AssetConversion pallet
        const poolsEntries = await api.query.assetConversion.pools.entries();

        if (poolsEntries && poolsEntries.length > 0) {
          const pools = poolsEntries.map(([key, value]: any) => {
            const poolData = value.toJSON();
            const poolKey = key.toHuman();
            
            // Calculate TVL from reserves
            const tvl = poolData && poolData[0] && poolData[1]
              ? ((parseFloat(poolData[0]) + parseFloat(poolData[1])) / 1e12).toFixed(2)
              : '0';
            
            // Parse asset IDs from pool key
            const assets = poolKey?.[0] || [];
            const asset1 = assets[0]?.NativeOrAsset?.Asset || '?';
            const asset2 = assets[1]?.NativeOrAsset?.Asset || '?';
            
            return {
              pool: `Asset ${asset1} / Asset ${asset2}`,
              tvl: `$${tvl}M`,
              apr: 'TBD', // Requires historical data
              volume: 'TBD', // Requires event indexing
            };
          });

          setLiquidityPools(pools.slice(0, 3));
        } else {
          setLiquidityPools([]);
        }
      } catch (error) {
        console.error('Failed to fetch liquidity pools:', error);
        setLiquidityPools([]);
      } finally {
        setIsLoadingPools(false);
      }
    };

    fetchLiquidityPools();
  }, [api, isApiReady, isDexAvailable]);

  // Fetch swap transaction history
  useEffect(() => {
    const fetchSwapHistory = async () => {
      if (!api || !isApiReady || !isDexAvailable || !selectedAccount) {
        return;
      }

      setIsLoadingHistory(true);
      try {
        // Get recent finalized blocks (last 100 blocks)
        const finalizedHead = await api.rpc.chain.getFinalizedHead();
        const finalizedBlock = await api.rpc.chain.getBlock(finalizedHead);
        const currentBlockNumber = finalizedBlock.block.header.number.toNumber();

        const startBlock = Math.max(0, currentBlockNumber - 100);

        console.log('🔍 Fetching swap history from block', startBlock, 'to', currentBlockNumber);

        const transactions: SwapTransaction[] = [];

        // Query block by block for SwapExecuted events
        for (let blockNum = currentBlockNumber; blockNum >= startBlock && transactions.length < 10; blockNum--) {
          try {
            const blockHash = await api.rpc.chain.getBlockHash(blockNum);
            const apiAt = await api.at(blockHash);
            const events = await apiAt.query.system.events();
            const block = await api.rpc.chain.getBlock(blockHash);
            const timestamp = Date.now() - ((currentBlockNumber - blockNum) * 6000); // Estimate 6s per block

            events.forEach((record: any) => {
              const { event } = record;

              // Check for AssetConversion::SwapExecuted event
              if (api.events.assetConversion?.SwapExecuted?.is(event)) {
                // SwapExecuted has 5 fields: (who, send_to, amountIn, amountOut, path)
                const [who, sendTo, amountIn, amountOut, path] = event.data;

                // Parse path to get token symbols - path is Vec<MultiAsset>
                let fromAssetId = 0;
                let toAssetId = 0;

                try {
                  // Path structure is: [[assetId, amount], [assetId, amount]]
                  const pathArray = path.toJSON ? path.toJSON() : path;

                  if (Array.isArray(pathArray) && pathArray.length >= 2) {
                    // Extract asset IDs from path
                    const asset0 = pathArray[0];
                    const asset1 = pathArray[1];

                    // Each element is a tuple where index 0 is the asset ID
                    if (Array.isArray(asset0) && asset0.length >= 1) {
                      fromAssetId = typeof asset0[0] === 'number' ? asset0[0] : parseInt(asset0[0]) || 0;
                    }
                    if (Array.isArray(asset1) && asset1.length >= 1) {
                      toAssetId = typeof asset1[0] === 'number' ? asset1[0] : parseInt(asset1[0]) || 0;
                    }
                  }
                } catch (err) {
                  console.warn('Failed to parse swap path:', err);
                }

                const fromTokenSymbol = fromAssetId === 0 ? 'wHEZ' : fromAssetId === 1 ? 'PEZ' : fromAssetId === 2 ? 'USDT' : `Asset${fromAssetId}`;
                const toTokenSymbol = toAssetId === 0 ? 'wHEZ' : toAssetId === 1 ? 'PEZ' : toAssetId === 2 ? 'USDT' : `Asset${toAssetId}`;

                // Only show transactions from current user
                if (who.toString() === selectedAccount.address) {
                  transactions.push({
                    blockNumber: blockNum,
                    timestamp,
                    from: who.toString(),
                    fromToken: fromTokenSymbol === 'wHEZ' ? 'HEZ' : fromTokenSymbol,
                    fromAmount: formatBalance(amountIn.toString()),
                    toToken: toTokenSymbol === 'wHEZ' ? 'HEZ' : toTokenSymbol,
                    toAmount: formatBalance(amountOut.toString()),
                    txHash: blockHash.toHex()
                  });
                }
              }
            });
          } catch (err) {
            console.warn(`Failed to fetch block ${blockNum}:`, err);
          }
        }

        console.log('✅ Swap history fetched:', transactions.length, 'transactions');
        setSwapHistory(transactions.slice(0, 10)); // Show max 10
      } catch (error) {
        console.error('Failed to fetch swap history:', error);
        setSwapHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchSwapHistory();
  }, [api, isApiReady, isDexAvailable, selectedAccount]);

  const handleSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
  };

  const handleConfirmSwap = async () => {
    if (!api || !selectedAccount) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    if (!isDexAvailable) {
      toast({
        title: 'DEX Not Available',
        description: 'AssetConversion pallet is not enabled in runtime',
        variant: 'destructive',
      });
      return;
    }

    if (!exchangeRate || exchangeRate === 0) {
      toast({
        title: 'Error',
        description: 'No liquidity pool available for this pair',
        variant: 'destructive',
      });
      return;
    }

    // ✅ BALANCE VALIDATION - Check if user has sufficient balance
    const fromAmountNum = parseFloat(fromAmount);
    const fromBalanceNum = parseFloat(fromBalance?.toString() || '0');

    if (fromAmountNum > fromBalanceNum) {
      toast({
        title: 'Insufficient Balance',
        description: `You only have ${fromBalanceNum.toFixed(4)} ${getTokenDisplayName(fromToken)}. Cannot swap ${fromAmountNum} ${getTokenDisplayName(fromToken)}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSwapping(true);
    setShowConfirm(false); // Close dialog before transaction starts
    try {
      // Get correct decimals for each token
      const getTokenDecimals = (token: string) => {
        if (token === 'USDT') return 6; // USDT has 6 decimals
        return 12; // HEZ, wHEZ, PEZ all have 12 decimals
      };

      const fromDecimals = getTokenDecimals(fromToken);
      const toDecimals = getTokenDecimals(toToken);

      const amountIn = parseAmount(fromAmount, fromDecimals);
      const minAmountOut = parseAmount(
        (parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toString(),
        toDecimals
      );

      console.log('💰 Swap amounts:', {
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        fromDecimals,
        toDecimals,
        amountIn: amountIn.toString(),
        minAmountOut: minAmountOut.toString()
      });

      // Get signer from extension
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      // Build transaction based on token types
      let tx;

      if (fromToken === 'HEZ' && toToken === 'PEZ') {
        // HEZ → PEZ: wrap(HEZ→wHEZ) then swap(wHEZ→PEZ)
        const wrapTx = api.tx.tokenWrapper.wrap(amountIn.toString());
        // AssetKind = u32, so swap path is just [0, 1]
        const swapPath = [0, 1]; // wHEZ → PEZ
        const swapTx = api.tx.assetConversion.swapExactTokensForTokens(
          swapPath,
          amountIn.toString(),
          minAmountOut.toString(),
          selectedAccount.address,
          true
        );
        tx = api.tx.utility.batchAll([wrapTx, swapTx]);

      } else if (fromToken === 'PEZ' && toToken === 'HEZ') {
        // PEZ → HEZ: swap(PEZ→wHEZ) then unwrap(wHEZ→HEZ)
        // AssetKind = u32, so swap path is just [1, 0]
        const swapPath = [1, 0]; // PEZ → wHEZ
        const swapTx = api.tx.assetConversion.swapExactTokensForTokens(
          swapPath,
          amountIn.toString(),
          minAmountOut.toString(),
          selectedAccount.address,
          true
        );
        const unwrapTx = api.tx.tokenWrapper.unwrap(minAmountOut.toString());
        tx = api.tx.utility.batchAll([swapTx, unwrapTx]);

      } else if (fromToken === 'HEZ') {
        // HEZ → Any Asset: wrap(HEZ→wHEZ) then swap(wHEZ→Asset)
        const wrapTx = api.tx.tokenWrapper.wrap(amountIn.toString());
        // Map token symbol to asset ID
        const toAssetId = toToken === 'PEZ' ? 1 : toToken === 'USDT' ? 2 : ASSET_IDS[toToken as keyof typeof ASSET_IDS];
        const swapPath = [0, toAssetId]; // wHEZ → target asset
        const swapTx = api.tx.assetConversion.swapExactTokensForTokens(
          swapPath,
          amountIn.toString(),
          minAmountOut.toString(),
          selectedAccount.address,
          true
        );
        tx = api.tx.utility.batchAll([wrapTx, swapTx]);

      } else if (toToken === 'HEZ') {
        // Any Asset → HEZ: swap(Asset→wHEZ) then unwrap(wHEZ→HEZ)
        // Map token symbol to asset ID
        const fromAssetId = fromToken === 'PEZ' ? 1 : fromToken === 'USDT' ? 2 : ASSET_IDS[fromToken as keyof typeof ASSET_IDS];
        const swapPath = [fromAssetId, 0]; // source asset → wHEZ
        const swapTx = api.tx.assetConversion.swapExactTokensForTokens(
          swapPath,
          amountIn.toString(),
          minAmountOut.toString(),
          selectedAccount.address,
          true
        );
        const unwrapTx = api.tx.tokenWrapper.unwrap(minAmountOut.toString());
        tx = api.tx.utility.batchAll([swapTx, unwrapTx]);

      } else {
        // Direct swap between assets (PEZ ↔ USDT, etc.)
        // Map token symbols to asset IDs
        const fromAssetId = fromToken === 'PEZ' ? 1 : fromToken === 'USDT' ? 2 : ASSET_IDS[fromToken as keyof typeof ASSET_IDS];
        const toAssetId = toToken === 'PEZ' ? 1 : toToken === 'USDT' ? 2 : ASSET_IDS[toToken as keyof typeof ASSET_IDS];
        const swapPath = [fromAssetId, toAssetId];

        tx = api.tx.assetConversion.swapExactTokensForTokens(
          swapPath,
          amountIn.toString(),
          minAmountOut.toString(),
          selectedAccount.address,
          true
        );
      }

      // Sign and send transaction
      await tx.signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        async ({ status, events, dispatchError }) => {
          console.log('🔍 Transaction status:', status.toHuman());

          if (status.isInBlock) {
            console.log('✅ Transaction in block:', status.asInBlock.toHex());

            toast({
              title: 'Transaction Submitted',
              description: `Processing in block ${status.asInBlock.toHex().slice(0, 10)}...`,
            });
          }

          if (status.isFinalized) {
            console.log('✅ Transaction finalized:', status.asFinalized.toHex());
            console.log('🔍 All events:', events.map(({ event }) => event.toHuman()));
            console.log('🔍 dispatchError:', dispatchError?.toHuman());

            // Check for errors
            if (dispatchError) {
              let errorMessage = 'Transaction failed';

              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }

              toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
              });
              setIsSwapping(false);
              return;
            }

            // Success - check for swap event
            const hasSwapEvent = events.some(({ event }) =>
              api.events.assetConversion?.SwapExecuted?.is(event)
            );

            if (hasSwapEvent || fromToken === 'HEZ' || toToken === 'HEZ') {
              toast({
                title: 'Success!',
                description: `Swapped ${fromAmount} ${fromToken} for ~${toAmount} ${toToken}`,
              });

              setFromAmount('');

              // Refresh balances and history without page reload
              await refreshBalances();
              console.log('✅ Balances refreshed after swap');

              // Refresh swap history after 3 seconds (wait for block finalization)
              setTimeout(async () => {
                console.log('🔄 Refreshing swap history...');
                const fetchSwapHistory = async () => {
                  if (!api || !isApiReady || !isDexAvailable || !selectedAccount) return;
                  setIsLoadingHistory(true);
                  try {
                    const finalizedHead = await api.rpc.chain.getFinalizedHead();
                    const finalizedBlock = await api.rpc.chain.getBlock(finalizedHead);
                    const currentBlockNumber = finalizedBlock.block.header.number.toNumber();
                    const startBlock = Math.max(0, currentBlockNumber - 100);
                    const transactions: SwapTransaction[] = [];
                    for (let blockNum = currentBlockNumber; blockNum >= startBlock && transactions.length < 10; blockNum--) {
                      try {
                        const blockHash = await api.rpc.chain.getBlockHash(blockNum);
                        const apiAt = await api.at(blockHash);
                        const events = await apiAt.query.system.events();
                        const timestamp = Date.now() - ((currentBlockNumber - blockNum) * 6000);
                        events.forEach((record: any) => {
                          const { event } = record;
                          if (api.events.assetConversion?.SwapExecuted?.is(event)) {
                            // SwapExecuted has 5 fields: (who, send_to, amountIn, amountOut, path)
                            const [who, sendTo, amountIn, amountOut, path] = event.data;

                            // Parse path (same logic as main history fetch)
                            let fromAssetId = 0;
                            let toAssetId = 0;
                            try {
                              // Path structure is: [[assetId, amount], [assetId, amount]]
                              const pathArray = path.toJSON ? path.toJSON() : path;

                              if (Array.isArray(pathArray) && pathArray.length >= 2) {
                                const asset0 = pathArray[0];
                                const asset1 = pathArray[1];

                                // Each element is a tuple where index 0 is the asset ID
                                if (Array.isArray(asset0) && asset0.length >= 1) {
                                  fromAssetId = typeof asset0[0] === 'number' ? asset0[0] : parseInt(asset0[0]) || 0;
                                }
                                if (Array.isArray(asset1) && asset1.length >= 1) {
                                  toAssetId = typeof asset1[0] === 'number' ? asset1[0] : parseInt(asset1[0]) || 0;
                                }
                              }
                            } catch (err) {
                              console.warn('Failed to parse swap path in refresh:', err);
                            }

                            const fromTokenSymbol = fromAssetId === 0 ? 'wHEZ' : fromAssetId === 1 ? 'PEZ' : fromAssetId === 2 ? 'USDT' : `Asset${fromAssetId}`;
                            const toTokenSymbol = toAssetId === 0 ? 'wHEZ' : toAssetId === 1 ? 'PEZ' : toAssetId === 2 ? 'USDT' : `Asset${toAssetId}`;

                            if (who.toString() === selectedAccount.address) {
                              transactions.push({
                                blockNumber: blockNum,
                                timestamp,
                                from: who.toString(),
                                fromToken: fromTokenSymbol === 'wHEZ' ? 'HEZ' : fromTokenSymbol,
                                fromAmount: formatBalance(amountIn.toString()),
                                toToken: toTokenSymbol === 'wHEZ' ? 'HEZ' : toTokenSymbol,
                                toAmount: formatBalance(amountOut.toString()),
                                txHash: blockHash.toHex()
                              });
                            }
                          }
                        });
                      } catch (err) {
                        console.warn(`Failed to fetch block ${blockNum}:`, err);
                      }
                    }
                    setSwapHistory(transactions.slice(0, 10));
                  } catch (error) {
                    console.error('Failed to refresh swap history:', error);
                  } finally {
                    setIsLoadingHistory(false);
                  }
                };
                await fetchSwapHistory();
              }, 3000);
            } else {
              toast({
                title: 'Error',
                description: 'Swap transaction failed',
                variant: 'destructive',
              });
            }

            setIsSwapping(false);
          }
        }
      );
    } catch (error: any) {
      console.error('Swap failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Swap transaction failed',
        variant: 'destructive',
      });
      setIsSwapping(false);
    }
  };

  // Show DEX unavailable message
  if (!isDexAvailable && isApiReady) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-yellow-500/10 rounded-full">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">DEX Coming Soon</h2>
              <p className="text-gray-300 max-w-md mx-auto">
                The AssetConversion pallet is not yet enabled in the runtime.
                Token swapping functionality will be available after the next runtime upgrade.
              </p>
            </div>

            <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
              Scheduled for Next Runtime Upgrade
            </Badge>

            <div className="pt-4">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kurdistan Sun Animation Overlay during swap (only after confirm dialog is closed) */}
      {isSwapping && !showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <KurdistanSun size={300} />
            <p className="text-white text-xl font-semibold animate-pulse">
              Processing your swap...
            </p>
          </div>
        </div>
      )}

      <div className="lg:col-span-2 space-y-6">
        {/* Price Chart */}
        {exchangeRate > 0 && (
          <PriceChart
            fromToken={fromToken}
            toToken={toToken}
            currentPrice={exchangeRate}
          />
        )}

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Token Swap</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {!selectedAccount && (
            <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/30">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-300">
                Please connect your wallet to swap tokens
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">From</span>
                <span className="text-sm text-gray-400">
                  Balance: {fromBalance} {getTokenDisplayName(fromToken)}
                </span>
              </div>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="text-2xl font-bold border-0 bg-transparent text-white placeholder:text-gray-600"
                  disabled={!selectedAccount}
                />
                <Select
                  value={fromToken}
                  onValueChange={(value) => {
                    setFromToken(value);
                    // Prevent selecting same token for both sides
                    if (value === toToken) {
                      const otherToken = AVAILABLE_TOKENS.find(t => t.symbol !== value);
                      if (otherToken) setToToken(otherToken.symbol);
                    }
                  }}
                  disabled={!selectedAccount}
                >
                  <SelectTrigger className="min-w-[140px] border-gray-600 hover:border-gray-500">
                    <SelectValue>
                      {(() => {
                        const token = AVAILABLE_TOKENS.find(t => t.symbol === fromToken);
                        return (
                          <span className="flex items-center gap-1.5 relative">
                            {token?.emoji} {token?.displaySymbol || token?.name}
                            {token?.badge && (
                              <span className="w-2 h-2 bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 rounded-sm absolute -bottom-0.5 -right-0.5"></span>
                            )}
                          </span>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_TOKENS.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <span className="flex items-center gap-2">
                          <span>{token.emoji} {token.name}</span>
                          {token.badge && (
                            <span className="w-2.5 h-2.5 bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 rounded-sm ml-1"></span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center -my-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwap}
                className="rounded-full bg-gray-800 border-2 border-gray-700 hover:bg-gray-700 hover:border-gray-600"
                disabled={!selectedAccount}
              >
                <ArrowDownUp className="h-5 w-5 text-gray-300" />
              </Button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">To</span>
                <span className="text-sm text-gray-400">
                  Balance: {toBalance} {getTokenDisplayName(toToken)}
                </span>
              </div>
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="text-2xl font-bold border-0 bg-transparent text-white placeholder:text-gray-600"
                />
                <Select
                  value={toToken}
                  onValueChange={(value) => {
                    setToToken(value);
                    // Prevent selecting same token for both sides
                    if (value === fromToken) {
                      const otherToken = AVAILABLE_TOKENS.find(t => t.symbol !== value);
                      if (otherToken) setFromToken(otherToken.symbol);
                    }
                  }}
                  disabled={!selectedAccount}
                >
                  <SelectTrigger className="min-w-[140px] border-gray-600 hover:border-gray-500">
                    <SelectValue>
                      {(() => {
                        const token = AVAILABLE_TOKENS.find(t => t.symbol === toToken);
                        return (
                          <span className="flex items-center gap-1.5 relative">
                            {token?.emoji} {token?.displaySymbol || token?.name}
                            {token?.badge && (
                              <span className="w-2 h-2 bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 rounded-sm absolute -bottom-0.5 -right-0.5"></span>
                            )}
                          </span>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_TOKENS.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <span className="flex items-center gap-2">
                          <span>{token.emoji} {token.name}</span>
                          {token.badge && (
                            <span className="w-2.5 h-2.5 bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 rounded-sm ml-1"></span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Swap Details - Uniswap Style */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Exchange Rate
                </span>
                <span className="font-semibold text-white">
                  {isLoadingRate ? (
                    'Loading...'
                  ) : exchangeRate > 0 ? (
                    `1 ${getTokenDisplayName(fromToken)} = ${exchangeRate.toFixed(4)} ${getTokenDisplayName(toToken)}`
                  ) : (
                    'No pool available'
                  )}
                </span>
              </div>

              {/* Price Impact Indicator (Uniswap style) */}
              {fromAmount && parseFloat(fromAmount) > 0 && priceImpact > 0 && (
                <div className="flex justify-between text-sm">
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

              {/* LP Fee */}
              {fromAmount && parseFloat(fromAmount) > 0 && lpFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Liquidity Provider Fee</span>
                  <span className="text-gray-300">{lpFee} {getTokenDisplayName(fromToken)}</span>
                </div>
              )}

              {/* Minimum Received */}
              {fromAmount && parseFloat(fromAmount) > 0 && minimumReceived && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Minimum Received</span>
                  <span className="text-gray-300">{minimumReceived} {getTokenDisplayName(toToken)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                <span className="text-gray-400">Slippage Tolerance</span>
                <span className="font-semibold text-blue-400">{slippage}%</span>
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {hasInsufficientBalance && (
              <Alert className="bg-red-900/20 border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-300 text-sm">
                  Insufficient {getTokenDisplayName(fromToken)} balance. You have {fromBalance} {getTokenDisplayName(fromToken)} but trying to swap {fromAmount} {getTokenDisplayName(fromToken)}.
                </AlertDescription>
              </Alert>
            )}

            {/* High Price Impact Warning (>5%) */}
            {priceImpact >= 5 && !hasInsufficientBalance && (
              <Alert className="bg-red-900/20 border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-300 text-sm">
                  High price impact! Your trade will significantly affect the pool price. Consider a smaller amount or check if there's better liquidity.
                </AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full h-12 text-lg"
              onClick={() => setShowConfirm(true)}
              disabled={!fromAmount || parseFloat(fromAmount) <= 0 || !selectedAccount || exchangeRate === 0 || hasInsufficientBalance}
            >
              {!selectedAccount
                ? 'Connect Wallet'
                : hasInsufficientBalance
                ? `Insufficient ${getTokenDisplayName(fromToken)} Balance`
                : exchangeRate === 0
                ? 'No Pool Available'
                : 'Swap Tokens'}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Liquidity Pools
          </h3>
          
          {isLoadingPools ? (
            <div className="text-center text-gray-400 py-8">Loading pools...</div>
          ) : liquidityPools.length > 0 ? (
            <div className="space-y-3">
              {liquidityPools.map((pool, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                  <div>
                    <div className="font-semibold text-gray-200">{pool.pool}</div>
                    <div className="text-sm text-gray-400">TVL: {pool.tvl}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">{pool.apr} APR</div>
                    <div className="text-sm text-gray-400">Vol: {pool.volume}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No liquidity pools available yet
            </div>
          )}
        </Card>

        {/* Limit Orders Section */}
        <LimitOrders
          fromToken={fromToken}
          toToken={toToken}
          currentPrice={exchangeRate}
        />
      </div>

      <div>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Swaps
          </h3>

          {!selectedAccount ? (
            <div className="text-center text-gray-400 py-8">
              Connect wallet to view history
            </div>
          ) : isLoadingHistory ? (
            <div className="text-center text-gray-400 py-8">
              Loading history...
            </div>
          ) : swapHistory.length > 0 ? (
            <div className="space-y-3">
              {swapHistory.map((tx, idx) => (
                <div key={idx} className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ArrowDownUp className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-semibold text-white">
                        {getTokenDisplayName(tx.fromToken)} → {getTokenDisplayName(tx.toToken)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      #{tx.blockNumber}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Sent:</span>
                      <span className="text-red-400">-{tx.fromAmount} {getTokenDisplayName(tx.fromToken)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Received:</span>
                      <span className="text-green-400">+{tx.toAmount} {getTokenDisplayName(tx.toToken)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-700">
                      <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                      <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No swap history yet
            </div>
          )}
        </Card>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Swap Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Slippage Tolerance</label>
              <div className="flex gap-2 mt-2">
                {['0.1', '0.5', '1.0'].map(val => (
                  <Button
                    key={val}
                    variant={slippage === val ? 'default' : 'outline'}
                    onClick={() => setSlippage(val)}
                    className="flex-1"
                  >
                    {val}%
                  </Button>
                ))}
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Swap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">You Pay</span>
                <span className="font-bold text-white">{fromAmount} {getTokenDisplayName(fromToken)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">You Receive</span>
                <span className="font-bold text-white">{toAmount} {getTokenDisplayName(toToken)}</span>
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-gray-700 text-sm">
                <span className="text-gray-400">Exchange Rate</span>
                <span className="text-gray-400">1 {getTokenDisplayName(fromToken)} = {exchangeRate.toFixed(4)} {getTokenDisplayName(toToken)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Slippage</span>
                <span className="text-gray-400">{slippage}%</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleConfirmSwap}
              disabled={isSwapping}
            >
              {isSwapping ? 'Swapping...' : 'Confirm Swap'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TokenSwap;