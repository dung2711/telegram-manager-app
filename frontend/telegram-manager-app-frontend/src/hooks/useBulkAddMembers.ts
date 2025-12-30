// src/hooks/useBulkAddMembers.ts
import { useState } from 'react';
import { userService } from '@/services/userService';
import { groupService } from '@/services/groupService';
import { ParsedMember, ResolvedMember, AddMemberResult, BulkAddMembersResult } from '@/types';
import { normalizePhone } from '@/utils/phoneNormalizer';

interface BulkAddProgress {
  phase: 'parsing' | 'resolving' | 'importing' | 'adding' | 'complete';
  current: number;
  total: number;
  message: string;
}

export const useBulkAddMembers = (accountID: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkAddProgress | null>(null);

  /**
   * PHASE 1: Get existing contacts để tránh import duplicate
   */
  const getExistingContacts = async () => {
    try {
      const response = await userService.getContactDetails(accountID);
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get existing contacts:', error);
      return [];
    }
  };

  /**
   * PHASE 2: Resolve members - Import contacts mới và lấy userIds
   */
  const resolveMembers = async (members: ParsedMember[]): Promise<ResolvedMember[]> => {
    const validMembers = members.filter(m => m.isValid);
    setProgress({
      phase: 'resolving',
      current: 0,
      total: validMembers.length,
      message: 'Checking existing contacts...',
    });

    // Lấy danh sách contacts hiện có
    const existingContacts = await getExistingContacts();
    const existingPhones = new Set(
      existingContacts.map(c => normalizePhone(c.phone_number || ''))
    );

    // Chia thành 2 nhóm: đã có và chưa có
    const alreadyInContacts: ParsedMember[] = [];
    const needImport: ParsedMember[] = [];

    for (const member of validMembers) {
      if (existingPhones.has(member.phoneNumber)) {
        alreadyInContacts.push(member);
      } else {
        needImport.push(member);
      }
    }

    const resolved: ResolvedMember[] = [];

    // Xử lý members đã có trong contacts
    setProgress({
      phase: 'resolving',
      current: 0,
      total: validMembers.length,
      message: `Found ${alreadyInContacts.length} existing contacts...`,
    });

    for (const member of alreadyInContacts) {
      const contact = existingContacts.find(
        c => normalizePhone(c.phone_number || '') === member.phoneNumber
      );
      
      if (contact) {
        resolved.push({
          phoneNumber: member.phoneNumber,
          name: member.name || `${contact.first_name} ${contact.last_name || ''}`.trim(),
          userId: contact.id,
          status: 'resolved',
          wasImported: false, // Already existed
        });
      }
    }

    // Import contacts mới
    if (needImport.length > 0) {
      setProgress({
        phase: 'importing',
        current: 0,
        total: needImport.length,
        message: `Importing ${needImport.length} new contacts...`,
      });

      try {
        const contactsToImport = needImport.map(m => ({
          phone_number: m.phoneNumber,
          first_name: m.name || m.phoneNumber,
          last_name: '',
        }));

        const importResult = await userService.addContacts(accountID, contactsToImport);
        
        if (importResult.data.success) {
          const importedUserIds = importResult.data.data.user_ids || [];
          
          // Match imported userIds với members (theo thứ tự)
          for (let i = 0; i < needImport.length; i++) {
            const member = needImport[i];
            const userId = importedUserIds[i];
            
            if (userId) {
              resolved.push({
                phoneNumber: member.phoneNumber,
                name: member.name,
                userId,
                status: 'resolved',
                wasImported: true, // Mark as imported
              });
            } else {
              resolved.push({
                phoneNumber: member.phoneNumber,
                name: member.name,
                status: 'not_found',
                error: 'Phone number not found on Telegram',
                wasImported: false,
              });
            }
          }
        }
      } catch (error: any) {
        // Nếu import thất bại, đánh dấu tất cả là import_failed
        for (const member of needImport) {
          resolved.push({
            phoneNumber: member.phoneNumber,
            name: member.name,
            status: 'import_failed',
            error: error.response?.data?.error || 'Failed to import contact',
            wasImported: false,
          });
        }
      }
    }

    return resolved;
  };

  /**
   * PHASE 3: Add resolved members to group
   */
  const addToGroup = async (
    chatId: string | number,
    chatType: string,
    resolvedMembers: ResolvedMember[]
  ): Promise<AddMemberResult[]> => {
    setProgress({
      phase: 'adding',
      current: 0,
      total: resolvedMembers.length,
      message: 'Adding members to group...',
    });

    const results: AddMemberResult[] = [];
    
    // Lọc ra members có userId
    const validMembers = resolvedMembers.filter(m => m.userId && m.status === 'resolved');
    const invalidMembers = resolvedMembers.filter(m => !m.userId || m.status !== 'resolved');

    // Thêm invalid members vào results trước
    for (const member of invalidMembers) {
      results.push({
        phoneNumber: member.phoneNumber,
        name: member.name,
        status: 'not_found',
        error: member.error || 'User ID not found',
      });
    }

    // Add members vào group với detailed error handling
    if (validMembers.length > 0) {
      const userIds = validMembers.map(m => m.userId!);
      
      const addResult = await groupService.addMembersBulk(accountID, chatId, chatType, userIds);
      
      // Map results back to members
      for (const member of validMembers) {
        if (addResult.successful.includes(member.userId!)) {
          results.push({
            phoneNumber: member.phoneNumber,
            name: member.name,
            userId: member.userId,
            status: 'success',
          });
        } else if (addResult.alreadyMembers.includes(member.userId!)) {
          results.push({
            phoneNumber: member.phoneNumber,
            name: member.name,
            userId: member.userId,
            status: 'already_member',
            error: 'Already a member of this group',
          });
        } else {
          const failedEntry = addResult.failed.find(f => f.userId === member.userId);
          results.push({
            phoneNumber: member.phoneNumber,
            name: member.name,
            userId: member.userId,
            status: 'failed',
            error: failedEntry?.error || 'Failed to add to group',
          });
        }
        
        setProgress(prev => ({
          ...prev!,
          current: prev!.current + 1,
        }));
      }
    }

    return results;
  };

  /**
   * MAIN FUNCTION: Process bulk add with auto-cleanup
   */
  const processBulkAdd = async (
    chatId: string | number,
    chatType: string,
    members: ParsedMember[],
    options: { autoCleanup: boolean }
  ): Promise<BulkAddMembersResult> => {
    setIsProcessing(true);
    const importedUserIds: number[] = [];
    
    try {
      // Phase 1: Resolve members (import + get userIds)
      const resolvedMembers = await resolveMembers(members);
      
      // Track which ones were imported
      importedUserIds.push(
        ...resolvedMembers
          .filter(m => m.wasImported && m.userId)
          .map(m => m.userId!)
      );
      
      // Phase 2: Add to group
      const results = await addToGroup(chatId, chatType, resolvedMembers);
      
      // Phase 3: Auto-cleanup (if enabled)
      let cleanedUp = 0;
      if (options.autoCleanup && importedUserIds.length > 0) {
        try {
          await userService.removeContacts(accountID, importedUserIds);
          cleanedUp = importedUserIds.length;
          console.log(`✅ Cleaned up ${cleanedUp} imported contacts`);
        } catch (error) {
          console.error('⚠️ Cleanup failed:', error);
          // Don't fail the whole operation
        }
      }
      
      // Phase 4: Calculate summary
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed' || r.status === 'not_found').length;
      const alreadyMembers = results.filter(r => r.status === 'already_member').length;
      
      setProgress({
        phase: 'complete',
        current: results.length,
        total: results.length,
        message: 'Complete!',
      });

      return {
        total: members.length,
        successful,
        failed,
        alreadyMembers,
        results,
        cleanedUp, // Add cleanup count to result
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    progress,
    processBulkAdd,
  };
};