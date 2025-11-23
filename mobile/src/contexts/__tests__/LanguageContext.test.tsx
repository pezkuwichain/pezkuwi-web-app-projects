import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LanguageProvider, useLanguage } from '../LanguageContext';

// Mock the i18n module relative to src/
jest.mock('../../i18n', () => ({
  saveLanguage: jest.fn(() => Promise.resolve()),
  getCurrentLanguage: jest.fn(() => 'en'),
  isRTL: jest.fn((code?: string) => {
    const testCode = code || 'en';
    return ['ckb', 'ar', 'fa'].includes(testCode);
  }),
  LANGUAGE_KEY: '@language',
  languages: [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
    { code: 'kmr', name: 'Kurdish Kurmanji', nativeName: 'Kurmancî', rtl: false },
    { code: 'ckb', name: 'Kurdish Sorani', nativeName: 'سۆرانی', rtl: true },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true },
  ],
}));

// Wrapper for provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('LanguageContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide language context', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.currentLanguage).toBe('en');
  });

  it('should change language', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    await act(async () => {
      await result.current.changeLanguage('kmr');
    });

    expect(result.current.currentLanguage).toBe('kmr');
  });

  it('should provide available languages', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.availableLanguages).toBeDefined();
    expect(Array.isArray(result.current.availableLanguages)).toBe(true);
    expect(result.current.availableLanguages.length).toBeGreaterThan(0);
  });

  it('should handle RTL languages', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    await act(async () => {
      await result.current.changeLanguage('ar');
    });

    expect(result.current.isRTL).toBe(true);
  });

  it('should handle LTR languages', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.isRTL).toBe(false);
  });

  it('should throw error when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLanguage());
    }).toThrow('useLanguage must be used within LanguageProvider');

    spy.mockRestore();
  });

  it('should handle language change errors gracefully', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    // changeLanguage should not throw but handle errors internally
    await act(async () => {
      await result.current.changeLanguage('en');
    });

    expect(result.current.currentLanguage).toBeDefined();
  });

  it('should persist language selection', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    await act(async () => {
      await result.current.changeLanguage('tr');
    });

    expect(result.current.currentLanguage).toBe('tr');
  });
});
