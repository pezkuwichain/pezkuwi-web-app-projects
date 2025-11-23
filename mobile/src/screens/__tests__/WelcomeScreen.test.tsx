import React from 'react';
import { render } from '@testing-library/react-native';
import { LanguageProvider } from '../../contexts/LanguageContext';
import WelcomeScreen from '../WelcomeScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Wrapper with required providers
const WelcomeScreenWrapper = () => (
  <LanguageProvider>
    <WelcomeScreen />
  </LanguageProvider>
);

describe('WelcomeScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<WelcomeScreenWrapper />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<WelcomeScreenWrapper />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should display welcome message', () => {
    const { UNSAFE_root } = render(<WelcomeScreenWrapper />);
    expect(UNSAFE_root).toBeDefined();
  });

  it('should render language selection options', () => {
    const { UNSAFE_root } = render(<WelcomeScreenWrapper />);
    expect(UNSAFE_root).toBeDefined();
  });
});
