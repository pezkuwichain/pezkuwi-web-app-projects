import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { KurdistanColors } from '../theme/colors';

interface SignInScreenProps {
  onSignIn: () => void;
  onNavigateToSignUp: () => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onSignIn, onNavigateToSignUp }) => {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        Alert.alert('Sign In Failed', error.message);
        return;
      }

      // Success - navigate to app
      onSignIn();
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      if (__DEV__) console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[KurdistanColors.kesk, KurdistanColors.zer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>PZK</Text>
              </View>
              <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
              <Text style={styles.subtitle}>{t('auth.signIn')}</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                onPress={handleSignIn}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={KurdistanColors.spi} />
                ) : (
                  <Text style={styles.signInButtonText}>{t('auth.signIn')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.signUpPrompt}
                onPress={onNavigateToSignUp}
              >
                <Text style={styles.signUpPromptText}>
                  {t('auth.noAccount')}{' '}
                  <Text style={styles.signUpLink}>{t('auth.signUp')}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: KurdistanColors.spi,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: KurdistanColors.kesk,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: KurdistanColors.spi,
    opacity: 0.9,
  },
  form: {
    backgroundColor: KurdistanColors.spi,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: KurdistanColors.kesk,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: KurdistanColors.kesk,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: KurdistanColors.kesk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#999',
  },
  signUpPrompt: {
    alignItems: 'center',
  },
  signUpPromptText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLink: {
    color: KurdistanColors.kesk,
    fontWeight: 'bold',
  },
});

export default SignInScreen;
