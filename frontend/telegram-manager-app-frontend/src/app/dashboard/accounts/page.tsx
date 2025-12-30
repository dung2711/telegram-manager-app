'use client';

import { useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import { AccountCard } from '@/components/accounts/AccountCard';
import { TelegramAuthDialog } from '@/components/accounts/TelegramAuthDialog';
import { accountService } from '@/services/accountService';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/utils/toastHelper';

export default function AccountsPage() {
  const { accounts, selectedAccount, selectAccount, refreshAccounts, removeAccount } = useAccount();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAccounts();
      toast.success('Accounts refreshed');
    } catch (error) {
      toast.error('Failed to refresh accounts');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteAccount = async (accountID: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      await accountService.delete(accountID);
      removeAccount(accountID);
      toast.success('Account deleted successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to delete account';
      toast.error(errorMsg);
    }
  };

  const handleAuthSuccess = async () => {
    await refreshAccounts();
    toast.success('Account added successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telegram Accounts</h1>
          <p className="text-gray-600 mt-1">
            Manage your connected Telegram accounts
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-all ${
              isRefreshing
                ? 'border-blue-400 bg-blue-50 text-blue-700 cursor-wait'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={() => setShowAuthDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-900">{accounts.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Accounts</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <div className="text-3xl font-bold text-green-900">
            {accounts.filter(a => a.isAuthenticated).length}
          </div>
          <div className="text-sm text-green-600 mt-1">Connected</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <div className="text-3xl font-bold text-red-900">
            {accounts.filter(a => !a.isAuthenticated).length}
          </div>
          <div className="text-sm text-red-600 mt-1">Disconnected</div>
        </div>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Accounts Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first Telegram account to start managing groups and contacts
            </p>
            <button
              onClick={() => setShowAuthDialog(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Account
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.accountID}
              account={account}
              isSelected={selectedAccount?.accountID === account.accountID}
              onSelect={() => selectAccount(account.accountID)}
              onDelete={() => handleDeleteAccount(account.accountID)}
            />
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• You can manage multiple Telegram accounts from one dashboard</li>
          <li>• Click on an account card to make it active</li>
          <li>• Connected accounts can access your groups and your contacts</li>
          <li>• Disconnected accounts need re-authentication to work</li>
        </ul>
      </div>

      {/* Auth Dialog */}
      <TelegramAuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}