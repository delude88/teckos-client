import { Packet } from '../types';
// eslint-disable-next-line
import WebSocket = require('isomorphic-ws');

const enc = new TextEncoder();
const dec = new TextDecoder();

const encodePacket = (packet: Packet): ArrayBufferLike => enc.encode(JSON.stringify(packet));
const decodePacket = (buffer: ArrayBuffer): Packet => JSON.parse(dec.decode(buffer).toString());
export {
  encodePacket,
  decodePacket,
};
