import { getClient } from '../services/tdClient.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Get own user logs with pagination and filtering
 * Yêu cầu: User phải đang có active session (Online) mới lấy được log
 * * @param {string} accountID - Account ID (Required)
 * @param {Object} filters - Options { page, limit, action, status, startDate, endDate }
 * @returns {Promise<Object>} Logs data
 */
export const getMyLogs = async (accountID, filters = {}) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');

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

        const query = { accountID: accountID };

        if (action) query.action = action;
        if (status) query.status = status;
        
        // Xử lý lọc theo ngày
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set về cuối ngày (23:59:59) để lấy trọn vẹn dữ liệu ngày đó
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
                .select('-__v') // Loại bỏ field __v cho gọn
                .lean(), // Convert sang JSON thuần giúp performance nhanh hơn
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