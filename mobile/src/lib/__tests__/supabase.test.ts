import { supabase } from '../supabase';

describe('Supabase Client', () => {
  it('should be defined', () => {
    expect(supabase).toBeDefined();
  });

  it('should have auth methods', () => {
    expect(supabase.auth).toBeDefined();
    expect(supabase.auth.signInWithPassword).toBeDefined();
    expect(supabase.auth.signUp).toBeDefined();
    expect(supabase.auth.signOut).toBeDefined();
  });

  it('should have database query methods', () => {
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });
});
