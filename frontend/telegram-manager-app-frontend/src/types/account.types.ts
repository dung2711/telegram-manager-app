// src/types/account.types.ts

/**
 * Telegram Account - Tài khoản Telegram được quản lý
 */
export interface TelegramAccount {
  _id: string;
  owner: string; // System user ID
  accountID: string; // UUID
  phoneNumber: string;
  isAuthenticated: boolean;
  lastActive?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Telegram Auth Flow Response
 */
export interface TelegramLoginResponse {
  accountID: string;
  isNewAccount: boolean;
  message: string;
}

export interface TelegramAuthState {
  step: 'phone' | 'code' | 'password' | 'completed';
  accountID?: string;
  phoneNumber?: string;
  error?: string;
}

/**
 * Account Selector Item
 */
export interface AccountOption {
  value: string; // accountID
  label: string; // phoneNumber
  isAuthenticated: boolean;
}