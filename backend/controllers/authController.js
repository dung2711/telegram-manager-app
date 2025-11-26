import { v4 as uuid } from 'uuid';
import Account from '../models/Account.js';
import { addClient } from '../services/tdClient.js';
import { createTDLibClient } from '../config/tdlib.js';

export const loginUser = async (phoneNumber) => {
    try {
        const accountID = uuid();
        const sessionPath = `./tdlib/${accountID}/`;
        
        // Create TDLib client
        const client = createTDLibClient(accountID);

        // Send phone number (client connects automatically on first invoke)
        await client.invoke({
            _: 'setAuthenticationPhoneNumber',
            phone_number: phoneNumber,
            settings: {
                _: 'phoneNumberAuthenticationSettings',
                allow_flash_call: false,
                is_current_phone_number: false,
                allow_sms_retriever_api: false
            }
        });
        
        // Store client for later use
        addClient(accountID, client);
        
        // // Create account document
        // await Account.create({
        //     accountID,
        //     phoneNumber,
        //     sessionPath,
        //     isAuthenticated: false
        // });
        
        return {
            success: true,
            accountID,
            message: 'Verification code sent to your phone number'
        };
        
    } catch (error) {
        throw new Error('Login initiation failed: ' + error.message);
    }
}

export const verifyAuthCode = async (accountID, code) => {
    try {
        const { getClient } = await import('../services/tdClient.js');
        const client = getClient(accountID);
        
        if (!client) {
            throw new Error('No active session found for this account');
        }
        
        // Submit authentication code
        await client.invoke({
            _: 'checkAuthenticationCode',
            code: code
        });
        
        // Update account status
        await Account.findOneAndUpdate(
            { accountID },
            { isAuthenticated: true },
            { new: true }
        );
        
        return {
            success: true,
            message: 'Authentication successful'
        };
        
    } catch (error) {
        throw new Error('Code verification failed: ' + error.message);
    }
}

export const verifyPassword = async (accountID, password) => {
    try {
        const { getClient } = await import('../services/tdClient.js');
        const client = getClient(accountID);
        
        if (!client) {
            throw new Error('No active session found for this account');
        }
        
        // Submit 2FA password
        await client.invoke({
            _: 'checkAuthenticationPassword',
            password: password
        });
        
        // Update account status
        await Account.findOneAndUpdate(
            { accountID },
            { isAuthenticated: true },
            { new: true }
        );
        
        return {
            success: true,
            message: '2FA authentication successful'
        };
        
    } catch (error) {
        throw new Error('Password verification failed: ' + error.message);
    }
}