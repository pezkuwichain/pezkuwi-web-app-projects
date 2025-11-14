/**
 * Blockchain-related type definitions
 */

export interface WalletAccount {
  address: string;
  name?: string;
  source?: string;
}

export interface BlockchainNetwork {
  name: string;
  endpoint: string;
  chainId?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
}

// Add more blockchain types as needed
