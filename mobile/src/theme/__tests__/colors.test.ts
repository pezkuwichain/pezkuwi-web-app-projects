import { AppColors } from '../colors';

describe('AppColors', () => {
  it('should be defined and have color properties', () => {
    expect(AppColors).toBeDefined();
    expect(typeof AppColors).toBe('object');
    expect(Object.keys(AppColors).length).toBeGreaterThan(0);
  });

  it('should export colors from shared theme', () => {
    // AppColors is re-exported from shared/theme/colors
    expect(AppColors).toBeTruthy();
  });
});
