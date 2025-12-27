import User from '../models/User.js';
import Session from '../models/Session.js';
import { generateTokenPair, verifyRefreshToken, TOKEN_CONFIG } from '../utils/jwt.js';
import { resetRateLimit } from '../middlewares/rateLimit.js';

/**
 * Đăng ký user mới
 */
export const register = async (req, res) => {
  try {
    const { username, fullname, password } = req.body;
    
    // Validation
    if (!username || !fullname || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, fullname and password are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }
    
    // Kiểm tra username đã tồn tại chưa
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }
    
    // Tạo user mới
    const user = await User.create({
      username: username.toLowerCase(),
      fullname,
      passwordHash: password, 
      role: 'user'
    });
    
    // Tạo tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id, 
      user.username, 
      user.role
    );
    
    // Lưu session vào database
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: TOKEN_CONFIG.getRefreshTokenExpiry(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullname: user.fullname,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

/**
 * Đăng nhập user (vào hệ thống web)
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Tìm user 
    const user = await User.findOne({ 
      username: username.toLowerCase() 
    }).select('+passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    // Kiểm tra password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    // Tạo tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id,
      user.username,
      user.role
    );
    
    // Lưu session
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: TOKEN_CONFIG.getRefreshTokenExpiry(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();
    
    // Reset rate limit khi login thành công
    await resetRateLimit('login', username);
    
    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullname: user.fullname,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

/**
 * Refresh access token bằng refresh token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    const { valid, decoded } = verifyRefreshToken(refreshToken);
    
    if (!valid || !decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    
    // Kiểm tra session có tồn tại và active không
    const session = await Session.findOne({
      refreshToken,
      isActive: true
    });
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session not found or expired'
      });
    }
    
    // Lấy thông tin user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Tạo access token mới
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
      user._id,
      user.username,
      user.role
    );
    
    // Update session với refresh token mới
    session.refreshToken = newRefreshToken;
    session.expiresAt = TOKEN_CONFIG.getRefreshTokenExpiry();
    await session.save();
    
    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
};

/**
 * Đăng xuất
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }
    
    // Deactivate session
    await Session.updateOne(
      { refreshToken },
      { isActive: false }
    );
    
    return res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

/**
 * Lấy thông tin user hiện tại (cần authenticate middleware)
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    return res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
};