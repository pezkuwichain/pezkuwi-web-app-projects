/**
 * Authentication and Authorization Utilities
 * Security-critical: Founder wallet detection and permissions
 */

// SECURITY: Founder wallet address for beta testnet
// This address has sudo rights and can perform privileged operations
export const FOUNDER_ADDRESS = '5GgTgG9sRmPQAYU1RsTejZYnZRjwzKZKWD3awtuqjHioki45';

/**
 * Check if given address is the founder wallet
 * @param address - Substrate address to check
 * @returns true if address matches founder, false otherwise
 */
export const isFounderWallet = (address: string | null | undefined): boolean => {
  if (!address) return false;
  return address === FOUNDER_ADDRESS;
};

/**
 * Validate substrate address format
 * @param address - Address to validate
 * @returns true if address is valid format
 */
export const isValidSubstrateAddress = (address: string): boolean => {
  // Substrate addresses start with 5 and are 47-48 characters
  return /^5[a-zA-Z0-9]{46,47}$/.test(address);
};

/**
 * Permission levels for DEX operations
 */
export enum DexPermission {
  // Anyone can perform these
  VIEW_POOLS = 'view_pools',
  ADD_LIQUIDITY = 'add_liquidity',
  REMOVE_LIQUIDITY = 'remove_liquidity',
  SWAP = 'swap',

  // Only founder can perform these
  CREATE_POOL = 'create_pool',
  SET_FEE_RATE = 'set_fee_rate',
  PAUSE_POOL = 'pause_pool',
  WHITELIST_TOKEN = 'whitelist_token',
}

/**
 * Check if user has permission for a specific DEX operation
 * @param address - User's wallet address
 * @param permission - Required permission level
 * @returns true if user has permission
 */
export const hasPermission = (
  address: string | null | undefined,
  permission: DexPermission
): boolean => {
  if (!address || !isValidSubstrateAddress(address)) {
    return false;
  }

  const founderOnly = [
    DexPermission.CREATE_POOL,
    DexPermission.SET_FEE_RATE,
    DexPermission.PAUSE_POOL,
    DexPermission.WHITELIST_TOKEN,
  ];

  // Founder-only operations
  if (founderOnly.includes(permission)) {
    return isFounderWallet(address);
  }

  // Everyone can view and trade
  return true;
};

/**
 * Get user role string for display
 * @param address - User's wallet address
 * @returns Human-readable role
 */
export const getUserRole = (address: string | null | undefined): string => {
  if (!address) return 'Guest';
  if (isFounderWallet(address)) return 'Founder (Admin)';
  return 'User';
};
