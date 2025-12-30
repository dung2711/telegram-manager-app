// src/components/settings/GeneralSettings.tsx
'use client';

import { AppSettings } from '@/hooks/useSettings';

interface GeneralSettingsProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          General Settings
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure general application preferences
        </p>
      </div>

      {/* Default Country Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Country Code
        </label>
        <select
          value={settings.defaultCountryCode}
          onChange={(e) => onUpdate('defaultCountryCode', e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="+84">+84 (Vietnam)</option>
          <option value="+1">+1 (USA/Canada)</option>
          <option value="+44">+44 (UK)</option>
          <option value="+86">+86 (China)</option>
          <option value="+91">+91 (India)</option>
          <option value="+81">+81 (Japan)</option>
          <option value="+82">+82 (South Korea)</option>
          <option value="+65">+65 (Singapore)</option>
        </select>
        <p className="text-sm text-gray-500 mt-2">
          Phone numbers without country code will be normalized to this format
        </p>
      </div>

      {/* Items Per Page */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Items Per Page
        </label>
        <select
          value={settings.itemsPerPage}
          onChange={(e) => onUpdate('itemsPerPage', parseInt(e.target.value))}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <p className="text-sm text-gray-500 mt-2">
          Number of items to display per page in lists
        </p>
      </div>
    </div>
  );
}