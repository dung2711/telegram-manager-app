'use client';

// src/context/AuthContext.tsx

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as authService from '@/services/authService';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, fullname: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserInfo: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  /**
   * Fetch user info khi mount (nếu có token)
   */
  const fetchUserInfo = useCallback(async () => {
    try {
      if (!authService.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh user info (gọi từ bên ngoài nếu cần)
   */
  const refreshUserInfo = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error);
    }
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        router.push('/dashboard');
      }
    } catch (error) {
      // Error đã được handle trong service (toast)
      throw error;
    }
  }, [router]);

  /**
   * Register handler
   */
  const register = useCallback(async (
    username: string,
    fullname: string,
    password: string
  ) => {
    try {
      const response = await authService.register(username, fullname, password);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        router.push('/dashboard');
      }
    } catch (error) {
      // Error đã được handle trong service (toast)
      throw error;
    }
  }, [router]);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      // Vẫn clear state dù có lỗi
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  // Auto-fetch user info khi mount
  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUserInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}