import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider } from '../../contexts/AuthContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import SignUpScreen from '../SignUpScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Wrapper with required providers
const SignUpScreenWrapper = () => (
  <LanguageProvider>
    <AuthProvider>
      <SignUpScreen />
    </AuthProvider>
  </LanguageProvider>
);

describe('SignUpScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<SignUpScreenWrapper />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<SignUpScreenWrapper />);
    expect(toJSON()).toMatchSnapshot();
  });
});
