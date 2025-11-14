/**
 * Polkadot/Substrate blockchain utilities
 */

import type { BlockchainNetwork } from '../types/blockchain';

/**
 * Pezkuwi blockchain network configuration
 */
export const PEZKUWI_NETWORK: BlockchainNetwork = {
  name: 'Pezkuwi',
  endpoint: 'wss://pezkuwichain.app:9944',
  chainId: 'pezkuwi',
};

/**
 * Common blockchain endpoints
 */
export const BLOCKCHAIN_ENDPOINTS = {
  pezkuwi: 'wss://pezkuwichain.app:9944',
  local: 'ws://127.0.0.1:9944',
} as const;

/**
 * Get block explorer URL for a transaction
 * @param txHash - Transaction hash
 * @returns Block explorer URL
 */
export function getExplorerUrl(txHash: string): string {
  // Update with your actual block explorer URL
  return `https://explorer.pezkuwichain.app/tx/${txHash}`;
}
