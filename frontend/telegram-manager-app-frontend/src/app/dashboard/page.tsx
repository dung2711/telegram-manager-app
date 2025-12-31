'use client';

// src/app/dashboard/page.tsx
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from '@/hooks/useAccount';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { accounts, selectedAccount } = useAccount();

  const stats = [
    {
      label: 'Total Accounts',
      value: accounts.length,
      icon: 'users',
      color: 'blue',
      link: '/dashboard/accounts',
    },
    {
      label: 'Active Account',
      value: selectedAccount ? '1' : '0',
      icon: 'check',
      color: 'green',
      link: '/dashboard/accounts',
    },
    {
      label: 'Groups',
      value: '-',
      icon: 'group',
      color: 'purple',
      link: '/dashboard/groups',
    },
    {
      label: 'Contacts',
      value: '-',
      icon: 'contacts',
      color: 'orange',
      link: '/dashboard/contacts',
    },
  ];

  const getStatIcon = (iconName: string) => {
    const icons: Record<string, ReactNode> = {
      users: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      ),
      check: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      group: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      ),
      contacts: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
    };
    return icons[iconName] || icons.users;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'bg-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'bg-green-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'bg-purple-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'bg-orange-600' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.fullname}! 👋
        </h1>
        <p className="text-gray-600">
          Here's an overview of your Telegram account management.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const colors = getColorClasses(stat.color);
          return (
            <Link
              key={stat.label}
              href={stat.link}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getStatIcon(stat.icon)}
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/accounts"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Add Account</h3>
              <p className="text-sm text-gray-600">Connect new Telegram account</p>
            </div>
          </Link>

          <Link
            href="/dashboard/groups"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Groups</h3>
              <p className="text-sm text-gray-600">Create and manage groups</p>
            </div>
          </Link>

          <Link
            href="/dashboard/contacts"
            className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Import Contacts</h3>
              <p className="text-sm text-gray-600">Add contacts to account</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      {accounts.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Get Started with Telegram Manager
              </h3>
              <p className="text-blue-700 mb-4">
                You haven't added any Telegram accounts yet. Add your first account to start managing groups, contacts, and more!
              </p>
              <Link
                href="/dashboard/accounts"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Your First Account
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}