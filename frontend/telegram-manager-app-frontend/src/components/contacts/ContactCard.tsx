'use client';

import { TDLibUser } from '@/types';
import { User, Phone, AtSign, UserMinus, CheckCircle, Shield } from 'lucide-react';

interface ContactCardProps {
  contact: TDLibUser;
  onClick: () => void;
  onRemove?: () => void;
}

export function ContactCard({ contact, onClick, onRemove }: ContactCardProps) {
  const displayName = `${contact.first_name} ${contact.last_name || ''}`.trim();
  
  const getStatusColor = () => {
    if (!contact.status) return 'bg-gray-400';
    
    switch (contact.status._) {
      case 'userStatusOnline':
        return 'bg-green-500';
      case 'userStatusRecently':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    if (!contact.status) return 'Unknown';
    
    switch (contact.status._) {
      case 'userStatusOnline':
        return 'Online';
      case 'userStatusRecently':
        return 'Recently';
      case 'userStatusLastWeek':
        return 'Last week';
      case 'userStatusLastMonth':
        return 'Last month';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getStatusColor()} rounded-full border-2 border-white`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name & Badges */}
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onClick}
              className="font-semibold text-gray-900 hover:text-blue-600 truncate"
            >
              {displayName}
            </button>
            {contact.is_verified && (
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
            {contact.is_support && (
              <Shield className="w-4 h-4 text-purple-500 flex-shrink-0" />
            )}
          </div>

          {/* Username */}
          {contact.username && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <AtSign className="w-3.5 h-3.5" />
              <span className="truncate">@{contact.username}</span>
            </div>
          )}

          {/* Phone */}
          {contact.phone_number && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-mono">{contact.phone_number}</span>
            </div>
          )}

          {/* Status & Actions */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              {getStatusText()}
            </span>
            
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="text-red-600 hover:text-red-700 p-1"
                title="Remove contact"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}