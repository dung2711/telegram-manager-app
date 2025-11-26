import express from 'express';
import { getChats, getChatDetails, getChatMembers,
    createBasicGroupChat, createNewSecretChat, createNewSupergroupChat,
    addMemberToGroup, addMembersToGroup, removeMemberFromGroup,
    leaveChat, deleteChat, setChatTitle, setChatDescription, setChatPermissions
 } from "../controllers/groupController.js";

const router = express.Router();

/**
 * GET /api/groups/:accountID
 * Get all chats with their details and members
 * 
 * @param {string} accountID - Account ID
 * @query {number} [limit] - Maximum number of chats to retrieve (20, 50, 100, or 200)
 * @query {string} [chatList] - Type of chat list ("chatListMain" or "chatListArchive")
 * 
 * @returns {Object[]} Array of chat objects
 * @returns {number} return[].chatId - Chat ID
 * @returns {Object} return[].detail - Chat details including:
 *   - {Object} chat - Basic chat information (id, title, type, photo, etc.)
 *   - {Object} detail - Full chat info (description, member_count, invite_link, etc.)
 *   - {string} chatType - Type of chat ("chatTypeBasicGroup", "chatTypeSupergroup", etc.)
 * @returns {Object} return[].members - Chat members information:
 *   - {Object[]} members - Array of member objects
 *   - {number} total_count - Total number of members
 * 
 * @example
 * GET /api/groups
 * GET /api/groups?limit=50&chatList=chatListMain
 * 
 * Response:
 * [
 *   {
 *     "chatId": 123456789,
 *     "detail": {
 *       "success": true,
 *       "data": {
 *         "chat": { "id": 123456789, "title": "My Group", "type": {...} },
 *         "detail": { "description": "Group description", "member_count": 10 },
 *         "chatType": "chatTypeSupergroup"
 *       }
 *     },
 *     "members": {
 *       "success": true,
 *       "data": { "members": [...], "total_count": 10 }
 *     }
 *   }
 * ]
 */
router.get('/:accountID', async (req, res) => {
    try {
        const { accountID } = req.params;
        const result = await getChats(accountID);
        if(result.success) {
            const chatDetails = await Promise.all(
                result.data.chats.map(async (chatId) => {
                    try {
                        const detail = await getChatDetails(accountID, chatId);
                        const members = await getChatMembers(accountID, chatId);
                        return {
                            chatId,
                            detail: detail.data,
                            members: members.data
                        };
                    } catch (err) {
                        console.error(`Failed to fetch details for chat ${chatId}:`, err);
                        return null;
                    }
                }
            ));
            const filteredDetails = chatDetails.filter(chat => chat !== null);
            res.status(200).json(filteredDetails);
        }
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * GET /api/groups/:accountID/:id
 * Get details of a specific chat by ID
 * 
 * @param {string} accountID - Account ID
 * @param {string|number} id - Chat ID
 * 
 * @returns {Object} Chat information object
 * @returns {Object} detail - Chat details:
 *   - {boolean} success - Whether the request was successful
 *   - {Object} data - Contains chat, detail, and chatType
 * @returns {Object} members - Chat members:
 *   - {boolean} success - Whether the request was successful
 *   - {Object} data - Members array and count
 *   - {number} count - Total number of members
 * 
 * @example
 * GET /api/groups/123456789
 * 
 * Response:
 * {
 *   "detail": {
 *     "success": true,
 *     "data": {
 *       "chat": { "id": 123456789, "title": "My Group", ... },
 *       "detail": { "description": "...", "member_count": 10 },
 *       "chatType": "chatTypeSupergroup"
 *     }
 *   },
 *   "members": {
 *     "success": true,
 *     "data": { "members": [...], "total_count": 10 },
 *     "count": 10
 *   }
 * }
 */
router.get('/:accountID/:id', async (req, res) => {
    try {
        const { accountID, id: chatId } = req.params;
        const detail = await getChatDetails(accountID, chatId);
        const members = await getChatMembers(accountID, chatId);
        res.status(200).json({ detail, members });
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * POST /api/groups/:accountID
 * Create a new chat (basic group, supergroup, channel, or secret chat)
 * 
 * @param {string} accountID - Account ID
 * @body {string} type - Type of chat to create: "basic_group", "super_group", or "secret_chat"
 * @body {string} title - Chat title (required for basic_group and super_group)
 * @body {number[]} userIds - Array of user IDs to add (required for basic_group and secret_chat)
 * @body {boolean} [isChannel] - True for channel, false for supergroup (only for super_group type)
 * @body {string} [description] - Chat description (only for super_group type)
 * @body {string} [location] - Chat location (only for super_group type)
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the operation was successful
 * @returns {Object} data - Created chat object with id, title, type, etc.
 * @returns {string} message - Success message
 * 
 * @example
 * // Create basic group
 * POST /api/groups
 * Body: {
 *   "type": "basic_group",
 *   "title": "My Group",
 *   "userIds": [123456, 789012]
 * }
 * 
 * // Create supergroup
 * POST /api/groups
 * Body: {
 *   "type": "super_group",
 *   "title": "My Supergroup",
 *   "isChannel": false,
 *   "description": "This is a supergroup"
 * }
 * 
 * // Create channel
 * POST /api/groups
 * Body: {
 *   "type": "super_group",
 *   "title": "My Channel",
 *   "isChannel": true,
 *   "description": "This is a channel"
 * }
 * 
 * // Create secret chat
 * POST /api/groups
 * Body: {
 *   "type": "secret_chat",
 *   "userIds": [123456]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { "id": 123456789, "title": "My Group", ... },
 *   "message": "Basic group 'My Group' created successfully"
 * }
 */
router.post('/:accountID', async (req, res) => {
    try {
        const { accountID } = req.params;
        const { type, title, userIds } = req.body;
        if (type === 'basic_group') {
            const result = await createBasicGroupChat(accountID, userIds, title);
            res.status(200).json(result);
        } else if (type === 'super_group') {
            const { isChannel, description, location } = req.body;
            const result = await createNewSupergroupChat(accountID, title, isChannel, description, location);
            res.status(200).json(result);
        } else if (type === 'secret_chat') {
            const id = parseInt(userIds[0], 10);
            const result = await createNewSecretChat(accountID, id);
            res.status(200).json(result);
        } else {
            res.status(400).json({ success: false, error: 'Invalid chat type' });
        }
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * POST /api/groups/:accountID/:id/addMember
 * Add a single member to a chat
 * 
 * @param {string} accountID - Account ID
 * @param {string|number} id - Chat ID
 * @body {number} userId - User ID to add to the chat
 * @body {number} [forwardLimit] - Number of old messages to forward to the new member (0-300, default: 0)
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the operation was successful
 * @returns {string} message - Success message
 * 
 * @example
 * POST /api/groups/123456789/addMember
 * Body: {
 *   "userId": 987654321,
 *   "forwardLimit": 0
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User 987654321 added to chat 123456789 successfully"
 * }
 */
router.post('/:accountID/:id/addMember', async (req, res) => {
    try {
        const { accountID, id: chatId } = req.params;
        const { userId, forwardLimit } = req.body;
        const result = await addMemberToGroup(accountID, chatId, userId, forwardLimit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * POST /api/groups/:accountID/:id/addMembers
 * Add multiple members to a supergroup (only works with supergroups)
 * 
 * @param {string} accountID - Account ID
 * @param {string|number} id - Supergroup chat ID
 * @body {number[]} userIds - Array of user IDs to add to the supergroup
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the operation was successful
 * @returns {string} message - Success message with number of users added
 * 
 * @example
 * POST /api/groups/123456789/addMembers
 * Body: {
 *   "userIds": [111111, 222222, 333333]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "3 user(s) added to supergroup successfully"
 * }
 * 
 * @error Returns error if chat is not a supergroup
 */
router.post('/:accountID/:id/addMembers', async (req, res) => {
    try {
        const { accountID, id: chatId } = req.params;
        const { userIds } = req.body;
        const result = await addMembersToGroup(accountID, chatId, userIds);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * PUT /api/groups/:accountID/:id/removeMember
 * Remove a member from a chat
 * 
 * @param {string} accountID - Account ID
 * @param {string|number} id - Chat ID
 * @body {number} userId - User ID to remove from the chat
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the operation was successful
 * @returns {string} message - Success message
 * 
 * @example
 * PUT /api/groups/123456789/removeMember
 * Body: {
 *   "userId": 987654321
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User 987654321 removed from chat 123456789 successfully"
 * }
 */
router.put('/:accountID/:id/removeMember', async (req, res) => {
    try {
        const { accountID, id: chatId } = req.params;
        const { userId } = req.body;
        const result = await removeMemberFromGroup(accountID, chatId, userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * PUT /api/groups/:accountID/:id/leave
 * Leave a chat
 * 
 * @param {string} accountID - Account ID
 * @param {string|number} id - Chat ID to leave
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the operation was successful
 * @returns {string} message - Success message
 * 
 * @example
 * PUT /api/groups/123456789/leave
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Left chat 123456789 successfully"
 * }
 */
router.put('/:accountID/:id/leave', async (req, res) => {
    try {
        const { accountID, id: chatId } = req.params;
        const result = await leaveChat(accountID, chatId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * PUT /api/groups/:accountID/:id/setTitle
 * Update chat title (works for basic groups and supergroups)
 * 
 * @param {string} accountID - Account ID
 * @param {string|number} id - Chat ID
 * @body {string} title - New title for the chat (required, non-empty)
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the operation was successful
 * @returns {string} message - Success message with the new title
 * 
 * @example
 * PUT /api/groups/123456789/setTitle
 * Body: {
 *   "title": "New Group Name"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Chat title updated to 'New Group Name' successfully"
 * }
 */
router.put('/:accountID/:id/setTitle', async (req, res) => {
    try {
        const { accountID, id: chatId } = req.params;
        const { title } = req.body;
        const result = await setChatTitle(accountID, chatId, title);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * PUT /api/groups/:accountID/:id/setDescription
 * Update chat description (works for supergroups and channels only)
 * 
 * @param {string} accountID - Account ID
 * @param {string|number} id - Chat ID
 * @body {string} description - New description for the chat (can be empty)
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the operation was successful
 * @returns {string} message - Success message
 * 
 * @example
 * PUT /api/groups/123456789/setDescription
 * Body: {
 *   "description": "This is the new group description"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Chat description updated successfully"
 * }
 * 
 * @error Returns error if chat is not a supergroup or channel
 */
router.put('/:accountID/:id/setDescription', async (req, res) => {
    try {
        const { accountID, id: chatId } = req.params;
        const { description } = req.body;
        const result = await setChatDescription(accountID, chatId, description);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * PUT /api/groups/:accountID/:id/setPermissions
 * Update chat permissions for all members (works for supergroups only)
 * 
 * @param {string} accountID - Account ID
 * @param {string|number} id - Chat ID
 * @body {Object} permissions - Permissions object with boolean flags:
 *   @body {boolean} [can_send_messages] - Can send text messages
 *   @body {boolean} [can_send_media_messages] - Can send media (photos, videos, files)
 *   @body {boolean} [can_send_polls] - Can send polls
 *   @body {boolean} [can_send_other_messages] - Can send stickers, GIFs, animations
 *   @body {boolean} [can_add_web_page_previews] - Can add link previews
 *   @body {boolean} [can_change_info] - Can change chat info (title, photo)
 *   @body {boolean} [can_invite_users] - Can invite new users
 *   @body {boolean} [can_pin_messages] - Can pin messages
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the operation was successful
 * @returns {string} message - Success message
 * 
 * @example
 * PUT /api/groups/123456789/setPermissions
 * Body: {
 *   "permissions": {
 *     "can_send_messages": true,
 *     "can_send_media_messages": false,
 *     "can_invite_users": true,
 *     "can_pin_messages": false
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Chat permissions updated successfully"
 * }
 * 
 * @note Unspecified permissions will default to:
 * - can_send_messages: true
 * - can_send_media_messages: true
 * - can_send_polls: true
 * - can_send_other_messages: true
 * - can_add_web_page_previews: true
 * - can_change_info: false
 * - can_invite_users: false
 * - can_pin_messages: false
 */
router.put('/:accountID/:id/setPermissions', async (req, res) => {
    try {
        const { accountID, id: chatId } = req.params;
        const { permissions } = req.body;
        const result = await setChatPermissions(accountID, chatId, permissions);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * DELETE /api/groups/:accountID/:id
 * Delete a chat (removes chat from the chat list)
 * 
 * @param {string} accountID - Account ID
 * @param {string|number} id - Chat ID to delete
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the operation was successful
 * @returns {string} message - Success message
 * 
 * @example
 * DELETE /api/groups/123456789
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Chat 123456789 deleted successfully"
 * }
 * 
 * @note This removes the chat from your chat list but doesn't delete the group itself.
 * To permanently delete a group you created, you need to be the owner and remove all members first.
 */
router.delete('/:accountID/:id', async (req, res) => {
    try {
        const { accountID, id: chatId } = req.params;
        const result = await deleteChat(accountID, chatId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});


export default router;