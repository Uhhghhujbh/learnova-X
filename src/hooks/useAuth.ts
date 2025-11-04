import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import type { AuthError } from '@supabase/supabase-js';
import { handleSupabaseError } from '../utils/errorHandler';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return;
    }
    
    if (data) {
      setUser(data);
      setIsAdmin(data.role === 'admin');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

import { handleSupabaseError } from '../utils/errorHandler';

const signUp = async (email: string, password: string, username: string, displayName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: { 
        username, 
        display_name: displayName 
      },
      emailRedirectTo: `${window.location.origin}`
    }
  });
  
  if (error) {
    console.error('SignUp Error:', error);
    return { error: { message: handleSupabaseError(error, 'SignUp') } };
  }
  
  return { error: null };
};

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
