var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var SocketEventEmitter = /** @class */ (function () {
    function SocketEventEmitter() {
        var _this = this;
        this._maxListeners = 50;
        this._handlers = {};
        this.addListener = function (event, listener) {
            if (Object.keys(_this._handlers).length === _this._maxListeners) {
                throw new Error('Max listeners reached');
            }
            _this._handlers[event] = _this._handlers[event] || [];
            _this._handlers[event].push(listener);
            return _this;
        };
        this.once = function (event, listener) {
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
        this.removeListener = function (event, listener) {
            if (_this._handlers[event]) {
                _this._handlers[event] = _this._handlers[event].filter(function (handler) { return handler !== listener; });
            }
            return _this;
        };
        this.off = function (event, listener) { return _this.removeListener(event, listener); };
        this.removeAllListeners = function (event) {
            if (event) {
                delete _this._handlers[event];
            }
            else {
                _this._handlers = {};
            }
            return _this;
        };
        this.setMaxListeners = function (n) {
            _this._maxListeners = n;
            return _this;
        };
        this.getMaxListeners = function () { return _this._maxListeners; };
        this.listeners = function (event) {
            if (_this._handlers[event]) {
                return __spreadArrays(_this._handlers[event]);
            }
            return [];
        };
        this.rawListeners = function (event) { return __spreadArrays(_this._handlers[event]); };
        this.listenerCount = function (event) {
            if (_this._handlers[event]) {
                return Object.keys(_this._handlers[event]).length;
            }
            return 0;
        };
        this.prependListener = function (event, listener) {
            if (Object.keys(_this._handlers).length === _this._maxListeners) {
                throw new Error('Max listeners reached');
            }
            _this._handlers[event] = _this._handlers[event] || [];
            _this._handlers[event].unshift(listener);
            return _this;
        };
        this.prependOnceListener = function (event, listener) {
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
        this.eventNames = function () { return Object.keys(_this._handlers); };
        this.on = function (event, listener) { return _this.addListener(event, listener); };
        this.emit = function (event) {
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
    }
    return SocketEventEmitter;
}());
export default SocketEventEmitter;
//# sourceMappingURL=SocketEventEmitter.js.map