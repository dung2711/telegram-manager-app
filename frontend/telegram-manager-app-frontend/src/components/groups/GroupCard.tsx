'use client';

import { ChatListItem } from '@/types';
import { Users, Lock, MessageSquare, Globe } from 'lucide-react';

interface GroupCardProps {
  group: ChatListItem;
  onClick: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const { detail, members } = group;
  
  if (!detail) return null;

  const { chat, chatType } = detail;
  const memberCount = members?.total_count || 0;

  // Get group icon based on type
  const getIcon = () => {
    switch (chatType) {
      case 'chatTypeSecret':
        return <Lock className="w-5 h-5 text-purple-600" />;
      case 'chatTypeSupergroup':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'chatTypeBasicGroup':
        return <Users className="w-5 h-5 text-green-600" />;
      case 'chatTypePrivate':
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get type label
  const getTypeLabel = () => {
    switch (chatType) {
      case 'chatTypeSecret':
        return 'Secret Chat';
      case 'chatTypeSupergroup':
        return 'Supergroup';
      case 'chatTypeBasicGroup':
        return 'Basic Group';
      case 'chatTypePrivate':
        return 'Private Chat';
      default:
        return 'Chat';
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-md transition-all text-left"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
            {chat.title}
          </h3>

          {/* Type & Members */}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">
              {getTypeLabel()}
            </span>
            {memberCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {memberCount}
              </span>
            )}
          </div>

          {/* Unread count */}
          {chat.unread_count && chat.unread_count > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-full">
                {chat.unread_count} unread
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}