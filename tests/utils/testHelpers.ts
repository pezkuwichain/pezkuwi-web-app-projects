/**
 * Test Helper Utilities
 * Common testing utilities for web and mobile
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

// ============================================================================
// REACT TESTING LIBRARY HELPERS
// ============================================================================

/**
 * Custom render function that includes common providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  polkadotConnected?: boolean;
  walletConnected?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const {
    initialState = {},
    polkadotConnected = true,
    walletConnected = true,
    ...renderOptions
  } = options || {};

  // Wrapper will be platform-specific (web or mobile)
  // This is a base implementation
  return render(ui, renderOptions);
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await sleep(interval);
  }
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// BLOCKCHAIN MOCK HELPERS
// ============================================================================

/**
 * Mock Polkadot.js API transaction response
 */
export const mockTransactionResponse = (success: boolean = true) => ({
  status: {
    isInBlock: success,
    isFinalized: success,
    type: success ? 'InBlock' : 'Invalid',
  },
  events: success ? [
    {
      event: {
        section: 'system',
        method: 'ExtrinsicSuccess',
        data: [],
      },
    },
  ] : [],
  dispatchError: success ? null : {
    isModule: true,
    asModule: {
      index: { toNumber: () => 0 },
      error: { toNumber: () => 0 },
    },
  },
});

/**
 * Mock blockchain query response
 */
export const mockQueryResponse = (data: any) => ({
  toJSON: () => data,
  toString: () => JSON.stringify(data),
  unwrap: () => ({ balance: data }),
  isEmpty: !data || data.length === 0,
  toNumber: () => (typeof data === 'number' ? data : 0),
});

/**
 * Generate mock account
 */
export const mockAccount = (address?: string) => ({
  address: address || `5${Math.random().toString(36).substring(2, 15)}`,
  meta: {
    name: 'Test Account',
    source: 'polkadot-js',
  },
  type: 'sr25519',
});

// ============================================================================
// FORM TESTING HELPERS
// ============================================================================

/**
 * Fill form field by test ID
 */
export function fillInput(
  getByTestId: (testId: string) => HTMLElement,
  testId: string,
  value: string
): void {
  const input = getByTestId(testId) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Click button by test ID
 */
export function clickButton(
  getByTestId: (testId: string) => HTMLElement,
  testId: string
): void {
  const button = getByTestId(testId);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/**
 * Check if element has class
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.className.includes(className);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate Polkadot address format
 */
export function isValidPolkadotAddress(address: string): boolean {
  return /^5[1-9A-HJ-NP-Za-km-z]{47}$/.test(address);
}

/**
 * Validate IPFS CID format
 */
export function isValidIPFSCID(cid: string): boolean {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate amount format
 */
export function isValidAmount(amount: string): boolean {
  return /^\d+(\.\d{1,12})?$/.test(amount);
}

// ============================================================================
// DATA ASSERTION HELPERS
// ============================================================================

/**
 * Assert balance matches expected value
 */
export function assertBalanceEquals(
  actual: bigint | string,
  expected: bigint | string,
  decimals: number = 12
): void {
  const actualBigInt = typeof actual === 'string' ? BigInt(actual) : actual;
  const expectedBigInt = typeof expected === 'string' ? BigInt(expected) : expected;

  if (actualBigInt !== expectedBigInt) {
    throw new Error(
      `Balance mismatch: expected ${expectedBigInt.toString()} but got ${actualBigInt.toString()}`
    );
  }
}

/**
 * Assert percentage within range
 */
export function assertPercentageInRange(
  value: number,
  min: number,
  max: number
): void {
  if (value < min || value > max) {
    throw new Error(`Percentage ${value} is not within range [${min}, ${max}]`);
  }
}

// ============================================================================
// MOCK STATE BUILDERS
// ============================================================================

/**
 * Build mock Polkadot context state
 */
export const buildPolkadotContextState = (overrides: Partial<any> = {}) => ({
  api: {
    query: {},
    tx: {},
    rpc: {},
    isReady: Promise.resolve(true),
  },
  isApiReady: true,
  selectedAccount: mockAccount(),
  accounts: [mockAccount()],
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  error: null,
  ...overrides,
});

/**
 * Build mock wallet context state
 */
export const buildWalletContextState = (overrides: Partial<any> = {}) => ({
  isConnected: true,
  account: mockAccount().address,
  balance: '1000000000000000',
  balances: {
    HEZ: '1000000000000000',
    PEZ: '500000000000000',
    wHEZ: '300000000000000',
    USDT: '1000000000', // 6 decimals
  },
  signer: {},
  connectWallet: jest.fn(),
  disconnect: jest.fn(),
  refreshBalances: jest.fn(),
  ...overrides,
});

// ============================================================================
// ERROR TESTING HELPERS
// ============================================================================

/**
 * Expect async function to throw
 */
export async function expectAsyncThrow(
  fn: () => Promise<any>,
  expectedError?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: any) {
    if (expectedError) {
      const message = error.message || error.toString();
      if (typeof expectedError === 'string') {
        if (!message.includes(expectedError)) {
          throw new Error(
            `Expected error message to include "${expectedError}", but got "${message}"`
          );
        }
      } else {
        if (!expectedError.test(message)) {
          throw new Error(
            `Expected error message to match ${expectedError}, but got "${message}"`
          );
        }
      }
    }
  }
}

/**
 * Mock console.error to suppress expected errors
 */
export function suppressConsoleError(fn: () => void): void {
  const originalError = console.error;
  console.error = jest.fn();
  fn();
  console.error = originalError;
}

// ============================================================================
// TIMING HELPERS
// ============================================================================

/**
 * Advance time for Jest fake timers
 */
export function advanceTimersByTime(ms: number): void {
  jest.advanceTimersByTime(ms);
}

/**
 * Run all pending timers
 */
export function runAllTimers(): void {
  jest.runAllTimers();
}

/**
 * Clear all timers
 */
export function clearAllTimers(): void {
  jest.clearAllTimers();
}

// ============================================================================
// CUSTOM MATCHERS (for Jest)
// ============================================================================

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidPolkadotAddress(): R;
      toBeValidIPFSCID(): R;
      toMatchBalance(expected: bigint | string, decimals?: number): R;
    }
  }
}

export const customMatchers = {
  toBeValidPolkadotAddress(received: string) {
    const pass = isValidPolkadotAddress(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid Polkadot address`
          : `Expected ${received} to be a valid Polkadot address`,
    };
  },

  toBeValidIPFSCID(received: string) {
    const pass = isValidIPFSCID(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid IPFS CID`
          : `Expected ${received} to be a valid IPFS CID`,
    };
  },

  toMatchBalance(received: bigint | string, expected: bigint | string, decimals = 12) {
    const receivedBigInt = typeof received === 'string' ? BigInt(received) : received;
    const expectedBigInt = typeof expected === 'string' ? BigInt(expected) : expected;
    const pass = receivedBigInt === expectedBigInt;

    return {
      pass,
      message: () =>
        pass
          ? `Expected balance ${receivedBigInt} not to match ${expectedBigInt}`
          : `Expected balance ${receivedBigInt} to match ${expectedBigInt}`,
    };
  },
};

// ============================================================================
// TEST DATA CLEANUP
// ============================================================================

/**
 * Clean up test data after each test
 */
export function cleanupTestData(): void {
  // Clear local storage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  // Clear session storage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }

  // Clear cookies
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  }
}
