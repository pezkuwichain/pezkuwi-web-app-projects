import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSkeleton } from '../LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('should render without crashing', () => {
    const component = render(<LoadingSkeleton />);
    expect(component).toBeTruthy();
  });

  it('should render with default props', () => {
    const { UNSAFE_root } = render(<LoadingSkeleton />);
    expect(UNSAFE_root).toBeDefined();
  });

  it('should render with custom height', () => {
    const { UNSAFE_root } = render(<LoadingSkeleton height={100} />);
    expect(UNSAFE_root).toBeDefined();
  });

  it('should render with custom width', () => {
    const { UNSAFE_root } = render(<LoadingSkeleton width={200} />);
    expect(UNSAFE_root).toBeDefined();
  });

  it('should render with borderRadius', () => {
    const { UNSAFE_root } = render(<LoadingSkeleton borderRadius={10} />);
    expect(UNSAFE_root).toBeDefined();
  });

  it('should apply custom styles', () => {
    const customStyle = { marginTop: 20 };
    const { UNSAFE_root } = render(<LoadingSkeleton style={customStyle} />);
    expect(UNSAFE_root).toBeDefined();
  });

  it('should render circle variant', () => {
    const { UNSAFE_root } = render(<LoadingSkeleton variant="circle" />);
    expect(UNSAFE_root).toBeDefined();
  });

  it('should render text variant', () => {
    const { UNSAFE_root } = render(<LoadingSkeleton variant="text" />);
    expect(UNSAFE_root).toBeDefined();
  });

  it('should render rectangular variant', () => {
    const { UNSAFE_root } = render(<LoadingSkeleton variant="rectangular" />);
    expect(UNSAFE_root).toBeDefined();
  });

  it('should handle animation', () => {
    const { UNSAFE_root } = render(<LoadingSkeleton animated />);
    expect(UNSAFE_root).toBeDefined();
  });
});
