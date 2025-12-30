// src/app/(dashboard)/logs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from '@/context/AccountContext';
import { useSettings } from '@/context/SettingsContext';
import { useLogs } from '@/hooks/useLogs';
import { LogTable } from '@/components/logs/LogTable';
import { LogFiltersComponent } from '@/components/logs/LogFilters';
import { LogFilters } from '@/types';
import { Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsPage() {
  const { selectedAccount } = useAccount();
  const { settings } = useSettings();
  const accountID = selectedAccount?.accountID;
  
  const [filters, setFilters] = useState<LogFilters>({
    accountID,
    page: 1,
    limit: settings.itemsPerPage,
  });

  const { logs, isLoading, pagination, fetchLogs, exportLogs } = useLogs();

  // Update filters when account or settings change
  useEffect(() => {
    if (accountID) {
      setFilters(prev => ({ 
        ...prev, 
        accountID, 
        page: 1,
        limit: settings.itemsPerPage 
      }));
    }
  }, [accountID, settings.itemsPerPage]);

  // Fetch logs when filters change
  useEffect(() => {
    if (filters.accountID) {
      fetchLogs(filters);
    }
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleRefresh = () => {
    if (filters.accountID) {
      fetchLogs(filters);
    }
  };

  if (!selectedAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please select an account to view logs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-1">
            View all activities for {selectedAccount.phoneNumber}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-all ${
              isLoading
                ? 'border-blue-400 bg-blue-50 text-blue-700 cursor-wait'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              logs.length === 0
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-900">{pagination.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total Logs</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <div className="text-3xl font-bold text-green-900">
            {logs.filter(l => l.status === 'SUCCESS').length}
          </div>
          <div className="text-sm text-green-600 mt-1">Successful</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <div className="text-3xl font-bold text-red-900">
            {logs.filter(l => l.status === 'FAILURE').length}
          </div>
          <div className="text-sm text-red-600 mt-1">Failed</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="text-3xl font-bold text-blue-900">{pagination.page}</div>
          <div className="text-sm text-blue-600 mt-1">Current Page</div>
        </div>
      </div>

      {/* Filters */}
      <LogFiltersComponent
        filters={filters}
        onFiltersChange={(newFilters) => setFilters({ ...newFilters, accountID })}
      />

      {/* Logs Table */}
      <LogTable logs={logs} isLoading={isLoading} />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} logs
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-all ${
                pagination.page === 1 || isLoading
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = pagination.page - 2 + i;
                if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pageNum === pagination.page
                        ? 'bg-blue-600 text-white'
                        : isLoading
                        ? 'border border-gray-200 bg-gray-50 text-gray-400 cursor-wait'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || isLoading}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-all ${
                pagination.page === pagination.totalPages || isLoading
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}