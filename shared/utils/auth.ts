/**
 * Authentication and Authorization Utilities
 * Security-critical: Founder wallet detection and permissions
 */

// DEPRECATED: Hardcoded founder address (kept for fallback only)
// Modern approach: Fetch sudo key dynamically from blockchain
export const FOUNDER_ADDRESS_FALLBACK = '5GgTgG9sRmPQAYU1RsTejZYnZRjwzKZKWD3awtuqjHioki45';

/**
 * Check if given address is the sudo account (admin/founder)
 * SECURITY: Only allows admin access when connected to blockchain with valid sudo key
 * @param address - Substrate address to check
 * @param sudoKey - Sudo key fetched from blockchain (REQUIRED for admin access)
 * @returns true if address matches sudo key from blockchain
 */
export const isFounderWallet = (
  address: string | null | undefined,
  sudoKey?: string | null
): boolean => {
  if (!address) return false;

  // SECURITY FIX: ONLY use dynamic sudo key from blockchain
  // No fallback to hardcoded address - admin access requires active blockchain connection
  if (!sudoKey || sudoKey === '') {
    return false; // No blockchain connection = no admin access
  }

  return address === sudoKey;
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
 * @param sudoKey - Sudo key fetched from blockchain (if available)
 * @returns true if user has permission
 */
export const hasPermission = (
  address: string | null | undefined,
  permission: DexPermission,
  sudoKey?: string | null
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
    return isFounderWallet(address, sudoKey);
  }

  // Everyone can view and trade
  return true;
};

/**
 * Get user role string for display
 * @param address - User's wallet address
 * @param sudoKey - Sudo key fetched from blockchain (if available)
 * @returns Human-readable role
 */
export const getUserRole = (
  address: string | null | undefined,
  sudoKey?: string | null
): string => {
  if (!address) return 'Guest';
  if (isFounderWallet(address, sudoKey)) return 'Sudo (Admin)';
  return 'User';
};
