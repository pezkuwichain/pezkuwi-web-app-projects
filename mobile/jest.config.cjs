module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.before.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@polkadot/.*|@babel/runtime)',
    '!../shared/.*',
  ],
  moduleNameMapper: {
    '^@pezkuwi/(.*)$': '<rootDir>/../shared/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    'react-native-gesture-handler': '<rootDir>/__mocks__/react-native-gesture-handler.js',
    'react-native-reanimated': '<rootDir>/__mocks__/react-native-reanimated.js',
    '^sonner$': '<rootDir>/__mocks__/sonner.js',
    '@polkadot/extension-dapp': '<rootDir>/__mocks__/polkadot-extension-dapp.js',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/types/**',
  ],
  coverageThreshold: {
    global: {
      statements: 35,
      branches: 20,
      functions: 25,
      lines: 35,
    },
  },
};
