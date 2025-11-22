import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initializeI18n } from './src/i18n';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { PolkadotProvider } from './src/contexts/PolkadotContext';
import { BiometricAuthProvider } from './src/contexts/BiometricAuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { KurdistanColors } from './src/theme/colors';

export default function App() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    // Initialize i18n on app start
    const initApp = async () => {
      try {
        await initializeI18n();
        setIsI18nInitialized(true);
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        // Fallback: Still show app but with default language
        setIsI18nInitialized(true);
      }
    };

    initApp();
  }, []);

  if (!isI18nInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={KurdistanColors.kesk} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PolkadotProvider>
          <LanguageProvider>
            <BiometricAuthProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </BiometricAuthProvider>
          </LanguageProvider>
        </PolkadotProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: KurdistanColors.spi,
  },
});

