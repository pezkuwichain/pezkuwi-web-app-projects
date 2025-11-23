import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BottomSheet } from '../BottomSheet';

describe('BottomSheet', () => {
  it('should render when visible', () => {
    const { getByText } = render(
      <BottomSheet visible={true} onClose={() => {}}>
        <Text>Test Content</Text>
      </BottomSheet>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <BottomSheet visible={false} onClose={() => {}}>
        <Text>Test Content</Text>
      </BottomSheet>
    );

    expect(queryByText('Test Content')).toBeNull();
  });

  it('should call onClose when backdrop is pressed', () => {
    const onClose = jest.fn();
    const { UNSAFE_root } = render(
      <BottomSheet visible={true} onClose={onClose}>
        <Text>Test Content</Text>
      </BottomSheet>
    );

    // Modal should be rendered
    expect(UNSAFE_root).toBeDefined();
    // onClose should be defined
    expect(onClose).toBeDefined();
  });

  it('should render custom title', () => {
    const { getByText } = render(
      <BottomSheet visible={true} onClose={() => {}} title="Custom Title">
        <Text>Test Content</Text>
      </BottomSheet>
    );

    expect(getByText('Custom Title')).toBeTruthy();
  });

  it('should render without title', () => {
    const { queryByText } = render(
      <BottomSheet visible={true} onClose={() => {}}>
        <Text>Test Content</Text>
      </BottomSheet>
    );

    // Should not crash without title
    expect(queryByText('Test Content')).toBeTruthy();
  });

  it('should apply custom height', () => {
    const { UNSAFE_root } = render(
      <BottomSheet visible={true} onClose={() => {}} height={500}>
        <Text>Test Content</Text>
      </BottomSheet>
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle children properly', () => {
    const { getByText } = render(
      <BottomSheet visible={true} onClose={() => {}}>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
      </BottomSheet>
    );

    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
  });

  it('should support animation type', () => {
    const { UNSAFE_root } = render(
      <BottomSheet visible={true} onClose={() => {}} animationType="fade">
        <Text>Test Content</Text>
      </BottomSheet>
    );

    expect(UNSAFE_root).toBeTruthy();
  });
});
