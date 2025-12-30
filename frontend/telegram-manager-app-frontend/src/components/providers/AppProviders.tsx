'use client';

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { AccountProvider } from '@/context/AccountContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { Toaster } from 'react-hot-toast';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [toastDuration, setToastDuration] = useState(3000);

  // Load toast duration from settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem('telegram-manager-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.toastDuration) {
          setToastDuration(settings.toastDuration);
        }
      }
    } catch (error) {
      console.error('Failed to load toast settings:', error);
    }

    // Listen for settings changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'telegram-manager-settings' && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          if (settings.toastDuration) {
            setToastDuration(settings.toastDuration);
          }
        } catch (error) {
          console.error('Failed to parse settings:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthProvider>
      <AccountProvider>
        <SettingsProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: toastDuration,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: toastDuration,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: toastDuration + 1000, 
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </SettingsProvider>
      </AccountProvider>
    </AuthProvider>
  );
}