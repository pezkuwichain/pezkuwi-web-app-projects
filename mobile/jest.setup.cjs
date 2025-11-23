// Jest setup for React Native testing
// @testing-library/react-native v12.4+ includes matchers by default

// Disable Expo's winter module system for tests
process.env.EXPO_USE_STATIC_RENDERING = 'true';
global.__ExpoImportMetaRegistry__ = {};

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock expo modules
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(() =>
    Promise.resolve({ success: true })
  ),
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])), // 1 = FINGERPRINT
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Polkadot.js
jest.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: jest.fn(() =>
      Promise.resolve({
        isReady: Promise.resolve(true),
        query: {},
        tx: {},
        rpc: {},
        disconnect: jest.fn(),
      })
    ),
  },
  WsProvider: jest.fn(),
}));

// Mock Supabase
jest.mock('./src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock shared blockchain utilities
jest.mock('../shared/blockchain/polkadot', () => ({
  PEZKUWI_NETWORK: {
    name: 'Pezkuwi',
    endpoint: 'wss://beta-rpc.pezkuwi.art',
    chainId: 'pezkuwi',
  },
  BLOCKCHAIN_ENDPOINTS: {
    mainnet: 'wss://mainnet.pezkuwichain.io',
    testnet: 'wss://ws.pezkuwichain.io',
    local: 'ws://127.0.0.1:9944',
  },
  DEFAULT_ENDPOINT: 'ws://127.0.0.1:9944',
  getExplorerUrl: jest.fn((txHash) => `https://explorer.pezkuwichain.app/tx/${txHash}`),
}));

// Mock shared DEX utilities
jest.mock('../shared/utils/dex', () => ({
  formatTokenBalance: jest.fn((amount, decimals) => '0.00'),
  parseTokenInput: jest.fn((input, decimals) => '0'),
  calculatePriceImpact: jest.fn(() => '0'),
  getAmountOut: jest.fn(() => '0'),
  calculateMinAmount: jest.fn((amount, slippage) => '0'),
  fetchPools: jest.fn(() => Promise.resolve([])),
  fetchUserPositions: jest.fn(() => Promise.resolve([])),
}));

// Mock shared P2P fiat utilities
jest.mock('../shared/lib/p2p-fiat', () => ({
  getActiveOffers: jest.fn(() => Promise.resolve([])),
  createOffer: jest.fn(() => Promise.resolve({ id: '123' })),
  acceptOffer: jest.fn(() => Promise.resolve(true)),
}));

// Mock shared i18n module
jest.mock('../shared/i18n', () => ({
  translations: {
    en: { welcome: 'Welcome' },
    tr: { welcome: 'Hoş geldiniz' },
    kmr: { welcome: 'Bi xêr hatî' },
    ckb: { welcome: 'بەخێربێن' },
    ar: { welcome: 'مرحبا' },
    fa: { welcome: 'خوش آمدید' },
  },
  LANGUAGES: [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
    { code: 'kmr', name: 'Kurdish Kurmanji', nativeName: 'Kurmancî', rtl: false },
    { code: 'ckb', name: 'Kurdish Sorani', nativeName: 'سۆرانی', rtl: true },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true },
  ],
  DEFAULT_LANGUAGE: 'en',
  LANGUAGE_STORAGE_KEY: '@language',
  isRTL: jest.fn((code) => ['ckb', 'ar', 'fa'].includes(code)),
}));

// Mock shared wallet utilities (handles import.meta)
jest.mock('../shared/lib/wallet', () => ({
  formatBalance: jest.fn((amount, decimals) => '0.00'),
  parseBalance: jest.fn((amount) => '0'),
  NETWORK_ENDPOINTS: {
    local: 'ws://127.0.0.1:9944',
    testnet: 'wss://testnet.pezkuwichain.io',
    mainnet: 'wss://mainnet.pezkuwichain.io',
    staging: 'wss://staging.pezkuwichain.io',
    beta: 'wss://rpc.pezkuwichain.io:9944',
  },
}));

// Mock shared staking utilities (handles import.meta)
jest.mock('../shared/lib/staking', () => ({
  formatBalance: jest.fn((amount) => '0.00'),
  NETWORK_ENDPOINTS: {},
}));

// Mock shared citizenship workflow (handles polkadot/extension-dapp)
jest.mock('../shared/lib/citizenship-workflow', () => ({
  createCitizenshipRequest: jest.fn(() => Promise.resolve({ id: '123' })),
}));

// Mock react-i18next for i18n initialization
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(() => Promise.resolve()),
      isInitialized: true,
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock i18next
jest.mock('i18next', () => ({
  ...jest.requireActual('i18next'),
  init: jest.fn(() => Promise.resolve()),
  changeLanguage: jest.fn(() => Promise.resolve()),
  use: jest.fn(function () { return this; }),
  language: 'en',
  isInitialized: true,
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
