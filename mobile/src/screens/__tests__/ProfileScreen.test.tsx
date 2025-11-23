import React from 'react';
import { render } from '@testing-library/react-native';
import { LanguageProvider } from '../../contexts/LanguageContext';
import ProfileScreen from '../ProfileScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const ProfileScreenWrapper = () => (
  <LanguageProvider>
    <ProfileScreen />
  </LanguageProvider>
);

describe('ProfileScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<ProfileScreenWrapper />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<ProfileScreenWrapper />);
    expect(toJSON()).toMatchSnapshot();
  });
});
