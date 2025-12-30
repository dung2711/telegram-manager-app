// src/components/groups/CreateGroupDialog.tsx
'use client';

import { useState } from 'react';
import { CreateGroupRequest } from '@/types';
import { MemberSelector } from './MemberSelector';
import { X, Users, Globe, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accountID: string;
  onCreate: (data: CreateGroupRequest) => Promise<void>;
}

export function CreateGroupDialog({
  isOpen,
  onClose,
  accountID,
  onCreate,
}: CreateGroupDialogProps) {
  const [step, setStep] = useState<'type' | 'info' | 'members'>('type');
  const [type, setType] = useState<'basic_group' | 'super_group' | 'secret_chat'>('basic_group');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isChannel, setIsChannel] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 'type') {
      setStep('info');
    } else if (step === 'info') {
      // Basic Group & Secret Chat cần chọn members
      if (type === 'basic_group' || type === 'secret_chat') {
        setStep('members');
      } else {
        // Supergroup có thể tạo trống
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (step === 'members') {
      setStep('info');
    } else if (step === 'info') {
      setStep('type');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (type !== 'secret_chat' && !title.trim()) {
      return;
    }

    if (type === 'basic_group' && selectedUserIds.length === 0) {
      return; // Basic group cần ít nhất 1 member
    }

    if (type === 'secret_chat' && selectedUserIds.length !== 1) {
      return; // Secret chat cần đúng 1 member
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        accountID,
        type,
        title: title.trim(),
        description: description.trim(),
        isChannel: type === 'super_group' ? isChannel : undefined,
        userIds: selectedUserIds,
      });
      
      // Reset form
      setStep('type');
      setType('basic_group');
      setTitle('');
      setDescription('');
      setIsChannel(false);
      setSelectedUserIds([]);
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 'type') return true;
    if (step === 'info') {
      if (type === 'secret_chat') return true; // Secret chat không cần title
      return title.trim().length > 0;
    }
    if (step === 'members') {
      if (type === 'basic_group') return selectedUserIds.length > 0 && selectedUserIds.length <= 200;
      if (type === 'secret_chat') return selectedUserIds.length === 1;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'type' && 'Choose Group Type'}
              {step === 'info' && 'Group Information'}
              {step === 'members' && 'Select Members'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Step {step === 'type' ? 1 : step === 'info' ? 2 : 3} of 3
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Step 1: Choose Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Select the type of group you want to create
              </p>

              <div className="grid grid-cols-1 gap-4">
                {/* Basic Group */}
                <button
                  onClick={() => setType('basic_group')}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                    type === 'basic_group'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${
                    type === 'basic_group' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Users className={`w-6 h-6 ${
                      type === 'basic_group' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      Basic Group
                    </div>
                    <div className="text-sm text-gray-600">
                      Perfect for small teams. Up to 200 members. 
                      Requires at least 1 member to create.
                    </div>
                  </div>
                </button>

                {/* Supergroup */}
                <button
                  onClick={() => setType('super_group')}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                    type === 'super_group'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${
                    type === 'super_group' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Globe className={`w-6 h-6 ${
                      type === 'super_group' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      Supergroup
                    </div>
                    <div className="text-sm text-gray-600">
                      For large communities. Unlimited members. 
                      Can be created empty and add members later.
                    </div>
                  </div>
                </button>

                {/* Secret Chat */}
                <button
                  onClick={() => setType('secret_chat')}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                    type === 'secret_chat'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${
                    type === 'secret_chat' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Lock className={`w-6 h-6 ${
                      type === 'secret_chat' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      Secret Chat
                    </div>
                    <div className="text-sm text-gray-600">
                      End-to-end encrypted. One-on-one only. 
                      Select exactly 1 contact to chat with.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Group Info */}
          {step === 'info' && (
            <div className="space-y-5">
              {type !== 'secret_chat' && (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter group name"
                      required
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  {/* Description (Supergroup only) */}
                  {type === 'super_group' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter group description"
                        rows={3}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  )}

                  {/* Channel Toggle (Supergroup only) */}
                  {type === 'super_group' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isChannel"
                        checked={isChannel}
                        onChange={(e) => setIsChannel(e.target.checked)}
                        disabled={isSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isChannel" className="text-sm text-gray-700">
                        Create as Channel (broadcast only)
                      </label>
                    </div>
                  )}
                </>
              )}

              {type === 'secret_chat' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    Secret chats are end-to-end encrypted and work only on this device. 
                    You'll select the contact in the next step.
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {type === 'basic_group' && '• Basic groups support up to 200 members'}
                  {type === 'super_group' && '• Supergroups can have unlimited members'}
                  {type === 'secret_chat' && '• Secret chats are one-on-one only'}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Select Members */}
          {step === 'members' && (
            <div className="space-y-4">
              {type === 'basic_group' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Basic groups require at least 1 member to create. 
                    You can select up to 200 members.
                  </p>
                </div>
              )}

              {type === 'secret_chat' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    <strong>Note:</strong> Secret chats are one-on-one. 
                    Select exactly 1 contact to start an encrypted conversation.
                  </p>
                </div>
              )}

              <MemberSelector
                accountID={accountID}
                mode={type === 'secret_chat' ? 'single' : 'multiple'}
                minSelection={type === 'basic_group' ? 1 : type === 'secret_chat' ? 1 : 0}
                maxSelection={type === 'basic_group' ? 200 : type === 'secret_chat' ? 1 : Infinity}
                onSelect={setSelectedUserIds}
                selectedUserIds={selectedUserIds}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3">
          {step !== 'type' && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {step === 'members' || (step === 'info' && type === 'super_group') ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}