// src/services/accountService.ts

import apiClient from '@/lib/axios';
import toast from 'react-hot-toast';
import type {
  TelegramLoginRequest,
  TelegramLoginResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  Verify2FARequest,
  Verify2FAResponse,
  GetAccountsResponse,
  Account,
} from '@/types';

/**
 * Bước 1: Đăng nhập Telegram bằng số điện thoại
 */
export const loginTelegram = async (phoneNumber: string): Promise<TelegramLoginResponse> => {
  try {
    // Validate phone format
    if (!phoneNumber.startsWith('+')) {
      throw new Error('Phone number must start with +');
    }

    const payload: TelegramLoginRequest = {
      phoneNumber: phoneNumber.trim(),
    };

    const response = await apiClient.post<TelegramLoginResponse>(
      '/auth/telegram/login',
      payload
    );

    if (response.data.success && response.data.data) {
      // Nếu account đã authenticated rồi
      if (response.data.data.message?.includes('already authenticated')) {
        toast.success('Account is already connected!');
      } else {
        toast.success('Verification code sent! Check your Telegram app');
      }
      return response.data;
    }

    throw new Error(response.data.error || 'Failed to send verification code');
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Failed to login';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Bước 2: Xác thực mã code từ Telegram
 */
export const verifyAuthCode = async (
  accountID: string,
  code: string
): Promise<VerifyCodeResponse> => {
  try {
    const payload: VerifyCodeRequest = {
      accountID,
      code: code.trim(),
    };

    const response = await apiClient.post<VerifyCodeResponse>(
      '/auth/telegram/verify-code',
      payload
    );

    if (response.data.success) {
      toast.success('Code verified successfully! ');
      return response.data;
    }

    throw new Error(response.data.error || 'Code verification failed');
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Invalid code';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Bước 3: Xác thực 2FA password (nếu có)
 */
export const verify2FA = async (
  accountID: string,
  password: string
): Promise<Verify2FAResponse> => {
  try {
    const payload: Verify2FARequest = {
      accountID,
      password,
    };

    const response = await apiClient.post<Verify2FAResponse>(
      '/auth/telegram/verify-password',
      payload
    );

    if (response.data.success) {
      toast.success('2FA verified! Account connected 🎉');
      return response.data;
    }

    throw new Error(response.data.error || '2FA verification failed');
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Invalid password';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Lấy danh sách Telegram accounts của user
 */
export const getMyAccounts = async (): Promise<Account[]> => {
  try {
    const response = await apiClient.get<GetAccountsResponse>('/auth/telegram/accounts');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to get accounts');
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Failed to get accounts';
    console.error('Get accounts error:', errorMsg);
    // Không toast error ở đây vì sẽ gọi khi mount component
    throw new Error(errorMsg);
  }
};

/**
 * Delete Telegram account 
 */
export const deleteAccount = async (accountID: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/auth/telegram/accounts/${accountID}`);

    if (response.data.success) {
      toast.success('Account deleted successfully');
      return;
    }

    throw new Error(response.data.error || 'Failed to delete account');
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Failed to delete account';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};