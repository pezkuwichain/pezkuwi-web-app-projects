import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * CRITICAL SECURITY NOTE:
 * ALL DATA STAYS ON DEVICE - NEVER SENT TO SERVER
 *
 * Storage Strategy:
 * - Biometric settings: AsyncStorage (local device only)
 * - PIN code: SecureStore (encrypted on device)
 * - Lock timer: AsyncStorage (local device only)
 * - Last unlock time: AsyncStorage (local device only)
 *
 * NO DATA IS EVER TRANSMITTED TO EXTERNAL SERVERS
 */

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled'; // Local only
const PIN_CODE_KEY = 'user_pin_code'; // Encrypted SecureStore
const AUTO_LOCK_TIMER_KEY = '@auto_lock_timer'; // Local only
const LAST_UNLOCK_TIME_KEY = '@last_unlock_time'; // Local only

interface BiometricAuthContextType {
  isBiometricSupported: boolean;
  isBiometricEnrolled: boolean;
  biometricType: 'fingerprint' | 'facial' | 'iris' | 'none';
  isBiometricEnabled: boolean;
  isLocked: boolean;
  autoLockTimer: number; // minutes
  authenticate: () => Promise<boolean>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  setPinCode: (pin: string) => Promise<void>;
  verifyPinCode: (pin: string) => Promise<boolean>;
  setAutoLockTimer: (minutes: number) => Promise<void>;
  lock: () => void;
  unlock: () => void;
  checkAutoLock: () => Promise<void>;
}

const BiometricAuthContext = createContext<BiometricAuthContextType | undefined>(
  undefined
);

export const BiometricAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | 'none'>('none');
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [autoLockTimer, setAutoLockTimerState] = useState(5); // Default 5 minutes

  useEffect(() => {
    initBiometric();
    loadSettings();
  }, []);

  /**
   * Initialize biometric capabilities
   * Checks device support - NO DATA SENT ANYWHERE
   */
  const initBiometric = async () => {
    try {
      // Check if device supports biometrics
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      if (compatible) {
        // Check if user has enrolled biometrics
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricEnrolled(enrolled);

        // Get supported authentication types
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('facial');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('iris');
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Biometric init error:', error);
    }
  };

  /**
   * Load settings from LOCAL STORAGE ONLY
   * Data never leaves the device
   */
  const loadSettings = async () => {
    try {
      // Load biometric enabled status (local only)
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabled(enabled === 'true');

      // Load auto-lock timer (local only)
      const timer = await AsyncStorage.getItem(AUTO_LOCK_TIMER_KEY);
      if (timer) {
        setAutoLockTimerState(parseInt(timer, 10));
      }

      // Check if app should be locked
      await checkAutoLock();
    } catch (error) {
      if (__DEV__) console.error('Error loading settings:', error);
    }
  };

  /**
   * Authenticate using biometric
   * Authentication happens ON DEVICE ONLY
   */
  const authenticate = async (): Promise<boolean> => {
    try {
      if (!isBiometricSupported || !isBiometricEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock PezkuwiChain',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        unlock();
        return true;
      }

      return false;
    } catch (error) {
      if (__DEV__) console.error('Authentication error:', error);
      return false;
    }
  };

  /**
   * Enable biometric authentication
   * Settings saved LOCALLY ONLY
   */
  const enableBiometric = async (): Promise<boolean> => {
    try {
      // First authenticate to enable
      const authenticated = await authenticate();

      if (authenticated) {
        // Save enabled status LOCALLY
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        setIsBiometricEnabled(true);
        return true;
      }

      return false;
    } catch (error) {
      if (__DEV__) console.error('Enable biometric error:', error);
      return false;
    }
  };

  /**
   * Disable biometric authentication
   * Settings saved LOCALLY ONLY
   */
  const disableBiometric = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      setIsBiometricEnabled(false);
    } catch (error) {
      if (__DEV__) console.error('Disable biometric error:', error);
    }
  };

  /**
   * Set PIN code as backup
   * PIN stored in ENCRYPTED SECURE STORE on device
   * NEVER sent to server
   */
  const setPinCode = async (pin: string): Promise<void> => {
    try {
      // Hash the PIN before storing (simple hash for demo)
      // In production, use proper cryptographic hashing
      const hashedPin = await hashPin(pin);

      // Store in SecureStore (encrypted on device)
      await SecureStore.setItemAsync(PIN_CODE_KEY, hashedPin);
    } catch (error) {
      if (__DEV__) console.error('Set PIN error:', error);
      throw error;
    }
  };

  /**
   * Verify PIN code
   * Verification happens LOCALLY on device
   */
  const verifyPinCode = async (pin: string): Promise<boolean> => {
    try {
      // Get stored PIN from SecureStore (local encrypted storage)
      const storedPin = await SecureStore.getItemAsync(PIN_CODE_KEY);

      if (!storedPin) {
        return false;
      }

      // Hash entered PIN
      const hashedPin = await hashPin(pin);

      // Compare (happens on device)
      if (hashedPin === storedPin) {
        unlock();
        return true;
      }

      return false;
    } catch (error) {
      if (__DEV__) console.error('Verify PIN error:', error);
      return false;
    }
  };

  /**
   * Simple PIN hashing (for demo)
   * In production, use bcrypt or similar
   * All happens ON DEVICE
   */
  const hashPin = async (pin: string): Promise<string> => {
    // Simple hash for demo - replace with proper crypto in production
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  /**
   * Set auto-lock timer
   * Setting saved LOCALLY ONLY
   */
  const setAutoLockTimer = async (minutes: number): Promise<void> => {
    try {
      await AsyncStorage.setItem(AUTO_LOCK_TIMER_KEY, minutes.toString());
      setAutoLockTimerState(minutes);
    } catch (error) {
      if (__DEV__) console.error('Set auto-lock timer error:', error);
    }
  };

  /**
   * Lock the app
   * State change is LOCAL ONLY
   */
  const lock = () => {
    setIsLocked(true);
  };

  /**
   * Unlock the app
   * Saves timestamp LOCALLY for auto-lock
   */
  const unlock = async () => {
    setIsLocked(false);

    // Save unlock time LOCALLY for auto-lock check
    try {
      await AsyncStorage.setItem(LAST_UNLOCK_TIME_KEY, Date.now().toString());
    } catch (error) {
      if (__DEV__) console.error('Save unlock time error:', error);
    }
  };

  /**
   * Check if app should auto-lock
   * All checks happen LOCALLY
   */
  const checkAutoLock = async (): Promise<void> => {
    try {
      // Get last unlock time from LOCAL storage
      const lastUnlockTime = await AsyncStorage.getItem(LAST_UNLOCK_TIME_KEY);

      if (!lastUnlockTime) {
        // First time or no previous unlock - lock the app
        setIsLocked(true);
        return;
      }

      const lastUnlock = parseInt(lastUnlockTime, 10);
      const now = Date.now();
      const minutesPassed = (now - lastUnlock) / 1000 / 60;

      // If more time passed than timer, lock the app
      if (minutesPassed >= autoLockTimer) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      if (__DEV__) console.error('Check auto-lock error:', error);
      // On error, lock for safety
      setIsLocked(true);
    }
  };

  return (
    <BiometricAuthContext.Provider
      value={{
        isBiometricSupported,
        isBiometricEnrolled,
        biometricType,
        isBiometricEnabled,
        isLocked,
        autoLockTimer,
        authenticate,
        enableBiometric,
        disableBiometric,
        setPinCode,
        verifyPinCode,
        setAutoLockTimer,
        lock,
        unlock,
        checkAutoLock,
      }}
    >
      {children}
    </BiometricAuthContext.Provider>
  );
};

export const useBiometricAuth = () => {
  const context = useContext(BiometricAuthContext);
  if (context === undefined) {
    throw new Error('useBiometricAuth must be used within BiometricAuthProvider');
  }
  return context;
};
