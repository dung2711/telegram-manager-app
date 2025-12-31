// src/types/account.types.ts

/**
 * Telegram Account entity từ backend
 */
export interface Account {
  _id: string;
  owner: string; // User ID
  accountID: string; // UUID
  phoneNumber: string;
  sessionPath: string;
  isAuthenticated: boolean;
  lastActive?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get accounts response từ /auth/telegram/accounts
 */
export interface GetAccountsResponse {
  success: boolean;
  data?: Account[];
  error?: string;
}

/**
 * Account info hiển thị trong UI (simplified)
 */
export interface AccountInfo {
  accountID: string;
  phoneNumber: string;
  isAuthenticated: boolean;
  lastActive?: string;
  createdAt?: string;
}

/**
 * Selected account trong context
 */
export interface SelectedAccount {
  accountID: string;
  phoneNumber: string;
  isAuthenticated: boolean;
}