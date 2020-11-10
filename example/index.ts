import { config } from 'dotenv';
import fetch from 'node-fetch';
import {JWTWebSocket} from "../src";

config();

const URL = process.env.URL || "localhost:4000";

const getToken = () => fetch('https://auth.digital-stage.org/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@digital-stage.org',
    password: 'testtesttest',
  }),
})
  .then((res) => {
    if (res.ok) return res.json();
    throw new Error(`Could not get token: ${res.statusText}`);
  });

const connect = async (token: string) => {
  const ws = new JWTWebSocket(URL, token, { bla: 'blubb' });

  ws.on('connect', () => {
    console.log('Connected!!!!!');

    ws.emit('no-args');

    ws.emit('hello', { another: 'world' }, ['hello', 'world']);

    console.log('Sending work');
    ws.emit('work', { some: 'data' }, (result: string) => {
      console.log(result);
    });
  });

  ws.on('stage-added', () => {
    console.log('Stage added');
  });

  ws.on('error', () => {
    console.log('Error');
  });

  ws.on('disconnect', () => {
    console.log('disconnect');
    setTimeout(() => connect(token), 1000);
  });
};

const run = async () => {
  const token = await getToken();
  connect(token);
};

run();
