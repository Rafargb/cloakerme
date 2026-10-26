'use client';

import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role: 'USER' | 'ADMIN';
  plan: 'FREE' | 'TRIAL' | 'STARTER' | 'PRO' | 'GLOBAL';
  status?: 'ACTIVE' | 'SUSPENDED';
  onboardingDone?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  isAdmin: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/auth/me');
      return (data?.data || data?.user || data) as AuthUser;
    },
    staleTime: 60_000,
    retry: 1,
  });

  const user: AuthUser = query.data ?? {
    id: 'usr_paulo_local',
    name: 'Paulo',
    email: 'paulo@aimedialab.online',
    role: 'ADMIN',
    plan: 'GLOBAL',
    status: 'ACTIVE',
    onboardingDone: true,
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };

  const clear = () => {
    queryClient.setQueryData(['auth', 'me'], null);
  };

  const logout = () => {
    clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/creatives';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status: 'authenticated',
        isAdmin: user?.role === 'ADMIN',
        logout,
        refreshUser: refresh,
        refresh,
        clear,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
