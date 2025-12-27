import RateLimit from '../models/RateLimit.js';

/**
 * Rate Limiting Middleware
 * @param {string} action - Tên action (vd: 'login', 'verify-code')
 * @param {number} maxAttempts - Số lần tối đa
 * @param {number} windowMs - Thời gian window (milliseconds)
 */
export const rateLimit = (action, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return async (req, res, next) => {
    try {
      // Tạo key dựa trên IP hoặc phone/accountID
      const identifier = req.body.phoneNumber || req.body.accountID || req.ip;
      const key = `${action}:${identifier}`;
      
      // Tìm record hiện tại
      let record = await RateLimit.findOne({ key });
      
      const now = new Date();
      
      // Nếu chưa có record hoặc đã hết hạn -> tạo mới
      if (!record || record.resetAt < now) {
        await RateLimit.findOneAndUpdate(
          { key },
          {
            key,
            attempts: 1,
            resetAt: new Date(now.getTime() + windowMs)
          },
          { upsert: true, new: true }
        );
        
        return next();
      }
      
      // Kiểm tra đã vượt quá limit chưa
      if (record.attempts >= maxAttempts) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000); // seconds
        
        return res.status(429).json({
          success: false,
          error: 'Too many attempts. Please try again later.',
          retryAfter,
          resetAt: record.resetAt
        });
      }
      
      // Tăng số lần thử
      record.attempts += 1;
      await record.save();
      
      // Thêm info vào response headers (optional)
      res.setHeader('X-RateLimit-Limit', maxAttempts);
      res.setHeader('X-RateLimit-Remaining', maxAttempts - record.attempts);
      res.setHeader('X-RateLimit-Reset', record.resetAt.toISOString());
      
      next();
      
    } catch (error) {
      console.error('Rate limit error:', error);
      // Nếu có lỗi, vẫn cho qua để không block user
      next();
    }
  };
};

/**
 * Reset rate limit cho một key cụ thể
 * Dùng khi login thành công
 */
export const resetRateLimit = async (action, identifier) => {
  try {
    const key = `${action}:${identifier}`;
    await RateLimit.deleteOne({ key });
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
};