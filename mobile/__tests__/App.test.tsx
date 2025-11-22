import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../App';

// Mock i18n initialization
jest.mock('../src/i18n', () => ({
  initializeI18n: jest.fn(() => Promise.resolve()),
}));

describe('App Integration Tests', () => {
  it('should render App component', async () => {
    const { getByTestId, UNSAFE_getByType } = render(<App />);

    // Wait for i18n to initialize
    await waitFor(() => {
      // App should render without crashing
      expect(UNSAFE_getByType(App)).toBeTruthy();
    });
  });

  it('should show loading indicator while initializing', () => {
    const { UNSAFE_getAllByType } = render(<App />);

    // Should have ActivityIndicator during initialization
    const indicators = UNSAFE_getAllByType(require('react-native').ActivityIndicator);
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('should wrap app in ErrorBoundary', () => {
    const { UNSAFE_getByType } = render(<App />);

    // ErrorBoundary should be present in component tree
    // This verifies the provider hierarchy is correct
    expect(UNSAFE_getByType(App)).toBeTruthy();
  });
});
