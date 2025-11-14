import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all translations
import en from './locales/en.json';
import tr from './locales/tr.json';
import kmr from './locales/kmr.json';
import ckb from './locales/ckb.json';
import ar from './locales/ar.json';
import fa from './locales/fa.json';

// Language storage key
export const LANGUAGE_KEY = '@pezkuwi_language';

// Available languages
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  { code: 'kmr', name: 'Kurdish (Kurmanji)', nativeName: 'Kurmancî', rtl: false },
  { code: 'ckb', name: 'Kurdish (Sorani)', nativeName: 'سۆرانی', rtl: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true },
];

// Initialize i18n
const initializeI18n = async () => {
  // Try to get saved language
  let savedLanguage = 'en'; // Default fallback
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored) {
      savedLanguage = stored;
    }
  } catch (error) {
    console.warn('Failed to load saved language:', error);
  }

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        tr: { translation: tr },
        kmr: { translation: kmr },
        ckb: { translation: ckb },
        ar: { translation: ar },
        fa: { translation: fa },
      },
      lng: savedLanguage,
      fallbackLng: 'en',
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
    console.error('Failed to save language:', error);
  }
};

// Get current language
export const getCurrentLanguage = () => i18n.language;

// Check if language is RTL
export const isRTL = (languageCode?: string) => {
  const code = languageCode || i18n.language;
  const lang = languages.find(l => l.code === code);
  return lang?.rtl || false;
};

export { initializeI18n };
export default i18n;
