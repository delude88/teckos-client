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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var SocketEventEmitter = /** @class */ (function (_super) {
    __extends(SocketEventEmitter, _super);
    function SocketEventEmitter() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._maxListeners = 10;
        _this._handlers = {};
        _this.addListener = function (event, listener) {
            if (Object.keys(_this._handlers).length === _this._maxListeners) {
                throw new Error('Max listeners reached');
            }
            _this._handlers[event] = _this._handlers[event] || [];
            _this._handlers[event].push(listener);
            return _this;
        };
        _this.once = function (event, listener) {
            if (Object.keys(_this._handlers).length === _this._maxListeners) {
                throw new Error('Max listeners reached');
            }
            _this._handlers[event] = _this._handlers[event] || [];
            var onceWrapper = function () {
                listener();
                _this.off(event, onceWrapper);
            };
            _this._handlers[event].push(onceWrapper);
            return _this;
        };
        _this.removeListener = function (event, listener) {
            if (_this._handlers[event]) {
                _this._handlers[event] = _this._handlers[event].filter(function (handler) { return handler !== listener; });
            }
            return _this;
        };
        _this.off = function (event, listener) { return _this.removeListener(event, listener); };
        _this.removeAllListeners = function (event) {
            if (event) {
                delete _this._handlers[event];
            }
            else {
                _this._handlers = {};
            }
            return _this;
        };
        _this.setMaxListeners = function (n) {
            _this._maxListeners = n;
            return _this;
        };
        _this.getMaxListeners = function () { return _this._maxListeners; };
        _this.listeners = function (event) {
            if (_this._handlers[event]) {
                return __spreadArrays(_this._handlers[event]);
            }
            return [];
        };
        _this.rawListeners = function (event) { return __spreadArrays(_this._handlers[event]); };
        _this.listenerCount = function (event) {
            if (_this._handlers[event]) {
                return Object.keys(_this._handlers[event]).length;
            }
            return 0;
        };
        _this.prependListener = function (event, listener) {
            if (Object.keys(_this._handlers).length === _this._maxListeners) {
                throw new Error('Max listeners reached');
            }
            _this._handlers[event] = _this._handlers[event] || [];
            _this._handlers[event].unshift(listener);
            return _this;
        };
        _this.prependOnceListener = function (event, listener) {
            if (Object.keys(_this._handlers).length === _this._maxListeners) {
                throw new Error('Max listeners reached');
            }
            _this._handlers[event] = _this._handlers[event] || [];
            var onceWrapper = function () {
                listener();
                _this.off(event, onceWrapper);
            };
            _this._handlers[event].unshift(onceWrapper);
            return _this;
        };
        _this.eventNames = function () { return Object.keys(_this._handlers); };
        _this.on = function (event, listener) { return _this.addListener(event, listener); };
        _this.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var listeners = _this.listeners(event);
            if (listeners.length > 0) {
                listeners.forEach(function (listener) { return listener(args); });
                return true;
            }
            return false;
        };
        return _this;
    }
    return SocketEventEmitter;
}(events_1.EventEmitter));
exports.default = SocketEventEmitter;
//# sourceMappingURL=SocketEventEmitter.js.map