'use client';

import { useState, useEffect } from 'react';
import { X, Edit, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EditGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string | number;
  chatType: string;
  currentTitle: string;
  currentDescription?: string;
  accountID: string;
  onUpdate: (title: string, description?: string) => Promise<void>;
}

export function EditGroupDialog({
  isOpen,
  onClose,
  chatId,
  chatType,
  currentTitle,
  currentDescription = '',
  accountID,
  onUpdate,
}: EditGroupDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const isSupergroup = chatType === 'chatTypeSupergroup';
  const isReadonly = chatType === 'chatTypeSecret' || chatType === 'chatTypePrivate';

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setDescription(currentDescription);
      setErrors({});
    }
  }, [isOpen, currentTitle, currentDescription]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    // Description validation (supergroup only)
    if (isSupergroup && description.length > 255) {
      newErrors.description = 'Description must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = () => {
    const titleChanged = title.trim() !== currentTitle;
    const descriptionChanged = isSupergroup && description.trim() !== currentDescription;
    return titleChanged || descriptionChanged;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors');
      return;
    }

    if (!hasChanges()) {
      toast('No changes to save');
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(title.trim(), isSupergroup ? description.trim() : undefined);
      toast.success('Group updated successfully');
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update group';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReadonly) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Cannot Edit</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                {chatType === 'chatTypeSecret' && 'Secret chats cannot be renamed.'}
                {chatType === 'chatTypePrivate' && 'Private chats cannot be renamed.'}
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Group</h2>
              <p className="text-sm text-gray-500">
                {isSupergroup ? 'Update name and description' : 'Update group name'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder="Enter group name"
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.title
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              maxLength={255}
              autoFocus
            />
            {errors.title && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {title.length} / 255 characters
            </div>
          </div>

          {/* Description Input (Supergroup only) */}
          {isSupergroup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors({ ...errors, description: undefined });
                }}
                placeholder="Enter group description"
                disabled={isSubmitting}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 resize-none transition-colors ${
                  errors.description
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                } disabled:bg-gray-50 disabled:text-gray-500`}
                maxLength={255}
              />
              {errors.description && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {description.length} / 255 characters
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {isSupergroup
                ? '💡 Supergroups can have both a name and description visible to all members.'
                : '💡 Basic groups can only have a name. Upgrade to a supergroup to add a description.'}
            </p>
          </div>

          {/* Changes Warning */}
          {!hasChanges() && title.trim() && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                ℹ️ No changes detected. Modify the {isSupergroup ? 'name or description' : 'name'} to save.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !hasChanges()}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubmitting || !title.trim() || !hasChanges()
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}