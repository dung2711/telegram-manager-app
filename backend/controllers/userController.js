import { getClient } from '../services/tdClient.js';
import { recordLog } from '../services/auditService.js';
import Account from '../models/Account.js';

/**
 * Sanitize accountID để tránh path traversal
 */
const sanitizeAccountID = (accountID) => {
  if (!accountID || typeof accountID !== 'string') {
    throw new Error('Invalid accountID');
  }
  
  const uuidRegex = /^[a-f0-9-]{36}$/i;
  if (!uuidRegex.test(accountID)) {
    throw new Error('Invalid accountID format');
  }
  
  return accountID;
};

/**
 * Verify account ownership
 */
const verifyAccountOwnership = async (accountID, userId) => {
  const account = await Account.findOne({
    accountID,
    owner: userId
  });
  
  if (!account) {
    throw new Error('Account not found or access denied');
  }
  
  if (!account.isAuthenticated) {
    throw new Error('Account is not authenticated. Please login to Telegram first.');
  }
  
  return account;
};

/**
 * Get own user information
 * @param {string} accountID - Account ID
 * @param {string} userId - User ID from req.user (for ownership check)
 * @returns {Promise<Object>} Own user details
 */
export const getMe = async (accountID, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const me = await client.invoke({
      _: "getMe"
    });
    
    // Log action
    await recordLog({
      accountID: validAccountID,
      action: 'GET_ME',
      status: 'SUCCESS'
    });
    
    return {
      success: true,
      data: me
    };
    
  } catch (error) {
    console.error('Error fetching own user info:', error);
    
    // Log error
    await recordLog({
      accountID,
      action: 'GET_ME',
      status: 'FAILURE',
      errorMessage: error.message
    });
    
    throw {
      success: false,
      error: error.message || 'Failed to fetch user info'
    };
  }
};

/**
 * Get all contacts
 * @param {string} accountID - Account ID
 * @param {string} userId - User ID from req.user
 * @returns {Promise<Object>} List of contacts with user IDs
 */
export const getAllContacts = async (accountID, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    const contacts = await client.invoke({
      _: "getContacts"
    });
    
    // Log action
    await recordLog({
      accountID: validAccountID,
      action: 'GET_CONTACTS',
      payload: { count: contacts.user_ids?.length || 0 },
      status: 'SUCCESS'
    });
    
    return {
      success: true,
      data: contacts,
      count: contacts.user_ids?.length || 0
    };
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    
    await recordLog({
      accountID,
      action: 'GET_CONTACTS',
      status: 'FAILURE',
      errorMessage: error.message
    });
    
    throw {
      success: false,
      error: error.message || 'Failed to fetch contacts'
    };
  }
};

/**
 * Get detailed user information by user ID
 * @param {string} accountID - Account ID
 * @param {number|string} userId - Telegram user ID
 * @param {string} requestUserId - User ID from req.user
 * @returns {Promise<Object>} User details
 */
export const getUserById = async (accountID, telegramUserId, requestUserId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, requestUserId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    // Convert to number if string
    const userId = typeof telegramUserId === 'string' 
      ? parseInt(telegramUserId, 10) 
      : telegramUserId;
    
    if (!userId || isNaN(userId)) {
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
    console.error(`Error fetching user ${telegramUserId}:`, error);
    throw {
      success: false,
      error: error.message || 'Failed to fetch user'
    };
  }
};

/**
 * Search for users by username or phone number
 * @param {string} accountID - Account ID
 * @param {string} query - Search query (username or phone)
 * @param {string} userId - User ID from req.user
 * @returns {Promise<Object>} Search results
 */
export const searchUsers = async (accountID, query, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Valid search query is required');
    }

    const result = await client.invoke({
      _: "searchContacts",
      query: query.trim(),
      limit: 50
    });
    
    // Log action
    await recordLog({
      accountID: validAccountID,
      action: 'SEARCH_USERS',
      payload: { query: query.trim(), resultCount: result.user_ids?.length || 0 },
      status: 'SUCCESS'
    });

    return {
      success: true,
      data: result,
      count: result.user_ids?.length || 0
    };
    
  } catch (error) {
    console.error('Error searching users:', error);
    
    await recordLog({
      accountID,
      action: 'SEARCH_USERS',
      payload: { query },
      status: 'FAILURE',
      errorMessage: error.message
    });
    
    throw {
      success: false,
      error: error.message || 'Failed to search users'
    };
  }
};

/**
 * Get contact details with enriched information
 * @param {string} accountID - Account ID
 * @param {number[]} userIds - Array of user IDs
 * @param {string} requestUserId - User ID from req.user
 * @returns {Promise<Object>} Enriched contact details
 */
export const getContactsDetails = async (accountID, userIds = [], requestUserId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, requestUserId);
    
    // Get all contacts first
    const contacts = await getAllContacts(validAccountID, requestUserId);
    const idsToFetch = userIds.length > 0 ? userIds : contacts.data.user_ids;

    if (!idsToFetch || idsToFetch.length === 0) {
      return {
        success: true,
        data: [],
        count: 0
      };
    }

    // Fetch details for each user
    const userDetails = await Promise.all(
      idsToFetch.map(async (userId) => {
        try {
          const user = await getUserById(validAccountID, userId, requestUserId);
          return user.data;
        } catch (err) {
          console.error(`Failed to fetch user ${userId}:`, err);
          return null;
        }
      })
    );

    const validUsers = userDetails.filter(user => user !== null);
    
    // Log action
    await recordLog({
      accountID: validAccountID,
      action: 'GET_CONTACTS_DETAILS',
      payload: { requestedCount: idsToFetch.length, fetchedCount: validUsers.length },
      status: 'SUCCESS'
    });

    return {
      success: true,
      data: validUsers,
      count: validUsers.length
    };
    
  } catch (error) {
    console.error('Error fetching contact details:', error);
    
    await recordLog({
      accountID,
      action: 'GET_CONTACTS_DETAILS',
      status: 'FAILURE',
      errorMessage: error.message
    });
    
    throw {
      success: false,
      error: error.message || 'Failed to fetch contact details'
    };
  }
};

/**
 * Add/Import contacts
 * @param {string} accountID - Account ID
 * @param {Array} contacts - Array of contact objects
 * @param {string} userId - User ID from req.user
 * @returns {Promise<Object>} Import result
 */
export const addContacts = async (accountID, contacts, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('Contacts array is required and cannot be empty');
    }
    
    // Validate contact structure
    const validContacts = contacts.filter(contact => {
      return contact.phone_number && typeof contact.phone_number === 'string';
    });
    
    if (validContacts.length === 0) {
      throw new Error('No valid contacts found. Each contact must have phone_number.');
    }

    const result = await client.invoke({
      _: "importContacts",
      contacts: validContacts
    });

    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'IMPORT_CONTACTS',
      targetName: `${validContacts.length} Contacts`,
      payload: { 
        requestedCount: contacts.length,
        validCount: validContacts.length,
        importedCount: result.user_ids?.length || 0
      },
      status: 'SUCCESS'
    });

    return {
      success: true,
      data: result,
      imported: result.user_ids?.length || 0
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'IMPORT_CONTACTS',
      payload: { requestCount: contacts?.length },
      status: 'FAILURE',
      errorMessage: error.message
    });
    
    console.error('Error adding contacts:', error);
    
    throw {
      success: false,
      error: error.message || 'Failed to add contacts'
    };
  }
};

/**
 * Remove contacts
 * @param {string} accountID - Account ID
 * @param {Array} userIds - Array of Telegram user IDs
 * @param {string} userId - User ID from req.user
 * @returns {Promise<Object>} Remove result
 */
export const removeContacts = async (accountID, userIds, userId) => {
  try {
    const validAccountID = sanitizeAccountID(accountID);
    await verifyAccountOwnership(validAccountID, userId);
    
    const client = getClient(validAccountID);
    if (!client) {
      throw new Error('No active session found');
    }
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required and cannot be empty');
    }
    
    // Convert to numbers
    const validUserIds = userIds
      .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      .filter(id => !isNaN(id));
    
    if (validUserIds.length === 0) {
      throw new Error('No valid user IDs found');
    }

    const result = await client.invoke({
      _: "removeContacts",
      user_ids: validUserIds
    });
    
    // Log success
    await recordLog({
      accountID: validAccountID,
      action: 'REMOVE_CONTACTS',
      targetName: `${validUserIds.length} Contacts`,
      payload: { 
        requestedCount: userIds.length,
        validCount: validUserIds.length
      },
      status: 'SUCCESS'
    });
    
    return {
      success: true,
      data: result,
      removed: validUserIds.length
    };
    
  } catch (error) {
    // Log failure
    await recordLog({
      accountID,
      action: 'REMOVE_CONTACTS',
      payload: { requestedCount: userIds?.length },
      status: 'FAILURE',
      errorMessage: error.message
    });
    
    console.error('Error removing contacts:', error);
    
    throw {
      success: false,
      error: error.message || 'Failed to remove contacts'
    };
  }
};