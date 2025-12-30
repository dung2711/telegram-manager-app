// src/context/AccountContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TelegramAccount } from '@/types';
import { authService } from '@/services/authService';
import { useAuth } from './AuthContext';

interface AccountContextType {
  accounts: TelegramAccount[];
  selectedAccount: TelegramAccount | null;
  isLoading: boolean;
  selectAccount: (accountID: string) => void;
  refreshAccounts: () => Promise<void>;
  addAccount: (account: TelegramAccount) => void;
  removeAccount: (accountID: string) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TelegramAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load accounts khi user đăng nhập
  const loadAccounts = async () => {
    if (!user) {
      setAccounts([]);
      setSelectedAccount(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.getMyAccounts();
      
      if (response.data.success) {
        const loadedAccounts = response.data.data;
        setAccounts(loadedAccounts);
        
        // Auto-select account đầu tiên nếu chưa có account nào được chọn
        if (loadedAccounts.length > 0 && !selectedAccount) {
          // Ưu tiên account đã authenticated
          const authenticatedAccount = loadedAccounts.find(acc => acc.isAuthenticated);
          setSelectedAccount(authenticatedAccount || loadedAccounts[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chọn account
  const selectAccount = (accountID: string) => {
    const account = accounts.find(acc => acc.accountID === accountID);
    if (account) {
      setSelectedAccount(account);
      // Lưu vào localStorage để persistent
      localStorage.setItem('selectedAccountID', accountID);
    }
  };

  // Refresh accounts list
  const refreshAccounts = async () => {
    await loadAccounts();
  };

  // Thêm account mới vào list (sau khi add thành công)
  const addAccount = (account: TelegramAccount) => {
    setAccounts(prev => [...prev, account]);
    // Auto-select account mới thêm
    setSelectedAccount(account);
    localStorage.setItem('selectedAccountID', account.accountID);
  };

  // Xóa account khỏi list
  const removeAccount = (accountID: string) => {
    setAccounts(prev => prev.filter(acc => acc.accountID !== accountID));
    
    // Nếu account đang được chọn bị xóa, chọn account khác
    if (selectedAccount?.accountID === accountID) {
      const remainingAccounts = accounts.filter(acc => acc.accountID !== accountID);
      setSelectedAccount(remainingAccounts[0] || null);
      
      if (remainingAccounts[0]) {
        localStorage.setItem('selectedAccountID', remainingAccounts[0].accountID);
      } else {
        localStorage.removeItem('selectedAccountID');
      }
    }
  };

  // Load accounts khi component mount hoặc user thay đổi
  useEffect(() => {
    loadAccounts();
  }, [user]);

  // Restore selected account từ localStorage
  useEffect(() => {
    if (accounts.length > 0) {
      const savedAccountID = localStorage.getItem('selectedAccountID');
      if (savedAccountID) {
        const account = accounts.find(acc => acc.accountID === savedAccountID);
        if (account) {
          setSelectedAccount(account);
        }
      }
    }
  }, [accounts]);

  return (
    <AccountContext.Provider
      value={{
        accounts,
        selectedAccount,
        isLoading,
        selectAccount,
        refreshAccounts,
        addAccount,
        removeAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

// Hook để dùng AccountContext
export const useAccount = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};