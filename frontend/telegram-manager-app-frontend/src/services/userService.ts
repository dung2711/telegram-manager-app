// src/services/userService.ts
import apiClient from '@/lib/axios';
import {
  ApiResponse,
  TDLibUser,
  ContactsResponse,
  ContactDetailsResponse,
  ContactToImport,
  ImportContactsResult,
  SearchUsersResponse,
} from '@/types';

export const userService = {
  /**
   * Lấy thông tin user hiện tại (me)
   */
  getMe: async (accountID: string) => {
    return apiClient.get<ApiResponse<TDLibUser>>('/users/me', {
      params: { accountID },
    });
  },

  /**
   * Lấy danh sách contacts (chỉ có IDs)
   */
  getContacts: async (accountID: string) => {
    return apiClient.get<ContactsResponse>('/users/contacts', {
      params: { accountID },
    });
  },

  /**
   * Lấy thông tin chi tiết contacts
   */
  getContactDetails: async (accountID: string, userIds?: number[]) => {
    const params: any = { accountID };
    if (userIds && userIds.length > 0) {
      params.userIds = userIds.join(',');
    }
    return apiClient.get<ContactDetailsResponse>('/users/contacts/details', { params });
  },

  /**
   * Lấy thông tin user theo ID
   */
  getUserById: async (accountID: string, userId: number) => {
    return apiClient.get<ApiResponse<TDLibUser>>(`/users/${userId}`, {
      params: { accountID },
    });
  },

  /**
   * Tìm kiếm users
   */
  searchUsers: async (accountID: string, query: string) => {
    return apiClient.get<SearchUsersResponse>('/users/search/query', {
      params: { accountID, q: query },
    });
  },

  /**
   * Thêm/Import contacts
   */
  addContacts: async (accountID: string, contacts: ContactToImport[]) => {
    return apiClient.post<ImportContactsResult>('/users/contacts', {
      accountID,
      contacts,
    });
  },

  /**
   * Xóa contacts
   */
  removeContacts: async (accountID: string, userIds: number[]) => {
    return apiClient.delete<ApiResponse<{ removed: number }>>('/users/contacts', {
      data: { accountID, userIds },
    });
  },
};