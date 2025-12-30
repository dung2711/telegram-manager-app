'use client';

import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AccountSelector } from './AccountSelector';

export function Header() {
  const { user, logout } = useAuth();
  const { selectedAccount } = useAccount();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      {/* Left: Account Selector */}
      <div className="flex items-center gap-4">
        <AccountSelector />
        
        {selectedAccount && (
          <div className="flex items-center gap-2 text-sm">
            <div className={`
              w-2 h-2 rounded-full 
              ${selectedAccount.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}
            `} />
            <span className="text-gray-600">
              {selectedAccount.isAuthenticated ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        )}
      </div>

      {/* Right: User Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">
                {user?.fullname || user?.username}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">
                {user?.fullname}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                @{user?.username}
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}