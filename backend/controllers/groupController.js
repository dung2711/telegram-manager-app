import { getClient } from '../services/tdClient.js';
import { getChatTitle, recordLog, getUserFullName } from '../services/auditService.js';

/**
 * Get chats with pagination and filtering options
 * @param {string} accountID - Account ID
 * @param {number} limit - Maximum number of chats to retrieve (default: 100)
 * @param {string} chatList - Type of chat list ("chatListMain" or "chatListArchive")
 * @returns {Promise<Object>} List of chats
 */
export const getChats = async (accountID, limit = 100, chatList = "chatListMain") => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        

        const chats = await client.invoke({
            _: "getChats",
            chat_list: {
                _: chatList
            },
            limit: limit
        });

        return {
            success: true,
            data: chats.chat_ids,
            count: chats.chat_ids?.length || 0
        };
    } catch (error) {
        console.error('Error fetching chats:', error);
        throw {
            success: false,
            error: error.message || 'Failed to fetch chats'
        };
    }
}

/**
 * Get detailed chat information including full info based on chat type
 * @param {string} accountID - Account ID
 * @param {number} chatId - Chat ID
 * @returns {Promise<Object>} Chat details with full info
 */
export const getChatDetails = async (accountID, chatId) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
            throw new Error('Valid chat ID is required');
        }

        const chat = await client.invoke({
            _: "getChat",
            chat_id: chatId
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
}

/**
 * Create a new basic group chat
 * @param {string} accountID - Account ID
 * @param {number[]} userIds - Array of user IDs to add to the group
 * @param {string} title - Group title
 * @returns {Promise<Object>} Created chat info
 */
export const createBasicGroupChat = async (accountID, userIds, title) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new Error('At least one user ID is required');
        }
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new Error('Valid group title is required');
        }
        if (userIds.length > 200) {
            throw new Error('Basic groups support maximum 200 members. Use supergroup instead.');
        }

        const chat = await client.invoke({
            _: "createNewBasicGroupChat",
            user_ids: userIds,
            title: title.trim()
        });
        // --- THÊM DÒNG NÀY ĐỂ DEBUG ---
        console.log("DEBUG CHAT OBJECT:", JSON.stringify(chat, null, 2)); 
        // ------------------------------

        // Log success
        recordLog({
            accountID,
            action: 'CREATE_BASIC_GROUP',
            targetId: chat.chat_id,
            targetName: title.trim(),
            payload: { chat },
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
        recordLog({
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
}

/**
 * Create a new secret chat
 * @param {string} accountID - Account ID
 * @param {number} userId - User ID to create secret chat with
 * @returns {Promise<Object>} Created secret chat info
 */
export const createNewSecretChat = async (accountID, userId) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!userId || typeof userId !== 'number') {
            throw new Error('Valid user ID is required');
        }

        const chat = await client.invoke({
            _: "createNewSecretChat",
            user_id: userId
        });

        // Lấy tên người được tạo chat cùng
        const partnerName = await getUserFullName(client, userId);

        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: 'CREATE_SECRET_CHAT',
            targetId: chat.chat_id,
            targetName: partnerName,
            payload: { chat },
            status: 'SUCCESS'
        });

        return {
            success: true,
            data: chat,
            message: 'Secret chat created successfully'
        };
    } catch (error) {
        // [LOG FAILURE]
        recordLog({
            accountID,
            action: 'CREATE_SECRET_CHAT',
            payload: { partnerUserId: userId },
            status: 'FAILURE',
            errorMessage: error.message
        });

        console.error('Error creating secret chat:', error);
        throw {
            success: false,
            error: error.message || 'Failed to create secret chat'
        };
    }
}

/**
 * Create a new supergroup or channel
 * @param {string} accountID - Account ID
 * @param {string} title - Group/channel title
 * @param {boolean} isChannel - True for channel, false for supergroup
 * @param {string} description - Group/channel description
 * @param {string} location - Location (optional)
 * @returns {Promise<Object>} Created chat info
 */
export const createNewSupergroupChat = async (accountID, title, isChannel = false, description = "", location = "") => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new Error('Valid group/channel title is required');
        }
        if (typeof isChannel !== 'boolean') {
            throw new Error('isChannel must be a boolean');
        }

        const chat = await client.invoke({
            _: "createNewSupergroupChat",
            title: title.trim(),
            is_channel: isChannel,
            description: description.trim(),
            location: location.trim()
        });

        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: isChannel ? 'CREATE_CHANNEL' : 'CREATE_SUPERGROUP',
            targetId: chat.chat_id,
            targetName: title.trim(),
            payload: { chat },
            status: 'SUCCESS'
        });

        return {
            success: true,
            data: chat,
            message: `${isChannel ? 'Channel' : 'Supergroup'} "${title}" created successfully`
        };
    } catch (error) {
        // [LOG FAILURE]
        recordLog({
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
}

/**
 * Add a member to a group chat
 * @param {string} accountID - Account ID
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID to add
 * @param {number} forwardLimit - Number of old messages to forward (0-300)
 * @returns {Promise<Object>} Result of add member operation
 */
export const addMemberToGroup = async (accountID, chatId, userId, forwardLimit = 0) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
            throw new Error('Valid chat ID is required');
        }
        if (!userId || typeof userId !== 'number') {
            throw new Error('Valid user ID is required');
        }
        if (forwardLimit < 0 || forwardLimit > 300) {
            throw new Error('Forward limit must be between 0 and 300');
        }

        await client.invoke({
            _: "addChatMember",
            chat_id: chatId,
            user_id: userId,
            forward_limit: forwardLimit
        });

        // Lấy thông tin phụ trợ cho log 
        const [chatTitle, userName] = await Promise.all([
            getChatTitle(client, chatId),
            getUserFullName(client, userId)
        ]);

        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: 'ADD_MEMBER',
            targetId: chatId,
            targetName: chatTitle,
            payload: { addedUserId: userId, addedUserName: userName, forwardLimit },
            status: 'SUCCESS'
        });

        return {
            success: true,
            message: `User ${userId} added to chat ${chatId} successfully`
        };
    } catch (error) {
        // [LOG FAILURE]
        recordLog({
            accountID,
            action: 'ADD_MEMBER',
            targetId: chatId,
            payload: { userId, forwardLimit },
            status: 'FAILURE',
            errorMessage: error.message
        });

        console.error(`Error adding user ${userId} to chat ${chatId}:`, error);
        throw {
            success: false,
            error: error.message || 'Failed to add member to group'
        };
    }
}

/**
 * Add multiple members to a supergroup
 * @param {string} accountID - Account ID
 * @param {number} chatId - Supergroup chat ID
 * @param {number[]} userIds - Array of user IDs to add
 * @returns {Promise<Object>} Result of add members operation
 */
export const addMembersToGroup = async (accountID, chatId, userIds) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
            throw new Error('Valid chat ID is required');
        }
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new Error('At least one user ID is required');
        }

        // Get chat details to ensure it's a supergroup
        const chatDetails = await getChatDetails(accountID, chatId);
        if (chatDetails.data.chatType !== 'chatTypeSupergroup') {
            throw new Error('This function only works with supergroups');
        }

        await client.invoke({
            _: "addChatMembers",
            chat_id: chatId,
            user_ids: userIds
        });
        // Lấy tên nhóm để log
        const chatTitle = chatDetails.data.chat.title;

        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: 'ADD_MEMBERS_BATCH',
            targetId: chatId,
            targetName: chatTitle,
            payload: { 
                addedUserIds: userIds, 
                count: userIds.length 
            },
            status: 'SUCCESS'
        });

        return {
            success: true,
            message: `${userIds.length} user(s) added to supergroup successfully`
        };
    } catch (error) {
        // [LOG FAILURE]
        recordLog({
            accountID,
            action: 'ADD_MEMBERS_BATCH',
            targetId: chatId,
            payload: { userIds },
            status: 'FAILURE',
            errorMessage: error.message
        });

        console.error(`Error adding members to supergroup ${chatId}:`, error);
        throw {
            success: false,
            error: error.message || 'Failed to add members to supergroup'
        };
    }
}

/**
 * Remove a member from a chat
 * @param {string} accountID - Account ID
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID to remove
 * @returns {Promise<Object>} Result of remove operation
 */
export const removeMemberFromGroup = async (accountID, chatId, userId) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
            throw new Error('Valid chat ID is required');
        }
        if (!userId || typeof userId !== 'number') {
            throw new Error('Valid user ID is required');
        }

        await client.invoke({
            _: "setChatMemberStatus",
            chat_id: chatId,
            user_id: userId,
            status: {
                _: "chatMemberStatusLeft"
            }
        });
        // Lấy thông tin cho log
        const [chatTitle, userName] = await Promise.all([
            getChatTitle(client, chatId),
            getUserFullName(client, userId)
        ]);

        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: 'REMOVE_MEMBER',
            targetId: chatId,
            targetName: chatTitle,
            payload: { removedUserId: userId, removedUserName: userName },
            status: 'SUCCESS'
        });

        return {
            success: true,
            message: `User ${userId} removed from chat ${chatId} successfully`
        };
    } catch (error) {
        // [LOG FAILURE]
        recordLog({
            accountID,
            action: 'REMOVE_MEMBER',
            targetId: chatId,
            payload: { userId },
            status: 'FAILURE',
            errorMessage: error.message
        });
        console.error(`Error removing user ${userId} from chat ${chatId}:`, error);
        throw {
            success: false,
            error: error.message || 'Failed to remove member from group'
        };
    }
}

/**
 * Get chat members
 * @param {string} accountID - Account ID
 * @param {number} chatId - Chat ID
 * @param {number} limit - Maximum number of members to retrieve
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} List of chat members
 */
export const getChatMembers = async (accountID, chatId, limit = 200, offset = 0) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
            throw new Error('Valid chat ID is required');
        }

        const chatDetails = await getChatDetails(accountID, chatId);
        const chatType = chatDetails.data.chatType;
        console.log('Fetching members for chat type:', chatType);

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
            // Private chats don't have members list, return the user info
            members = {
                members: [chatDetails.data.detail],
                total_count: 1
            };
        } else {
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
}

/**
 * Leave a chat
 * @param {string} accountID - Account ID
 * @param {number} chatId - Chat ID to leave
 * @returns {Promise<Object>} Result of leave operation
 */
export const leaveChat = async (accountID, chatId) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
            throw new Error('Valid chat ID is required');
        }
        // Lấy tên nhóm trước khi rời
        const chatTitle = await getChatTitle(client, chatId);

        await client.invoke({
            _: "leaveChat",
            chat_id: chatId
        });
        
        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: 'LEAVE_CHAT',
            targetId: chatId,
            targetName: chatTitle,
            status: 'SUCCESS'
        });

        return {
            success: true,
            message: `Left chat ${chatId} successfully`
        };
    } catch (error) {
        // [ LOG FAILURE]
        recordLog({
            accountID,
            action: 'LEAVE_CHAT',
            targetId: chatId,
            status: 'FAILURE',
            errorMessage: error.message
        });
        console.error(`Error leaving chat ${chatId}:`, error);
        throw {
            success: false,
            error: error.message || 'Failed to leave chat'
        };
    }
}

/**
 * Delete a chat
 * @param {string} accountID - Account ID
 * @param {number} chatId - Chat ID to delete
 * @returns {Promise<Object>} Result of delete operation
 */
export const deleteChat = async (accountID, chatId) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
            throw new Error('Valid chat ID is required');
        }

        // Lấy tên nhóm trước khi xoá
        const chatTitle = await getChatTitle(client, chatId);

        await client.invoke({
            _: "deleteChat",
            chat_id: chatId
        });

        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: 'DELETE_CHAT',
            targetId: chatId,
            targetName: chatTitle,
            status: 'SUCCESS'
        });

        return {
            success: true,
            message: `Chat ${chatId} deleted successfully`
        };
    } catch (error) {
        // [LOG FAILURE]
        recordLog({
            accountID,
            action: 'DELETE_CHAT',
            targetId: chatId,
            status: 'FAILURE',
            errorMessage: error.message
        });
        console.error(`Error deleting chat ${chatId}:`, error);
        throw {
            success: false,
            error: error.message || 'Failed to delete chat'
        };
    }
}

/**
 * Set chat title (works for basic groups and supergroups)
 * @param {string} accountID - Account ID
 * @param {number} chatId - Chat ID
 * @param {string} title - New title
 * @returns {Promise<Object>} Result of operation
 */
export const setChatTitle = async (accountID, chatId, title) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
            throw new Error('Valid chat ID is required');
        }
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new Error('Valid title is required');
        }

        const oldTitle = await getChatTitle(client, chatId);

        await client.invoke({
            _: "setChatTitle",
            chat_id: chatId,
            title: title.trim()
        });

        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: 'UPDATE_CHAT_TITLE',
            targetId: chatId,
            targetName: oldTitle.trim(), 
            payload: { newTitle: title.trim() },
            status: 'SUCCESS'
        });

        return {
            success: true,
            message: `Chat title updated to "${title}" successfully`
        };
    } catch (error) {
        // [LOG FAILURE]
        recordLog({
            accountID,
            action: 'UPDATE_CHAT_TITLE',
            targetId: chatId,
            payload: { attemptedTitle: title },
            status: 'FAILURE',
            errorMessage: error.message
        });
        console.error(`Error updating chat title for ${chatId}:`, error);
        throw {
            success: false,
            error: error.message || 'Failed to update chat title'
        };
    }
}

/**
 * Set chat description (works for supergroups and channels)
 * @param {string} accountID - Account ID
 * @param {number} chatId - Chat ID
 * @param {string} description - New description
 * @returns {Promise<Object>} Result of operation
 */
export const setChatDescription = async (accountID, chatId, description = "") => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
            throw new Error('Valid chat ID is required');
        }

        await client.invoke({
            _: "setChatDescription",
            chat_id: chatId,
            description: description.trim()
        });
        // Lấy tên nhóm để log 
        const chatTitle = await getChatTitle(client, chatId);

        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: 'UPDATE_CHAT_DESCRIPTION',
            targetId: chatId,
            targetName: chatTitle,
            payload: { newDescription: description.trim() },
            status: 'SUCCESS'
        });

        return {
            success: true,
            message: 'Chat description updated successfully'
        };
    } catch (error) {
        // [LOG FAILURE]
        recordLog({
            accountID,
            action: 'UPDATE_CHAT_DESCRIPTION',
            targetId: chatId,
            status: 'FAILURE',
            errorMessage: error.message
        });
        console.error(`Error updating chat description for ${chatId}:`, error);
        throw {
            success: false,
            error: error.message || 'Failed to update chat description'
        };
    }
}

/**
 * Set chat permissions (for supergroups)
 * @param {string} accountID - Account ID
 * @param {number} chatId - Chat ID
 * @param {Object} permissions - Chat permissions object
 * @returns {Promise<Object>} Result of operation
 */
export const setChatPermissions = async (accountID, chatId, permissions) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!chatId || (typeof chatId !== 'number' && typeof chatId !== 'string')) {
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
            chat_id: chatId,
            permissions: defaultPermissions
        });
         // Lấy tên nhóm để log 
        const chatTitle = await getChatTitle(client, chatId);

        // [LOG SUCCESS]
        recordLog({
            accountID,
            action: 'UPDATE_CHAT_PERMISSIONS',
            targetId: chatId,
            targetName: chatTitle,
            payload: { permissions: defaultPermissions },
            status: 'SUCCESS'
        });

        return {
            success: true,
            message: 'Chat permissions updated successfully'
        };
    } catch (error) {
        // [LOG FAILURE]
        recordLog({
            accountID,
            action: 'UPDATE_CHAT_PERMISSIONS',
            targetId: chatId,
            status: 'FAILURE',
            errorMessage: error.message
        });
        console.error(`Error updating chat permissions for ${chatId}:`, error);
        throw {
            success: false,
            error: error.message || 'Failed to update chat permissions'
        };
    }
}