'use client';

import { TDLibUser } from '@/types';
import { ContactCard } from './ContactCard';
import { Loader2 } from 'lucide-react';

interface ContactListProps {
  contacts: TDLibUser[];
  isLoading: boolean;
  onContactClick: (contact: TDLibUser) => void;
  onRemoveContact?: (userId: number) => void;
}

export function ContactList({ 
  contacts, 
  isLoading, 
  onContactClick,
  onRemoveContact 
}: ContactListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading contacts...</span>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No contacts found</div>
        <p className="text-gray-500 text-sm">
          Import contacts to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onClick={() => onContactClick(contact)}
          onRemove={onRemoveContact ? () => onRemoveContact(contact.id) : undefined}
        />
      ))}
    </div>
  );
}