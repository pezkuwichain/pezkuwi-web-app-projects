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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<{ error: Error | null }>;
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

  const signOut = useCallback(async () => {
    setIsAdmin(false);
    setUser(null);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    await supabase.auth.signOut();
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
      if (import.meta.env.DEV) console.log('⏱️ Session timeout - logging out due to inactivity');
      await signOut();
    }
  }, [user, updateLastActivity, signOut]);

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
      checkAdminStatus(); // Check admin status regardless of Supabase session
      setLoading(false);
    }).catch(() => {
      // If Supabase is not available, still check wallet-based admin
      checkAdminStatus();
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAdminStatus(); // Check admin status on auth change
      setLoading(false);
    });

    // Listen for wallet changes (from PolkadotContext)
    const handleWalletChange = () => {
      checkAdminStatus();
    };
    window.addEventListener('walletChanged', handleWalletChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('walletChanged', handleWalletChange);
    };
  }, [checkAdminStatus]);

  const checkAdminStatus = useCallback(async () => {
    // Admin wallet whitelist (blockchain-based auth)
    const ADMIN_WALLETS = [
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Founder (original)
      '5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3', // Founder delegate (initial KYC member)
      '5GgTgG9sRmPQAYU1RsTejZYnZRjwzKZKWD3awtuqjHioki45', // Founder (current dev wallet)
    ];

    try {
      // PRIMARY: Check wallet-based admin (blockchain auth)
      const connectedWallet = localStorage.getItem('selectedWallet');
      if (import.meta.env.DEV) console.log('🔍 Admin check - Connected wallet:', connectedWallet);
      if (import.meta.env.DEV) console.log('🔍 Admin check - Whitelist:', ADMIN_WALLETS);

      if (connectedWallet && ADMIN_WALLETS.includes(connectedWallet)) {
        if (import.meta.env.DEV) console.log('✅ Admin access granted (wallet-based)');
        setIsAdmin(true);
        return true;
      }

      // SECONDARY: Check Supabase admin_roles (if wallet not in whitelist)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data && ['admin', 'super_admin'].includes(data.role)) {
          if (import.meta.env.DEV) console.log('✅ Admin access granted (Supabase-based)');
          setIsAdmin(true);
          return true;
        }
      }

      if (import.meta.env.DEV) console.log('❌ Admin access denied');
      setIsAdmin(false);
      return false;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Admin check error:', err);
      setIsAdmin(false);
      return false;
    }
  }, []);

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
    } catch {
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
        
        // If there&apos;s a referral code, track it
        if (referralCode) {
          // You can add logic here to reward the referrer
          // For example, update their referral count or add rewards
          if (import.meta.env.DEV) console.log(`User registered with referral code: ${referralCode}`);
        }
      }

      return { error };
    } catch {
      return { 
        error: { 
          message: 'Registration service unavailable. Please try again later.' 
        } 
      };
    }
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