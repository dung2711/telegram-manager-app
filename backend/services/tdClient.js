import { createTDLibClient } from '../config/tdlib.js';
import Account from '../models/Account.js';

// In-memory storage cho TDLib clients
const clients = new Map();

/**
 * Add client to memory
 */
export const addClient = (accountID, client) => {
  clients.set(accountID, client);
  console.log(`Client added for account: ${accountID}`);
};

/**
 * Get client from memory
 */
export const getClient = (accountID) => {
  return clients.get(accountID);
};

/**
 * Remove client from memory
 */
export const removeClient = (accountID) => {
  const client = clients.get(accountID);
  if (client) {
    try {
      client.close();
    } catch (error) {
      console.error(`Error closing client ${accountID}:`, error);
    }
    clients.delete(accountID);
    console.log(`Client removed for account: ${accountID}`);
  }
};

/**
 * Get all active client IDs
 */
export const getActiveClients = () => {
  return Array.from(clients.keys());
};

/**
 * Restore TDLib clients cho các accounts đã authenticated
 * Gọi khi server start
 */
export const restoreClients = async () => {
  try {
    console.log('Restoring TDLib clients...');
    
    // Lấy tất cả accounts đã authenticated
    const authenticatedAccounts = await Account.find({ 
      isAuthenticated: true 
    });
    
    if (authenticatedAccounts.length === 0) {
      console.log('No authenticated accounts found');
      return;
    }
    
    console.log(`Found ${authenticatedAccounts.length} authenticated account(s)`);
    
    // Khôi phục client cho mỗi account
    let restoredCount = 0;
    let failedCount = 0;
    
    for (const account of authenticatedAccounts) {
      try {
        // Tạo lại TDLib client
        const client = createTDLibClient(account.accountID);
        
        // Thêm vào map
        addClient(account.accountID, client);
        
        // Update lastActive
        account.lastActive = new Date();
        await account.save();
        
        restoredCount++;
        
      } catch (error) {
        console.error(`Failed to restore client for ${account.phoneNumber}:`, error.message);
        
        // Nếu restore fail, set isAuthenticated = false
        account.isAuthenticated = false;
        await account.save();
        
        failedCount++;
      }
    }
    
    console.log(`Restored ${restoredCount} client(s)`);
    if (failedCount > 0) {
      console.log(`⚠️  Failed to restore ${failedCount} client(s)`);
    }
    
  } catch (error) {
    console.error('Error restoring clients:', error);
  }
};

/**
 * Cleanup - Close all clients
 * Gọi khi server shutdown
 */
export const cleanupClients = async () => {
  console.log('Cleaning up TDLib clients...');
  
  for (const [accountID, client] of clients.entries()) {
    try {
      await client.close();
      console.log(`Closed client: ${accountID}`);
    } catch (error) {
      console.error(`Error closing client ${accountID}:`, error);
    }
  }
  
  clients.clear();
  console.log('All clients cleaned up');
};