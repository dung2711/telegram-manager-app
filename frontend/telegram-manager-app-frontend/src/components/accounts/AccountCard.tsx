'use client';

// src/components/accounts/AccountCard.tsx

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Account } from '@/types';

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (accountID: string) => void;
}

export function AccountCard({ account, isSelected, onSelect, onDelete }: AccountCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(account.accountID);
    setShowDeleteConfirm(false);
  };

  const formatLastActive = (date?: string) => {
    if (!date) return 'Never';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md border-2 transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
          Active
        </div>
      )}

      <div className="p-4">
        {/* Phone Number */}
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{account.phoneNumber}</h3>
            <div className="flex items-center mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  account.isAuthenticated
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1 ${
                    account.isAuthenticated ? 'bg-green-600' : 'bg-yellow-600'
                  }`}
                ></span>
                {account.isAuthenticated ? 'Connected' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Last active: {formatLastActive(account.lastActive)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Added: {formatLastActive(account.createdAt)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isSelected && (
            <button
              onClick={onSelect}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Select
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Delete Account?</h4>
            <p className="text-xs text-gray-600 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}