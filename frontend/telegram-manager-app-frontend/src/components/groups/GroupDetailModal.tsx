'use client';

import { useState } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { ChatListItem } from '@/types';
import { X, Users, Settings, UserPlus, UserMinus, LogOut, Trash2, Edit } from 'lucide-react';
import { BulkAddMembersDialog } from './BulkAddMembersDialog';
import { EditGroupDialog } from './EditGroupDialog';

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ChatListItem;
  accountID: string;
  onUpdate: () => void;
  onLeave: () => void;
  onDelete: () => void;
}

export function GroupDetailModal({
  isOpen,
  onClose,
  group,
  accountID,
  onUpdate,
  onLeave,
  onDelete,
}: GroupDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { updateTitle, updateDescription } = useGroups(accountID);

  if (!isOpen || !group.detail) return null;

  const { chat, chatType } = group.detail;
  const members = group.members?.members || [];
  const memberCount = group.members?.total_count || 0;

  // Get current description (if available)
  const currentDescription = (chat as any).description || '';

  const handleUpdateGroup = async (title: string, description?: string) => {
    // Update title
    await updateTitle(group.chatId, title);

    // Update description (supergroup only)
    if (chatType === 'chatTypeSupergroup' && description !== undefined) {
      await updateDescription(group.chatId, description);
    }

    // Refresh data
    onUpdate();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{chat.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {chatType === 'chatTypeBasicGroup' && 'Basic Group'}
                  {chatType === 'chatTypeSupergroup' && 'Supergroup'}
                  {chatType === 'chatTypeSecret' && 'Secret Chat'}
                  {chatType === 'chatTypePrivate' && 'Private Chat'}
                  {' '} • {memberCount} member{memberCount !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-4 border-b -mb-px">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'members'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Members
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBulkAdd(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Members
                  </button>
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  {members.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No members to display
                    </div>
                  ) : (
                    members.map((member, idx) => {
                      const userId = member.member_id?.user_id || member.user_id;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                              {userId ? String(userId).slice(0, 2) : '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                User {userId}
                              </div>
                              <div className="text-sm text-gray-500">
                                {member.status?._ || 'Member'}
                              </div>
                            </div>
                          </div>
                          <button className="text-red-600 hover:text-red-700">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Group Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Group Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chat ID:</span>
                      <span className="font-mono text-gray-900">{chat.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900">{chatType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Members:</span>
                      <span className="text-gray-900">{memberCount}</span>
                    </div>
                    {currentDescription && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-gray-600 block mb-1">Description:</span>
                        <p className="text-gray-900 text-sm">{currentDescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {/* Edit Group Name/Description */}
                  <button
                    onClick={() => setShowEditDialog(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Edit Group {chatType === 'chatTypeSupergroup' ? 'Info' : 'Name'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {chatType === 'chatTypeSupergroup'
                          ? 'Change the group name and description'
                          : 'Change the group name'}
                      </div>
                    </div>
                  </button>

                  {/* Leave Group */}
                  <button
                    onClick={onLeave}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="font-medium text-yellow-900">Leave Group</div>
                      <div className="text-sm text-yellow-600">Exit this group</div>
                    </div>
                  </button>

                  {/* Delete Group */}
                  <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-medium text-red-900">Delete Group</div>
                      <div className="text-sm text-red-600">Permanently delete this group</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Add Members Dialog */}
      <BulkAddMembersDialog
        isOpen={showBulkAdd}
        onClose={() => setShowBulkAdd(false)}
        chatId={group.chatId}
        chatName={chat.title}
        chatType={chatType}
        accountID={accountID}
        onSuccess={() => {
          setShowBulkAdd(false);
          onUpdate();
        }}
      />

      {/* Edit Group Dialog */}
      <EditGroupDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        chatId={group.chatId}
        chatType={chatType}
        currentTitle={chat.title}
        currentDescription={currentDescription}
        accountID={accountID}
        onUpdate={handleUpdateGroup}
      />
    </>
  );
}