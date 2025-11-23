import React from 'react';
import { render } from '@testing-library/react-native';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { PolkadotProvider } from '../../contexts/PolkadotContext';
import EducationScreen from '../EducationScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const EducationScreenWrapper = () => (
  <LanguageProvider>
    <PolkadotProvider>
      <EducationScreen />
    </PolkadotProvider>
  </LanguageProvider>
);

describe('EducationScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<EducationScreenWrapper />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<EducationScreenWrapper />);
    expect(toJSON()).toMatchSnapshot();
  });
});
