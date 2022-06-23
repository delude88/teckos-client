const enc = new TextEncoder();
const dec = new TextDecoder();
const encodePacket = (packet) => enc.encode(JSON.stringify(packet));
const decodePacket = (buffer) => JSON.parse(dec.decode(buffer).toString());
export { encodePacket, decodePacket };
//# sourceMappingURL=Converter.js.map