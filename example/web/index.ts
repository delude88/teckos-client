import {TeckosClient} from "../..";

const URL = "ws://localhost:4000";

const sendingRef = document.getElementById("sending") as HTMLTextAreaElement;
const receivingRef = document.getElementById("receiving") as HTMLTextAreaElement;

const printToSent = (text: string) => {
  sendingRef.value += text + "\n";
}
const printToReceive = (text: string) => {
  receivingRef.value += text + "\n";
}

const sendExampleMessages = (ws: TeckosClient) => {
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

const connect = () => {
  const ws = new TeckosClient(URL, {
    reconnection: true
  });

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

  console.log("Connecting...");
  ws.connect();
};


document.addEventListener("DOMContentLoaded", function(){
  connect();
});
