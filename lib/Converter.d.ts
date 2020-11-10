/// <reference types="node" />
import { Packet } from './Packet';
declare const encodePacket: (packet: Packet) => Buffer;
declare const decodePacket: (buffer: ArrayBuffer) => Packet;
export { encodePacket, decodePacket, };
