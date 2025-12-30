'use client';

import { useState } from 'react';
import { LogFilters as LogFiltersType, LogAction, LogStatus } from '@/types';
import { Filter, X } from 'lucide-react';

interface LogFiltersProps {
  filters: LogFiltersType;
  onFiltersChange: (filters: LogFiltersType) => void;
}

const actionOptions: { value: LogAction; label: string }[] = [
  { value: 'CREATE_BASIC_GROUP', label: 'Create Basic Group' },
  { value: 'CREATE_SUPERGROUP', label: 'Create Supergroup' },
  { value: 'CREATE_CHANNEL', label: 'Create Channel' },
  { value: 'CREATE_SECRET_CHAT', label: 'Create Secret Chat' },
  { value: 'ADD_MEMBER', label: 'Add Member' },
  { value: 'ADD_MEMBERS_BATCH', label: 'Add Members (Bulk)' },
  { value: 'REMOVE_MEMBER', label: 'Remove Member' },
  { value: 'IMPORT_CONTACTS', label: 'Import Contacts' },
  { value: 'REMOVE_CONTACTS', label: 'Remove Contacts' },
];

export function LogFiltersComponent({ filters, onFiltersChange }: LogFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleActionChange = (action: LogAction | '') => {
    onFiltersChange({
      ...filters,
      action: action || undefined,
    });
  };

  const handleStatusChange = (status: LogStatus | '') => {
    onFiltersChange({
      ...filters,
      status: status || undefined,
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters = !!(filters.action || filters.status || filters.startDate || filters.endDate);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 font-medium hover:text-gray-900"
        >
          <Filter className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={filters.action || ''}
              onChange={(e) => handleActionChange(e.target.value as LogAction | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              {actionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value as LogStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failed</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}