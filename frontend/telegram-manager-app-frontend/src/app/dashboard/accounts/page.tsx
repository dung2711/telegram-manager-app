'use client';

// src/app/dashboard/accounts/page.tsx

import { useState, useEffect } from 'react';
import { useAccount } from '@/hooks/useAccount';
import * as accountService from '@/services/accountService';
import { AccountCard } from '@/components/accounts/AccountCard';
import { TelegramAuthDialog } from '@/components/accounts/TelegramAuthDialog';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const {
    accounts,
    selectedAccount,
    isLoading,
    fetchAccounts,
    selectAccount,
    refreshAccounts,
  } = useAccount();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch accounts khi mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSelectAccount = (accountID: string, phoneNumber: string, isAuthenticated: boolean) => {
    selectAccount(accountID, phoneNumber, isAuthenticated);
    toast.success(`Switched to ${phoneNumber}`);
  };

  const handleDeleteAccount = async (accountID: string) => {
    await accountService.deleteAccount(accountID);
    await refreshAccounts();
  };

  const handleDialogSuccess = async () => {
    // Refresh accounts list sau khi add thành công
    await refreshAccounts();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Telegram Accounts
          </h1>
          <p className="text-gray-600">
            Manage your connected Telegram accounts
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Account
        </button>
      </div>

      {/* Loading State */}
      {isLoading && accounts.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg
              className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-gray-600">Loading accounts...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && accounts.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Accounts Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Add your first Telegram account to get started with group and contact management.
          </p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Account
          </button>
        </div>
      )}

      {/* Accounts Grid */}
      {!isLoading && accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <AccountCard
              key={account.accountID}
              account={account}
              isSelected={selectedAccount?.accountID === account.accountID}
              onSelect={() => handleSelectAccount(account.accountID, account.phoneNumber, account.isAuthenticated)}
              onDelete={handleDeleteAccount}
            />
          ))}
        </div>
      )}

      {/* Selected Account Info */}
      {selectedAccount && accounts.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-900">
              Currently using <span className="font-semibold">{selectedAccount.phoneNumber}</span> for all operations
            </p>
          </div>
        </div>
      )}

      {/* Add Account Dialog */}
      <TelegramAuthDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}