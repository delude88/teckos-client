import debug from "debug";
import {ITeckosClient, TeckosClientWithJWT} from "../../lib/index.js";

const d = debug("example");

const printToSent = d.extend("sent");
const printToReceive = d.extend("received");


const URL = "ws://imac.fritz.box:4000";

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

    d("Now sleeping for 5s...");

    setTimeout(() => sendExampleMessages(ws), 5000);
}

const connect = async (token: string) => {
    const ws: ITeckosClient = new TeckosClientWithJWT(URL, {
        reconnection: true,
        reconnectionAttempts: 5
    }, token);

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
