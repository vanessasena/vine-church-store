'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasOrdersPermission: boolean;
  permissionLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; hasPermission?: boolean }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOrdersPermission, setHasOrdersPermission] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);

  useEffect(() => {
    // Initialize session and permission in sequence
    let isMounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token && session?.user?.email) {
        setPermissionLoading(true);
        await checkOrdersPermissionAPI(session.access_token);
        setPermissionLoading(false);
      } else {
        setHasOrdersPermission(false);
      }
      setLoading(false);
    };
    init();

    // Listen for auth changes and re-check permission
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token && session?.user?.email) {
        setPermissionLoading(true);
        await checkOrdersPermissionAPI(session.access_token);
        setPermissionLoading(false);
      } else {
        setHasOrdersPermission(false);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Prefer server-side verification to bypass RLS issues
  const checkOrdersPermissionAPI = async (accessToken: string) => {
    try {
      const res = await fetch('/api/verify-permission', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        setHasOrdersPermission(false);
        return;
      }
      const json = await res.json();
      setHasOrdersPermission(Boolean(json?.hasPermission));
    } catch (error) {
      console.error('Error checking orders permission (API):', error);
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

    // Verify permission via API using current access token
    try {
      const { data: { session: current } } = await supabase.auth.getSession();
      const token = current?.access_token;
      if (!token) {
        await supabase.auth.signOut();
        return {
          error: new Error('Unable to verify permissions. Please try again.'),
          hasPermission: false,
        };
      }

      const res = await fetch('/api/verify-permission', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        await supabase.auth.signOut();
        return {
          error: new Error('You do not have permission to access this system. Please contact an administrator.'),
          hasPermission: false,
        };
      }
      const json = await res.json();
      const permitted = Boolean(json?.hasPermission);
      if (!permitted) {
        await supabase.auth.signOut();
        return {
          error: new Error('You do not have permission to access this system. Please contact an administrator.'),
          hasPermission: false,
        };
      }
      setHasOrdersPermission(true);
      return { error: null, hasPermission: true };
    } catch (error) {
      console.error('Error verifying orders permission via API:', error);
      await supabase.auth.signOut();
      return {
        error: new Error('Unable to verify permissions. Please try again.'),
        hasPermission: false,
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
    permissionLoading,
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
