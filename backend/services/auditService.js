import AuditLog from '../models/AuditLog.js';

// Hàm lấy tên Group
export const getChatTitle = async (client, chatId) => {
    try {
        const chat = await client.invoke({ _: 'getChat', chat_id: chatId });
        return chat.title;
    } catch { return `Chat ID: ${chatId}`; }
};

// Hàm lấy tên User
export const getUserFullName = async (client, userId) => {
    try {
        const user = await client.invoke({ _: 'getUser', user_id: userId });
        return `${user.first_name} ${user.last_name || ''}`.trim();
    } catch { return `User ID: ${userId}`; }
};

// Hàm ghi Log chung
export const recordLog = async ({ accountID, action, targetId, targetName, payload, status = 'SUCCESS', errorMessage }) => {
    try {
        await AuditLog.create({
            accountID,
            action,
            targetId: targetId ? targetId.toString() : null, // Convert BigInt/Number sang String
            targetName,
            payload,
            status,
            errorMessage
        });
        console.log(`[LOG] ${action} - ${status}`);
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};