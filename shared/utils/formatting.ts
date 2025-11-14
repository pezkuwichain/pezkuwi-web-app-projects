/**
 * Formatting utilities
 */

/**
 * Format a blockchain address for display
 * @param address - Full blockchain address
 * @param chars - Number of characters to show at start and end
 * @returns Formatted address (e.g., "0x1234...5678")
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format a number with thousand separators
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a token amount with proper decimals
 * @param amount - Amount in smallest unit
 * @param decimals - Token decimals (e.g., 18 for most tokens)
 * @returns Formatted token amount
 */
export function formatTokenAmount(amount: string | number, decimals = 18): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return formatNumber(value / Math.pow(10, decimals), 4);
}
