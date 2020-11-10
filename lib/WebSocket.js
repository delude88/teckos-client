"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var websocket_1 = require("websocket");
var SocketEventEmitter_1 = require("./SocketEventEmitter");
var Converter_1 = require("./Converter");
var Packet_1 = require("./Packet");
var WebSocket = /** @class */ (function (_super) {
    __extends(WebSocket, _super);
    function WebSocket(url, options) {
        var _this = _super.call(this) || this;
        _this._acks = new Map();
        _this._fnId = 0;
        _this.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            args.unshift(event);
            var packet = {
                type: Packet_1.PacketType.EVENT,
                data: args,
            };
            if (typeof args[args.length - 1] === 'function') {
                _this._acks.set(_this._fnId, args.pop());
                packet.id = _this._fnId;
                _this._fnId += 1;
            }
            return _this._send(packet);
        };
        _this.send = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            args.unshift('message');
            return _this._send({
                type: Packet_1.PacketType.EVENT,
                data: args,
            });
        };
        _this._send = function (packet) {
            if (_this.connected) {
                console.log('\nsend information:');
                var buffer = Converter_1.encodePacket(packet);
                _this._ws.send(buffer);
                return true;
            }
            return false;
        };
        _this._handleMessage = function (msg) {
            var packet = Converter_1.decodePacket(msg.data);
            console.log('PACKET');
            console.log(packet);
            if (packet.type === Packet_1.PacketType.EVENT) {
                var event_1 = packet.data[0];
                var args_1 = packet.data.slice(1);
                if (event_1) {
                    _this.listeners(event_1).forEach(function (listener) { return listener.apply(void 0, args_1); });
                }
                else {
                    console.error('Invalid message from server:');
                    console.error(msg.data);
                }
            }
            else if (packet.type === Packet_1.PacketType.ACK) {
                // Call assigned function
                var ack = _this._acks.get(packet.id);
                if (typeof ack === 'function') {
                    console.debug('calling ack %s with %j', packet.id, packet.data);
                    console.log(ack);
                    ack.apply(_this, packet.data);
                    _this._acks.delete(packet.id);
                }
            }
            else {
                console.error("Invalid type: " + packet.type);
            }
        };
        _this._handleOpen = function () {
            console.log('handleOpen');
            // Nothing to do here
            _this.listeners('connect').forEach(function (listener) { return listener(); });
        };
        _this._handleError = function (error) {
            if (_this._handlers && _this._handlers.error) {
                _this._handlers.error.forEach(function (listener) { return listener(error.message); });
            }
        };
        _this._handleClose = function () {
            _this.listeners('disconnect').forEach(function (listener) { return listener(); });
        };
        _this.close = function () {
            _this._ws.close();
        };
        _this._options = options;
        _this._ws = new websocket_1.w3cwebsocket(url);
        _this._ws.onopen = _this._handleOpen;
        _this._ws.onerror = _this._handleError;
        _this._ws.onclose = _this._handleClose;
        _this._ws.onmessage = _this._handleMessage;
        return _this;
    }
    Object.defineProperty(WebSocket.prototype, "connected", {
        get: function () {
            return this._ws.readyState === 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocket.prototype, "disconnected", {
        get: function () {
            return !this.connected;
        },
        enumerable: false,
        configurable: true
    });
    return WebSocket;
}(SocketEventEmitter_1.default));
exports.default = WebSocket;
//# sourceMappingURL=WebSocket.js.map