// src/components/settings/UISettings.tsx
'use client';

import { AppSettings } from '@/hooks/useSettings';

interface UISettingsProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function UISettings({ settings, onUpdate }: UISettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          UI Preferences
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Customize the user interface and notifications
        </p>
      </div>

      {/* Toast Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notification duration (seconds)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1000"
            max="10000"
            step="1000"
            value={settings.toastDuration}
            onChange={(e) => onUpdate('toastDuration', parseInt(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-sm font-medium text-gray-900 w-12">
            {settings.toastDuration / 1000}s
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          How long toast notifications stay on screen
        </p>
      </div>

      {/* Show Notifications */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="showNotifications"
          checked={settings.showNotifications}
          onChange={(e) => onUpdate('showNotifications', e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <div className="flex-1">
          <label htmlFor="showNotifications" className="block text-sm font-medium text-gray-700">
            Show notifications
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Display toast notifications for success, error, and info messages
          </p>
        </div>
      </div>
    </div>
  );
}