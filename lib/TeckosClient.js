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
import SocketEventEmitter from './SocketEventEmitter';
import { decodePacket, encodePacket } from './Converter';
import { PacketType } from './Packet';
var TeckosClient = /** @class */ (function (_super) {
    __extends(TeckosClient, _super);
    function TeckosClient(url, options) {
        var _this = _super.call(this) || this;
        _this._reconnectDelay = 250;
        _this._reconnectionsAttemps = 0;
        _this._acks = new Map();
        _this._fnId = 0;
        _this._attachHandler = function () {
            if (_this._ws) {
                _this._ws.onopen = _this._handleOpen;
                _this._ws.onerror = _this._handleError;
                _this._ws.onclose = _this._handleClose;
                _this._ws.onmessage = _this._handleMessage;
            }
        };
        _this.connect = function () {
            _this._ws = new WebSocket(_this._url);
            _this._attachHandler();
        };
        _this._reconnect = function () {
            _this.connect();
        };
        _this.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            args.unshift(event);
            var packet = {
                type: PacketType.EVENT,
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
                type: PacketType.EVENT,
                data: args,
            });
        };
        _this._send = function (packet) {
            if (_this._ws !== undefined && _this.connected) {
                var buffer = encodePacket(packet);
                _this._ws.send(buffer);
                return true;
            }
            return false;
        };
        _this._handleMessage = function (msg) {
            var packet = typeof msg.data === 'string' ? JSON.parse(msg.data) : decodePacket(msg.data);
            if (packet.type === PacketType.EVENT) {
                var event_1 = packet.data[0];
                var args_1 = packet.data.slice(1);
                if (event_1) {
                    _this.listeners(event_1).forEach(function (listener) { return listener.apply(void 0, args_1); });
                }
                else {
                    console.error(msg.data);
                }
            }
            else if (packet.type === PacketType.ACK && packet.id !== undefined) {
                // Call assigned function
                var ack = _this._acks.get(packet.id);
                if (typeof ack === 'function') {
                    ack.apply(_this, packet.data);
                    _this._acks.delete(packet.id);
                }
            }
            else {
                console.error("Invalid type: " + packet.type);
            }
        };
        _this._handleOpen = function () {
            if (_this._reconnectionsAttemps > 0) {
                _this.listeners('reconnect').forEach(function (listener) { return listener(); });
            }
            else {
                _this.listeners('connect').forEach(function (listener) { return listener(); });
            }
        };
        _this._handleError = function (error) {
            if (_this._handlers && _this._handlers.error) {
                _this._handlers.error.forEach(function (listener) { return listener(error); });
            }
        };
        _this._handleClose = function () {
            _this.listeners('disconnect').forEach(function (listener) { return listener(); });
            // Try reconnect
            _this._reconnectDelay = (_this._options && _this._options.reconnectionDelay) || 250;
            setTimeout(function () {
                _this._reconnectionsAttemps += 1;
                _this._reconnect();
            }, Math.min((_this._options && _this._options.reconnectionDelayMax)
                || 4000, _this._reconnectDelay + _this._reconnectDelay));
        };
        _this.close = function () {
            if (_this._ws !== undefined)
                _this._ws.close();
        };
        _this._options = options;
        _this._url = url;
        return _this;
    }
    Object.defineProperty(TeckosClient.prototype, "connected", {
        get: function () {
            return this._ws !== undefined && this._ws.readyState === 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TeckosClient.prototype, "disconnected", {
        get: function () {
            return !this.connected;
        },
        enumerable: false,
        configurable: true
    });
    return TeckosClient;
}(SocketEventEmitter));
export default TeckosClient;
//# sourceMappingURL=TeckosClient.js.map