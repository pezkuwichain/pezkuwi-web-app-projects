import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '../../lib/supabase';

// Wrapper for provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide auth context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should sign in with email and password', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password123');
      expect(response.error).toBeNull();
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle sign in error', async () => {
    const mockError = new Error('Invalid credentials');
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'wrong-password');
      expect(response.error).toBeDefined();
    });
  });

  it('should sign up new user', async () => {
    const mockUser = { id: '456', email: 'new@example.com' };
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signUp(
        'new@example.com',
        'password123',
        'newuser'
      );
      expect(response.error).toBeNull();
    });

    expect(supabase.auth.signUp).toHaveBeenCalled();
  });

  it('should sign out user', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should check admin status', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const isAdmin = await result.current.checkAdminStatus();
      expect(typeof isAdmin).toBe('boolean');
    });
  });
});
