// src/types/auth.types.ts

/**
 * User entity từ backend
 */
export interface User {
  id: string;
  username: string;
  fullname: string;
  role: 'user' | 'admin';
  lastLogin?: Date | string;
  createdAt?: Date | string;
}

/**
 * Token pair từ backend
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth response từ backend (register/login)
 */
export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

/**
 * User info response từ /auth/me
 */
export interface UserResponse {
  success: boolean;
  data?: User;
  error?: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  username: string;
  fullname: string;
  password: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

/**
 * Logout request payload
 */
export interface LogoutRequest {
  refreshToken: string;
}

/**
 * Generic API response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}