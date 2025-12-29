import { getClient } from '../services/tdClient.js';
import { getChatTitle, recordLog, getUserFullName } from '../services/auditService.js';
import Account from '../models/Account.js';

/**
 * Sanitize accountID để tránh path traversal
 */
const sanitizeAccountID = (accountID) => {
  if (!accountID || typeof accountID !== 'string') {
    throw new Error('Invalid accountID');
  }
  
  const uuidRegex = /^[a-f0-9-]{36}$/i;
  if (!uuidRegex.test(accountID)) {
    throw new Error('Invalid accountID format');
  }
  
  return accountID;
};

/**
 * Verify account ownership
 */
const verifyAccountOwnership = async (accountID, userId) => {
  const account = await Account.findOne({
    accountID,
    owner: userId
  });
  
  if (!account) {
    throw new Error('Account not found or access denied');
  }
  
  if (!account.isAuthenticated) {
    throw new Error('Account is not authenticated. Please login to Telegram first.');
  }
  
  return account;
};

/**
 * Get chats with pagination and filtering options
 */
export const getChats = async (accountID, userId, limit = 100, chatList = "chatListMain") => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }

    const chats = await client.invoke({
      _: "getChats",
      chat_list: {
        _: chatList
      },
      limit: limit
    });

    // Log action
    await recordLog({
      accountID: validAccountID,
      action: 'GET_CHATS',
      payload: { count: chats.chat_ids?.length || 0, chatList },
      status: 'SUCCESS'
    });

    return {
      success: true,
      data: chats.chat_ids,
      count: chats.chat_ids?.length || 0
    };
    
  } catch (error) {
    console.error('Error fetching chats:', error);
    
    await recordLog({
      accountID,
      action: 'GET_CHATS',
      status: 'FAILURE',
      errorMessage: error.message
    });
    
    throw {
      success: false,
      error: error.message || 'Failed to fetch chats'
    };
  }
};

/**
 * Get detailed chat information
 */
export const getChatDetails = async (accountID, chatId, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    // Convert chatId to number if string
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }

    const chat = await client.invoke({
      _: "getChat",
      chat_id: validChatId
    });

    let detail = null;
    let chatType = chat.type._;
    
    switch (chatType) {
      case "chatTypeBasicGroup":
        detail = await client.invoke({
          _: "getBasicGroupFullInfo",
          basic_group_id: chat.type.basic_group_id
        });
        break;
      case "chatTypeSupergroup":
        detail = await client.invoke({
          _: "getSupergroupFullInfo",
          supergroup_id: chat.type.supergroup_id
        });
        break;
      case "chatTypePrivate":
        detail = await client.invoke({
          _: "getUser",
          user_id: chat.type.user_id
        });
        break;
      case "chatTypeSecret":
        detail = await client.invoke({
          _: "getSecretChat",
          secret_chat_id: chat.type.secret_chat_id
        });
        break;
      default:
        console.warn(`Unknown chat type: ${chatType}`);
        detail = null;
    }

    return {
      success: true,
      data: { chat, detail, chatType }
    };
    
  } catch (error) {
    console.error(`Error fetching chat details for ${chatId}:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to fetch chat details'
    };
  }
};

/**
 * Create a new basic group chat
 */
export const createBasicGroupChat = async (accountID, userIds, title, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('At least one user ID is required');
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Valid group title is required');
    }
    if (userIds.length > 200) {
      throw new Error('Basic groups support maximum 200 members. Use supergroup instead.');
    }

    // Convert userIds to numbers
    const validUserIds = userIds
      .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      .filter(id => !isNaN(id));

    if (validUserIds.length === 0) {
      throw new Error('No valid user IDs found');
    }

    const chat = await client.invoke({
      _: "createNewBasicGroupChat",
      user_ids: validUserIds,
      title: title.trim()
    });

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'CREATE_BASIC_GROUP',
      targetId: chat.id?.toString(),
      targetName: title.trim(),
      payload: { userIds: validUserIds, memberCount: validUserIds.length },
      status: 'SUCCESS'
    });

    return {
      success: true,
      data: chat,
      message: `Basic group "${title}" created successfully`
    };
    
  } catch (error) {
    console.error('Error creating basic group:', error);

    // Log failure
    await recordLog({
      accountID,
      action: 'CREATE_BASIC_GROUP',
      targetName: title,
      payload: { userIds },
      status: 'FAILURE',
      errorMessage: error.message
    });

    throw {
      success: false,
      error: error.message || 'Failed to create basic group'
    };
  }
};

/**
 * Create a new secret chat
 */
export const createNewSecretChat = async (accountID, targetUserId, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validTargetUserId = typeof targetUserId === 'string' 
      ? parseInt(targetUserId, 10) 
      : targetUserId;
    
    if (!validTargetUserId || isNaN(validTargetUserId)) {
      throw new Error('Valid user ID is required');
    }

    const chat = await client.invoke({
      _: "createNewSecretChat",
      user_id: validTargetUserId
    });

    // Lấy tên người được tạo chat cùng
    const partnerName = await getUserFullName(client, validTargetUserId);

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'CREATE_SECRET_CHAT',
      targetId: chat.id?.toString(),
      targetName: partnerName,
      payload: { partnerUserId: validTargetUserId },
      status: 'SUCCESS'
    });

    return {
      success: true,
      data: chat,
      message: 'Secret chat created successfully'
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'CREATE_SECRET_CHAT',
      payload: { partnerUserId: targetUserId },
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error('Error creating secret chat:', error);
    throw {
      success: false,
      error: error.message || 'Failed to create secret chat'
    };
  }
};

/**
 * Create a new supergroup or channel
 */
export const createNewSupergroupChat = async (accountID, title, isChannel = false, description = "", location = "", userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Valid group/channel title is required');
    }
    if (typeof isChannel !== 'boolean') {
      throw new Error('isChannel must be a boolean');
    }

    const requestPayload = {
      _: "createNewSupergroupChat",
      title: title.trim(),
      is_channel: !!isChannel, 
      description: description ? description.trim() : ""
    };

    if (location && typeof location === 'object' && location.latitude && location.longitude) {
       requestPayload.location = {
         _: "chatLocation",
         location: {
           _: "location",
           latitude: location.latitude,
           longitude: location.longitude
         }
       };
    }

    // Gọi TDLib với payload đã sửa
    const chat = await client.invoke(requestPayload);

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: isChannel ? 'CREATE_CHANNEL' : 'CREATE_SUPERGROUP',
      targetId: chat.id?.toString(),
      targetName: title.trim(),
      payload: { isChannel, description: description.trim() },
      status: 'SUCCESS'
    });

    return {
      success: true,
      data: chat,
      message: `${isChannel ? 'Channel' : 'Supergroup'} "${title}" created successfully`
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: isChannel ? 'CREATE_CHANNEL' : 'CREATE_SUPERGROUP',
      targetName: title,
      payload: { description },
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error('Error creating supergroup/channel:', error);
    throw {
      success: false,
      error: error.message || 'Failed to create supergroup/channel'
    };
  }
};

/**
 * Add a member to a group chat
 */
export const addMemberToGroup = async (accountID, chatId, targetUserId, forwardLimit = 0, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    const validTargetUserId = typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }
    if (!validTargetUserId || isNaN(validTargetUserId)) {
      throw new Error('Valid user ID is required');
    }
    if (forwardLimit < 0 || forwardLimit > 300) {
      throw new Error('Forward limit must be between 0 and 300');
    }

    await client.invoke({
      _: "addChatMember",
      chat_id: validChatId,
      user_id: validTargetUserId,
      forward_limit: forwardLimit
    });

    // Lấy thông tin phụ trợ cho log
    const [chatTitle, userName] = await Promise.all([
      getChatTitle(client, validChatId),
      getUserFullName(client, validTargetUserId)
    ]);

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'ADD_MEMBER',
      targetId: validChatId.toString(),
      targetName: chatTitle,
      payload: { addedUserId: validTargetUserId, addedUserName: userName, forwardLimit },
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `User added to chat successfully`
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'ADD_MEMBER',
      targetId: chatId?.toString(),
      payload: { userId: targetUserId, forwardLimit },
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error(`Error adding user to chat:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to add member to group'
    };
  }
};

/**
 * Add multiple members to a supergroup
 */
export const addMembersToGroup = async (accountID, chatId, userIds, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('At least one user ID is required');
    }

    // Convert userIds to numbers
    const validUserIds = userIds
      .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      .filter(id => !isNaN(id));

    if (validUserIds.length === 0) {
      throw new Error('No valid user IDs found');
    }

    // Get chat details to ensure it's a supergroup
    const chatDetails = await getChatDetails(accountID, validChatId, userId);
    if (chatDetails.data.chatType !== 'chatTypeSupergroup') {
      throw new Error('This function only works with supergroups');
    }

    await client.invoke({
      _: "addChatMembers",
      chat_id: validChatId,
      user_ids: validUserIds
    });

    const chatTitle = chatDetails.data.chat.title;

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'ADD_MEMBERS_BATCH',
      targetId: validChatId.toString(),
      targetName: chatTitle,
      payload: { 
        addedUserIds: validUserIds, 
        count: validUserIds.length 
      },
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `${validUserIds.length} user(s) added to supergroup successfully`
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'ADD_MEMBERS_BATCH',
      targetId: chatId?.toString(),
      payload: { userIds },
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error(`Error adding members to supergroup:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to add members to supergroup'
    };
  }
};

/**
 * Remove a member from a chat
 */
export const removeMemberFromGroup = async (accountID, chatId, targetUserId, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    const validTargetUserId = typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }
    if (!validTargetUserId || isNaN(validTargetUserId)) {
      throw new Error('Valid user ID is required');
    }

    await client.invoke({
      _: "setChatMemberStatus",
      chat_id: validChatId,
      user_id: validTargetUserId,
      status: {
        _: "chatMemberStatusLeft"
      }
    });

    // Lấy thông tin cho log
    const [chatTitle, userName] = await Promise.all([
      getChatTitle(client, validChatId),
      getUserFullName(client, validTargetUserId)
    ]);

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'REMOVE_MEMBER',
      targetId: validChatId.toString(),
      targetName: chatTitle,
      payload: { removedUserId: validTargetUserId, removedUserName: userName },
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `User removed from chat successfully`
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'REMOVE_MEMBER',
      targetId: chatId?.toString(),
      payload: { userId: targetUserId },
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error(`Error removing user from chat:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to remove member from group'
    };
  }
};

/**
 * Get chat members
 */
export const getChatMembers = async (accountID, chatId, userId, limit = 200, offset = 0) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }

    const chatDetails = await getChatDetails(accountID, validChatId, userId);
    const chatType = chatDetails.data.chatType;

    let members;
    if (chatType === 'chatTypeSupergroup') {
      members = await client.invoke({
        _: "getSupergroupMembers",
        supergroup_id: chatDetails.data.chat.type.supergroup_id,
        filter: { _: "supergroupMembersFilterRecent" },
        offset: offset,
        limit: limit
      });
    } else if (chatType === 'chatTypeBasicGroup') {
      const fullInfo = await client.invoke({
        _: "getBasicGroupFullInfo",
        basic_group_id: chatDetails.data.chat.type.basic_group_id
      });
      members = {
        members: fullInfo.members,
        total_count: fullInfo.members?.length || 0
      };
    } else if (chatType === 'chatTypePrivate') {
      members = {
        members: [chatDetails.data.detail],
        total_count: 1
      };
    } else if (chatType === 'chatTypeSecret') {
        const partnerId = chatDetails.data.detail.user_id;

        members = [{
          members: [partnerId], 
          total_count: 1
        }];
        
        
    }else {
      throw new Error('Chat type does not support member listing');
    }

    return {
      success: true,
      data: members,
      count: members.members?.length || members.total_count || 0
    };
    
  } catch (error) {
    console.error(`Error fetching members for chat ${chatId}:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to fetch chat members'
    };
  }
};

/**
 * Leave a chat
 */
export const leaveChat = async (accountID, chatId, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }

    // Lấy tên nhóm trước khi rời
    const chatTitle = await getChatTitle(client, validChatId);

    await client.invoke({
      _: "leaveChat",
      chat_id: validChatId
    });
    
    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'LEAVE_CHAT',
      targetId: validChatId.toString(),
      targetName: chatTitle,
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `Left chat successfully`
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'LEAVE_CHAT',
      targetId: chatId?.toString(),
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error(`Error leaving chat:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to leave chat'
    };
  }
};

/**
 * Delete a chat
 */
export const deleteChat = async (accountID, chatId, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }

    // Lấy tên nhóm trước khi xoá
    const chatTitle = await getChatTitle(client, validChatId);

    await client.invoke({
      _: "deleteChat",
      chat_id: validChatId
    });

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'DELETE_CHAT',
      targetId: validChatId.toString(),
      targetName: chatTitle,
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `Chat deleted successfully`
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'DELETE_CHAT',
      targetId: chatId?.toString(),
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error(`Error deleting chat:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to delete chat'
    };
  }
};

/**
 * Set chat title
 */
export const setChatTitle = async (accountID, chatId, title, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Valid title is required');
    }

    const oldTitle = await getChatTitle(client, validChatId);

    await client.invoke({
      _: "setChatTitle",
      chat_id: validChatId,
      title: title.trim()
    });

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'UPDATE_CHAT_TITLE',
      targetId: validChatId.toString(),
      targetName: oldTitle, 
      payload: { newTitle: title.trim() },
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `Chat title updated to "${title}" successfully`
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'UPDATE_CHAT_TITLE',
      targetId: chatId?.toString(),
      payload: { attemptedTitle: title },
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error(`Error updating chat title:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to update chat title'
    };
  }
};

/**
 * Set chat description
 */
export const setChatDescription = async (accountID, chatId, description = "", userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }

    await client.invoke({
      _: "setChatDescription",
      chat_id: validChatId,
      description: description.trim()
    });

    const chatTitle = await getChatTitle(client, validChatId);

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'UPDATE_CHAT_DESCRIPTION',
      targetId: validChatId.toString(),
      targetName: chatTitle,
      payload: { newDescription: description.trim() },
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: 'Chat description updated successfully'
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'UPDATE_CHAT_DESCRIPTION',
      targetId: chatId?.toString(),
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error(`Error updating chat description:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to update chat description'
    };
  }
};

/**
 * Set chat permissions
 */
export const setChatPermissions = async (accountID, chatId, permissions, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const validChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    
    if (!validChatId || isNaN(validChatId)) {
      throw new Error('Valid chat ID is required');
    }
    if (!permissions || typeof permissions !== 'object') {
      throw new Error('Valid permissions object is required');
    }

    const defaultPermissions = {
      _: "chatPermissions",
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
      can_change_info: false,
      can_invite_users: false,
      can_pin_messages: false,
      ...permissions
    };

    await client.invoke({
      _: "setChatPermissions",
      chat_id: validChatId,
      permissions: defaultPermissions
    });

    const chatTitle = await getChatTitle(client, validChatId);

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'UPDATE_CHAT_PERMISSIONS',
      targetId: validChatId.toString(),
      targetName: chatTitle,
      payload: { permissions: defaultPermissions },
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: 'Chat permissions updated successfully'
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'UPDATE_CHAT_PERMISSIONS',
      targetId: chatId?.toString(),
      status: 'FAILURE',
      errorMessage: error.message
    });

    console.error(`Error updating chat permissions:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to update chat permissions'
    };
  }
};