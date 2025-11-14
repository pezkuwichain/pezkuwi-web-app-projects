/**
 * Validation utilities
 */

/**
 * Validate if a string is a valid blockchain address
 * @param address - Address to validate
 * @returns True if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  // Basic validation - extend based on your blockchain requirements
  if (!address) return false;

  // Substrate/Polkadot addresses typically start with specific characters
  // and have a specific length
  return address.length >= 47 && address.length <= 48;
}

/**
 * Validate if a string is a valid amount
 * @param amount - Amount to validate
 * @returns True if valid, false otherwise
 */
export function isValidAmount(amount: string): boolean {
  if (!amount) return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}
