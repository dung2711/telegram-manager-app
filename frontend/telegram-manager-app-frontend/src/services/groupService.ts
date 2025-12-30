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

// Lấy settings từ localStorage
const getDelay = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('telegram-manager-settings') || '{}');
    return settings.bulkAddDelay || 1000;
  } catch {
    return 1000;
  }
};

export const groupService = {
  /**
   * Lấy tất cả chats với details và members
   */
  getAll: async (accountID: string, limit = 100, chatList = 'chatListMain') => {
    return apiClient.get<ChatListItem[]>('/groups', {
      params: { accountID, limit, chatList },
    });
  },

  /**
   * Lấy chi tiết một chat/group
   */
  getDetail: async (accountID: string, chatId: string | number) => {
    return apiClient.get<GroupDetailResponse>(`/groups/${chatId}`, {
      params: { accountID },
    });
  },

  /**
   * Tạo nhóm mới
   */
  create: async (data: CreateGroupRequest) => {
    return apiClient.post<ApiResponse<any>>('/groups', data);
  },

  /**
   * Thêm thành viên vào nhóm (single hoặc multiple)
   */
  addMembers: async (chatId: string | number, data: AddMemberRequest) => {
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
        try {
          await apiClient.post(`/groups/${chatId}/members`, {
            accountID,
            userIds,
          });
          
          results.successful = userIds;
          return results;
        } catch (batchError: any) {
          const errorMsg = batchError.response?.data?.error || '';
          
          if (errorMsg.toLowerCase().includes('already')) {
            results.alreadyMembers = userIds;
            return results;
          }
          
          console.log('Batch add failed, trying individual adds...', errorMsg);
        }
      }
    }

    // Basic Group OR Supergroup fallback: Add one by one
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      
      try {
        await apiClient.post(`/groups/${chatId}/members`, {
          accountID,
          userId,
        });
        results.successful.push(userId);
      } catch (error: any) {
        const errMsg = error.response?.data?.error || 'Unknown error';
        
        if (errMsg.toLowerCase().includes('already')) {
          results.alreadyMembers.push(userId);
        } else {
          results.failed.push({ userId, error: errMsg });
        }
      }
      
      const delay = getDelay();
      if (i < userIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  },
  

  /**
   * Xóa thành viên khỏi nhóm
   */
  removeMember: async (accountID: string, chatId: string | number, userId: number) => {
    return apiClient.delete<ApiResponse<void>>(`/groups/${chatId}/members/${userId}`, {
      params: { accountID },
    });
  },

  /**
   * Rời khỏi nhóm
   */
  leave: async (accountID: string, chatId: string | number) => {
    return apiClient.post<ApiResponse<void>>(`/groups/${chatId}/leave`, {
      accountID,
    });
  },

  /**
   * Xóa chat/nhóm
   */
  delete: async (accountID: string, chatId: string | number) => {
    return apiClient.delete<ApiResponse<void>>(`/groups/${chatId}`, {
      params: { accountID },
    });
  },

  /**
   * Cập nhật tên nhóm
   */
  updateTitle: async (accountID: string, chatId: string | number, title: string) => {
    return apiClient.patch<ApiResponse<void>>(`/groups/${chatId}/title`, {
      accountID,
      title,
    });
  },

  /**
   * Cập nhật mô tả nhóm
   */
  updateDescription: async (accountID: string, chatId: string | number, description: string) => {
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
    return apiClient.patch<ApiResponse<void>>(`/groups/${chatId}/permissions`, {
      accountID,
      permissions,
    });
  },
};