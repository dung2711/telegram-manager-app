import Account from "../models/Account.js";
import { createTDLibClient } from "../config/tdlib.js";

const clients = new Map();

export const addClient = (accountID, client) => {
    clients.set(accountID, client);
}

export const getClient = (accountID) => {
    return clients.get(accountID);
}

export const loadClientFromDB = async () => {
    const allAccounts = await Account.find({ isAuthenticated: true });
    for (const account of allAccounts) {
        const client = createTDLibClient(account.accountID);
        clients.set(account.accountID, client);
    }
}