import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../i18n';
import AppColors, { KurdistanColors } from '../theme/colors';

interface WelcomeScreenProps {
  onLanguageSelected: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLanguageSelected }) => {
  const { t } = useTranslation();
  const { changeLanguage, currentLanguage } = useLanguage();

  const handleLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode);
    // Small delay for better UX
    setTimeout(() => {
      onLanguageSelected();
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[KurdistanColors.kesk, KurdistanColors.zer, KurdistanColors.sor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>PZK</Text>
            </View>
            <Text style={styles.title}>{t('welcome.title')}</Text>
            <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
          </View>

          {/* Language Selection */}
          <View style={styles.languageSection}>
            <Text style={styles.sectionTitle}>{t('welcome.selectLanguage')}</Text>
            <View style={styles.languageGrid}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageCard,
                    currentLanguage === language.code && styles.languageCardSelected,
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.languageName,
                    currentLanguage === language.code && styles.languageNameSelected,
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageCode,
                    currentLanguage === language.code && styles.languageCodeSelected,
                  ]}>
                    {language.name}
                  </Text>
                  {language.rtl && (
                    <View style={styles.rtlBadge}>
                      <Text style={styles.rtlBadgeText}>RTL</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Continue Button */}
          {currentLanguage && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => onLanguageSelected()}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>{t('welcome.continue')}</Text>
            </TouchableOpacity>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Pezkuwi Blockchain • {new Date().getFullYear()}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KurdistanColors.kesk,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: KurdistanColors.spi,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: KurdistanColors.kesk,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: KurdistanColors.spi,
    textAlign: 'center',
    opacity: 0.9,
  },
  languageSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: KurdistanColors.spi,
    marginBottom: 20,
    textAlign: 'center',
  },
  languageGrid: {
    gap: 12,
  },
  languageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardSelected: {
    backgroundColor: KurdistanColors.spi,
    borderColor: KurdistanColors.zer,
    shadowColor: KurdistanColors.zer,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: KurdistanColors.spi,
    marginBottom: 4,
  },
  languageNameSelected: {
    color: KurdistanColors.kesk,
  },
  languageCode: {
    fontSize: 14,
    color: KurdistanColors.spi,
    opacity: 0.8,
  },
  languageCodeSelected: {
    color: KurdistanColors.reş,
    opacity: 0.6,
  },
  rtlBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: KurdistanColors.zer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rtlBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: KurdistanColors.reş,
  },
  continueButton: {
    backgroundColor: KurdistanColors.spi,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: KurdistanColors.kesk,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: KurdistanColors.spi,
    opacity: 0.7,
  },
});

export default WelcomeScreen;
