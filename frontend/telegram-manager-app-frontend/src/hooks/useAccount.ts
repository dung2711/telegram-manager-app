// src/hooks/useAccount.ts

import { useContext } from 'react';
import { AccountContext } from '@/context/AccountContext';

/**
 * Custom hook để sử dụng AccountContext
 * Throw error nếu dùng ngoài AccountProvider
 */
export function useAccount() {
  const context = useContext(AccountContext);

  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }

  return context;
}