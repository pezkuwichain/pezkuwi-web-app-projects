import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useBiometricAuth } from '../contexts/BiometricAuthContext';
import { AppColors, KurdistanColors } from '../theme/colors';
import { Button, Input } from '../components';

/**
 * Lock Screen
 * Shown when app is locked - requires biometric or PIN
 *
 * PRIVACY: All authentication happens locally
 */
export default function LockScreen() {
  const {
    isBiometricSupported,
    isBiometricEnrolled,
    isBiometricEnabled,
    biometricType,
    authenticate,
    verifyPinCode,
  } = useBiometricAuth();

  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleBiometricAuth = React.useCallback(async () => {
    const success = await authenticate();
    if (!success) {
      // Biometric failed, show PIN option
      setShowPinInput(true);
    }
  }, [authenticate]);

  useEffect(() => {
    // Auto-trigger biometric on mount if enabled
    if (isBiometricEnabled && isBiometricSupported && isBiometricEnrolled) {
      handleBiometricAuth();
    }
  }, [isBiometricEnabled, isBiometricSupported, isBiometricEnrolled, handleBiometricAuth]);

  const handlePinSubmit = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    try {
      setVerifying(true);
      const success = await verifyPinCode(pin);

      if (!success) {
        Alert.alert('Error', 'Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch {
      Alert.alert('Error', 'Failed to verify PIN');
    } finally {
      setVerifying(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'facial': return '😊';
      case 'fingerprint': return '👆';
      case 'iris': return '👁️';
      default: return '🔒';
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'facial': return 'Face ID';
      case 'fingerprint': return 'Fingerprint';
      case 'iris': return 'Iris';
      default: return 'Biometric';
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🌟</Text>
        <Text style={styles.appName}>PezkuwiChain</Text>
        <Text style={styles.subtitle}>Digital Kurdistan</Text>
      </View>

      {/* Lock Icon */}
      <View style={styles.lockIcon}>
        <Text style={styles.lockEmoji}>🔒</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>App Locked</Text>
      <Text style={styles.description}>
        Authenticate to unlock and access your wallet
      </Text>

      {/* Biometric or PIN */}
      <View style={styles.authContainer}>
        {!showPinInput ? (
          // Biometric Button
          isBiometricEnabled && isBiometricSupported && isBiometricEnrolled ? (
            <View style={styles.biometricContainer}>
              <Pressable
                onPress={handleBiometricAuth}
                style={styles.biometricButton}
              >
                <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
              </Pressable>
              <Text style={styles.biometricLabel}>
                Tap to use {getBiometricLabel()}
              </Text>
              <Pressable
                onPress={() => setShowPinInput(true)}
                style={styles.usePinButton}
              >
                <Text style={styles.usePinText}>Use PIN instead</Text>
              </Pressable>
            </View>
          ) : (
            // No biometric, show PIN immediately
            <View style={styles.noBiometricContainer}>
              <Text style={styles.noBiometricText}>
                Biometric authentication not available
              </Text>
              <Button
                title="Enter PIN"
                onPress={() => setShowPinInput(true)}
                variant="primary"
                fullWidth
              />
            </View>
          )
        ) : (
          // PIN Input
          <View style={styles.pinContainer}>
            <Input
              label="Enter PIN"
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
              placeholder="Enter your PIN"
              autoFocus
            />
            <Button
              title="Unlock"
              onPress={handlePinSubmit}
              loading={verifying}
              disabled={verifying || pin.length < 4}
              variant="primary"
              fullWidth
            />
            {isBiometricEnabled && (
              <Pressable
                onPress={() => {
                  setShowPinInput(false);
                  setPin('');
                }}
                style={styles.backButton}
              >
                <Text style={styles.backText}>
                  Use {getBiometricLabel()} instead
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Text style={styles.privacyText}>
          🔐 Authentication happens on your device only
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: KurdistanColors.kesk,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  lockIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  lockEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  authContainer: {
    width: '100%',
    maxWidth: 360,
  },
  biometricContainer: {
    alignItems: 'center',
  },
  biometricButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: KurdistanColors.kesk,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: KurdistanColors.kesk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  biometricIcon: {
    fontSize: 40,
  },
  biometricLabel: {
    fontSize: 16,
    color: AppColors.text,
    marginBottom: 24,
  },
  usePinButton: {
    paddingVertical: 12,
  },
  usePinText: {
    fontSize: 14,
    color: KurdistanColors.kesk,
    fontWeight: '600',
  },
  noBiometricContainer: {
    alignItems: 'center',
  },
  noBiometricText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  pinContainer: {
    gap: 16,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: KurdistanColors.kesk,
    fontWeight: '600',
  },
  privacyNotice: {
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 24,
  },
  privacyText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
});
