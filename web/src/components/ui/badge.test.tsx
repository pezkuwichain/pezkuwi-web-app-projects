import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './badge';

describe('Badge Component', () => {
  it('should render the badge with the correct text', () => {
    const testMessage = 'Hello, World!';
    render(<Badge>{testMessage}</Badge>);

    const badgeElement = screen.getByText(testMessage);
    expect(badgeElement).toBeInTheDocument();
  });
});
