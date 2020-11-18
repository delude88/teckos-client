import { Packet } from '../types';

const enc = new TextEncoder();
const dec = new TextDecoder();

const encodePacket = (packet: Packet): ArrayBufferLike =>
  enc.encode(JSON.stringify(packet));
const decodePacket = (buffer: ArrayBuffer): Packet =>
  JSON.parse(dec.decode(buffer).toString());
export { encodePacket, decodePacket };
