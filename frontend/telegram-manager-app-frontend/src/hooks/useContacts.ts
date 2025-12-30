// src/hooks/useContacts.ts
import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/userService';
import { TDLibUser, ContactToImport } from '@/types';
import { toast } from '@/utils/toastHelper';

export const useContacts = (accountID?: string) => {
  const [contacts, setContacts] = useState<TDLibUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all contacts with details
  const fetchContacts = useCallback(async () => {
    if (!accountID) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.getContactDetails(accountID);
      if (response.data.success) {
        setContacts(response.data.data);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load contacts';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [accountID]);

  // Search users
  const searchUsers = async (query: string) => {
    if (!accountID || !query.trim()) return [];

    try {
      const response = await userService.searchUsers(accountID, query);
      if (response.data.success) {
        // Fetch details for search results
        const userIds = response.data.data.user_ids;
        const detailsResponse = await userService.getContactDetails(accountID, userIds);
        return detailsResponse.data.data;
      }
      return [];
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Search failed';
      toast.error(errorMsg);
      return [];
    }
  };

  // Add contacts
  const addContacts = async (contactsToAdd: ContactToImport[]) => {
    if (!accountID) return;

    try {
      const response = await userService.addContacts(accountID, contactsToAdd);
      
      // toast.success(`${response.data.imported} contact(s) added successfully`); 

      await fetchContacts(); 
      
      return response.data; 
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to add contacts';
      toast.error(errorMsg); 
      throw err;
    }
  };

  // Remove contacts
  const removeContacts = async (userIds: number[]) => {
    if (!accountID) return;

    try {
      const response = await userService.removeContacts(accountID, userIds);
      toast.success(`${response.data.data.removed} contact(s) removed successfully`);
      await fetchContacts(); // Refresh list
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to remove contacts';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Get user by ID
  const getUserById = async (userId: number) => {
    if (!accountID) return null;

    try {
      const response = await userService.getUserById(accountID, userId);
      return response.data.data;
    } catch (err: any) {
      console.error('Failed to get user:', err);
      return null;
    }
  };

  // Auto-fetch when accountID changes
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    isLoading,
    error,
    fetchContacts,
    searchUsers,
    addContacts,
    removeContacts,
    getUserById,
  };
};