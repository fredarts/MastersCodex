'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, UserRoleMode } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  roleMode: UserRoleMode;
  setRoleMode: (role: UserRoleMode) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadDemoEverything: () => void;
  isLoading: boolean;
}

const DEMO_USER: UserProfile = {
  id: 'demo-dm-user-123',
  email: 'mestre@valiria.rpg',
  displayName: 'Frederico Monteiro (Game Dev)',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=MestreAris',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEMO_USER);
  const [roleMode, setRoleModeState] = useState<UserRoleMode>('dm');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('codex_user');
      const savedRole = localStorage.getItem('codex_role');

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(DEMO_USER);
      }

      if (savedRole === 'dm' || savedRole === 'player') {
        setRoleModeState(savedRole);
      }
    } catch (e) {
      console.error('Erro ao carregar usuário do localStorage:', e);
    } finally {
      setIsLoading(false);
    }

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.full_name || session.user.email || 'Mestre',
            avatarUrl: session.user.user_metadata?.avatar_url,
          });
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.full_name || session.user.email || 'Mestre',
            avatarUrl: session.user.user_metadata?.avatar_url,
          });
        } else {
          setUser(DEMO_USER);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const setRoleMode = (role: UserRoleMode) => {
    setRoleModeState(role);
    try {
      localStorage.setItem('codex_role', role);
    } catch (e) {}
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}` },
      });
      if (error) throw error;
    } else {
      setUser(DEMO_USER);
    }
  };

  const signInWithEmail = async (email: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    } else {
      setUser({
        id: `user-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
      });
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    try {
      localStorage.removeItem('codex_user');
    } catch (e) {}
  };

  const loadDemoEverything = () => {
    setUser(DEMO_USER);
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roleMode,
        setRoleMode,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        loadDemoEverything,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
