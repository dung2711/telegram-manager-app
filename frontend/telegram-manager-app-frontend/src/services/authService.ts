// src/services/authService.ts
import apiClient from '@/lib/axios';
import { ApiResponse, LoginResponse, User } from '@/types';

// Dữ liệu đầu vào cho Login
interface LoginCredentials {
  username: string;
  password?: string; // Hệ thống
  phoneNumber?: string; // Telegram
  accountID?: string; // Telegram
  code?: string; // Telegram
}

export const authService = {
  // --- SYSTEM AUTH ---
  login: async (credentials: Pick<LoginCredentials, 'username' | 'password'>) => {
    return apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
  },

  register: async (data: any) => {
    return apiClient.post<ApiResponse<LoginResponse>>('/auth/register', data);
  },

  logout: async (refreshToken: string) => {
    return apiClient.post('/auth/logout', { refreshToken });
  },

  getMe: async () => {
    return apiClient.get<ApiResponse<User>>('/auth/me');
  },

  // --- TELEGRAM AUTH FLOW ---
  // Bước 1: Nhập SĐT
  telegramLogin: async (phoneNumber: string) => {
    return apiClient.post<ApiResponse<{ accountID: string; isNewAccount: boolean; message: string }>>(
      '/auth/telegram/login', 
      { phoneNumber }
    );
  },

  // Bước 2: Nhập Code
  verifyCode: async (accountID: string, code: string) => {
    return apiClient.post<ApiResponse<any>>('/auth/telegram/verify-code', { accountID, code });
  },

  // Bước 3: Nhập Password (2FA)
  verifyPassword: async (accountID: string, password: string) => {
    return apiClient.post<ApiResponse<any>>('/auth/telegram/verify-password', { accountID, password });
  },
  
  // Lấy danh sách tài khoản Telegram
  getMyAccounts: async () => {
    return apiClient.get<ApiResponse<any[]>>('/auth/telegram/accounts');
  }
};