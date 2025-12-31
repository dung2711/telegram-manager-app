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

// --- RE-EXPORT ALL TYPES ---
export * from './account.types';
export * from './group.types';
export * from './user.types';
export * from './log.types';
export * from './auth.types';
export * from './account.types';
export * from './telegram.types';