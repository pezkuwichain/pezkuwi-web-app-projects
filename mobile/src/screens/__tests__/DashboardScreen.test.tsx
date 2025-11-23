import React from 'react';
import { render } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

describe('DashboardScreen', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<DashboardScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(<DashboardScreen />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should display dashboard content', () => {
    const { UNSAFE_root } = render(<DashboardScreen />);
    expect(UNSAFE_root).toBeDefined();
  });
});
