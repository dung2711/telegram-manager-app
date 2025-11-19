import express from 'express';
import { getContactsDetails, getUserById } from "../controllers/userController.js";

const router = express.Router();

/**
 * GET /api/users/contacts
 * Get all contacts with detailed user information
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the request was successful
 * @returns {Object[]} data - Array of user objects with details:
 *   - {number} id - User ID
 *   - {string} first_name - User's first name
 *   - {string} last_name - User's last name
 *   - {string} username - Username (if available)
 *   - {string} phone_number - Phone number (if available)
 *   - {Object} profile_photo - Profile photo information
 *   - {Object} status - User's online status
 *   - {boolean} is_contact - Whether user is a contact
 *   - {boolean} is_mutual_contact - Whether it's a mutual contact
 * @returns {number} count - Total number of contacts
 * 
 * @example
 * GET /api/users/contacts
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 123456789,
 *       "first_name": "John",
 *       "last_name": "Doe",
 *       "username": "johndoe",
 *       "phone_number": "+1234567890",
 *       "profile_photo": { ... },
 *       "status": { "_": "userStatusOnline" },
 *       "is_contact": true,
 *       "is_mutual_contact": true
 *     }
 *   ],
 *   "count": 1
 * }
 */
router.get('/contacts', async (req, res) => {
    try {
        const result = await getContactsDetails();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * GET /api/users/:id
 * Get detailed information about a specific user by their ID
 * 
 * @param {number} id - User ID
 * 
 * @returns {Object} Result object
 * @returns {boolean} success - Whether the request was successful
 * @returns {Object} data - User object with detailed information:
 *   - {number} id - User ID
 *   - {string} first_name - User's first name
 *   - {string} last_name - User's last name
 *   - {string} username - Username (if available)
 *   - {string} phone_number - Phone number (if available)
 *   - {Object} profile_photo - Profile photo information
 *   - {Object} status - User's online status
 *   - {boolean} is_contact - Whether user is a contact
 *   - {boolean} is_mutual_contact - Whether it's a mutual contact
 *   - {boolean} is_verified - Whether the user is verified
 *   - {boolean} is_premium - Whether the user has Telegram Premium
 *   - {boolean} is_support - Whether this is an official support account
 *   - {string} restriction_reason - Restriction reason (if restricted)
 *   - {boolean} is_scam - Whether the user is marked as scam
 *   - {boolean} is_fake - Whether the user is marked as fake
 *   - {Object} type - User type information
 * 
 * @example
 * GET /api/users/123456789
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 123456789,
 *     "first_name": "John",
 *     "last_name": "Doe",
 *     "username": "johndoe",
 *     "phone_number": "+1234567890",
 *     "profile_photo": {
 *       "small": { ... },
 *       "big": { ... }
 *     },
 *     "status": {
 *       "_": "userStatusOnline",
 *       "expires": 1234567890
 *     },
 *     "is_contact": true,
 *     "is_mutual_contact": true,
 *     "is_verified": false,
 *     "is_premium": false,
 *     "is_support": false,
 *     "is_scam": false,
 *     "is_fake": false
 *   }
 * }
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const result = await getUserById(userId);
        res.status(200).json(result);   
    } catch (error) {
        res.status(500).json(error);
    }
});

export default router;
