// src/types/telegram.types.ts

/**
 * Telegram authentication steps
 */
export enum TelegramAuthStep {
  PHONE = 'PHONE',
  CODE = 'CODE',
  PASSWORD = 'PASSWORD', // 2FA
  SUCCESS = 'SUCCESS',
}

/**
 * Login Telegram request payload
 */
export interface TelegramLoginRequest {
  phoneNumber: string;
}

/**
 * Login Telegram response
 */
export interface TelegramLoginResponse {
  success: boolean;
  data?: {
    accountID: string;
    isNewAccount: boolean;
    message?: string;
  };
  error?: string;
}

/**
 * Verify auth code request payload
 */
export interface VerifyCodeRequest {
  accountID: string;
  code: string;
}

/**
 * Verify auth code response
 */
export interface VerifyCodeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Verify 2FA password request payload
 */
export interface Verify2FARequest {
  accountID: string;
  password: string;
}

/**
 * Verify 2FA password response
 */
export interface Verify2FAResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Telegram auth state trong hook
 */
export interface TelegramAuthState {
  step: TelegramAuthStep;
  accountID: string | null;
  phoneNumber: string;
  isLoading: boolean;
  error: string | null;
}