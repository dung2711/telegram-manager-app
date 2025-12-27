import jwt from 'jsonwebtoken';

// Lấy từ .env
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Thời gian hết hạn
const ACCESS_TOKEN_EXPIRE = '15m'; // 15 phút
const REFRESH_TOKEN_EXPIRE = '7d'; // 7 ngày

/**
 * Tạo Access Token (JWT ngắn hạn)
 */
export const generateAccessToken = (userId, username, role) => {
  const payload = {
    userId,
    username,
    role,
    type: 'access'
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRE
  });
};

/**
 * Tạo Refresh Token (JWT dài hạn)
 */
export const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh'
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRE
  });
};

/**
 * Tạo cả 2 tokens cùng lúc
 */
export const generateTokenPair = (userId, username, role) => {
  return {
    accessToken: generateAccessToken(userId, username, role),
    refreshToken: generateRefreshToken(userId)
  };
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return {
      valid: true,
      expired: false,
      decoded
    };
  } catch (error) {
    return {
      valid: false,
      expired: error.message.includes('expired'),
      decoded: null
    };
  }
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return {
      valid: true,
      expired: false,
      decoded
    };
  } catch (error) {
    return {
      valid: false,
      expired: error.message.includes('expired'),
      decoded: null
    };
  }
};

/**
 * Decode token không verify (dùng để debug)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Tính thời gian hết hạn (timestamp)
 */
export const getTokenExpiry = (expiresIn) => {
  const now = new Date();
  
  // Parse string như '15m', '7d'
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return now;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch(unit) {
    case 's': // seconds
      now.setSeconds(now.getSeconds() + value);
      break;
    case 'm': // minutes
      now.setMinutes(now.getMinutes() + value);
      break;
    case 'h': // hours
      now.setHours(now.getHours() + value);
      break;
    case 'd': // days
      now.setDate(now.getDate() + value);
      break;
  }
  
  return now;
};

// Export constants để dùng ở nơi khác
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
  getRefreshTokenExpiry: () => getTokenExpiry(REFRESH_TOKEN_EXPIRE)
};