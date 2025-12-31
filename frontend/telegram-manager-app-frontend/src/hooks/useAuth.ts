// src/hooks/useAuth.ts

import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

/**
 * Custom hook để sử dụng AuthContext
 * Throw error nếu dùng ngoài AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}