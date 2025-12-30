// src/hooks/useSettings.ts
import { useState, useEffect } from 'react';

export interface AppSettings {
  // General
  defaultCountryCode: string;
  itemsPerPage: number;
  
  // Bulk Operations
  autoCleanupContacts: boolean;
  phoneValidationStrict: boolean;
  bulkAddDelay: number; // milliseconds
  
  // UI Preferences
  toastDuration: number; // milliseconds
  showNotifications: boolean;
  
  // Advanced
  debugMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  // General
  defaultCountryCode: '+84',
  itemsPerPage: 20,
  
  // Bulk Operations
  autoCleanupContacts: true,
  phoneValidationStrict: true,
  bulkAddDelay: 1000,
  
  // UI Preferences
  toastDuration: 3000,
  showNotifications: true,
  
  // Advanced
  debugMode: false,
};

const STORAGE_KEY = 'telegram-manager-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: Partial<AppSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  };

  // Update single setting
  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    return saveSettings({ [key]: value });
  };

  return {
    settings,
    isLoading,
    saveSettings,
    updateSetting,
    resetSettings,
  };
};