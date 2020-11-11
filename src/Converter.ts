import { Packet } from './Packet';

const enc = new TextEncoder();
const dec = new TextDecoder();

const encodePacket = (packet: Packet): ArrayBufferLike => enc.encode(JSON.stringify(packet));
const decodePacket = (buffer: ArrayBufferLike): Packet => JSON.parse(dec.decode(buffer).toString());
export {
  encodePacket,
  decodePacket,
};
