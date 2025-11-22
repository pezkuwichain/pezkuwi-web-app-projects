import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';

// Session timeout configuration
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute
const LAST_ACTIVITY_KEY = '@pezkuwi_last_activity';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
  updateActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Update last activity timestamp
  const updateActivity = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      if (__DEV__) console.error('Failed to update activity:', error);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsAdmin(false);
    setUser(null);
    await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
    await supabase.auth.signOut();
  }, []);

  // Check if session has timed out
  const checkSessionTimeout = useCallback(async () => {
    if (!user) return;

    try {
      const lastActivity = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivity) {
        await updateActivity();
        return;
      }

      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();
      const inactiveTime = now - lastActivityTime;

      if (inactiveTime >= SESSION_TIMEOUT_MS) {
        if (__DEV__) console.log('⏱️ Session timeout - logging out due to inactivity');
        await signOut();
      }
    } catch (error) {
      if (__DEV__) console.error('Error checking session timeout:', error);
    }
  }, [user, updateActivity, signOut]);

  // Setup activity monitoring
  useEffect(() => {
    if (!user) return;

    // Initial activity timestamp
    updateActivity();

    // Check for timeout periodically
    const timeoutChecker = setInterval(checkSessionTimeout, ACTIVITY_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(timeoutChecker);
    };
  }, [user, updateActivity, checkSessionTimeout]);

  // Check admin status
  const checkAdminStatus = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) {
        if (__DEV__) console.error('Error checking admin status:', error);
        return false;
      }

      const adminStatus = data?.is_admin || false;
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      if (__DEV__) console.error('Error in checkAdminStatus:', error);
      return false;
    }
  }, [user]);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        await updateActivity();
        await checkAdminStatus();
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    username: string,
    referralCode?: string
  ): Promise<{ error: Error | null }> => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            referral_code: referralCode,
          },
        },
      });

      if (authError) {
        return { error: authError };
      }

      // Create profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username,
            email,
            referral_code: referralCode,
          });

        if (profileError) {
          if (__DEV__) console.error('Profile creation error:', profileError);
          // Don't fail signup if profile creation fails
        }

        setUser(authData.user);
        await updateActivity();
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await checkAdminStatus();
          await updateActivity();
        }
      } catch (error) {
        if (__DEV__) console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          await checkAdminStatus();
          await updateActivity();
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminStatus, updateActivity]);

  const value = {
    user,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    checkAdminStatus,
    updateActivity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
