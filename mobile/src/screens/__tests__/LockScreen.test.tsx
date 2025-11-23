import React from 'react';
import { render } from '@testing-library/react-native';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { BiometricAuthProvider } from '../../contexts/BiometricAuthContext';
import LockScreen from '../LockScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const LockScreenWrapper = () => (
  <LanguageProvider>
    <BiometricAuthProvider>
      <LockScreen />
    </BiometricAuthProvider>
  </LanguageProvider>
);

describe('LockScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<LockScreenWrapper />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<LockScreenWrapper />);
    expect(toJSON()).toMatchSnapshot();
  });
});
