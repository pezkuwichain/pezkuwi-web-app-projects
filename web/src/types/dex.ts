export interface TokenInfo {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
}

export interface PoolInfo {
  id: string; // asset1-asset2 pair
  asset1: number;
  asset2: number;
  asset1Symbol: string;
  asset2Symbol: string;
  asset1Decimals: number;
  asset2Decimals: number;
  reserve1: string; // Raw balance string
  reserve2: string;
  lpTokenSupply: string;
  volume24h?: string;
  tvl?: string;
  apr7d?: string;
  feeRate?: string;
}

export interface UserLiquidityPosition {
  poolId: string;
  asset1: number;
  asset2: number;
  lpTokenBalance: string;
  shareOfPool: string; // Percentage as string (e.g., "2.5")
  asset1Amount: string;
  asset2Amount: string;
  valueUSD?: string;
  feesEarned?: string;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  path: number[]; // Asset IDs in route
  priceImpact: string; // Percentage as string
  minimumReceived: string; // After slippage
  route: string; // Human readable (e.g., "wHEZ → PEZ → wUSDT")
}

export interface AddLiquidityParams {
  asset1: number;
  asset2: number;
  amount1: string;
  amount2: string;
  amount1Min: string;
  amount2Min: string;
  recipient: string;
}

export interface RemoveLiquidityParams {
  asset1: number;
  asset2: number;
  lpTokenAmount: string;
  amount1Min: string;
  amount2Min: string;
  recipient: string;
}

export interface SwapParams {
  path: number[];
  amountIn: string;
  amountOutMin: string;
  recipient: string;
  deadline?: number;
}

export interface PoolCreationParams {
  asset1: number;
  asset2: number;
  feeRate?: number;
}

// Known tokens on testnet
export const KNOWN_TOKENS: Record<number, TokenInfo> = {
  0: {
    id: 0,
    symbol: 'wHEZ',
    name: 'Wrapped HEZ',
    decimals: 12,
  },
  1: {
    id: 1,
    symbol: 'PEZ',
    name: 'Pezkuwi Token',
    decimals: 12,
  },
  2: {
    id: 2,
    symbol: 'wUSDT',
    name: 'Wrapped USDT',
    decimals: 6,
  },
};

// Transaction status
export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}
