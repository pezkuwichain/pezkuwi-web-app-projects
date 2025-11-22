import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws error for testing
const ThrowError = () => {
  throw new Error('Test error');
  return null;
};

// Normal component for success case
const SuccessComponent = () => <Text>Success!</Text>;

describe('ErrorBoundary', () => {
  // Suppress error console logs during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <SuccessComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Success!')).toBeTruthy();
  });

  it('should render error UI when child throws error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeTruthy();
    expect(screen.getByText(/An unexpected error occurred/)).toBeTruthy();
  });

  it('should display try again button on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('should render custom fallback if provided', () => {
    const CustomFallback = () => <Text>Custom Error UI</Text>;

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });
});
