'use client';

import { useAccount } from '@/context/AccountContext';
import { Plus, Check, Phone } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AccountSelector() {
  const { accounts, selectedAccount, selectAccount, isLoading } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAccount = (accountID: string) => {
    selectAccount(accountID);
    setIsOpen(false);
  };

  const handleAddAccount = () => {
    setIsOpen(false);
    router.push('/dashboard/accounts/new');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Loading accounts...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <button
        onClick={handleAddAccount}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Add Telegram Account</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-w-[200px]"
      >
        <Phone className="w-4 h-4 text-gray-600" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900">
            {selectedAccount?.phoneNumber || 'Select Account'}
          </div>
          {selectedAccount && (
            <div className="text-xs text-gray-500">
              {selectedAccount.isAuthenticated ? 'Active' : 'Inactive'}
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase">
              Your Accounts ({accounts.length})
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {accounts.map((account) => (
              <button
                key={account.accountID}
                onClick={() => handleSelectAccount(account.accountID)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className={`
                  w-2 h-2 rounded-full flex-shrink-0
                  ${account.isAuthenticated ? 'bg-green-500' : 'bg-gray-400'}
                `} />
                
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {account.phoneNumber}
                  </div>
                  <div className="text-xs text-gray-500">
                    {account.isAuthenticated ? 'Connected' : 'Not connected'}
                  </div>
                </div>

                {selectedAccount?.accountID === account.accountID && (
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 p-1">
            <button
              onClick={handleAddAccount}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}