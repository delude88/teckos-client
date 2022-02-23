import {ITeckosClient, TeckosClient, TeckosClientWithJWT} from "../..";

const URL = "ws://localhost:4000";

const sendingRef = document.getElementById("sending") as HTMLTextAreaElement;
const receivingRef = document.getElementById("receiving") as HTMLTextAreaElement;

const printToSent = (text: string) => {
    sendingRef.value += text + "\n";
}
const printToReceive = (text: string) => {
    receivingRef.value += text + "\n";
}

const sendExampleMessages = (ws: ITeckosClient) => {
    printToSent("Sending 'undefined'");
    ws.emit(undefined);

    printToSent('sending undefined');
    ws.emit(undefined);

    printToSent("Sending larger payload'");
    ws.emit("send-ice-candidate", {
        from: "6216171fbc99489419eadc7e",
        to: "62161b6ebc99489419eadc88",
        iceCandidate: undefined
    });

    printToSent("Sending 'no-args'");
    ws.emit('no-args');

    printToSent("Sending 'hello' with payload");
    ws.emit('hello', {another: 'world'}, ['hello', 'world']);

    printToSent("Sending 'hello' with payload and callback");
    ws.emit('work', {some: 'data'}, (result: string) => {
        printToReceive("Got result from callback: " + result);
    });

    printToSent("Sending 'personal'");
    ws.emit('personal');

    printToSent("Now sleeping for 5s...");

    setTimeout(() => sendExampleMessages(ws), 5000);
}

const USE_TOKEN = true

const connect = () => {
    const ws = USE_TOKEN ? new TeckosClientWithJWT(URL, {
        reconnection: true,
        debug: true
    }, "mytoken") : new TeckosClient(URL, {reconnection: true, debug: true})

    ws.on('connect', () => {
        printToReceive("Connected!");
        sendExampleMessages(ws);
    });

    ws.on('hello', () => {
        printToReceive("Received 'hello' (was broadcasted by server to all)");
    })

    ws.on('notification', () => {
        printToReceive("Received 'notification' (was broadcasted by server to group 'usergroup')");
    })

    ws.on('test', () => {
        printToReceive("Received 'test'");
    })

    ws.on('error', (error: Error) => {
        printToReceive("Received 'error': " + error);
    });

    ws.on('disconnect', () => {
        printToReceive("Disconnected!");
    });

    ws.on('reconnect_attempt', () => {
        printToReceive("reconnect_attempt!");
    });

    ws.on('reconnect', () => {
        printToReceive("Reconnected!");
    });

    ws.on('disconnect', () => {
        printToReceive("Another disconnection handler!");
    });

    console.log("Connecting...");
    ws.connect();
};


document.addEventListener("DOMContentLoaded", function () {
    connect();
});
