'use client';

import { ChatListItem } from '@/types';
import { GroupCard } from './GroupCard';
import { Loader2 } from 'lucide-react';

interface GroupListProps {
  groups: ChatListItem[];
  isLoading: boolean;
  onGroupClick: (group: ChatListItem) => void;
}

export function GroupList({ groups, isLoading, onGroupClick }: GroupListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading groups...</span>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No groups found</div>
        <p className="text-gray-500 text-sm">
          Create a new group to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <GroupCard
          key={group.chatId}
          group={group}
          onClick={() => onGroupClick(group)}
        />
      ))}
    </div>
  );
}