import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input', () => {
  it('should render with placeholder', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" />);
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('should handle value changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('Enter text');
    fireEvent.changeText(input, 'New value');
    expect(onChangeText).toHaveBeenCalledWith('New value');
  });

  it('should render with label', () => {
    const { getByText } = render(<Input label="Username" placeholder="Enter username" />);
    expect(getByText('Username')).toBeTruthy();
  });

  it('should render error message', () => {
    const { getByText } = render(
      <Input placeholder="Email" error="Invalid email" />
    );
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('should be disabled when disabled prop is true', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Disabled" disabled onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('Disabled');
    expect(input.props.editable).toBe(false);
  });

  it('should handle secure text entry', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Password" secureTextEntry />
    );

    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('should apply custom styles', () => {
    const customStyle = { borderWidth: 2 };
    const { getByTestId } = render(
      <Input placeholder="Styled" style={customStyle} testID="input" />
    );
    expect(getByTestId('input')).toBeTruthy();
  });

  it('should handle testID', () => {
    const { getByTestId } = render(<Input placeholder="Test" testID="input" />);
    expect(getByTestId('input')).toBeTruthy();
  });

  it('should handle multiline', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Multiline" multiline numberOfLines={4} />
    );

    const input = getByPlaceholderText('Multiline');
    expect(input.props.multiline).toBe(true);
  });

  it('should handle keyboard type', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Email" keyboardType="email-address" />
    );

    const input = getByPlaceholderText('Email');
    expect(input.props.keyboardType).toBe('email-address');
  });
});
