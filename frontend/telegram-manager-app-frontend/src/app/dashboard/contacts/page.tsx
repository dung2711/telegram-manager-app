'use client';

import { useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import { useContacts } from '@/hooks/useContacts';
import { ContactList } from '@/components/contacts/ContactList';
import { ImportContactsDialog } from '@/components/contacts/ImportContactsDialog';
import { TDLibUser } from '@/types';
import { Plus, RefreshCw, Upload, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ContactsPage() {
  const { selectedAccount } = useAccount();
  const accountID = selectedAccount?.accountID;
  
  const { contacts, isLoading, fetchContacts, addContacts, removeContacts, searchUsers } = useContacts(accountID);
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TDLibUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleImportContacts = async (contactsToImport: any[]) => {
    try {
      await addContacts(contactsToImport);
      setShowImportDialog(false);
    } catch (error) {
      console.error('Failed to import contacts:', error);
    }
  };

  const handleRemoveContact = async (userId: number) => {
    if (confirm('Are you sure you want to remove this contact?')) {
      try {
        await removeContacts([userId]);
      } catch (error) {
        console.error('Failed to remove contact:', error);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      toast.success(`Found ${results.length} users`);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const displayContacts = searchResults.length > 0 ? searchResults : contacts;

  if (!selectedAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please select an account to view contacts</p>
      </div>
    );
  }

  if (!selectedAccount.isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please authenticate your account to view contacts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            Manage your Telegram contacts
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchContacts}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-all ${
              isLoading
                ? 'border-blue-400 bg-blue-50 text-blue-700 cursor-wait'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Contacts
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              isSearching
                ? 'bg-blue-400 text-white cursor-wait'
                : !searchQuery.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          
          {searchResults.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-900">{contacts.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Contacts</div>
        </div>
        {searchResults.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="text-3xl font-bold text-blue-900">{searchResults.length}</div>
            <div className="text-sm text-blue-600 mt-1">Search Results</div>
          </div>
        )}
      </div>

      {/* Contacts List */}
      <ContactList
        contacts={displayContacts}
        isLoading={isLoading || isSearching}
        onContactClick={(contact) => console.log('Contact clicked:', contact)}
        onRemoveContact={searchResults.length === 0 ? handleRemoveContact : undefined}
      />

      {/* Import Dialog */}
      <ImportContactsDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportContacts}
      />
    </div>
  );
}