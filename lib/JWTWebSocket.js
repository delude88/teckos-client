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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocket_1 = require("./WebSocket");
var JWTWebSocket = /** @class */ (function (_super) {
    __extends(JWTWebSocket, _super);
    function JWTWebSocket(url, token, initialData) {
        var _this = _super.call(this, url) || this;
        _this._ws.onopen = function () {
            _super.prototype.once.call(_this, 'ready', function () {
                _this.listeners('connect').forEach(function (listener) { return listener(); });
            });
            _this.emit('token', __assign({ token: token }, initialData));
        };
        return _this;
    }
    return JWTWebSocket;
}(WebSocket_1.default));
exports.default = JWTWebSocket;
//# sourceMappingURL=JWTWebSocket.js.map