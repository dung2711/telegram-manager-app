import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getMyLogs } from '../controllers/logController.js';

const router = express.Router();

/**
 * @route   GET /api/logs
 * @desc    Lấy logs của một account cụ thể
 * @access  Private
 * @query   accountID (required), page, limit, action, status, startDate, endDate
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { accountID, ...filters } = req.query;
    
    // Validation
    if (!accountID) {
      return res.status(400).json({
        success: false,
        error: 'accountID is required'
      });
    }
    
    // Kiểm tra account có thuộc user này không
    const Account = (await import('../models/Account.js')).default;
    const account = await Account.findOne({
      accountID,
      owner: req.user.userId
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or access denied'
      });
    }
    
    // Lấy logs
    const result = await getMyLogs(accountID, filters);
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch logs'
    });
  }
});

/**
 * @route   GET /api/logs/all
 * @desc    Lấy tất cả logs của tất cả accounts thuộc user
 * @access  Private
 * @query   page, limit, action, status, startDate, endDate
 */
router.get('/all', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, action, status, startDate, endDate } = req.query;
    
    // Lấy tất cả accountIDs của user
    const Account = (await import('../models/Account.js')).default;
    const accounts = await Account.find({ owner: userId }).select('accountID');
    const accountIDs = accounts.map(acc => acc.accountID);
    
    if (accountIDs.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      });
    }
    
    // Build query
    const AuditLog = (await import('../models/AuditLog.js')).default;
    const query = { accountID: { $in: accountIDs } };
    
    if (action) query.action = action;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }
    
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v')
        .lean(),
      AuditLog.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Get all logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs'
    });
  }
});

export default router;