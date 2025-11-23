import React from 'react';
import { render } from '@testing-library/react-native';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { PolkadotProvider } from '../../contexts/PolkadotContext';
import NFTGalleryScreen from '../NFTGalleryScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const NFTGalleryScreenWrapper = () => (
  <LanguageProvider>
    <PolkadotProvider>
      <NFTGalleryScreen />
    </PolkadotProvider>
  </LanguageProvider>
);

describe('NFTGalleryScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<NFTGalleryScreenWrapper />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<NFTGalleryScreenWrapper />);
    expect(toJSON()).toMatchSnapshot();
  });
});
