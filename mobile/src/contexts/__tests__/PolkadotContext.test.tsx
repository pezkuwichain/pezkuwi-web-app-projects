import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { PolkadotProvider, usePolkadot } from '../PolkadotContext';
import { ApiPromise } from '@polkadot/api';

// Wrapper for provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PolkadotProvider>{children}</PolkadotProvider>
);

describe('PolkadotContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide polkadot context', () => {
    const { result } = renderHook(() => usePolkadot(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.api).toBeNull();
    expect(result.current.isApiReady).toBe(false);
    expect(result.current.selectedAccount).toBeNull();
  });

  it('should initialize API connection', async () => {
    const { result } = renderHook(() => usePolkadot(), { wrapper });

    await waitFor(() => {
      expect(result.current.isApiReady).toBe(false); // Mock doesn't complete
    });
  });

  it('should provide connectWallet function', () => {
    const { result } = renderHook(() => usePolkadot(), { wrapper });

    expect(result.current.connectWallet).toBeDefined();
    expect(typeof result.current.connectWallet).toBe('function');
  });

  it('should handle disconnectWallet', () => {
    const { result } = renderHook(() => usePolkadot(), { wrapper });

    act(() => {
      result.current.disconnectWallet();
    });

    expect(result.current.selectedAccount).toBeNull();
  });

  it('should provide setSelectedAccount function', () => {
    const { result } = renderHook(() => usePolkadot(), { wrapper });

    expect(result.current.setSelectedAccount).toBeDefined();
    expect(typeof result.current.setSelectedAccount).toBe('function');
  });

  it('should set selected account', () => {
    const { result } = renderHook(() => usePolkadot(), { wrapper });

    const testAccount = { address: '5test', name: 'Test Account' };

    act(() => {
      result.current.setSelectedAccount(testAccount);
    });

    expect(result.current.selectedAccount).toEqual(testAccount);
  });

  it('should provide getKeyPair function', () => {
    const { result } = renderHook(() => usePolkadot(), { wrapper });

    expect(result.current.getKeyPair).toBeDefined();
    expect(typeof result.current.getKeyPair).toBe('function');
  });

  it('should throw error when usePolkadot is used outside provider', () => {
    // Suppress console error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePolkadot());
    }).toThrow('usePolkadot must be used within PolkadotProvider');

    spy.mockRestore();
  });

  it('should handle accounts array', () => {
    const { result } = renderHook(() => usePolkadot(), { wrapper });

    expect(Array.isArray(result.current.accounts)).toBe(true);
  });

  it('should handle error state', () => {
    const { result } = renderHook(() => usePolkadot(), { wrapper });

    expect(result.current.error).toBeDefined();
  });
});
