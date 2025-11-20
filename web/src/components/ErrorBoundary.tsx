// ========================================
// Error Boundary Component
// ========================================
// Catches React errors and displays fallback UI

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary
 * Catches unhandled errors in React component tree
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    if (import.meta.env.DEV) console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <Card className="bg-gray-900 border-gray-800 max-w-2xl w-full">
            <CardContent className="p-8">
              <Alert className="bg-red-900/20 border-red-500 mb-6">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <AlertDescription className="text-gray-300">
                  <h2 className="text-xl font-bold mb-2 text-white">Something Went Wrong</h2>
                  <p className="mb-4">
                    An unexpected error occurred. We apologize for the inconvenience.
                  </p>
                  {this.state.error && (
                    <details className="mt-4 p-4 bg-gray-950 rounded border border-gray-700">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-400 hover:text-gray-300">
                        Error Details (for developers)
                      </summary>
                      <div className="mt-3 text-xs font-mono space-y-2">
                        <div>
                          <strong className="text-red-400">Error:</strong>
                          <pre className="mt-1 text-gray-400 whitespace-pre-wrap">
                            {this.state.error.toString()}
                          </pre>
                        </div>
                        {this.state.errorInfo && (
                          <div>
                            <strong className="text-red-400">Component Stack:</strong>
                            <pre className="mt-1 text-gray-400 whitespace-pre-wrap">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800 flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              <p className="mt-6 text-sm text-gray-500">
                If this problem persists, please contact support at{' '}
                <a
                  href="mailto:info@pezkuwichain.io"
                  className="text-green-400 hover:underline"
                >
                  info@pezkuwichain.io
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// ========================================
// ROUTE-LEVEL ERROR BOUNDARY
// ========================================

/**
 * Smaller error boundary for individual routes
 * Less intrusive, doesn&apos;t take over the whole screen
 */
export const RouteErrorBoundary: React.FC<{
  children: ReactNode;
  routeName?: string;
}> = ({ children, routeName = 'this page' }) => {
  const [hasError, setHasError] = React.useState(false);

  const handleReset = () => {
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className="p-8">
        <Alert className="bg-red-900/20 border-red-500">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-gray-300">
            <strong className="block mb-2">Error loading {routeName}</strong>
            An error occurred while rendering this component.
            <div className="mt-4">
              <Button onClick={handleReset} size="sm" className="bg-green-600 hover:bg-green-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<RouteErrorFallback routeName={routeName} onReset={handleReset} />}>
      {children}
    </ErrorBoundary>
  );
};

const RouteErrorFallback: React.FC<{ routeName: string; onReset: () => void }> = ({
  routeName,
  onReset,
}) => {
  return (
    <div className="p-8">
      <Alert className="bg-red-900/20 border-red-500">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <AlertDescription className="text-gray-300">
          <strong className="block mb-2">Error loading {routeName}</strong>
          An unexpected error occurred.
          <div className="mt-4">
            <Button onClick={onReset} size="sm" className="bg-green-600 hover:bg-green-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
