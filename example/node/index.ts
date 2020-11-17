import {config} from 'dotenv';
import {TeckosClient} from "../../lib";
import debug from "debug";

config();

const d = debug("example");

const printToSent = d.extend("sent");
const printToReceive = d.extend("received");


const URL = process.env.URL || "ws://localhost:4000";

const sendExampleMessages = (ws: TeckosClient) => {
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

const connect = async () => {
  const ws = new TeckosClient(URL, {});

  ws.on('connect', () => {
    printToReceive("Connected!");
    sendExampleMessages(ws);
  });

  ws.on('hello', (firstName, lastName) => {
    printToReceive("Received 'hello' with payload (to all):");
    printToReceive(firstName, lastName);
  })

  ws.on('notification', (firstName, lastName) => {
    printToReceive("Received 'notification' with payload (to group 'usergroup'):");
    printToReceive(firstName, lastName);
  })

  ws.on('test', () => {
    printToReceive("Received 'test'");
  })

  ws.on('error', (error) => {
    printToReceive("Received 'error': ");
    console.error(error);
  });

  ws.on('disconnect', () => {
    printToReceive("Disconnected!");
  });

  ws.connect();
};

connect();
