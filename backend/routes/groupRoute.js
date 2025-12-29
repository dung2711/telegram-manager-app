import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { rateLimit } from '../middlewares/rateLimit.js';
import {
  getChats,
  getChatDetails,
  getChatMembers,
  createBasicGroupChat,
  createNewSecretChat,
  createNewSupergroupChat,
  addMemberToGroup,
  addMembersToGroup,
  removeMemberFromGroup,
  leaveChat,
  deleteChat,
  setChatTitle,
  setChatDescription,
  setChatPermissions
} from '../controllers/groupController.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticate);

/**
 * @route   GET /api/groups
 * @desc    Get all chats with details and members
 * @access  Private
 * @query   accountID (required), limit, chatList
 */
router.get('/', async (req, res) => {
  try {
    const { accountID, limit, chatList } = req.query;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    const result = await getChats(
      accountID, 
      req.user.userId,
      limit ? parseInt(limit) : 100,
      chatList || 'chatListMain'
    );
    
    if (result.success) {
      // Fetch details and members for all chats
      const chatDetails = await Promise.all(
        result.data.map(async (chatId) => {
          try {
            const detail = await getChatDetails(accountID, chatId, req.user.userId);
            const members = await getChatMembers(accountID, chatId, req.user.userId);
            return {
              chatId,
              detail: detail.data,
              members: members.data
            };
          } catch (err) {
            console.error(`Failed to fetch details for chat ${chatId}:`, err);
            return null;
          }
        })
      );
      
      const filteredDetails = chatDetails.filter(chat => chat !== null);
      res.json(filteredDetails);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   GET /api/groups/:id
 * @desc    Get details of a specific chat
 * @access  Private
 * @query   accountID (required)
 */
router.get('/:id', async (req, res) => {
  try {
    const { accountID } = req.query;
    const { id: chatId } = req.params;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    const detail = await getChatDetails(accountID, chatId, req.user.userId);
    const members = await getChatMembers(accountID, chatId, req.user.userId);
    
    res.json({ detail, members });
    
  } catch (error) {
    console.error('Get chat details error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   POST /api/groups
 * @desc    Create a new chat
 * @access  Private
 * @body    accountID, type, title, userIds, isChannel, description, location
 */
router.post('/',
  rateLimit('create-chat', 10, 60 * 60 * 1000), // 10 lần/giờ
  async (req, res) => {
    try {
      const { accountID, type, title, userIds, isChannel, description, location } = req.body;
      
      if (!accountID) {
        return res.status(400).json({
          success: false,
          error: 'accountID is required'
        });
      }
      
      if (!type) {
        return res.status(400).json({
          success: false,
          error: 'type is required (basic_group, super_group, or secret_chat)'
        });
      }
      
      let result;
      
      if (type === 'basic_group') {
        if (!title || !userIds || !Array.isArray(userIds)) {
          return res.status(400).json({
            success: false,
            error: 'title and userIds array are required for basic_group'
          });
        }
        result = await createBasicGroupChat(accountID, userIds, title, req.user.userId);
        
      } else if (type === 'super_group') {
        if (!title) {
          return res.status(400).json({
            success: false,
            error: 'title is required for super_group'
          });
        }
        result = await createNewSupergroupChat(
          accountID,
          title,
          isChannel || false,
          description || '',
          location || '',
          req.user.userId
        );
        
      } else if (type === 'secret_chat') {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'userIds array with at least one user is required for secret_chat'
          });
        }
        result = await createNewSecretChat(accountID, userIds[0], req.user.userId);
        
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid chat type. Must be: basic_group, super_group, or secret_chat'
        });
      }
      
      res.json(result);
      
    } catch (error) {
      console.error('Create chat error:', error);
      res.status(error.error ? 400 : 500).json(error);
    }
  }
);

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add member(s) to a chat
 * @access  Private
 * @body    accountID, userId (single) OR userIds (multiple)
 */
router.post('/:id/members',
  rateLimit('add-members', 200, 60 * 60 * 1000), // 200 lần/giờ
  async (req, res) => {
    try {
      const { accountID, userId, userIds, forwardLimit } = req.body;
      const { id: chatId } = req.params;
      
      if (!accountID) {
        return res.status(400).json({
          success: false,
          error: 'accountID is required'
        });
      }
      
      let result;
      
      // Nếu có userIds array -> add multiple members
      if (userIds && Array.isArray(userIds)) {
        result = await addMembersToGroup(accountID, chatId, userIds, req.user.userId);
      }
      // Nếu có userId single -> add single member
      else if (userId) {
        result = await addMemberToGroup(
          accountID,
          chatId,
          userId,
          forwardLimit || 0,
          req.user.userId
        );
      } else {
        return res.status(400).json({
          success: false,
          error: 'userId or userIds is required'
        });
      }
      
      res.json(result);
      
    } catch (error) {
      console.error('Add member error:', error);
      res.status(error.error ? 400 : 500).json(error);
    }
  }
);

/**
 * @route   DELETE /api/groups/:id/members/:userId
 * @desc    Remove a member from chat
 * @access  Private
 * @query   accountID (required)
 */
router.delete('/:id/members/:userId',
  rateLimit('remove-member', 20, 60 * 60 * 1000),
  async (req, res) => {
    try {
      const { accountID } = req.query;
      const { id: chatId, userId } = req.params;
      
      if (!accountID) {
        return res.status(400).json({
          success: false,
          error: 'accountID is required'
        });
      }
      
      const result = await removeMemberFromGroup(
        accountID,
        chatId,
        userId,
        req.user.userId
      );
      
      res.json(result);
      
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(error.error ? 400 : 500).json(error);
    }
  }
);

/**
 * @route   POST /api/groups/:id/leave
 * @desc    Leave a chat
 * @access  Private
 * @body    accountID (required)
 */
router.post('/:id/leave', async (req, res) => {
  try {
    const { accountID } = req.body;
    const { id: chatId } = req.params;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    const result = await leaveChat(accountID, chatId, req.user.userId);
    res.json(result);
    
  } catch (error) {
    console.error('Leave chat error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   PATCH /api/groups/:id/title
 * @desc    Update chat title
 * @access  Private
 * @body    accountID, title
 */
router.patch('/:id/title', async (req, res) => {
  try {
    const { accountID, title } = req.body;
    const { id: chatId } = req.params;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'title is required'
      });
    }
    
    const result = await setChatTitle(accountID, chatId, title, req.user.userId);
    res.json(result);
    
  } catch (error) {
    console.error('Update title error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   PATCH /api/groups/:id/description
 * @desc    Update chat description
 * @access  Private
 * @body    accountID, description
 */
router.patch('/:id/description', async (req, res) => {
  try {
    const { accountID, description } = req.body;
    const { id: chatId } = req.params;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    const result = await setChatDescription(
      accountID,
      chatId,
      description || '',
      req.user.userId
    );
    res.json(result);
    
  } catch (error) {
    console.error('Update description error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   PATCH /api/groups/:id/permissions
 * @desc    Update chat permissions
 * @access  Private
 * @body    accountID, permissions
 */
router.patch('/:id/permissions', async (req, res) => {
  try {
    const { accountID, permissions } = req.body;
    const { id: chatId } = req.params;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    if (!permissions) {
      return res.status(400).json({
        success: false,
        error: 'permissions object is required'
      });
    }
    
    const result = await setChatPermissions(
      accountID,
      chatId,
      permissions,
      req.user.userId
    );
    res.json(result);
    
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete a chat
 * @access  Private
 * @query   accountID (required)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { accountID } = req.query;
    const { id: chatId } = req.params;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    const result = await deleteChat(accountID, chatId, req.user.userId);
    res.json(result);
    
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

export default router;