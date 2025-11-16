/**
 * Polkadot/Substrate blockchain utilities
 */

import type { BlockchainNetwork } from '../types/blockchain';

/**
 * Pezkuwi blockchain network configuration
 */
export const PEZKUWI_NETWORK: BlockchainNetwork = {
  name: 'Pezkuwi',
  endpoint: 'wss://beta-rpc.pezkuwi.art',
  chainId: 'pezkuwi',
};

/**
 * Common blockchain endpoints
 */
export const BLOCKCHAIN_ENDPOINTS = {
  mainnet: 'wss://mainnet.pezkuwichain.io',
  testnet: 'wss://ws.pezkuwichain.io',
  local: 'ws://127.0.0.1:9944',
} as const;

/**
 * Get the appropriate WebSocket endpoint based on environment
 */
function getWebSocketEndpoint(): string {
  const network = import.meta.env.VITE_NETWORK || 'local';

  switch (network) {
    case 'mainnet':
      return import.meta.env.VITE_WS_ENDPOINT_MAINNET || BLOCKCHAIN_ENDPOINTS.mainnet;
    case 'testnet':
      return import.meta.env.VITE_WS_ENDPOINT_TESTNET || BLOCKCHAIN_ENDPOINTS.testnet;
    case 'local':
    default:
      return import.meta.env.VITE_WS_ENDPOINT_LOCAL || BLOCKCHAIN_ENDPOINTS.local;
  }
}

/**
 * Default endpoint (reads from environment variables)
 */
export const DEFAULT_ENDPOINT = getWebSocketEndpoint();

/**
 * Get block explorer URL for a transaction
 * @param txHash - Transaction hash
 * @returns Block explorer URL
 */
export function getExplorerUrl(txHash: string): string {
  // Update with your actual block explorer URL
  return `https://explorer.pezkuwichain.app/tx/${txHash}`;
}
