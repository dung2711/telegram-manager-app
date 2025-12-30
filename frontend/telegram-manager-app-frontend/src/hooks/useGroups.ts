// src/hooks/useGroups.ts
import { useState, useEffect, useCallback } from 'react';
import { groupService } from '@/services/groupService';
import { ChatListItem, CreateGroupRequest, AddMemberRequest, ChatPermissions } from '@/types';
import { toast } from '@/utils/toastHelper';

export const useGroups = (accountID?: string) => {
  const [groups, setGroups] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all groups
  const fetchGroups = useCallback(async () => {
    if (!accountID) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await groupService.getAll(accountID);
      setGroups(response.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load groups';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [accountID]);

  // Create group
  const createGroup = async (data: CreateGroupRequest) => {
    try {
      const response = await groupService.create(data);
      toast.success(response.data.message || 'Group created successfully');
      await fetchGroups(); // Refresh list
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create group';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Add members
  const addMembers = async (chatId: string | number, data: AddMemberRequest) => {
    try {
      const response = await groupService.addMembers(chatId, data);
      toast.success('Member(s) added successfully');
      await fetchGroups();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to add members';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Remove member
  const removeMember = async (chatId: string | number, userId: number) => {
    if (!accountID) return;

    try {
      await groupService.removeMember(accountID, chatId, userId);
      toast.success('Member removed successfully');
      await fetchGroups();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to remove member';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Leave group
  const leaveGroup = async (chatId: string | number) => {
    if (!accountID) return;

    try {
      await groupService.leave(accountID, chatId);
      toast.success('Left group successfully');
      await fetchGroups();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to leave group';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Delete group
  const deleteGroup = async (chatId: string | number) => {
    if (!accountID) return;

    try {
      await groupService.delete(accountID, chatId);
      toast.success('Group deleted successfully');
      await fetchGroups();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete group';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Update title
  const updateTitle = async (chatId: string | number, title: string) => {
    if (!accountID) return;

    try {
      await groupService.updateTitle(accountID, chatId, title);
      toast.success('Title updated successfully');
      await fetchGroups();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update title';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Update description
  const updateDescription = async (chatId: string | number, description: string) => {
    if (!accountID) return;

    try {
      await groupService.updateDescription(accountID, chatId, description);
      toast.success('Description updated successfully');
      await fetchGroups();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update description';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Update permissions
  const updatePermissions = async (chatId: string | number, permissions: Partial<ChatPermissions>) => {
    if (!accountID) return;

    try {
      await groupService.updatePermissions(accountID, chatId, permissions);
      toast.success('Permissions updated successfully');
      await fetchGroups();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update permissions';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Auto-fetch when accountID changes
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    isLoading,
    error,
    fetchGroups,
    createGroup,
    addMembers,
    removeMember,
    leaveGroup,
    deleteGroup,
    updateTitle,
    updateDescription,
    updatePermissions,
  };
};
