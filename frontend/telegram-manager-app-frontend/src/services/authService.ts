// src/services/authService.ts

import apiClient from '@/lib/axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserResponse,
  ApiResponse,
} from '@/types';

/**
 * Đăng ký user mới
 */
export const register = async (
  username: string,
  fullname: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const payload: RegisterRequest = {
      username: username.toLowerCase().trim(),
      fullname: fullname.trim(),
      password,
    };

    const response = await apiClient.post<AuthResponse>('/auth/register', payload);

    if (response.data.success && response.data.data) {
      // Lưu tokens vào cookies
      Cookies.set('accessToken', response.data.data.accessToken, { expires: 1 });
      Cookies.set('refreshToken', response.data.data.refreshToken, { expires: 7 });
      
      toast.success('Registration successful! Welcome aboard 🎉');
      return response.data;
    }

    throw new Error(response.data.error || 'Registration failed');
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Registration failed';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Đăng nhập user
 */
export const login = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const payload: LoginRequest = {
      username: username.toLowerCase().trim(),
      password,
    };

    const response = await apiClient.post<AuthResponse>('/auth/login', payload);

    if (response.data.success && response.data.data) {
      // Lưu tokens vào cookies
      Cookies.set('accessToken', response.data.data.accessToken, { expires: 1 });
      Cookies.set('refreshToken', response.data.data.refreshToken, { expires: 7 });
      
      toast.success(`Welcome back, ${response.data.data.user.fullname}! 👋`);
      return response.data;
    }

    throw new Error(response.data.error || 'Login failed');
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Login failed';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Đăng xuất user
 */
export const logout = async (): Promise<void> => {
  try {
    const refreshToken = Cookies.get('refreshToken');
    
    if (refreshToken) {
      // Call backend logout (best effort - không block nếu fail)
      await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
    }

    // Clear tokens
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    
    // Clear selected account
    localStorage.removeItem('telegram-selected-account');
    
    toast.success('Logged out successfully');
  } catch (error: any) {
    // Vẫn clear tokens dù API fail
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.removeItem('telegram-selected-account');
    
    console.error('Logout error:', error);
    toast.error('Logged out (with errors)');
  }
};

/**
 * Lấy thông tin user hiện tại
 */
export const getCurrentUser = async (): Promise<UserResponse> => {
  try {
    const response = await apiClient.get<UserResponse>('/auth/me');

    if (response.data.success && response.data.data) {
      return response.data;
    }

    throw new Error(response.data.error || 'Failed to get user info');
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Failed to get user info';
    console.error('Get current user error:', errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Kiểm tra xem user có đang authenticated không
 */
export const isAuthenticated = (): boolean => {
  const accessToken = Cookies.get('accessToken');
  const refreshToken = Cookies.get('refreshToken');
  return !!(accessToken || refreshToken);
};