import tdl from "tdl";

export const createTDLibClient = (accountID) => {
    const client = tdl.createClient({
        apiId: process.env.TELEGRAM_API_ID,
        apiHash: process.env.TELEGRAM_API_HASH,
        tdlibParameters: {
            database_directory: `./tdlib/${accountID}`,
            files_directory: `./tdlib/${accountID}/files`,
            use_message_database: true,
            use_secret_chats: true,
        }
    });
    return client;
}