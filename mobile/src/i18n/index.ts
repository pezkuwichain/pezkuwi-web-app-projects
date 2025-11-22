import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import shared translations and language configurations
import {
  translations,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isRTL as checkIsRTL,
} from '../../../shared/i18n';

// Language storage key (re-export for compatibility)
export const LANGUAGE_KEY = LANGUAGE_STORAGE_KEY;

// Available languages (re-export for compatibility)
export const languages = LANGUAGES;

// Initialize i18n
const initializeI18n = async () => {
  // Try to get saved language
  let savedLanguage = DEFAULT_LANGUAGE;
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored) {
      savedLanguage = stored;
    }
  } catch (error) {
    if (__DEV__) console.warn('Failed to load saved language:', error);
  }

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: translations.en },
        tr: { translation: translations.tr },
        kmr: { translation: translations.kmr },
        ckb: { translation: translations.ckb },
        ar: { translation: translations.ar },
        fa: { translation: translations.fa },
      },
      lng: savedLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false,
      },
    });

  return savedLanguage;
};

// Save language preference
export const saveLanguage = async (languageCode: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
  } catch (error) {
    if (__DEV__) console.error('Failed to save language:', error);
  }
};

// Get current language
export const getCurrentLanguage = () => i18n.language;

// Check if language is RTL
export const isRTL = (languageCode?: string) => {
  const code = languageCode || i18n.language;
  return checkIsRTL(code);
};

export { initializeI18n };
export default i18n;
