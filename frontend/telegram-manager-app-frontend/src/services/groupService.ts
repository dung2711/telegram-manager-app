// src/services/groupService.ts
import apiClient from '@/lib/axios';
import {
  ApiResponse,
  ChatListItem,
  GroupDetailResponse,
  CreateGroupRequest,
  AddMemberRequest,
  ChatPermissions,
} from '@/types';

/**
 * Get settings from localStorage
 */
const getSettings = () => {
  try {
    const stored = localStorage.getItem('telegram-manager-settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return null;
};

/**
 * Get bulk add delay from settings
 */
const getDelay = (): number => {
  const settings = getSettings();
  return settings?.bulkAddDelay || 1000;
};

/**
 * Debug log helper
 */
const debugLog = (...args: any[]) => {
  const settings = getSettings();
  if (settings?.debugMode) {
    console.log('[GroupService]', ...args);
  }
};

export const groupService = {
  /**
   * Lấy tất cả chats với details và members
   */
  getAll: async (accountID: string, limit = 100, chatList = 'chatListMain') => {
    debugLog('Fetching groups:', { accountID, limit, chatList });
    return apiClient.get<ChatListItem[]>('/groups', {
      params: { accountID, limit, chatList },
    });
  },

  /**
   * Lấy chi tiết một chat/group
   */
  getDetail: async (accountID: string, chatId: string | number) => {
    debugLog('Fetching group detail:', { accountID, chatId });
    return apiClient.get<GroupDetailResponse>(`/groups/${chatId}`, {
      params: { accountID },
    });
  },

  /**
   * Tạo nhóm mới
   */
  create: async (data: CreateGroupRequest) => {
    debugLog('Creating group:', data);
    return apiClient.post<ApiResponse<any>>('/groups', data);
  },

  /**
   * Thêm thành viên vào nhóm (single hoặc multiple)
   */
  addMembers: async (chatId: string | number, data: AddMemberRequest) => {
    debugLog('Adding members:', { chatId, data });
    return apiClient.post<ApiResponse<void>>(`/groups/${chatId}/members`, data);
  },

  /**
   * Thêm nhiều thành viên với error handling chi tiết
   * Supports both supergroup (batch) and basic group (sequential)
   */
  addMembersBulk: async (
    accountID: string,
    chatId: string | number,
    chatType: string,
    userIds: number[]
  ): Promise<{
    successful: number[];
    failed: Array<{ userId: number; error: string }>;
    alreadyMembers: number[];
  }> => {
    debugLog('Bulk adding members:', { accountID, chatId, chatType, count: userIds.length });
    
    const results = {
      successful: [] as number[],
      failed: [] as Array<{ userId: number; error: string }>,
      alreadyMembers: [] as number[],
    };

    // Validation: Basic Group max 200 members
    if (chatType === 'chatTypeBasicGroup' && userIds.length > 200) {
      throw new Error('Basic groups support maximum 200 members');
    }

    // Supergroup: Try batch first
    if (chatType === 'chatTypeSupergroup') {
      const shouldTryBatch = userIds.length >= 10;

      if (shouldTryBatch) {
        debugLog('Attempting batch add for supergroup...');
        try {
          await apiClient.post(`/groups/${chatId}/members`, {
            accountID,
            userIds,
          });
          
          results.successful = userIds;
          debugLog('Batch add successful:', results.successful.length);
          return results;
        } catch (batchError: any) {
          const errorMsg = batchError.response?.data?.error || '';
          
          if (errorMsg.toLowerCase().includes('already')) {
            results.alreadyMembers = userIds;
            debugLog('All members already in group');
            return results;
          }
          
          debugLog('Batch add failed, trying individual adds...', errorMsg);
        }
      }
    }

    // Basic Group OR Supergroup fallback: Add one by one
    const delay = getDelay();
    debugLog('Adding members individually with delay:', delay, 'ms');
    
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      
      try {
        await apiClient.post(`/groups/${chatId}/members`, {
          accountID,
          userId,
        });
        results.successful.push(userId);
        debugLog(`Added member ${i + 1}/${userIds.length}:`, userId);
      } catch (error: any) {
        const errMsg = error.response?.data?.error || 'Unknown error';
        
        if (errMsg.toLowerCase().includes('already')) {
          results.alreadyMembers.push(userId);
          debugLog(`Member ${userId} already in group`);
        } else {
          results.failed.push({ userId, error: errMsg });
          debugLog(`Failed to add member ${userId}:`, errMsg);
        }
      }
      
      // Delay between requests (except for last one)
      if (i < userIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    debugLog('Bulk add complete:', {
      successful: results.successful.length,
      failed: results.failed.length,
      alreadyMembers: results.alreadyMembers.length,
    });

    return results;
  },
  

  /**
   * Xóa thành viên khỏi nhóm
   */
  removeMember: async (accountID: string, chatId: string | number, userId: number) => {
    debugLog('Removing member:', { accountID, chatId, userId });
    return apiClient.delete<ApiResponse<void>>(`/groups/${chatId}/members/${userId}`, {
      params: { accountID },
    });
  },

  /**
   * Rời khỏi nhóm
   */
  leave: async (accountID: string, chatId: string | number) => {
    debugLog('Leaving group:', { accountID, chatId });
    return apiClient.post<ApiResponse<void>>(`/groups/${chatId}/leave`, {
      accountID,
    });
  },

  /**
   * Xóa chat/nhóm
   */
  delete: async (accountID: string, chatId: string | number) => {
    debugLog('Deleting group:', { accountID, chatId });
    return apiClient.delete<ApiResponse<void>>(`/groups/${chatId}`, {
      params: { accountID },
    });
  },

  /**
   * Cập nhật tên nhóm
   */
  updateTitle: async (accountID: string, chatId: string | number, title: string) => {
    debugLog('Updating group title:', { accountID, chatId, title });
    return apiClient.patch<ApiResponse<void>>(`/groups/${chatId}/title`, {
      accountID,
      title,
    });
  },

  /**
   * Cập nhật mô tả nhóm
   */
  updateDescription: async (accountID: string, chatId: string | number, description: string) => {
    debugLog('Updating group description:', { accountID, chatId });
    return apiClient.patch<ApiResponse<void>>(`/groups/${chatId}/description`, {
      accountID,
      description,
    });
  },

  /**
   * Cập nhật quyền nhóm
   */
  updatePermissions: async (
    accountID: string,
    chatId: string | number,
    permissions: Partial<ChatPermissions>
  ) => {
    debugLog('Updating group permissions:', { accountID, chatId, permissions });
    return apiClient.patch<ApiResponse<void>>(`/groups/${chatId}/permissions`, {
      accountID,
      permissions,
    });
  },
};