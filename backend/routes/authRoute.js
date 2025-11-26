import express from 'express';
import { loginUser, verifyAuthCode, verifyPassword } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Initiate login with phone number
 * @body { phoneNumber }
 */
router.post('/login', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        const result = await loginUser(phoneNumber);
        res.json(result);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Login failed'
        });
    }
});

/**
 * @route POST /api/auth/verify-code
 * @desc Verify authentication code
 * @body { accountID, code }
 */
router.post('/verify-code', async (req, res) => {
    try {
        const { accountID, code } = req.body;

        if (!accountID || !code) {
            return res.status(400).json({
                success: false,
                error: 'Account ID and code are required'
            });
        }

        const result = await verifyAuthCode(accountID, code);
        res.json(result);

    } catch (error) {
        console.error('Code verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Code verification failed'
        });
    }
});

/**
 * @route POST /api/auth/verify-password
 * @desc Verify 2FA password
 * @body { accountID, password }
 */
router.post('/verify-password', async (req, res) => {
    try {
        const { accountID, password } = req.body;

        if (!accountID || !password) {
            return res.status(400).json({
                success: false,
                error: 'Account ID and password are required'
            });
        }

        const result = await verifyPassword(accountID, password);
        res.json(result);

    } catch (error) {
        console.error('Password verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Password verification failed'
        });
    }
});

export default router;
