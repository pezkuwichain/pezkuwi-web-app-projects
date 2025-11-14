import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import shared translations
import { translations } from '@pezkuwi/i18n';

export const languages = {
  en: { name: 'English', flag: '🇬🇧', dir: 'ltr' },
  tr: { name: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  'ku-kurmanji': { name: 'Kurdî (Kurmancî)', flag: '☀️', dir: 'ltr' },
  'ku-sorani': { name: 'کوردی (سۆرانی)', flag: '☀️', dir: 'rtl' },
  ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  fa: { name: 'فارسی', flag: '🇮🇷', dir: 'rtl' }
};

const resources = {
  en: { translation: translations.en },
  tr: { translation: translations.tr },
  'ku-kurmanji': { translation: translations['ku-kurmanji'] },
  'ku-sorani': { translation: translations['ku-sorani'] },
  ar: { translation: translations.ar },
  fa: { translation: translations.fa }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;