import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { BiometricAuthProvider, useBiometricAuth } from '../BiometricAuthContext';
import * as LocalAuthentication from 'expo-local-authentication';

// Wrapper for provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BiometricAuthProvider>{children}</BiometricAuthProvider>
);

describe('BiometricAuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks for biometric hardware
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it('should provide biometric auth context', () => {
    const { result } = renderHook(() => useBiometricAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLocked).toBe(true);
    expect(result.current.isBiometricEnabled).toBe(false);
  });

  it('should check for biometric hardware', async () => {
    const { result } = renderHook(() => useBiometricAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isBiometricSupported).toBe(true);
    });
  });

  it('should authenticate with biometrics', async () => {
    const { result } = renderHook(() => useBiometricAuth(), { wrapper });

    // Wait for biometric initialization
    await waitFor(() => {
      expect(result.current.isBiometricSupported).toBe(true);
    });

    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: true,
    });

    await act(async () => {
      const success = await result.current.authenticate();
      expect(success).toBe(true);
    });
  });

  it('should handle failed biometric authentication', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Authentication failed',
    });

    const { result } = renderHook(() => useBiometricAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isBiometricSupported).toBe(true);
    });

    await act(async () => {
      const success = await result.current.authenticate();
      expect(success).toBe(false);
    });
  });

  it('should enable biometric authentication', async () => {
    const { result } = renderHook(() => useBiometricAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isBiometricSupported).toBe(true);
    });

    await act(async () => {
      await result.current.enableBiometric();
    });

    expect(result.current.enableBiometric).toBeDefined();
  });

  it('should disable biometric authentication', async () => {
    const { result } = renderHook(() => useBiometricAuth(), { wrapper });

    await act(async () => {
      await result.current.disableBiometric();
    });

    expect(result.current.disableBiometric).toBeDefined();
  });

  it('should lock the app', () => {
    const { result } = renderHook(() => useBiometricAuth(), { wrapper });

    act(() => {
      result.current.lock();
    });

    expect(result.current.isLocked).toBe(true);
  });

  it('should unlock the app', () => {
    const { result } = renderHook(() => useBiometricAuth(), { wrapper });

    act(() => {
      result.current.unlock();
    });

    expect(result.current.isLocked).toBe(false);
  });

  it('should throw error when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useBiometricAuth());
    }).toThrow('useBiometricAuth must be used within BiometricAuthProvider');

    spy.mockRestore();
  });

  it('should handle authentication errors gracefully', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockRejectedValue(
      new Error('Hardware error')
    );

    const { result } = renderHook(() => useBiometricAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isBiometricSupported).toBe(true);
    });

    await act(async () => {
      const success = await result.current.authenticate();
      expect(success).toBe(false);
    });
  });
});
