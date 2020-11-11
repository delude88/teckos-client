import {TeckosClientWithJWT} from "./../src"

const URL = "ws://localhost:4000";

const sendingRef = document.getElementById("sending") as HTMLTextAreaElement;
const receivingRef = document.getElementById("receiving") as HTMLTextAreaElement;

const printToSent = (text: string) => {
  sendingRef.value += text + "\n";
}
const printToReceive = (text: string) => {
  receivingRef.value += text + "\n";
}

const connect = (token: string) => {
  const ws = new TeckosClientWithJWT(URL, token, {bla: 'blubb'});

  const sendExampleMessages = () => {
    printToSent("Sending 'no-args'");
    ws.emit('no-args');

    printToSent("Sending 'hello' with payload");
    ws.emit('hello', {another: 'world'}, ['hello', 'world']);

    printToSent("Sending 'hello' with payload and callback");
    ws.emit('work', {some: 'data'}, (result: string) => {
      receivingRef.value += "Got result from callback:" + result;
    });

    printToSent("Sending 'personal'");
    ws.emit('personal');

    printToSent("Now sleeping for 5s...");
    setTimeout(() => sendExampleMessages(), 5000);
  }

  ws.on('connect', () => {
    printToReceive("Connected!");
    sendExampleMessages();
  });

  ws.on('test', () => {
    printToReceive("Received 'test'");
  })

  ws.on('error', (error) => {
    printToReceive("Received 'error': " + error);
  });

  ws.on('disconnect', () => {
    printToReceive("Disconnected!");
    printToReceive("Reconnecting...");
    setTimeout(() => connect(token), 1000);
  });

  ws.connect();
};


document.addEventListener("DOMContentLoaded", function(){
  connect("mytoken");
});
