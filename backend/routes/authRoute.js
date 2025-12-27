import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { rateLimit } from '../middlewares/rateLimit.js';

// User auth controllers
import { 
  register, 
  login, 
  refreshToken, 
  logout,
  getCurrentUser 
} from '../controllers/userAuthController.js';

// Telegram auth controllers
import { 
  loginTelegram, 
  verifyAuthCode, 
  verifyPassword,
  getMyAccounts
} from '../controllers/telegramAuthController.js';

const router = express.Router();

// ========== USER AUTH ROUTES ==========

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký user mới
 * @access  Public
 */
router.post('/register', 
  rateLimit('register', 3, 60 * 60 * 1000), // 3 lần/giờ
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập user
 * @access  Public
 */
router.post('/login', 
  rateLimit('login', 5, 15 * 60 * 1000), // 5 lần/15 phút
  login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin user hiện tại
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

// ========== TELEGRAM AUTH ROUTES ==========

/**
 * @route   POST /api/auth/telegram/login
 * @desc    Bắt đầu đăng nhập Telegram
 * @access  Private (phải login vào hệ thống trước)
 */
router.post('/telegram/login', 
  authenticate,
  rateLimit('telegram-login', 5, 15 * 60 * 1000), // 5 lần/15 phút
  loginTelegram
);

/**
 * @route   POST /api/auth/telegram/verify-code
 * @desc    Xác thực mã code từ Telegram
 * @access  Private
 */
router.post('/telegram/verify-code', 
  authenticate,
  rateLimit('verify-code', 5, 15 * 60 * 1000),
  verifyAuthCode
);

/**
 * @route   POST /api/auth/telegram/verify-password
 * @desc    Xác thực 2FA password
 * @access  Private
 */
router.post('/telegram/verify-password', 
  authenticate,
  rateLimit('verify-password', 3, 15 * 60 * 1000),
  verifyPassword
);

/**
 * @route   GET /api/auth/telegram/accounts
 * @desc    Lấy danh sách Telegram accounts của user
 * @access  Private
 */
router.get('/telegram/accounts', authenticate, getMyAccounts);

export default router;