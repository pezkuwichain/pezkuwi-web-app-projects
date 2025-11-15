import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Pressable,
} from 'react-native';
import { useBiometricAuth } from '../contexts/BiometricAuthContext';
import { AppColors, KurdistanColors } from '../theme/colors';
import { Card, Button, Input, BottomSheet, Badge } from '../components';

/**
 * Security Settings Screen
 * Configure biometric auth, PIN code, auto-lock
 *
 * PRIVACY GUARANTEE:
 * - All data stored LOCALLY on device only
 * - Biometric data never leaves iOS/Android secure enclave
 * - PIN stored in encrypted SecureStore on device
 * - Settings saved in AsyncStorage (local only)
 * - NO DATA TRANSMITTED TO SERVERS
 */
export default function SecurityScreen() {
  const {
    isBiometricSupported,
    isBiometricEnrolled,
    biometricType,
    isBiometricEnabled,
    autoLockTimer,
    enableBiometric,
    disableBiometric,
    setPinCode,
    setAutoLockTimer,
  } = useBiometricAuth();

  const [pinSheetVisible, setPinSheetVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [settingPin, setSettingPin] = useState(false);
  const [timerSheetVisible, setTimerSheetVisible] = useState(false);

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'facial': return 'Face ID';
      case 'fingerprint': return 'Fingerprint';
      case 'iris': return 'Iris Recognition';
      default: return 'Biometric';
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'facial': return '🔐';
      case 'fingerprint': return '👆';
      case 'iris': return '👁️';
      default: return '🔒';
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      // Enable biometric
      const success = await enableBiometric();
      if (!success) {
        Alert.alert(
          'Authentication Failed',
          'Could not enable biometric authentication. Please try again.'
        );
      } else {
        Alert.alert(
          'Success',
          `${getBiometricLabel()} authentication enabled successfully!`
        );
      }
    } else {
      // Disable biometric
      Alert.alert(
        'Disable Biometric Auth',
        `Are you sure you want to disable ${getBiometricLabel()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await disableBiometric();
              Alert.alert('Disabled', `${getBiometricLabel()} authentication disabled`);
            },
          },
        ]
      );
    }
  };

  const handleSetPin = async () => {
    if (!newPin || !confirmPin) {
      Alert.alert('Error', 'Please enter PIN in both fields');
      return;
    }

    if (newPin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    try {
      setSettingPin(true);
      await setPinCode(newPin);

      Alert.alert(
        'Success',
        'PIN code set successfully!\n\n🔒 Your PIN is stored encrypted on your device only.',
        [
          {
            text: 'OK',
            onPress: () => {
              setPinSheetVisible(false);
              setNewPin('');
              setConfirmPin('');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set PIN');
    } finally {
      setSettingPin(false);
    }
  };

  const autoLockOptions = [
    { label: 'Immediately', value: 0 },
    { label: '1 minute', value: 1 },
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: 'Never', value: 999999 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Security</Text>
          <Text style={styles.headerSubtitle}>
            Protect your account and assets
          </Text>
        </View>

        {/* Privacy Notice */}
        <Card variant="outlined" style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔐 Privacy Guarantee</Text>
          <Text style={styles.privacyText}>
            All security settings are stored locally on your device only. Your biometric data never leaves your device's secure enclave. PIN codes are encrypted. No data is transmitted to our servers.
          </Text>
        </Card>

        {/* Biometric Authentication */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Biometric Authentication</Text>

          {!isBiometricSupported ? (
            <View style={styles.notAvailable}>
              <Text style={styles.notAvailableText}>
                Biometric authentication is not available on this device
              </Text>
            </View>
          ) : !isBiometricEnrolled ? (
            <View style={styles.notAvailable}>
              <Text style={styles.notAvailableText}>
                Please enroll {getBiometricLabel()} in your device settings first
              </Text>
            </View>
          ) : (
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>{getBiometricIcon()}</Text>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{getBiometricLabel()}</Text>
                  <Text style={styles.settingSubtitle}>
                    {isBiometricEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{
                  false: AppColors.border,
                  true: KurdistanColors.kesk
                }}
                thumbColor={AppColors.surface}
              />
            </View>
          )}
        </Card>

        {/* PIN Code */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>PIN Code</Text>
          <Text style={styles.sectionDescription}>
            Set a backup PIN code for when biometric authentication fails
          </Text>
          <Button
            title="Set PIN Code"
            variant="outline"
            onPress={() => setPinSheetVisible(true)}
            fullWidth
          />
        </Card>

        {/* Auto-Lock */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Lock</Text>
          <Text style={styles.sectionDescription}>
            Automatically lock the app after inactivity
          </Text>
          <Pressable
            onPress={() => setTimerSheetVisible(true)}
            style={styles.timerButton}
          >
            <Text style={styles.timerLabel}>Auto-lock timer</Text>
            <View style={styles.timerValueContainer}>
              <Text style={styles.timerValue}>
                {autoLockTimer === 999999
                  ? 'Never'
                  : autoLockTimer === 0
                  ? 'Immediately'
                  : `${autoLockTimer} min`}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        </Card>

        {/* Security Tips */}
        <Card variant="outlined" style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Security Tips</Text>
          <View style={styles.tips}>
            <Text style={styles.tip}>
              • Enable biometric authentication for faster, more secure access
            </Text>
            <Text style={styles.tip}>
              • Set a strong PIN code as backup
            </Text>
            <Text style={styles.tip}>
              • Use auto-lock to protect your account when device is idle
            </Text>
            <Text style={styles.tip}>
              • Your biometric data never leaves your device
            </Text>
            <Text style={styles.tip}>
              • All security settings are stored locally only
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Set PIN Bottom Sheet */}
      <BottomSheet
        visible={pinSheetVisible}
        onClose={() => setPinSheetVisible(false)}
        title="Set PIN Code"
        height={450}
      >
        <View>
          <Text style={styles.pinInfo}>
            Create a 4-digit PIN code to use as backup authentication method.
          </Text>

          <Input
            label="New PIN"
            value={newPin}
            onChangeText={setNewPin}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
            placeholder="Enter 4-6 digit PIN"
          />

          <Input
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
            placeholder="Re-enter PIN"
          />

          <View style={styles.pinNotice}>
            <Text style={styles.pinNoticeText}>
              🔒 Your PIN will be encrypted and stored securely on your device only.
            </Text>
          </View>

          <Button
            title="Set PIN"
            onPress={handleSetPin}
            loading={settingPin}
            disabled={settingPin}
            fullWidth
          />
        </View>
      </BottomSheet>

      {/* Auto-Lock Timer Bottom Sheet */}
      <BottomSheet
        visible={timerSheetVisible}
        onClose={() => setTimerSheetVisible(false)}
        title="Auto-Lock Timer"
        height={500}
      >
        <View style={styles.timerOptions}>
          {autoLockOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={async () => {
                await setAutoLockTimer(option.value);
                setTimerSheetVisible(false);
                Alert.alert(
                  'Auto-Lock Updated',
                  `App will auto-lock after ${option.label.toLowerCase()} of inactivity`
                );
              }}
              style={[
                styles.timerOption,
                autoLockTimer === option.value && styles.timerOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.timerOptionText,
                  autoLockTimer === option.value && styles.timerOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {autoLockTimer === option.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  privacyCard: {
    marginBottom: 16,
    backgroundColor: `${KurdistanColors.kesk}08`,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  notAvailable: {
    paddingVertical: 16,
  },
  notAvailableText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppColors.background,
    borderRadius: 12,
  },
  timerLabel: {
    fontSize: 16,
    color: AppColors.text,
  },
  timerValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: KurdistanColors.kesk,
    marginRight: 4,
  },
  chevron: {
    fontSize: 20,
    color: AppColors.textSecondary,
  },
  tipsCard: {
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 12,
  },
  tips: {
    gap: 8,
  },
  tip: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  pinInfo: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  pinNotice: {
    backgroundColor: `${KurdistanColors.kesk}10`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  pinNoticeText: {
    fontSize: 12,
    color: AppColors.text,
    lineHeight: 18,
  },
  timerOptions: {
    gap: 8,
  },
  timerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timerOptionActive: {
    borderColor: KurdistanColors.kesk,
    backgroundColor: `${KurdistanColors.kesk}10`,
  },
  timerOptionText: {
    fontSize: 16,
    color: AppColors.text,
  },
  timerOptionTextActive: {
    fontWeight: '600',
    color: KurdistanColors.kesk,
  },
  checkmark: {
    fontSize: 20,
    color: KurdistanColors.kesk,
  },
});
