// src/components/settings/AboutSection.tsx
'use client';

import { AppSettings } from '@/hooks/useSettings';
import { Info, Github, Mail, Globe } from 'lucide-react';

interface AboutSectionProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function AboutSection({ settings, onUpdate }: AboutSectionProps) {
  const appVersion = '1.0.0';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          About
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Application information and advanced settings
        </p>
      </div>

      {/* App Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">
              Telegram Manager
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Version: <span className="font-medium text-gray-900">{appVersion}</span></p>
              <p>API Endpoint: <span className="font-mono text-xs text-gray-700">{apiUrl}</span></p>
              <p>Build Date: <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Mode */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="debugMode"
          checked={settings.debugMode}
          onChange={(e) => onUpdate('debugMode', e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <div className="flex-1">
          <label htmlFor="debugMode" className="block text-sm font-medium text-gray-700">
            Debug mode
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Enable detailed console logging for troubleshooting. 
            May impact performance.
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Resources</h4>
        <div className="grid grid-cols-1 gap-3">
          <a
            href="https://github.com/dung2711/telegram-manager-app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Github className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">GitHub Repository</div>
              <div className="text-xs text-gray-500">View source code and contribute</div>
            </div>
          </a>

          <a
            href="https://core.telegram.org/tdlib/docs/td__api_8h.html?fbclid=IwY2xjawOV9vRleHRuA2FlbQIxMQBicmlkETFWangzcUQxNnFRSExhSHl1c3J0YwZhcHBfaWQBMAABHmoOUszjJHPiaQJxj-VkDCnJw6OXDxD3Rah6XLgRQ12P7CGdX9fzpbRTxRMH_aem_gY2Ns8ltik6LHrPov5tzfg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Globe className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Telegram Documentation</div>
              <div className="text-xs text-gray-500">Official Telegram API docs</div>
            </div>
          </a>

          <a
            href="mailto:dungphan25gt@gmail.com"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Contact Support</div>
              <div className="text-xs text-gray-500">Get help with issues</div>
            </div>
          </a>
        </div>
      </div>

      {/* License */}
      <div className="border-t pt-6">
        <p className="text-xs text-gray-500 text-center">
          © 2025 Telegram Manager. All rights reserved.
          <br />
          This software is licensed for personal and commercial use.
        </p>
      </div>
    </div>
  );
}