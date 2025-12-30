// src/types/index.ts

// --- COMMON RESPONSE WRAPPER ---
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- SYSTEM USER (Auth System) ---
export interface User {
  id: string;
  username: string;
  fullname: string;
  role: 'user' | 'admin';
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// --- RE-EXPORT ALL TYPES ---
export * from './account.types';
export * from './group.types';
export * from './user.types';
export * from './log.types';