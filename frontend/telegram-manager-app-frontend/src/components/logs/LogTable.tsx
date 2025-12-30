'use client';

import { AuditLog } from '@/types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LogTableProps {
  logs: AuditLog[];
  isLoading: boolean;
}

export function LogTable({ logs, isLoading }: LogTableProps) {
  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      GET_CHATS: 'Get Chats',
      CREATE_BASIC_GROUP: 'Create Basic Group',
      CREATE_SUPERGROUP: 'Create Supergroup',
      CREATE_CHANNEL: 'Create Channel',
      CREATE_SECRET_CHAT: 'Create Secret Chat',
      ADD_MEMBER: 'Add Member',
      ADD_MEMBERS_BATCH: 'Add Members (Bulk)',
      REMOVE_MEMBER: 'Remove Member',
      LEAVE_CHAT: 'Leave Chat',
      DELETE_CHAT: 'Delete Chat',
      UPDATE_CHAT_TITLE: 'Update Title',
      UPDATE_CHAT_DESCRIPTION: 'Update Description',
      UPDATE_CHAT_PERMISSIONS: 'Update Permissions',
      GET_CONTACTS: 'Get Contacts',
      GET_CONTACTS_DETAILS: 'Get Contact Details',
      IMPORT_CONTACTS: 'Import Contacts',
      REMOVE_CONTACTS: 'Remove Contacts',
      SEARCH_USERS: 'Search Users',
      GET_ME: 'Get My Info',
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600">Loading logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg">No logs found</p>
        <p className="text-gray-500 text-sm mt-2">Logs will appear here as you perform actions</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                {/* Time */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </td>

                {/* Action */}
                <td className="px-6 py-4 text-sm">
                  <span className="font-medium text-gray-900">
                    {getActionLabel(log.action)}
                  </span>
                </td>

                {/* Target */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {log.targetName || log.targetId || '-'}
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {log.status === 'SUCCESS' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                </td>

                {/* Details */}
                <td className="px-6 py-4 text-sm text-gray-600">
                  {log.errorMessage ? (
                    <span className="text-red-600 text-xs">{log.errorMessage}</span>
                  ) : log.payload ? (
                    <span className="text-xs text-gray-500">
                      {Object.keys(log.payload).length} fields
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}