// src/types/group.types.ts

/**
 * TDLib Chat Type
 */
export type ChatType = 
  | 'chatTypePrivate' 
  | 'chatTypeBasicGroup' 
  | 'chatTypeSupergroup' 
  | 'chatTypeSecret';

/**
 * TDLib Chat Object
 */
export interface TDLibChat {
  id: number;
  type: {
    _: ChatType;
    user_id?: number;
    basic_group_id?: number;
    supergroup_id?: number;
    secret_chat_id?: number;
  };
  title: string;
  photo?: {
    small?: { local?: { path: string } };
    big?: { local?: { path: string } };
  };
  last_message?: any;
  positions?: any[];
  unread_count?: number;
  last_read_inbox_message_id?: number;
  last_read_outbox_message_id?: number;
  unread_mention_count?: number;
  notification_settings?: any;
  permissions?: ChatPermissions;
}

/**
 * Chat Permissions
 */
export interface ChatPermissions {
  _?: string;
  can_send_messages?: boolean;
  can_send_media_messages?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
}

/**
 * Chat Member
 */
export interface ChatMember {
  member_id?: {
    _: string;
    user_id: number;
  };
  user_id?: number; // For basic groups
  status?: {
    _: string;
  };
  joined_chat_date?: number;
  inviter_user_id?: number;
}

/**
 * Full Chat Detail từ API
 */
export interface ChatDetailData {
  chat: TDLibChat;
  detail: any; // BasicGroupFullInfo | SupergroupFullInfo | User | SecretChat
  chatType: ChatType;
}

/**
 * Response từ GET /api/groups/:id
 */
export interface GroupDetailResponse {
  detail: {
    success: boolean;
    data: ChatDetailData;
  };
  members: {
    success: boolean;
    data: {
      members: ChatMember[];
      total_count: number;
    };
    count: number;
  };
}

/**
 * Chat Item hiển thị trong list
 */
export interface ChatListItem {
  chatId: number;
  detail: ChatDetailData | null;
  members: {
    members: ChatMember[];
    total_count: number;
  } | null;
}

/**
 * Create Group Request
 */
export interface CreateGroupRequest {
  accountID: string;
  type: 'basic_group' | 'super_group' | 'secret_chat';
  title?: string;
  userIds?: number[];
  isChannel?: boolean;
  description?: string;
  location?: string;
}

/**
 * Add Member Request
 */
export interface AddMemberRequest {
  accountID: string;
  userId?: number;
  userIds?: number[];
  forwardLimit?: number;
}

/**
 * Add Members Options
 */
export interface AddMembersOptions {
  autoCleanup: boolean;      // Auto-remove imported contacts
  chatType: ChatType;         // Used for validation
}

/**
 * Member to Import (từ CSV/TXT)
 */
export interface MemberToImport {
  name?: string; // Từ CSV (optional)
  phoneNumber: string; // Normalized phone (+84...)
  rawPhone: string; // Original phone from file
  lineNumber: number; // For error tracking
}

/**
 * Parsed Member với validation status
 */
export interface ParsedMember extends MemberToImport {
  isValid: boolean;
  validationError?: string;
}

/**
 * Resolved Member (sau khi tìm userId)
 */
export interface ResolvedMember {
  phoneNumber: string;
  name?: string;
  userId?: number;
  status: 'resolved' | 'not_found' | 'import_failed';
  error?: string;
  wasImported?: boolean; // Track if this was imported (for cleanup)
}

/**
 * Add Member Result (kết quả cuối cùng)
 */
export interface AddMemberResult {
  phoneNumber: string;
  name?: string;
  userId?: number;
  status: 'success' | 'failed' | 'already_member' | 'not_found';
  error?: string;
}

/**
 * Bulk Add Members Summary
 */
export interface BulkAddMembersResult {
  total: number;
  successful: number;
  failed: number;
  alreadyMembers: number;
  results: AddMemberResult[];
  cleanedUp?: number; // Number of contacts cleaned up
}