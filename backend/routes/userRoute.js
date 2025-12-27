import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { rateLimit } from '../middlewares/rateLimit.js';
import {
  getMe,
  getAllContacts,
  getUserById,
  searchUsers,
  getContactsDetails,
  addContacts,
  removeContacts
} from '../controllers/userController.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Lấy thông tin Telegram user của account
 * @access  Private
 * @query   accountID (required)
 */
router.get('/me', async (req, res) => {
  try {
    const { accountID } = req.query;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    const result = await getMe(accountID, req.user.userId);
    res.json(result);
    
  } catch (error) {
    console.error('Get me error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   GET /api/users/contacts
 * @desc    Lấy tất cả contacts
 * @access  Private
 * @query   accountID (required)
 */
router.get('/contacts', async (req, res) => {
  try {
    const { accountID } = req.query;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    const result = await getAllContacts(accountID, req.user.userId);
    res.json(result);
    
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   GET /api/users/contacts/details
 * @desc    Lấy thông tin chi tiết của contacts
 * @access  Private
 * @query   accountID (required), userIds (optional, comma-separated)
 */
router.get('/contacts/details', async (req, res) => {
  try {
    const { accountID, userIds } = req.query;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    // Parse userIds nếu có (format: "123,456,789")
    let userIdsArray = [];
    if (userIds) {
      userIdsArray = userIds.split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id));
    }
    
    const result = await getContactsDetails(
      accountID, 
      userIdsArray, 
      req.user.userId
    );
    res.json(result);
    
  } catch (error) {
    console.error('Get contacts details error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   GET /api/users/:userId
 * @desc    Lấy thông tin user theo ID
 * @access  Private
 * @query   accountID (required)
 * @params  userId - Telegram user ID
 */
router.get('/:userId', async (req, res) => {
  try {
    const { accountID } = req.query;
    const { userId } = req.params;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }
    
    const result = await getUserById(accountID, userId, req.user.userId);
    res.json(result);
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   GET /api/users/search
 * @desc    Tìm kiếm users
 * @access  Private
 * @query   accountID (required), q (query string, required)
 */
router.get('/search/query', async (req, res) => {
  try {
    const { accountID, q } = req.query;
    
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }
    
    const result = await searchUsers(accountID, q, req.user.userId);
    res.json(result);
    
  } catch (error) {
    console.error('Search users error:', error);
    res.status(error.error ? 400 : 500).json(error);
  }
});

/**
 * @route   POST /api/users/contacts
 * @desc    Thêm/Import contacts
 * @access  Private
 * @body    accountID (required), contacts (array, required)
 */
router.post('/contacts',
  rateLimit('add-contacts', 10, 60 * 60 * 1000), // 10 lần/giờ
  async (req, res) => {
    try {
      const { accountID, contacts } = req.body;
      
      if (!accountID) {
        return res.status(400).json({
          success: false,
          error: 'accountID is required'
        });
      }
      
      if (!contacts || !Array.isArray(contacts)) {
        return res.status(400).json({
          success: false,
          error: 'contacts array is required'
        });
      }
      
      const result = await addContacts(accountID, contacts, req.user.userId);
      res.json(result);
      
    } catch (error) {
      console.error('Add contacts error:', error);
      res.status(error.error ? 400 : 500).json(error);
    }
  }
);

/**
 * @route   DELETE /api/users/contacts
 * @desc    Xóa contacts
 * @access  Private
 * @body    accountID (required), userIds (array, required)
 */
router.delete('/contacts',
  rateLimit('remove-contacts', 10, 60 * 60 * 1000), // 10 lần/giờ
  async (req, res) => {
    try {
      const { accountID, userIds } = req.body;
      
      if (!accountID) {
        return res.status(400).json({
          success: false,
          error: 'accountID is required'
        });
      }
      
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
          success: false,
          error: 'userIds array is required'
        });
      }
      
      const result = await removeContacts(accountID, userIds, req.user.userId);
      res.json(result);
      
    } catch (error) {
      console.error('Remove contacts error:', error);
      res.status(error.error ? 400 : 500).json(error);
    }
  }
);

export default router;