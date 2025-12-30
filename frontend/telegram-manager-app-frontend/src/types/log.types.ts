// src/types/log.types.ts

/**
 * Audit Log Actions
 */
export type LogAction =
  | 'GET_CHATS'
  | 'CREATE_BASIC_GROUP'
  | 'CREATE_SUPERGROUP'
  | 'CREATE_CHANNEL'
  | 'CREATE_SECRET_CHAT'
  | 'ADD_MEMBER'
  | 'ADD_MEMBERS_BATCH'
  | 'REMOVE_MEMBER'
  | 'LEAVE_CHAT'
  | 'DELETE_CHAT'
  | 'UPDATE_CHAT_TITLE'
  | 'UPDATE_CHAT_DESCRIPTION'
  | 'UPDATE_CHAT_PERMISSIONS'
  | 'GET_CONTACTS'
  | 'GET_CONTACTS_DETAILS'
  | 'IMPORT_CONTACTS'
  | 'REMOVE_CONTACTS'
  | 'SEARCH_USERS'
  | 'GET_ME';

/**
 * Log Status
 */
export type LogStatus = 'SUCCESS' | 'FAILURE';

/**
 * Audit Log Entry
 */
export interface AuditLog {
  _id: string;
  accountID: string;
  action: LogAction;
  status: LogStatus;
  targetId?: string;
  targetName?: string;
  payload?: Record<string, any>;
  errorMessage?: string;
  timestamp: string;
}

/**
 * Log Filters
 */
export interface LogFilters {
  accountID?: string;
  page?: number;
  limit?: number;
  action?: LogAction;
  status?: LogStatus;
  startDate?: string; // ISO format
  endDate?: string; // ISO format
}

/**
 * Logs Response
 */
export interface LogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Log Display Item (với thêm thông tin format)
 */
export interface LogDisplayItem extends AuditLog {
  actionLabel: string; // Human-readable action
  statusColor: 'success' | 'error'; // For UI display
  formattedTime: string; // "2 hours ago"
}