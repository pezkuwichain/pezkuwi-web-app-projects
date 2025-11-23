import React from 'react';
import { render } from '@testing-library/react-native';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { PolkadotProvider } from '../../contexts/PolkadotContext';
import GovernanceScreen from '../GovernanceScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const GovernanceScreenWrapper = () => (
  <LanguageProvider>
    <PolkadotProvider>
      <GovernanceScreen />
    </PolkadotProvider>
  </LanguageProvider>
);

describe('GovernanceScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<GovernanceScreenWrapper />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<GovernanceScreenWrapper />);
    expect(toJSON()).toMatchSnapshot();
  });
});
