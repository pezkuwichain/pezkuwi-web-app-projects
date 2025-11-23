import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { saveLanguage, getCurrentLanguage, isRTL, LANGUAGE_KEY, languages } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  isRTL: boolean;
  hasSelectedLanguage: boolean;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [currentIsRTL, setCurrentIsRTL] = useState(isRTL());

  const checkLanguageSelection = React.useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      setHasSelectedLanguage(!!saved);
    } catch (error) {
      if (__DEV__) console.error('Failed to check language selection:', error);
    }
  }, []);

  useEffect(() => {
    // Check if user has already selected a language
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkLanguageSelection();
  }, [checkLanguageSelection]);

  const changeLanguage = async (languageCode: string) => {
    try {
      await saveLanguage(languageCode);
      setCurrentLanguage(languageCode);
      setHasSelectedLanguage(true);

      const newIsRTL = isRTL(languageCode);
      setCurrentIsRTL(newIsRTL);

      // Update RTL layout if needed
      if (I18nManager.isRTL !== newIsRTL) {
        // Note: Changing RTL requires app restart in React Native
        I18nManager.forceRTL(newIsRTL);
        // You may want to show a message to restart the app
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to change language:', error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        isRTL: currentIsRTL,
        hasSelectedLanguage,
        availableLanguages: languages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
