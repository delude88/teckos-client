"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodePacket = exports.encodePacket = void 0;
var encodePacket = function (packet) { return Buffer.from(JSON.stringify(packet)); };
exports.encodePacket = encodePacket;
var decodePacket = function (buffer) { return JSON.parse(Buffer.from(buffer).toString()); };
exports.decodePacket = decodePacket;
//# sourceMappingURL=Converter.js.map