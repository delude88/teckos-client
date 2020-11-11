import { Packet } from './Packet';
declare const encodePacket: (packet: Packet) => ArrayBufferLike;
declare const decodePacket: (buffer: ArrayBufferLike) => Packet;
export { encodePacket, decodePacket, };
