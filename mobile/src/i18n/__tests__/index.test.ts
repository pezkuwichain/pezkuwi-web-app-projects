import i18n from '../index';

describe('i18n Configuration', () => {
  it('should be initialized', () => {
    expect(i18n).toBeDefined();
  });

  it('should have language property', () => {
    expect(i18n.language).toBeDefined();
  });

  it('should have translation function', () => {
    expect(i18n.t).toBeDefined();
    expect(typeof i18n.t).toBe('function');
  });

  it('should support changeLanguage', async () => {
    expect(i18n.changeLanguage).toBeDefined();
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });
});
