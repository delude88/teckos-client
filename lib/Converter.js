var enc = new TextEncoder();
var dec = new TextDecoder();
var encodePacket = function (packet) { return enc.encode(JSON.stringify(packet)); };
var decodePacket = function (buffer) { return JSON.parse(dec.decode(buffer).toString()); };
export { encodePacket, decodePacket, };
//# sourceMappingURL=Converter.js.map