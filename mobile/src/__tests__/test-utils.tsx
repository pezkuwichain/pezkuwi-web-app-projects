import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

// Mock all contexts with simple implementations
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const MockPolkadotProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const MockLanguageProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const MockBiometricAuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Wrapper component with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockAuthProvider>
      <MockPolkadotProvider>
        <MockLanguageProvider>
          <MockBiometricAuthProvider>
            {children}
          </MockBiometricAuthProvider>
        </MockLanguageProvider>
      </MockPolkadotProvider>
    </MockAuthProvider>
  );
};

// Custom render method
const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
