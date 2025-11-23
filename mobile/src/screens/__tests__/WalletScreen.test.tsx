import React from 'react';
import { render } from '@testing-library/react-native';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { PolkadotProvider } from '../../contexts/PolkadotContext';
import WalletScreen from '../WalletScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const WalletScreenWrapper = () => (
  <LanguageProvider>
    <PolkadotProvider>
      <WalletScreen />
    </PolkadotProvider>
  </LanguageProvider>
);

describe('WalletScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<WalletScreenWrapper />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<WalletScreenWrapper />);
    expect(toJSON()).toMatchSnapshot();
  });
});
