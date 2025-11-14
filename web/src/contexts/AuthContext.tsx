import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

// Demo/Founder account credentials from environment variables
// ⚠️ SECURITY: Never hardcode credentials in source code!
const FOUNDER_ACCOUNT = {
  email: import.meta.env.VITE_DEMO_FOUNDER_EMAIL || '',
  password: import.meta.env.VITE_DEMO_FOUNDER_PASSWORD || '',
  id: import.meta.env.VITE_DEMO_FOUNDER_ID || 'founder-001',
  user_metadata: {
    full_name: 'Satoshi Qazi Muhammed',
    phone: '+9647700557978',
    recovery_email: 'satoshi@pezkuwichain.io',
    founder: true
  }
};

// Check if demo mode is enabled
const DEMO_MODE_ENABLED = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

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
    // Check if demo mode is enabled and this is the founder account
    if (DEMO_MODE_ENABLED && email === FOUNDER_ACCOUNT.email && password === FOUNDER_ACCOUNT.password) {
      // Try Supabase first
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (!error && data.user) {
          await checkAdminStatus();
          return { error: null };
        }
      } catch {
        // Supabase not available
      }

      // Fallback to demo mode for founder account
      const demoUser = {
        id: FOUNDER_ACCOUNT.id,
        email: FOUNDER_ACCOUNT.email,
        user_metadata: FOUNDER_ACCOUNT.user_metadata,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      } as User;
      
      setUser(demoUser);
      setIsAdmin(true);
      
      // Store in localStorage for persistence
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      
      return { error: null };
    }

    // For other accounts, use Supabase
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
    localStorage.removeItem('demo_user');
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  // Check for demo user on mount
  useEffect(() => {
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser && !user) {
      const parsedUser = JSON.parse(demoUser);
      setUser(parsedUser);
      setIsAdmin(true);
    }
  }, []);

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