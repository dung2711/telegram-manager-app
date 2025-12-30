// src/services/logService.ts
import apiClient from '@/lib/axios';
import { LogsResponse, LogFilters } from '@/types';

export const logService = {
  /**
   * Lấy logs của một account cụ thể
   */
  getByAccount: async (filters: LogFilters) => {
    return apiClient.get<LogsResponse>('/logs', {
      params: filters,
    });
  },

  /**
   * Lấy tất cả logs của tất cả accounts
   */
  getAll: async (filters: Omit<LogFilters, 'accountID'>) => {
    return apiClient.get<LogsResponse>('/logs/all', {
      params: filters,
    });
  },

  /**
   * Export logs sang CSV (client-side)
   */
  exportToCSV: (logs: any[], filename = 'logs.csv') => {
    const headers = ['Timestamp', 'Action', 'Status', 'Target', 'Error'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.action,
      log.status,
      log.targetName || log.targetId || '-',
      log.errorMessage || '-',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};