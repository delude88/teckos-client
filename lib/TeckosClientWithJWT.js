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
import TeckosClient from './TeckosClient';
var TeckosClientWithJWT = /** @class */ (function (_super) {
    __extends(TeckosClientWithJWT, _super);
    function TeckosClientWithJWT(url, token, initialData) {
        var _this = _super.call(this, url) || this;
        _this._handleOpen = function () {
            _this.once('ready', function () {
                if (_this._reconnectionsAttemps > 0) {
                    _this.listeners('reconnect').forEach(function (listener) { return listener(); });
                }
                else {
                    _this.listeners('connect').forEach(function (listener) { return listener(); });
                }
            });
            _this.emit('token', __assign({ token: _this._token }, _this._initialData));
        };
        _this._token = token;
        _this._initialData = initialData;
        return _this;
    }
    return TeckosClientWithJWT;
}(TeckosClient));
export default TeckosClientWithJWT;
//# sourceMappingURL=TeckosClientWithJWT.js.map