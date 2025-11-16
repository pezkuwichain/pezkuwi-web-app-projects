import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Session timeout configuration
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute
const LAST_ACTIVITY_KEY = 'last_activity_timestamp';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
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

  // ========================================
  // SESSION TIMEOUT MANAGEMENT
  // ========================================

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }, []);

  // Check if session has timed out
  const checkSessionTimeout = useCallback(async () => {
    if (!user) return;

    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivity) {
      updateLastActivity();
      return;
    }

    const lastActivityTime = parseInt(lastActivity, 10);
    const now = Date.now();
    const inactiveTime = now - lastActivityTime;

    if (inactiveTime >= SESSION_TIMEOUT_MS) {
      console.log('⏱️ Session timeout - logging out due to inactivity');
      await signOut();
    }
  }, [user]);

  // Setup activity listeners
  useEffect(() => {
    if (!user) return;

    // Update activity on user interactions
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => {
      updateLastActivity();
    };

    // Register event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Initial activity timestamp
    updateLastActivity();

    // Check for timeout periodically
    const timeoutChecker = setInterval(checkSessionTimeout, ACTIVITY_CHECK_INTERVAL_MS);

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(timeoutChecker);
    };
  }, [user, updateLastActivity, checkSessionTimeout]);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus();
      }
      setLoading(false);
    }).catch(() => {
      // If Supabase is not available, continue without auth
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const adminStatus = !error && data && ['admin', 'super_admin'].includes(data.role);
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch {
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.user) {
        await checkAdminStatus();
      }
      
      return { error };
    } catch (err) {
      return { 
        error: { 
          message: 'Authentication service unavailable. Please try again later.' 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, username: string, referralCode?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            referral_code: referralCode || null,
          },
        },
      });

      if (!error && data.user) {
        // Create profile in profiles table with referral code
        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          email,
          referred_by: referralCode || null,
        });
        
        // If there's a referral code, track it
        if (referralCode) {
          // You can add logic here to reward the referrer
          // For example, update their referral count or add rewards
          console.log(`User registered with referral code: ${referralCode}`);
        }
      }

      return { error };
    } catch (err) {
      return { 
        error: { 
          message: 'Registration service unavailable. Please try again later.' 
        } 
      };
    }
  };

  const signOut = async () => {
    setIsAdmin(false);
    setUser(null);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin,
      signIn, 
      signUp, 
      signOut,
      checkAdminStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};