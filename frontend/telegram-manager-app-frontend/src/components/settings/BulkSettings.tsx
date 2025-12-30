// src/components/settings/BulkSettings.tsx
'use client';

import { AppSettings } from '@/hooks/useSettings';

interface BulkSettingsProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function BulkSettings({ settings, onUpdate }: BulkSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bulk Operations
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure bulk import and member management settings
        </p>
      </div>

      {/* Auto-cleanup Contacts */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="autoCleanup"
          checked={settings.autoCleanupContacts}
          onChange={(e) => onUpdate('autoCleanupContacts', e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <div className="flex-1">
          <label htmlFor="autoCleanup" className="block text-sm font-medium text-gray-700">
            Auto-remove imported contacts
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Automatically remove contacts from your list after they are added to a group. 
            This keeps your contact list clean and prevents clutter.
          </p>
        </div>
      </div>

      {/* Phone Validation Strict */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="phoneStrict"
          checked={settings.phoneValidationStrict}
          onChange={(e) => onUpdate('phoneValidationStrict', e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <div className="flex-1">
          <label htmlFor="phoneStrict" className="block text-sm font-medium text-gray-700">
            Strict phone validation
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Enforce strict validation rules for phone numbers (10-15 digits only). 
            Disable this if you need more flexible validation.
          </p>
        </div>
      </div>

      {/* Bulk Add Delay */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delay between requests (ms)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1000"
            max="2000"
            step="100"
            value={settings.bulkAddDelay}
            onChange={(e) => onUpdate('bulkAddDelay', parseInt(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-sm font-medium text-gray-900 w-16">
            {settings.bulkAddDelay}ms
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Time to wait between adding each member. Higher values reduce rate limit risks 
          but take longer. 1-2 seconds recommended.
        </p>
      </div>
    </div>
  );
}