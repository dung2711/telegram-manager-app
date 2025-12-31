import { v4 as uuid } from 'uuid';
import { rm } from 'fs/promises';
import path from 'path';
import Account from '../models/Account.js';
import AuditLog from '../models/AuditLog.js';
import { addClient, getClient, removeClient } from '../services/tdClient.js';
import { createTDLibClient } from '../config/tdlib.js';
import { resetRateLimit } from '../middlewares/rateLimit.js';

/**
 * Sanitize accountID để tránh path traversal
 */
const sanitizeAccountID = (accountID) => {
  if (!accountID || typeof accountID !== 'string') {
    throw new Error('Invalid accountID');
  }
  
  // Chỉ cho phép UUID format (alphanumeric và dấu gạch ngang)
  const uuidRegex = /^[a-f0-9-]{36}$/i;
  if (!uuidRegex.test(accountID)) {
    throw new Error('Invalid accountID format');
  }
  
  return accountID;
};

/**
 * Validate phone number
 */
const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new Error('Invalid phone number');
  }
  
  // Phone phải bắt đầu bằng + và chỉ chứa số
  const phoneRegex = /^\+[0-9]{10,15}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new Error('Phone number must start with + and contain 10-15 digits');
  }
  
  return phoneNumber;
};

/**
 * Bước 1: Đăng nhập Telegram bằng số điện thoại
 * Yêu cầu: User phải đã đăng nhập vào hệ thống (có req.user từ middleware)
 */
export const loginTelegram = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user.userId; // Từ authenticate middleware
    
    // Validation
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    const validPhone = validatePhoneNumber(phoneNumber);
    
    // Kiểm tra xem phone này đã được user khác sử dụng chưa
    const existingAccount = await Account.findOne({ phoneNumber: validPhone });
    
    let accountID;
    let isNewAccount = false;
    
    if (existingAccount) {
      // Nếu account đã tồn tại nhưng thuộc user khác -> không cho phép
      if (existingAccount.owner.toString() !== userId.toString()) {
        return res.status(400).json({
          success: false,
          error: 'This phone number is already linked to another user'
        });
      }
      
      accountID = existingAccount.accountID;
    } else {
      // Tạo account mới
      accountID = uuid();
      isNewAccount = true;
    }
    
    const sessionPath = `./tdlib/${accountID}`;
    
    // Tạo hoặc lấy TDLib client
    let client = getClient(accountID);
    if (!client) {
      client = createTDLibClient(accountID);
      addClient(accountID, client);
    }
    
    // Gửi phone number để nhận mã xác thực
    try {
      await client.invoke({
        _: 'setAuthenticationPhoneNumber',
        phone_number: validPhone,
        settings: {
          _: 'phoneNumberAuthenticationSettings',
          allow_flash_call: false,
          is_current_phone_number: false,
          allow_sms_retriever_api: false
        }
      });
      
      // Tạo account mới nếu chưa có
      if (isNewAccount) {
        await Account.create({
          owner: userId,
          accountID,
          phoneNumber: validPhone,
          sessionPath,
          isAuthenticated: false
        });
      }
      
      // Log action
      await AuditLog.create({
        accountID,
        action: 'TELEGRAM_LOGIN_INITIATED',
        status: 'SUCCESS',
        payload: { phoneNumber: validPhone }
      });
      
      // Reset rate limit khi gửi code thành công
      await resetRateLimit('telegram-login', validPhone);
      
      return res.json({
        success: true,
        data: {
            accountID,
            isNewAccount,
            message: 'Verification code sent to your Telegram'
        }
      });
      
    } catch (tdError) {
      // Nếu đã authenticated rồi
      if (tdError.message && tdError.message.includes('PHONE_NUMBER_INVALID')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format'
        });
      }
      
      // Nếu user đã login Telegram rồi
      if (tdError.message && tdError.message.includes('unexpected')) {
        // Update trạng thái
        await Account.findOneAndUpdate(
          { accountID },
          { 
            isAuthenticated: true, 
            lastActive: new Date() 
          }
        );
        

        return res.json({
          success: true,
          data: {
            accountID,
            isNewAccount,
            message: 'Account is already authenticated'
          }
        });
      }
      
      throw tdError;
    }
    
  } catch (error) {
    console.error('Telegram login error:', error);
    
    // Log error
    if (req.body.phoneNumber) {
      await AuditLog.create({
        accountID: 'UNKNOWN',
        action: 'TELEGRAM_LOGIN_INITIATED',
        status: 'FAILURE',
        errorMessage: error.message,
        payload: { phoneNumber: req.body.phoneNumber }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Telegram login failed'
    });
  }
};

/**
 * Bước 2: Xác thực mã code từ Telegram
 */
export const verifyAuthCode = async (req, res) => {
  try {
    const { accountID, code } = req.body;
    const userId = req.user.userId;
    
    // Validation
    if (!accountID || !code) {
      return res.status(400).json({
        success: false,
        error: 'Account ID and code are required'
      });
    }
    
    const validAccountID = sanitizeAccountID(accountID);
    
    // Kiểm tra account có thuộc user này không
    const account = await Account.findOne({ 
      accountID: validAccountID,
      owner: userId 
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or access denied'
      });
    }
    
    // Lấy client
    const client = getClient(validAccountID);
    
    if (!client) {
      return res.status(400).json({
        success: false,
        error: 'No active session found. Please login again.'
      });
    }
    
    // Submit code
    await client.invoke({
      _: 'checkAuthenticationCode',
      code: code.toString()
    });
    
    // Update account status
    account.isAuthenticated = true;
    account.lastActive = new Date();
    await account.save();
    
    // Log
    await AuditLog.create({
      accountID: validAccountID,
      action: 'TELEGRAM_CODE_VERIFIED',
      status: 'SUCCESS'
    });
    
    // Reset rate limit
    await resetRateLimit('verify-code', validAccountID);
    
    return res.json({
      success: true,
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('Code verification error:', error);
    
    // Log error
    if (req.body.accountID) {
      await AuditLog.create({
        accountID: req.body.accountID,
        action: 'TELEGRAM_CODE_VERIFIED',
        status: 'FAILURE',
        errorMessage: error.message
      });
    }
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Code verification failed'
    });
  }
};

/**
 * Bước 3: Xác thực 2FA password (nếu có)
 */
export const verifyPassword = async (req, res) => {
  try {
    const { accountID, password } = req.body;
    const userId = req.user.userId;
    
    // Validation
    if (!accountID || !password) {
      return res.status(400).json({
        success: false,
        error: 'Account ID and password are required'
      });
    }
    
    const validAccountID = sanitizeAccountID(accountID);
    
    // Kiểm tra ownership
    const account = await Account.findOne({
      accountID: validAccountID,
      owner: userId
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or access denied'
      });
    }
    
    const client = getClient(validAccountID);
    
    if (!client) {
      return res.status(400).json({
        success: false,
        error: 'No active session found'
      });
    }
    
    // Submit password
    await client.invoke({
      _: 'checkAuthenticationPassword',
      password: password
    });
    
    // Update status
    account.isAuthenticated = true;
    account.lastActive = new Date();
    await account.save();
    
    // Log
    await AuditLog.create({
      accountID: validAccountID,
      action: 'TELEGRAM_2FA_VERIFIED',
      status: 'SUCCESS'
    });
    
    // Reset rate limit
    await resetRateLimit('verify-password', validAccountID);
    
    return res.json({
      success: true,
      message: '2FA authentication successful'
    });
    
  } catch (error) {
    console.error('Password verification error:', error);
    
    // Log error
    if (req.body.accountID) {
      await AuditLog.create({
        accountID: req.body.accountID,
        action: 'TELEGRAM_2FA_VERIFIED',
        status: 'FAILURE',
        errorMessage: error.message
      });
    }
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Password verification failed'
    });
  }
};

/**
 * Lấy danh sách accounts của user hiện tại
 */
export const getMyAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const accounts = await Account.find({ owner: userId })
      .select('-__v')
      .sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      data: accounts
    });
    
  } catch (error) {
    console.error('Get accounts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get accounts'
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { accountID } = req.params;
    const userId = req.user.userId;

    if (!accountID) {
      return res.status(400).json({ 
        success: false, 
        error: 'Account ID is required' 
      });
    }

    const validAccountID = sanitizeAccountID(accountID);

    const account = await Account.findOne({
      accountID: validAccountID,
      owner: userId
    });

    if (!account) {
      return res.status(404).json({ 
        success: false, 
        error: 'Account not found or access denied' 
      });
    }

    // 1. Dừng TDLib Client 
    await removeClient(validAccountID);

    // 2. Xóa thư mục session
    if (account.sessionPath) {
      try {
        const absolutePath = path.resolve(account.sessionPath);
        if (absolutePath.includes('tdlib')) {
            await rm(absolutePath, { recursive: true, force: true });
        }
      } catch (fsError) {
        console.error(`File cleanup error for ${validAccountID}:`, fsError.message);
      }
    }

    // 3. Xóa dữ liệu trong Database
    await Account.deleteOne({ _id: account._id });

    // 4. Log Audit
    await AuditLog.create({
      accountID: validAccountID,
      action: 'ACCOUNT_DELETED',
      status: 'SUCCESS',
      payload: { deletedBy: userId }
    });

    return res.json({
      success: true,
      message: 'Account and session data deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete account'
    });
  }
};