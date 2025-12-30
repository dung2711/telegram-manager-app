// src/services/accountService.ts
import apiClient from '@/lib/axios';
import { ApiResponse, TelegramAccount } from '@/types';

export const accountService = {
  /**
   * Lấy danh sách tất cả Telegram accounts của user
   */
  getAll: async () => {
    return apiClient.get<ApiResponse<TelegramAccount[]>>('/auth/telegram/accounts');
  },

  /**
   * Lấy thông tin chi tiết một account
   */
  getById: async (accountID: string) => {
    return apiClient.get<ApiResponse<TelegramAccount>>(`/accounts/${accountID}`);
  },

  /**
   * Xóa một Telegram account
   */
  delete: async (accountID: string) => {
    return apiClient.delete<ApiResponse<void>>(`/accounts/${accountID}`);
  },

  /**
   * Check trạng thái authentication của account
   */
  checkAuthStatus: async (accountID: string) => {
    return apiClient.get<ApiResponse<{ isAuthenticated: boolean; phoneNumber: string }>>(
      `/accounts/${accountID}/status`
    );
  },
};