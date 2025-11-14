/**
 * Shared formatting utilities
 * Platform-agnostic formatters for numbers, currency, etc.
 */

/**
 * Format a number with K, M, B suffixes for large values
 * @param value - The number to format
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (value === 0) return '0';
  if (value < 0.01) return '<0.01';

  // For large numbers, use K, M, B suffixes
  if (value >= 1e9) {
    return (value / 1e9).toFixed(decimals) + 'B';
  }
  if (value >= 1e6) {
    return (value / 1e6).toFixed(decimals) + 'M';
  }
  if (value >= 1e3) {
    return (value / 1e3).toFixed(decimals) + 'K';
  }

  return value.toFixed(decimals);
}

/**
 * Format a percentage value
 * @param value - The percentage value (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a currency value
 * @param value - The currency value
 * @param symbol - Currency symbol (default '$')
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  symbol: string = '$',
  decimals: number = 2
): string {
  return `${symbol}${formatNumber(value, decimals)}`;
}

/**
 * Parse a formatted number string back to number
 * @param formatted - Formatted string (e.g., "1.5K")
 * @returns Number value
 */
export function parseFormattedNumber(formatted: string): number {
  const cleaned = formatted.replace(/[^0-9.KMB]/g, '');
  const match = cleaned.match(/^([\d.]+)([KMB])?$/);

  if (!match) return 0;

  const [, numberPart, suffix] = match;
  let value = parseFloat(numberPart);

  if (suffix === 'K') value *= 1e3;
  else if (suffix === 'M') value *= 1e6;
  else if (suffix === 'B') value *= 1e9;

  return value;
}
