// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { User, LoginResponse } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hàm login: Lưu token và set user state
  const login = (data: LoginResponse) => {
    Cookies.set('accessToken', data.accessToken, { expires: 1 }); // 1 ngày
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 }); // 7 ngày
    setUser(data.user);
    router.push('/dashboard'); // Chuyển hướng sau khi login
  };

  // Hàm logout
  const logout = async () => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      setUser(null);
      router.push('/login');
    }
  };

  // Hàm check auth khi F5 trang
  const checkAuth = async () => {
    const token = Cookies.get('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      // Nếu token lỗi -> logout luôn
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Chạy checkAuth 1 lần khi mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook để dùng nhanh ở các component khác
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};