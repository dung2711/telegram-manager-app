// src/app/(dashboard)/groups/page.tsx
'use client';

import { useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import { useSettings } from '@/context/SettingsContext';
import { useGroups } from '@/hooks/useGroups';
import { GroupList } from '@/components/groups/GroupList';
import { GroupDetailModal } from '@/components/groups/GroupDetailModal';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { ChatListItem } from '@/types';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/utils/toastHelper';

export default function GroupsPage() {
  const { selectedAccount } = useAccount();
  const { settings } = useSettings();
  const accountID = selectedAccount?.accountID;
  
  const { groups, isLoading, fetchGroups, createGroup, leaveGroup, deleteGroup } = useGroups(accountID);
  
  const [selectedGroup, setSelectedGroup] = useState<ChatListItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateGroup = async (data: any) => {
    try {
      await createGroup(data);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    
    if (confirm(`Are you sure you want to leave "${selectedGroup.detail?.chat.title}"?`)) {
      try {
        await leaveGroup(selectedGroup.chatId);
        setSelectedGroup(null);
      } catch (error) {
        console.error('Failed to leave group:', error);
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    
    if (confirm(`Are you sure you want to delete "${selectedGroup.detail?.chat.title}"? This cannot be undone.`)) {
      try {
        await deleteGroup(selectedGroup.chatId);
        setSelectedGroup(null);
      } catch (error) {
        console.error('Failed to delete group:', error);
      }
    }
  };

  if (!selectedAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please select an account to view groups</p>
      </div>
    );
  }

  if (!selectedAccount.isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please authenticate your account to view groups</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-1">
            Manage your Telegram groups and channels • {settings.itemsPerPage} items per page
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchGroups}
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
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-900">{groups.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Groups</div>
        </div>
      </div>

      {/* Groups List */}
      <GroupList
        groups={groups}
        isLoading={isLoading}
        onGroupClick={setSelectedGroup}
        itemsPerPage={settings.itemsPerPage}
      />

      {/* Modals */}
      {selectedGroup && accountID && selectedGroup.detail && (
        <GroupDetailModal
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          group={selectedGroup}
          accountID={accountID}
          onUpdate={fetchGroups}
          onLeave={handleLeaveGroup}
          onDelete={handleDeleteGroup}
        />
      )}

      {accountID && (
        <CreateGroupDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          accountID={accountID}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
}