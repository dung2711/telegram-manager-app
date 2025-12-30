'use client';

import { useAccount } from '@/context/AccountContext';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Users, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { accounts, selectedAccount } = useAccount();

  const stats = [
    {
      name: 'Telegram Accounts',
      value: accounts.length,
      icon: TrendingUp,
      color: 'blue',
      href: '/dashboard/accounts',
    },
    {
      name: 'Active Groups',
      value: '-',
      icon: MessageSquare,
      color: 'green',
      href: '/dashboard/groups',
    },
    {
      name: 'Total Contacts',
      value: '-',
      icon: Users,
      color: 'purple',
      href: '/dashboard/contacts',
    },
    {
      name: 'Activity Logs',
      value: '-',
      icon: FileText,
      color: 'orange',
      href: '/dashboard/logs',
    },
  ];

  const quickActions = [
    {
      title: 'Create Group',
      description: 'Start a new Telegram group',
      href: '/dashboard/groups',
      icon: MessageSquare,
      color: 'bg-blue-500',
    },
    {
      title: 'Import Contacts',
      description: 'Add contacts from CSV/TXT',
      href: '/dashboard/contacts',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'View Logs',
      description: 'Check recent activities',
      href: '/dashboard/logs',
      icon: FileText,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.fullname}!
        </h1>
        <p className="text-blue-100">
          {selectedAccount
            ? `Currently managing: ${selectedAccount.phoneNumber}`
            : 'Select an account to get started'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.name}</div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Account Status */}
      {selectedAccount && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Account Status
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Phone Number:</span>
              <span className="font-mono text-gray-900">
                {selectedAccount.phoneNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAccount.isAuthenticated
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {selectedAccount.isAuthenticated ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Account ID:</span>
              <span className="font-mono text-xs text-gray-500">
                {selectedAccount.accountID}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No Account Warning */}
      {accounts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2">
                No Telegram Accounts
              </h3>
              <p className="text-yellow-800 text-sm mb-4">
                You haven't added any Telegram accounts yet. Add an account to start managing your groups and contacts.
              </p>
              <Link
                href="/dashboard/accounts/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Add Telegram Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}