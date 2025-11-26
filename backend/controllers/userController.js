import { getClient } from '../services/tdClient.js';

/**
 * Get all contacts
 * @param {string} accountID - Account ID
 * @returns {Promise<Object>} List of contacts with user IDs
 */
export const getAllContacts = async (accountID) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        const contacts = await client.invoke({
            _: "getContacts"
        });
        return {
            success: true,
            data: contacts,
            count: contacts.user_ids?.length || 0
        };
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw {
            success: false,
            error: error.message || 'Failed to fetch contacts'
        };
    }
}

/**
 * Get detailed user information by user ID
 * @param {string} accountID - Account ID
 * @param {number} userId - Telegram user ID
 * @returns {Promise<Object>} User details
 */
export const getUserById = async (accountID, userId) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!userId || typeof userId !== 'number') {
            throw new Error('Valid user ID is required');
        }

        const user = await client.invoke({
            _: "getUser",
            user_id: userId
        });

        return {
            success: true,
            data: user
        };
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        throw {
            success: false,
            error: error.message || 'Failed to fetch user'
        };
    }
}

/**
 * Search for users by username or phone number
 * @param {string} accountID - Account ID
 * @param {string} query - Search query (username or phone)
 * @returns {Promise<Object>} Search results
 */
export const searchUsers = async (accountID, query) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!query || typeof query !== 'string') {
            throw new Error('Valid search query is required');
        }

        const result = await client.invoke({
            _: "searchContacts",
            query: query,
            limit: 50
        });

        return {
            success: true,
            data: result,
            count: result.user_ids?.length || 0
        };
    } catch (error) {
        console.error('Error searching users:', error);
        throw {
            success: false,
            error: error.message || 'Failed to search users'
        };
    }
}

/**
 * Get contact details with enriched information
 * @param {string} accountID - Account ID
 * @param {number[]} userIds - Array of user IDs
 * @returns {Promise<Object>} Enriched contact details
 */
export const getContactsDetails = async (accountID, userIds = []) => {
    try {
        const contacts = await getAllContacts(accountID);
        const idsToFetch = userIds.length > 0 ? userIds : contacts.data.user_ids;

        const userDetails = await Promise.all(
            idsToFetch.map(async (userId) => {
                try {
                    const user = await getUserById(accountID, userId);
                    return user.data;
                } catch (err) {
                    console.error(`Failed to fetch user ${userId}:`, err);
                    return null;
                }
            })
        );

        return {
            success: true,
            data: userDetails.filter(user => user !== null),
            count: userDetails.filter(user => user !== null).length
        };
    } catch (error) {
        console.error('Error fetching contact details:', error);
        throw {
            success: false,
            error: error.message || 'Failed to fetch contact details'
        };
    }
}

export const addContacts = async (accountID, contacts) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!Array.isArray(contacts) || contacts.length === 0) {
            throw new Error('Contacts array is required');
        }

        const result = await client.invoke({
            _: "importContacts",
            contacts: contacts
        });

        return result
    } catch (error) {
        console.error('Error adding contacts:', error);
        throw {
            error: error.message || 'Failed to add contacts'
        };
    }
}

export const removeContacts = async (accountID, userIds) => {
    try {
        const client = getClient(accountID);
        if (!client) throw new Error('No active session found');
        
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new Error('User IDs array is required');
        }

        const result = await client.invoke({
            _: "removeContacts",
            user_ids: userIds
        });
        
        return result;
    } catch (error) {
        console.error('Error removing contacts:', error);
        throw {
            error: error.message || 'Failed to remove contacts'
        };
    }
}