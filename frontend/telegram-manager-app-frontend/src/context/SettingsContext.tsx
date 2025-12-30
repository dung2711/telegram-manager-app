// src/context/SettingsContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { useSettings as useSettingsHook, AppSettings } from '@/hooks/useSettings';

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => boolean;
  saveSettings: (newSettings: Partial<AppSettings>) => boolean;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settingsHook = useSettingsHook();

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};