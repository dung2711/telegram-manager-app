'use client';

import { TelegramAccount } from '@/types';
import { Phone, CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react';

interface AccountCardProps {
  account: TelegramAccount;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function AccountCard({ account, isSelected, onSelect, onDelete }: AccountCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border-2 p-6 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-600 shadow-lg'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${account.isAuthenticated ? 'bg-green-100' : 'bg-red-100'}
          `}>
            <Phone className={`w-6 h-6 ${
              account.isAuthenticated ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>

          <div>
            <div className="font-semibold text-gray-900 text-lg">
              {account.phoneNumber}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {account.isAuthenticated ? (
                <span className="inline-flex items-center gap-1 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-red-700">
                  <XCircle className="w-4 h-4" />
                  Disconnected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Selected Badge */}
        {isSelected && (
          <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            Active
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Account ID:</span>
          <span className="font-mono text-xs text-gray-500">
            {account.accountID.slice(0, 8)}...
          </span>
        </div>
        
        {account.lastActive && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Last Active:</span>
            <span className="text-gray-900">
              {new Date(account.lastActive).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Created:</span>
          <span className="text-gray-900">
            {new Date(account.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        {!account.isAuthenticated && (
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reconnect
          </button>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}