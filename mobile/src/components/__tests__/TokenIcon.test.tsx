import React from 'react';
import { render } from '@testing-library/react-native';
import { TokenIcon } from '../TokenIcon';

describe('TokenIcon', () => {
  it('should render HEZ token icon', () => {
    const { getByText } = render(<TokenIcon symbol="HEZ" />);
    expect(getByText('H')).toBeTruthy();
  });

  it('should render PEZ token icon', () => {
    const { getByText } = render(<TokenIcon symbol="PEZ" />);
    expect(getByText('P')).toBeTruthy();
  });

  it('should render USDT token icon', () => {
    const { getByText } = render(<TokenIcon symbol="wUSDT" />);
    expect(getByText('U')).toBeTruthy();
  });

  it('should render with custom size', () => {
    const { getByTestId } = render(<TokenIcon symbol="HEZ" size={50} testID="token-icon" />);
    expect(getByTestId('token-icon')).toBeTruthy();
  });

  it('should handle testID', () => {
    const { getByTestId } = render(<TokenIcon symbol="PEZ" testID="token-icon" />);
    expect(getByTestId('token-icon')).toBeTruthy();
  });

  it('should render unknown token', () => {
    const { getByText } = render(<TokenIcon symbol="UNKNOWN" />);
    expect(getByText('U')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const customStyle = { borderRadius: 50 };
    const { getByTestId } = render(
      <TokenIcon symbol="HEZ" style={customStyle} testID="token-icon" />
    );
    expect(getByTestId('token-icon')).toBeTruthy();
  });
});
