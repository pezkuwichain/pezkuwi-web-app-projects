import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with title', () => {
    const { getByText } = render(<Button title="Click Me" onPress={() => {}} />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPress} />);

    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPress} disabled />);

    fireEvent.press(getByText('Click Me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render primary variant', () => {
    const { getByText } = render(<Button title="Primary" variant="primary" onPress={() => {}} />);
    expect(getByText('Primary')).toBeTruthy();
  });

  it('should render secondary variant', () => {
    const { getByText } = render(
      <Button title="Secondary" variant="secondary" onPress={() => {}} />
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('should render outline variant', () => {
    const { getByText } = render(<Button title="Outline" variant="outline" onPress={() => {}} />);
    expect(getByText('Outline')).toBeTruthy();
  });

  it('should render small size', () => {
    const { getByText } = render(<Button title="Small" size="small" onPress={() => {}} />);
    expect(getByText('Small')).toBeTruthy();
  });

  it('should render medium size', () => {
    const { getByText } = render(<Button title="Medium" size="medium" onPress={() => {}} />);
    expect(getByText('Medium')).toBeTruthy();
  });

  it('should render large size', () => {
    const { getByText } = render(<Button title="Large" size="large" onPress={() => {}} />);
    expect(getByText('Large')).toBeTruthy();
  });

  it('should show loading state', () => {
    const { getByTestId } = render(
      <Button title="Loading" loading onPress={() => {}} testID="button" />
    );
    expect(getByTestId('button')).toBeTruthy();
  });

  it('should be disabled when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Loading" loading onPress={onPress} testID="button" />
    );

    fireEvent.press(getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should apply custom styles', () => {
    const customStyle = { margin: 20 };
    const { getByText } = render(<Button title="Styled" style={customStyle} onPress={() => {}} />);
    expect(getByText('Styled')).toBeTruthy();
  });

  it('should handle testID prop', () => {
    const { getByTestId } = render(<Button title="Test" testID="button" onPress={() => {}} />);
    expect(getByTestId('button')).toBeTruthy();
  });

  it('should render fullWidth', () => {
    const { getByText } = render(<Button title="Full Width" fullWidth onPress={() => {}} />);
    expect(getByText('Full Width')).toBeTruthy();
  });

  it('should render with icon', () => {
    const { getByText, getByTestId } = render(
      <Button title="With Icon" icon={<Button title="Icon" onPress={() => {}} />} testID="button" onPress={() => {}} />
    );
    expect(getByTestId('button')).toBeTruthy();
  });
});
