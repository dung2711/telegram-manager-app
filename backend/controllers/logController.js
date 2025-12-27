import AuditLog from '../models/AuditLog.js';

/**
 * Get logs của một account cụ thể
 * @param {string} accountID - Account ID (Required)
 * @param {Object} filters - Options { page, limit, action, status, startDate, endDate }
 * @returns {Promise<Object>} Logs data
 */
export const getMyLogs = async (accountID, filters = {}) => {
  try {
    if (!accountID) {
      throw new Error('Account ID is required');
    }
    
    const { 
      page = 1, 
      limit = 20, 
      action, 
      status, 
      startDate, 
      endDate 
    } = filters;
    
    // Build query
    const query = { accountID };
    
    if (action) query.action = action;
    if (status) query.status = status;
    
    // Xử lý lọc theo ngày
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set về cuối ngày (23:59:59)
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
        .sort({ timestamp: -1 }) // Mới nhất lên đầu
        .skip(skip)
        .limit(limitNum)
        .select('-__v') // Loại bỏ field __v
        .lean(), // Convert sang JSON thuần
      AuditLog.countDocuments(query)
    ]);
    
    return {
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
    
  } catch (error) {
    console.error(`Error fetching logs for ${accountID}:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to fetch user logs'
    };
  }
};