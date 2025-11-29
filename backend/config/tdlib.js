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
    client.on('error', console.error)

    // Aside of receiving responses to your requests, the server can push to you
    // events called "updates" which can be received as follows:
    // client.on('update', update => {
    // console.log('Received update:', update)
    // });
    return client;
}