'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasOrdersPermission: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; hasPermission?: boolean }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOrdersPermission, setHasOrdersPermission] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        checkOrdersPermission(session.user.email);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        checkOrdersPermission(session.user.email);
      } else {
        setHasOrdersPermission(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOrdersPermission = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('orders_permission')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error checking orders permission:', error);
        setHasOrdersPermission(false);
        return;
      }

      setHasOrdersPermission(data?.orders_permission ?? false);
    } catch (error) {
      console.error('Error checking orders permission:', error);
      setHasOrdersPermission(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    // Check if user has orders_permission
    try {
      const { data, error: permError } = await supabase
        .from('users')
        .select('orders_permission')
        .eq('email', email)
        .single();

      if (permError || !data?.orders_permission) {
        // Sign out the user if they don't have permission
        await supabase.auth.signOut();
        return {
          error: new Error('You do not have permission to access this system. Please contact an administrator.'),
          hasPermission: false
        };
      }

      return { error: null, hasPermission: true };
    } catch (error) {
      console.error('Error checking orders permission:', error);
      await supabase.auth.signOut();
      return {
        error: new Error('Unable to verify permissions. Please try again.'),
        hasPermission: false
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthContext: Sign out error:', error);
      throw error;
    }
    setHasOrdersPermission(false);
    return { error: null };
  };

  const value = {
    user,
    session,
    loading,
    hasOrdersPermission,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
