// src/components/groups/MemberSelector.tsx
'use client';

import { useState } from 'react';
import { TDLibUser } from '@/types';
import { useContacts } from '@/hooks/useContacts';
import { Search, X, CheckCircle } from 'lucide-react';

interface MemberSelectorProps {
  accountID: string;
  mode: 'single' | 'multiple';
  minSelection?: number;
  maxSelection?: number;
  onSelect: (userIds: number[]) => void;
  selectedUserIds?: number[];
}

export function MemberSelector({
  accountID,
  mode,
  minSelection = 0,
  maxSelection = Infinity,
  onSelect,
  selectedUserIds = [],
}: MemberSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelected, setLocalSelected] = useState<number[]>(selectedUserIds);
  
  const { contacts, isLoading } = useContacts(accountID);

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.first_name?.toLowerCase().includes(searchLower) ||
      contact.last_name?.toLowerCase().includes(searchLower) ||
      contact.username?.toLowerCase().includes(searchLower) ||
      contact.phone_number?.includes(searchQuery)
    );
  });

  const handleToggle = (userId: number) => {
    let newSelection: number[];
    
    if (mode === 'single') {
      newSelection = [userId];
    } else {
      if (localSelected.includes(userId)) {
        newSelection = localSelected.filter(id => id !== userId);
      } else {
        if (localSelected.length >= maxSelection) {
          return; // Max reached
        }
        newSelection = [...localSelected, userId];
      }
    }
    
    setLocalSelected(newSelection);
    onSelect(newSelection);
  };

  const handleRemove = (userId: number) => {
    const newSelection = localSelected.filter(id => id !== userId);
    setLocalSelected(newSelection);
    onSelect(newSelection);
  };

  const isSelected = (userId: number) => localSelected.includes(userId);

  const canSelect = (userId: number) => {
    if (isSelected(userId)) return true;
    if (mode === 'single') return true;
    return localSelected.length < maxSelection;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-600">
        Loading contacts...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Selected Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Selected: {localSelected.length}
          {minSelection > 0 && ` (min: ${minSelection})`}
          {maxSelection < Infinity && ` (max: ${maxSelection})`}
        </span>
        {localSelected.length > 0 && (
          <button
            onClick={() => {
              setLocalSelected([]);
              onSelect([]);
            }}
            className="text-red-600 hover:text-red-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Selected Members Chips */}
      {localSelected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          {localSelected.map(userId => {
            const contact = contacts.find(c => c.id === userId);
            if (!contact) return null;
            
            return (
              <div
                key={userId}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm"
              >
                <span className="truncate max-w-[150px]">
                  {contact.first_name} {contact.last_name}
                </span>
                <button
                  onClick={() => handleRemove(userId)}
                  className="hover:text-blue-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Contacts List */}
      <div className="border rounded-lg max-h-80 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No contacts found' : 'No contacts available'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredContacts.map(contact => {
              const selected = isSelected(contact.id);
              const selectable = canSelect(contact.id);
              
              return (
                <button
                  key={contact.id}
                  onClick={() => selectable && handleToggle(contact.id)}
                  disabled={!selectable && !selected}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                    selected
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : selectable
                      ? 'hover:bg-gray-50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selected
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {selected && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {contact.username && `@${contact.username} • `}
                      {contact.phone_number}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}