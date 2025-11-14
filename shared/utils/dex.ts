import { ApiPromise } from '@polkadot/api';
import { KNOWN_TOKENS, PoolInfo, SwapQuote } from '../types/dex';

/**
 * Format balance with proper decimals
 * @param balance - Raw balance string
 * @param decimals - Token decimals
 * @param precision - Display precision (default 4)
 */
export const formatTokenBalance = (
  balance: string | number | bigint,
  decimals: number,
  precision: number = 4
): string => {
  const balanceBigInt = BigInt(balance);
  const divisor = BigInt(10 ** decimals);
  const integerPart = balanceBigInt / divisor;
  const fractionalPart = balanceBigInt % divisor;

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const displayFractional = fractionalStr.slice(0, precision);

  return `${integerPart}.${displayFractional}`;
};

/**
 * Parse user input to raw balance
 * @param input - User input string (e.g., "10.5")
 * @param decimals - Token decimals
 */
export const parseTokenInput = (input: string, decimals: number): string => {
  if (!input || input === '' || input === '.') return '0';

  // Remove non-numeric chars except decimal point
  const cleaned = input.replace(/[^\d.]/g, '');
  const [integer, fractional] = cleaned.split('.');

  const integerPart = BigInt(integer || '0') * BigInt(10 ** decimals);

  if (!fractional) {
    return integerPart.toString();
  }

  // Pad or truncate fractional part
  const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
  const fractionalPart = BigInt(fractionalPadded);

  return (integerPart + fractionalPart).toString();
};

/**
 * Calculate price impact for a swap
 * @param reserveIn - Reserve of input token
 * @param reserveOut - Reserve of output token
 * @param amountIn - Amount being swapped in
 */
export const calculatePriceImpact = (
  reserveIn: string,
  reserveOut: string,
  amountIn: string
): string => {
  const reserveInBig = BigInt(reserveIn);
  const reserveOutBig = BigInt(reserveOut);
  const amountInBig = BigInt(amountIn);

  if (reserveInBig === BigInt(0) || reserveOutBig === BigInt(0)) {
    return '0';
  }

  // Price before = reserveOut / reserveIn
  // Amount out with constant product: (amountIn * reserveOut) / (reserveIn + amountIn)
  const amountOut =
    (amountInBig * reserveOutBig) / (reserveInBig + amountInBig);

  // Price after = (reserveOut - amountOut) / (reserveIn + amountIn)
  const priceBefore = (reserveOutBig * BigInt(10000)) / reserveInBig;
  const priceAfter =
    ((reserveOutBig - amountOut) * BigInt(10000)) /
    (reserveInBig + amountInBig);

  // Impact = |priceAfter - priceBefore| / priceBefore * 100
  const impact = ((priceBefore - priceAfter) * BigInt(100)) / priceBefore;

  return (Number(impact) / 100).toFixed(2);
};

/**
 * Calculate output amount for a swap (constant product formula)
 * @param amountIn - Input amount
 * @param reserveIn - Reserve of input token
 * @param reserveOut - Reserve of output token
 * @param feeRate - Fee rate (e.g., 30 for 0.3%)
 */
export const getAmountOut = (
  amountIn: string,
  reserveIn: string,
  reserveOut: string,
  feeRate: number = 30
): string => {
  const amountInBig = BigInt(amountIn);
  const reserveInBig = BigInt(reserveIn);
  const reserveOutBig = BigInt(reserveOut);

  if (
    amountInBig === BigInt(0) ||
    reserveInBig === BigInt(0) ||
    reserveOutBig === BigInt(0)
  ) {
    return '0';
  }

  // amountInWithFee = amountIn * (10000 - feeRate) / 10000
  const amountInWithFee = (amountInBig * BigInt(10000 - feeRate)) / BigInt(10000);

  // amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)
  const numerator = amountInWithFee * reserveOutBig;
  const denominator = reserveInBig + amountInWithFee;

  return (numerator / denominator).toString();
};

/**
 * Calculate required amount1 for given amount2 (maintaining ratio)
 * @param amount2 - Amount of token 2
 * @param reserve1 - Reserve of token 1
 * @param reserve2 - Reserve of token 2
 */
export const quote = (
  amount2: string,
  reserve1: string,
  reserve2: string
): string => {
  const amount2Big = BigInt(amount2);
  const reserve1Big = BigInt(reserve1);
  const reserve2Big = BigInt(reserve2);

  if (reserve2Big === BigInt(0)) return '0';

  return ((amount2Big * reserve1Big) / reserve2Big).toString();
};

/**
 * Fetch all existing pools from chain
 * @param api - Polkadot API instance
 */
export const fetchPools = async (api: ApiPromise): Promise<PoolInfo[]> => {
  try {
    const pools: PoolInfo[] = [];

    // Query all pool accounts
    const poolKeys = await api.query.assetConversion.pools.keys();

    for (const key of poolKeys) {
      // Extract asset IDs from storage key
      const [asset1Raw, asset2Raw] = key.args;
      const asset1 = Number(asset1Raw.toString());
      const asset2 = Number(asset2Raw.toString());

      // Get pool account
      const poolAccount = await api.query.assetConversion.pools([asset1, asset2]);

      if (poolAccount.isNone) continue;

      // Get reserves
      const reserve1Data = await api.query.assets.account(asset1, poolAccount.unwrap());
      const reserve2Data = await api.query.assets.account(asset2, poolAccount.unwrap());

      const reserve1 = reserve1Data.isSome ? reserve1Data.unwrap().balance.toString() : '0';
      const reserve2 = reserve2Data.isSome ? reserve2Data.unwrap().balance.toString() : '0';

      // Get token info
      const token1 = KNOWN_TOKENS[asset1] || {
        id: asset1,
        symbol: `Asset ${asset1}`,
        name: `Unknown Asset ${asset1}`,
        decimals: 12,
      };
      const token2 = KNOWN_TOKENS[asset2] || {
        id: asset2,
        symbol: `Asset ${asset2}`,
        name: `Unknown Asset ${asset2}`,
        decimals: 12,
      };

      pools.push({
        id: `${asset1}-${asset2}`,
        asset1,
        asset2,
        asset1Symbol: token1.symbol,
        asset2Symbol: token2.symbol,
        asset1Decimals: token1.decimals,
        asset2Decimals: token2.decimals,
        reserve1,
        reserve2,
        lpTokenSupply: '0', // TODO: Query LP token supply
        feeRate: '0.3', // Default 0.3%
      });
    }

    return pools;
  } catch (error) {
    console.error('Failed to fetch pools:', error);
    return [];
  }
};

/**
 * Validate amounts are greater than zero
 */
export const validateAmount = (amount: string): boolean => {
  try {
    const amountBig = BigInt(amount);
    return amountBig > BigInt(0);
  } catch {
    return false;
  }
};

/**
 * Calculate minimum amount with slippage tolerance
 * @param amount - Expected amount
 * @param slippage - Slippage percentage (e.g., 1 for 1%)
 */
export const calculateMinAmount = (amount: string, slippage: number): string => {
  const amountBig = BigInt(amount);
  const slippageFactor = BigInt(10000 - slippage * 100);
  return ((amountBig * slippageFactor) / BigInt(10000)).toString();
};

/**
 * Get token symbol safely
 */
export const getTokenSymbol = (assetId: number): string => {
  return KNOWN_TOKENS[assetId]?.symbol || `Asset ${assetId}`;
};

/**
 * Get token decimals safely
 */
export const getTokenDecimals = (assetId: number): number => {
  return KNOWN_TOKENS[assetId]?.decimals || 12;
};
