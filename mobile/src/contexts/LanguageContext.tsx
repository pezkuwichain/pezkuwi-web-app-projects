import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveLanguage, getCurrentLanguage, isRTL, LANGUAGE_KEY } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  isRTL: boolean;
  hasSelectedLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [currentIsRTL, setCurrentIsRTL] = useState(isRTL());

  useEffect(() => {
    // Check if user has already selected a language
    checkLanguageSelection();
  }, []);

  const checkLanguageSelection = async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      setHasSelectedLanguage(!!saved);
    } catch (error) {
      console.error('Failed to check language selection:', error);
    }
  };

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
      console.error('Failed to change language:', error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        isRTL: currentIsRTL,
        hasSelectedLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
