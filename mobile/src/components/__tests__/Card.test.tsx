import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

describe('Card', () => {
  it('should render children', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const customStyle = { padding: 20 };
    const { getByTestId } = render(
      <Card style={customStyle} testID="card">
        <Text>Styled Card</Text>
      </Card>
    );
    expect(getByTestId('card')).toBeTruthy();
  });

  it('should render with title', () => {
    const { getByText } = render(
      <Card title="Card Title">
        <Text>Content</Text>
      </Card>
    );
    expect(getByText('Card Title')).toBeTruthy();
  });

  it('should render multiple children', () => {
    const { getByText } = render(
      <Card>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
      </Card>
    );
    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
  });

  it('should handle testID', () => {
    const { getByTestId } = render(
      <Card testID="card">
        <Text>Content</Text>
      </Card>
    );
    expect(getByTestId('card')).toBeTruthy();
  });

  it('should render without title', () => {
    const { getByText } = render(
      <Card>
        <Text>No Title</Text>
      </Card>
    );
    expect(getByText('No Title')).toBeTruthy();
  });

  it('should support elevation', () => {
    const { getByTestId } = render(
      <Card elevation={4} testID="card">
        <Text>Elevated</Text>
      </Card>
    );
    expect(getByTestId('card')).toBeTruthy();
  });
});
