import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider } from '../../contexts/AuthContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import SignInScreen from '../SignInScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Wrapper with required providers
const SignInScreenWrapper = () => (
  <LanguageProvider>
    <AuthProvider>
      <SignInScreen />
    </AuthProvider>
  </LanguageProvider>
);

describe('SignInScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<SignInScreenWrapper />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<SignInScreenWrapper />);
    expect(toJSON()).toMatchSnapshot();
  });
});
