// src/utils/toastHelper.ts
import { toast as hotToast } from 'react-hot-toast';

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
 * Check if notifications are enabled
 */
const isNotificationsEnabled = (): boolean => {
  const settings = getSettings();
  return settings?.showNotifications !== false; // Default to true
};

/**
 * Wrapper cho react-hot-toast với settings check
 */
export const toast = {
  success: (message: string, options?: any) => {
    if (isNotificationsEnabled()) {
      return hotToast.success(message, options);
    }
  },
  
  error: (message: string, options?: any) => {
    if (isNotificationsEnabled()) {
      return hotToast.error(message, options);
    }
  },

  warning: (message: string, options?: any) => {
    if (isNotificationsEnabled()) {
      return hotToast(message, {
        icon: '⚠️', 
        style: {
          background: '#fff',     
          color: '#333',          
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.1), 0 3px 3px rgba(0,0,0,0.05)', 
          fontSize: '14px',
          maxWidth: '500px',      
        },
        ...options,
      });
    }
  },
  
  loading: (message: string, options?: any) => {
    if (isNotificationsEnabled()) {
      return hotToast.loading(message, options);
    }
  },
  
  promise: hotToast.promise, // Keep original for promise-based toasts
  
  custom: (jsx: any, options?: any) => {
    if (isNotificationsEnabled()) {
      return hotToast.custom(jsx, options);
    }
  },
  
  dismiss: hotToast.dismiss,
  remove: hotToast.remove,
};

/**
 * Debug log wrapper
 */
export const debugLog = (...args: any[]) => {
  const settings = getSettings();
  if (settings?.debugMode) {
    console.log('[DEBUG]', ...args);
  }
};