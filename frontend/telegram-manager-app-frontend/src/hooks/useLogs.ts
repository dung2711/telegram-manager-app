// src/hooks/useLogs.ts
import { useState, useEffect, useCallback } from 'react';
import { logService } from '@/services/logService';
import { AuditLog, LogFilters } from '@/types';
import { toast } from 'react-hot-toast';

interface UseLogsResult {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  fetchLogs: (filters: LogFilters) => Promise<void>;
  exportLogs: () => void;
}

export const useLogs = (initialFilters?: LogFilters): UseLogsResult => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Fetch logs
  const fetchLogs = useCallback(async (filters: LogFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = filters.accountID
        ? await logService.getByAccount(filters)
        : await logService.getAll(filters);

      if (response.data.success) {
        setLogs(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load logs';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Export logs to CSV
  const exportLogs = useCallback(() => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const filename = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    logService.exportToCSV(logs, filename);
    toast.success('Logs exported successfully');
  }, [logs]);

  // Auto-fetch on mount if initialFilters provided
  useEffect(() => {
    if (initialFilters) {
      fetchLogs(initialFilters);
    }
  }, [initialFilters, fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    pagination,
    fetchLogs,
    exportLogs,
  };
};