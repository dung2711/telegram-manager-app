'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { BulkSettings } from '@/components/settings/BulkSettings';
import { UISettings } from '@/components/settings/UISettings';
import { AboutSection } from '@/components/settings/AboutSection';
import { Settings as SettingsIcon, Zap, Palette, Info, RotateCcw, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

type SettingsTab = 'general' | 'bulk' | 'ui' | 'about';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { settings, isLoading, updateSetting, resetSettings, saveSettings } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: 'general' as SettingsTab, name: 'General', icon: SettingsIcon },
    { id: 'bulk' as SettingsTab, name: 'Bulk Operations', icon: Zap },
    { id: 'ui' as SettingsTab, name: 'UI Preferences', icon: Palette },
    { id: 'about' as SettingsTab, name: 'About', icon: Info },
  ];

  const handleUpdate = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    const success = updateSetting(key, value);
    if (success) {
      setHasChanges(false);
      toast.success('Settings saved');
    } else {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      toast.success('Settings reset to defaults');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your application preferences and configuration
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="col-span-12 md:col-span-9">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {activeTab === 'general' && (
              <GeneralSettings settings={settings} onUpdate={handleUpdate} />
            )}
            
            {activeTab === 'bulk' && (
              <BulkSettings settings={settings} onUpdate={handleUpdate} />
            )}
            
            {activeTab === 'ui' && (
              <UISettings settings={settings} onUpdate={handleUpdate} />
            )}
            
            {activeTab === 'about' && (
              <AboutSection settings={settings} onUpdate={handleUpdate} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}