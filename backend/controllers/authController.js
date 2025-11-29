import { v4 as uuid } from 'uuid';
import Account from '../models/Account.js';
import { addClient, getClient } from '../services/tdClient.js';
import { createTDLibClient } from '../config/tdlib.js';

// export const loginUser = async (phoneNumber) => {
//     try {
//         const accountID = uuid();
//         const sessionPath = `./tdlib/${accountID}/`;
        
//         // Create TDLib client
//         const client = createTDLibClient(accountID);

//         // Send phone number (client connects automatically on first invoke)
//         await client.invoke({
//             _: 'setAuthenticationPhoneNumber',
//             phone_number: phoneNumber,
//             settings: {
//                 _: 'phoneNumberAuthenticationSettings',
//                 allow_flash_call: false,
//                 is_current_phone_number: false,
//                 allow_sms_retriever_api: false
//             }
//         });
        
//         // Store client for later use
//         addClient(accountID, client);
        
//         // // Create account document
//         // await Account.create({
//         //     accountID,
//         //     phoneNumber,
//         //     sessionPath,
//         //     isAuthenticated: false
//         // });
        
//         return {
//             success: true,
//             accountID,
//             message: 'Verification code sent to your phone number'
//         };
        
//     } catch (error) {
//         throw new Error('Login initiation failed: ' + error.message);
//     }
// }

export const loginUser = async (phoneNumber) => {
    try {
        let accountID;
        let isNewUser = false;

        const existingUser = await Account.findOne({phoneNumber});

        if(!existingUser){
            accountID = uuid();
            isNewUser = true;
        }else{
            accountID = existingUser.accountID;
        }

        const sessionPath = `./tdlib/${accountID}/`;
        
        // Create TDLib client
        let client = getClient(accountID);
        if (!client) {
            client = createTDLibClient(accountID);
            addClient(accountID, client);
        }

        // Send phone number (client connects automatically on first invoke)
        try {
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

            if (isNewUser) {
                await Account.create({
                    accountID,
                    phoneNumber,
                    sessionPath,
                    isAuthenticated: false,
                    createdAt: new Date()
                });
            }

            return {
                success: true,
                accountID,
                isNewUser,
                authState: 'WAIT_CODE',
                message: 'Verification code sent to your phone number'
            };

        } catch (tdError) {
           
            if (tdError.message.includes('unexpected')) {
                console.log(`User ${phoneNumber} is already authenticated.`);
               
                if (!isNewUser) {
                     await Account.findOneAndUpdate(
                        { accountID },
                        { isAuthenticated: true, lastLogin: new Date() }
                    );
                }

                // Trả về thành công luôn, bỏ qua bước nhập Code
                return {
                    success: true,
                    accountID,
                    isNewUser,
                    message: 'User is already logged in'
                };
            }
            
            // Nếu lỗi khác thì ném ra ngoài
            throw tdError;
        }
        
    } catch (error) {
        throw new Error('Login initiation failed: ' + error.message);
    }
}


export const verifyAuthCode = async (accountID, code) => {
    try {

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
            { 
                isAuthenticated: true,
                lastActive: new Date()
            },
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
            { 
                isAuthenticated: true,
                lastActive: new Date()
            },
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