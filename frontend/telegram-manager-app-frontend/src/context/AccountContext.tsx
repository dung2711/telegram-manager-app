'use client';

// src/context/AccountContext.tsx

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as accountService from '@/services/accountService';
import type { Account, SelectedAccount } from '@/types';

interface AccountContextType {
  accounts: Account[];
  selectedAccount: SelectedAccount | null;
  isLoading: boolean;
  fetchAccounts: () => Promise<void>;
  selectAccount: (accountID: string, phoneNumber: string, isAuthenticated: boolean) => void;
  clearSelectedAccount: () => void;
  refreshAccounts: () => Promise<void>;
}

export const AccountContext = createContext<AccountContextType | undefined>(undefined);

interface AccountProviderProps {
  children: ReactNode;
}

const SELECTED_ACCOUNT_KEY = 'telegram-selected-account';

export function AccountProvider({ children }: AccountProviderProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SelectedAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load selected account từ localStorage khi mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SELECTED_ACCOUNT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSelectedAccount(parsed);
      }
    } catch (error) {
      console.error('Failed to load selected account:', error);
    }
  }, []);

  /**
   * Fetch accounts từ backend
   */
  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await accountService.getMyAccounts();
      setAccounts(data);

      // Kiểm tra xem selected account có còn tồn tại không
      if (selectedAccount) {
        const accountExists = data.some(acc => acc.accountID === selectedAccount.accountID);
        if (!accountExists) {
          // Account đã bị xóa → clear selection
          setSelectedAccount(null);
          localStorage.removeItem(SELECTED_ACCOUNT_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount]);

  /**
   * Select account và persist vào localStorage
   */
  const selectAccount = useCallback((accountID: string, phoneNumber: string, isAuthenticated: boolean) => {
    const selected: SelectedAccount = { accountID, phoneNumber, isAuthenticated };
    setSelectedAccount(selected);
    localStorage.setItem(SELECTED_ACCOUNT_KEY, JSON.stringify(selected));

    // Emit custom event để các components khác biết account đã đổi
    window.dispatchEvent(new CustomEvent('account-changed', { 
      detail: selected 
    }));
  }, []);

  /**
   * Clear selected account
   */
  const clearSelectedAccount = useCallback(() => {
    setSelectedAccount(null);
    localStorage.removeItem(SELECTED_ACCOUNT_KEY);

    // Emit event
    window.dispatchEvent(new CustomEvent('account-changed', { 
      detail: null 
    }));
  }, []);

  /**
   * Refresh accounts (alias cho fetchAccounts)
   */
  const refreshAccounts = useCallback(async () => {
    await fetchAccounts();
  }, [fetchAccounts]);

  const value: AccountContextType = {
    accounts,
    selectedAccount,
    isLoading,
    fetchAccounts,
    selectAccount,
    clearSelectedAccount,
    refreshAccounts,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}