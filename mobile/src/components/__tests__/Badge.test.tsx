import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('should render with text', () => {
    const { getByText } = render(<Badge>Test Badge</Badge>);
    expect(getByText('Test Badge')).toBeTruthy();
  });

  it('should render default variant', () => {
    const { getByText } = render(<Badge>Default</Badge>);
    expect(getByText('Default')).toBeTruthy();
  });

  it('should render success variant', () => {
    const { getByText } = render(<Badge variant="success">Success</Badge>);
    expect(getByText('Success')).toBeTruthy();
  });

  it('should render error variant', () => {
    const { getByText } = render(<Badge variant="error">Error</Badge>);
    expect(getByText('Error')).toBeTruthy();
  });

  it('should render warning variant', () => {
    const { getByText } = render(<Badge variant="warning">Warning</Badge>);
    expect(getByText('Warning')).toBeTruthy();
  });

  it('should render info variant', () => {
    const { getByText } = render(<Badge variant="info">Info</Badge>);
    expect(getByText('Info')).toBeTruthy();
  });

  it('should render small size', () => {
    const { getByText } = render(<Badge size="small">Small</Badge>);
    expect(getByText('Small')).toBeTruthy();
  });

  it('should render medium size', () => {
    const { getByText } = render(<Badge size="medium">Medium</Badge>);
    expect(getByText('Medium')).toBeTruthy();
  });

  it('should render large size', () => {
    const { getByText } = render(<Badge size="large">Large</Badge>);
    expect(getByText('Large')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const customStyle = { margin: 10 };
    const { getByText } = render(<Badge style={customStyle}>Styled</Badge>);
    expect(getByText('Styled')).toBeTruthy();
  });

  it('should handle testID prop', () => {
    const { getByTestId } = render(<Badge testID="badge">Test</Badge>);
    expect(getByTestId('badge')).toBeTruthy();
  });

  it('should render with number', () => {
    const { getByText } = render(<Badge>{99}</Badge>);
    expect(getByText('99')).toBeTruthy();
  });

  it('should render with icon', () => {
    const { getByTestId } = render(
      <Badge testID="badge">
        <Badge>Inner Badge</Badge>
      </Badge>
    );
    expect(getByTestId('badge')).toBeTruthy();
  });
});
