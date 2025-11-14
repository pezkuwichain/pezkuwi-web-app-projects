/**
 * Shared constants for Pezkuwi Web App Projects
 */

/**
 * Application version
 */
export const APP_VERSION = '1.0.0';

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'kmr', name: 'Kurdî' },
  { code: 'ckb', name: 'سۆرانی' },
  { code: 'ar', name: 'العربية' },
  { code: 'fa', name: 'فارسی' },
] as const;

/**
 * Default language
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * API timeouts (in milliseconds)
 */
export const TIMEOUTS = {
  API_REQUEST: 30000,
  BLOCKCHAIN_QUERY: 60000,
  TRANSACTION: 120000,
} as const;
