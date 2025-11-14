// ========================================
// PezkuwiChain - Substrate/Polkadot.js Configuration
// ========================================
// This file configures wallet connectivity for Substrate-based chains

import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

// ========================================
// NETWORK ENDPOINTS
// ========================================
export const NETWORK_ENDPOINTS = {
  local: import.meta.env.VITE_DEVELOPMENT_WS || 'ws://127.0.0.1:9944',
  testnet: import.meta.env.VITE_TESTNET_WS || 'wss://testnet.pezkuwichain.io',
  mainnet: import.meta.env.VITE_MAINNET_WS || 'wss://mainnet.pezkuwichain.io',
  staging: import.meta.env.VITE_STAGING_WS || 'wss://staging.pezkuwichain.io',
  beta: import.meta.env.VITE_BETA_WS || 'wss://beta.pezkuwichain.io',
};

// ========================================
// CHAIN CONFIGURATION
// ========================================
export const CHAIN_CONFIG = {
  name: import.meta.env.VITE_CHAIN_NAME || 'PezkuwiChain',
  symbol: import.meta.env.VITE_CHAIN_TOKEN_SYMBOL || 'PEZ',
  decimals: parseInt(import.meta.env.VITE_CHAIN_TOKEN_DECIMALS || '12'),
  ss58Format: parseInt(import.meta.env.VITE_CHAIN_SS58_FORMAT || '42'),
};

// ========================================
// SUBSTRATE ASSET IDs (Assets Pallet)
// ========================================
// ⚠️ IMPORTANT: HEZ is the native token and does NOT have an Asset ID
// Only wrapped/asset tokens are listed here
export const ASSET_IDS = {
  WHEZ: parseInt(import.meta.env.VITE_ASSET_WHEZ || '0'),  // Wrapped HEZ
  PEZ: parseInt(import.meta.env.VITE_ASSET_PEZ || '1'),    // PEZ utility token
  WUSDT: parseInt(import.meta.env.VITE_ASSET_WUSDT || '2'), // Wrapped USDT (multisig backed)
  USDT: parseInt(import.meta.env.VITE_ASSET_USDT || '3'),
  BTC: parseInt(import.meta.env.VITE_ASSET_BTC || '4'),
  ETH: parseInt(import.meta.env.VITE_ASSET_ETH || '5'),
  DOT: parseInt(import.meta.env.VITE_ASSET_DOT || '6'),
} as const;

// ========================================
// EXPLORER URLS
// ========================================
export const EXPLORER_URLS = {
  polkadotJs: import.meta.env.VITE_EXPLORER_URL || 'https://polkadot.js.org/apps/?rpc=',
  custom: import.meta.env.VITE_CUSTOM_EXPLORER_URL || 'https://explorer.pezkuwichain.io',
};

// ========================================
// WALLET ERROR MESSAGES
// ========================================
export const WALLET_ERRORS = {
  NO_EXTENSION: 'No Polkadot.js extension detected. Please install Polkadot.js or compatible wallet.',
  NO_ACCOUNTS: 'No accounts found. Please create an account in your wallet extension.',
  CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  TRANSACTION_FAILED: 'Transaction failed. Please check your balance and try again.',
  USER_REJECTED: 'User rejected the request.',
  INSUFFICIENT_BALANCE: 'Insufficient balance to complete transaction.',
  INVALID_ADDRESS: 'Invalid address format.',
  API_NOT_READY: 'Blockchain API not ready. Please wait...',
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format Substrate address for display (SS58 format)
 * @param address - Full substrate address
 * @returns Shortened address string (e.g., "5GrwV...xQjz")
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format balance from planck to human-readable format
 * @param balance - Balance in smallest unit (planck)
 * @param decimals - Token decimals (default 12 for PEZ)
 * @returns Formatted balance string
 */
export const formatBalance = (balance: string | number, decimals = 12): string => {
  if (!balance) return '0';
  const value = typeof balance === 'string' ? parseFloat(balance) : balance;
  return (value / Math.pow(10, decimals)).toFixed(4);
};

/**
 * Parse human-readable amount to planck (smallest unit)
 * @param amount - Human-readable amount
 * @param decimals - Token decimals
 * @returns Amount in planck
 */
export const parseAmount = (amount: string | number, decimals = 12): bigint => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.floor(value * Math.pow(10, decimals)));
};

/**
 * Get asset symbol by ID
 * @param assetId - Asset ID from Assets pallet
 * @returns Asset symbol or 'UNKNOWN'
 */
export const getAssetSymbol = (assetId: number): string => {
  const entry = Object.entries(ASSET_IDS).find(([_, id]) => id === assetId);
  return entry ? entry[0] : 'UNKNOWN';
};

/**
 * Get current network endpoint based on VITE_NETWORK env
 * @returns WebSocket endpoint URL
 */
export const getCurrentEndpoint = (): string => {
  const network = import.meta.env.VITE_NETWORK || 'local';
  return NETWORK_ENDPOINTS[network as keyof typeof NETWORK_ENDPOINTS] || NETWORK_ENDPOINTS.local;
};

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface PolkadotWalletState {
  isConnected: boolean;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  balance: string;
  error: string | null;
}

export const initialPolkadotWalletState: PolkadotWalletState = {
  isConnected: false,
  accounts: [],
  selectedAccount: null,
  balance: '0',
  error: null,
};