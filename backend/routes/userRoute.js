import express from 'express';
import { getContactsDetails, getUserById, addContacts, removeContacts } from "../controllers/userController.js";

const router = express.Router();

/**
 * GET /api/users/:accountID/contacts
 * Get all contacts with detailed user information
 * 
 * @param {string} accountID - Account ID
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
router.get('/:accountID/contacts', async (req, res) => {
    try {
        const { accountID } = req.params;
        const result = await getContactsDetails(accountID);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * GET /api/users/:accountID/:id
 * Get detailed information about a specific user by their ID
 * 
 * @param {string} accountID - Account ID
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
router.get('/:accountID/:id', async (req, res) => {
    try {
        const { accountID } = req.params;
        const userId = parseInt(req.params.id, 10);
        const result = await getUserById(accountID, userId);
        res.status(200).json(result);   
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/:accountID/add-contacts', async (req, res) => {
    try {
        const { accountID } = req.params;
        const { contacts } = req.body;
        if (!Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'contacts must be a non-empty array'
            });
        }

        const addedContacts = await addContacts(accountID, contacts);

        res.status(200).json({
            success: true,
            data: addedContacts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to add contacts'
        });
    }
});

router.delete('/:accountID/remove-contacts', async (req, res) => {
    try {
        const { accountID } = req.params;
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'userIds must be a non-empty array'
            });
        }

        const result = await removeContacts(accountID, userIds);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to remove contacts'
        });
    }
});

export default router;
