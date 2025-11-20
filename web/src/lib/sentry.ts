import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Only initialize if DSN is provided and not in development
  if (!dsn || import.meta.env.DEV) {
    if (import.meta.env.DEV) {
      console.log('📊 Sentry disabled in development');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter out sensitive data
    beforeSend(event) {
      // Don't send errors in development
      if (import.meta.env.DEV) {
        return null;
      }

      // Filter out wallet addresses and sensitive data
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/5[A-HJ-NP-Za-km-z]{47}/g, '[REDACTED_WALLET]');
      }

      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            breadcrumb.data = JSON.parse(
              JSON.stringify(breadcrumb.data).replace(/5[A-HJ-NP-Za-km-z]{47}/g, '[REDACTED_WALLET]')
            );
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Ignore common non-critical errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      // Network errors that are expected
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // Polkadot.js expected disconnections
      'WebSocket is not connected',
      'RPC connection closed',
    ],
  });

  // Set user context when available
  const selectedWallet = localStorage.getItem('selectedWallet');
  if (selectedWallet) {
    Sentry.setUser({
      id: selectedWallet.slice(0, 8), // Only first 8 chars for privacy
    });
  }

  console.log('📊 Sentry initialized');
};

// Export Sentry for use in error boundaries and manual reporting
export { Sentry };
