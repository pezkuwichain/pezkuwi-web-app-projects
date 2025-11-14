/**
 * Shared i18n configuration for PezkuwiChain
 * Exports comprehensive translations and language configuration
 */

// Import comprehensive translations (2590+ lines covering all features)
export { translations as comprehensiveTranslations, supportedLocales } from './translations';

// Import all translation JSON files for i18next compatibility
import en from './locales/en.json';
import tr from './locales/tr.json';
import kmr from './locales/kmr.json';
import ckb from './locales/ckb.json';
import ar from './locales/ar.json';
import fa from './locales/fa.json';

/**
 * Language configuration with RTL support
 */
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

/**
 * Available languages
 */
export const LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  { code: 'kmr', name: 'Kurdish (Kurmanji)', nativeName: 'Kurmancî', rtl: false },
  { code: 'ckb', name: 'Kurdish (Sorani)', nativeName: 'سۆرانی', rtl: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true },
];

/**
 * Default language code
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * Language storage key (for AsyncStorage/localStorage)
 */
export const LANGUAGE_STORAGE_KEY = '@pezkuwi_language';

/**
 * Translation resources (JSON format for i18next)
 */
export const translations = {
  en,
  tr,
  kmr,
  ckb,
  ar,
  fa,
};

/**
 * Check if a language is RTL
 * @param languageCode - Language code (e.g., 'ar', 'ckb', 'fa')
 * @returns true if RTL, false otherwise
 */
export function isRTL(languageCode: string): boolean {
  const lang = LANGUAGES.find(l => l.code === languageCode);
  return lang?.rtl || false;
}

/**
 * Get language configuration
 * @param languageCode - Language code
 * @returns Language configuration or undefined
 */
export function getLanguageConfig(languageCode: string): LanguageConfig | undefined {
  return LANGUAGES.find(l => l.code === languageCode);
}
