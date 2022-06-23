import {ITeckosClient, TeckosClient, TeckosClientWithJWT} from "../../..";

const USE_TOKEN = true
const URL = "ws://localhost:4000";

const printToSent = (message: string) => console.log(`[SEND] ${message}`)
const printToReceive = (...message: string[]) => console.log(`[RECEIVED]`, ...message)

const sendExampleMessages = (ws: ITeckosClient) => {
    if (ws.disconnected) {
        return;
    }

    printToSent("Sending 'no-args'");
    ws.emit('no-args');

    printToSent("Sending 'hello' with payload");
    ws.emit('hello', 'First name', 'Last name');

    printToSent("Sending 'hello' with payload and callback");
    ws.emit('work', {some: 'data'}, (result: string) => {
        printToReceive("Got result from callback: " + result);
    });

    printToSent("Sending 'personal'");
    ws.emit('personal');

    console.log("Now sleeping for 5s...");

    setTimeout(() => sendExampleMessages(ws), 5000);
}

const connect = async (token: string) => {
    const ws = USE_TOKEN ? new TeckosClientWithJWT(URL, {
        reconnection: true,
        debug: true
    }, "mytoken") : new TeckosClient(URL, {reconnection: true, debug: true})

    ws.on('connect', () => {
        printToReceive("Connected!");
        sendExampleMessages(ws);
    });

    ws.on('hello', (firstName: string, lastName: string) => {
        printToReceive("Received 'hello' with payload (to all):");
        printToReceive(firstName, lastName);
    })

    ws.on('notification', (firstName: string, lastName: string) => {
        printToReceive("Received 'notification' with payload (to group 'usergroup'):");
        printToReceive(firstName, lastName);
    })

    ws.on('test', () => {
        printToReceive("Received 'test'");
    })

    ws.on('error', (error: Error) => {
        printToReceive("Received 'error': ");
        console.error(error);
    });

    ws.on('reconnect_attempt', () => {
        printToReceive("Try to reconnect ...");
    });

    ws.on('reconnect_error', () => {
        printToReceive("Reconnect attempt failed!");
    });

    ws.on('reconnect_failed', () => {
        printToReceive("Unable to reconnect!");
    });

    ws.on('disconnect', () => {
        printToReceive("Disconnected!");
    });

    ws.connect();
};

connect("secret123");
