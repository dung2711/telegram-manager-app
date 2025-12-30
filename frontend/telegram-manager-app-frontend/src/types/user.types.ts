// src/types/user.types.ts

/**
 * TDLib User Object
 */
export interface TDLibUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  status?: {
    _: 'userStatusOnline' | 'userStatusOffline' | 'userStatusRecently' | 'userStatusLastWeek' | 'userStatusLastMonth' | 'userStatusEmpty';
    was_online?: number;
    expires?: number;
  };
  profile_photo?: {
    small?: { local?: { path: string } };
    big?: { local?: { path: string } };
  };
  type?: {
    _: string;
  };
  is_contact?: boolean;
  is_mutual_contact?: boolean;
  is_verified?: boolean;
  is_support?: boolean;
  restriction_reason?: string;
  have_access?: boolean;
  language_code?: string;
}

/**
 * Contact Item (for display)
 */
export interface ContactItem extends TDLibUser {
  displayName: string; // first_name + last_name
  statusText: string; // "Online", "Last seen recently", etc.
}

/**
 * Contacts Response từ API
 */
export interface ContactsResponse {
  success: boolean;
  data: {
    user_ids: number[];
    total_count: number;
  };
  count: number;
}

/**
 * Contact Details Response
 */
export interface ContactDetailsResponse {
  success: boolean;
  data: TDLibUser[];
  count: number;
}

/**
 * Contact to Import (CSV format)
 */
export interface ContactToImport {
  phone_number: string;
  first_name: string;
  last_name?: string;
}

/**
 * Import Contacts Result
 */
export interface ImportContactsResult {
  success: boolean;
  data: {
    user_ids: number[];
    importer_count: number[];
  };
  imported: number;
}

/**
 * Search Users Response
 */
export interface SearchUsersResponse {
  success: boolean;
  data: {
    user_ids: number[];
    total_count: number;
  };
  count: number;
}