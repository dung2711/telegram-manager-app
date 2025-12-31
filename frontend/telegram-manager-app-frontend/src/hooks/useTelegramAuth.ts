// src/hooks/useTelegramAuth.ts

import { useState, useCallback } from 'react';
import * as accountService from '@/services/accountService';
import { TelegramAuthStep } from '@/types';

interface UseTelegramAuthReturn {
  // State
  step: TelegramAuthStep;
  accountID: string | null;
  phoneNumber: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  startLogin: (phone: string) => Promise<void>;
  submitCode: (code: string) => Promise<void>;
  submit2FA: (password: string) => Promise<void>;
  reset: () => void;
  setStep: (step: TelegramAuthStep) => void;
}

/**
 * Custom hook cho Telegram authentication flow
 * Quản lý 3-step wizard: Phone → Code → 2FA (optional)
 */
export function useTelegramAuth(): UseTelegramAuthReturn {
  const [step, setStep] = useState<TelegramAuthStep>(TelegramAuthStep.PHONE);
  const [accountID, setAccountID] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Step 1: Start login với phone number
   */
  const startLogin = useCallback(async (phone: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setPhoneNumber(phone);

      const response = await accountService.loginTelegram(phone);

      if (response.success && response.data) {
        setAccountID(response.data.accountID);

        // Nếu account đã authenticated rồi → skip to success
        if (response.data.message?.includes('already authenticated')) {
          setStep(TelegramAuthStep.SUCCESS);
        } else {
          // Chuyển sang bước nhập code
          setStep(TelegramAuthStep.CODE);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Step 2: Verify authentication code
   */
  const submitCode = useCallback(async (code: string) => {
    try {
      if (!accountID) {
        throw new Error('No account ID found');
      }

      setIsLoading(true);
      setError(null);

      const response = await accountService.verifyAuthCode(accountID, code);

      if (response.success) {
        // Code verified successfully → Chuyển sang success
        setStep(TelegramAuthStep.SUCCESS);
      }
    } catch (err: any) {
      // Nếu cần 2FA password
      if (err.message?.toLowerCase().includes('password') || 
          err.message?.toLowerCase().includes('2fa')) {
        setStep(TelegramAuthStep.PASSWORD);
        setError(null); // Clear error vì đây không phải lỗi, chỉ cần 2FA
      } else {
        setError(err.message || 'Invalid verification code');
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  }, [accountID]);

  /**
   * Step 3: Verify 2FA password (optional)
   */
  const submit2FA = useCallback(async (password: string) => {
    try {
      if (!accountID) {
        throw new Error('No account ID found');
      }

      setIsLoading(true);
      setError(null);

      const response = await accountService.verify2FA(accountID, password);

      if (response.success) {
        setStep(TelegramAuthStep.SUCCESS);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accountID]);

  /**
   * Reset về trạng thái ban đầu
   */
  const reset = useCallback(() => {
    setStep(TelegramAuthStep.PHONE);
    setAccountID(null);
    setPhoneNumber('');
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    step,
    accountID,
    phoneNumber,
    isLoading,
    error,
    startLogin,
    submitCode,
    submit2FA,
    reset,
    setStep,
  };
}