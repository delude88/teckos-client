/* eslint-disable no-console */
import * as IsomorphicWebSocket from 'isomorphic-ws';
import { TeckosClient } from './TeckosClient';
import { ConnectionState } from './types';
class TeckosClientWithJWT extends TeckosClient {
    token;
    initialData;
    receivedReady = false;
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(url, options, token, initialData) {
        super(url, options);
        this.token = token;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.initialData = initialData;
        this.on('disconnect', () => {
            this.receivedReady = false;
        });
    }
    getConnectionState() {
        if (this.ws) {
            switch (this.ws.readyState) {
                case IsomorphicWebSocket.WebSocket.OPEN:
                    if (this.receivedReady) {
                        return ConnectionState.CONNECTED;
                    }
                    return ConnectionState.CONNECTING;
                case IsomorphicWebSocket.WebSocket.CONNECTING:
                    return ConnectionState.CONNECTING;
                case IsomorphicWebSocket.WebSocket.CLOSING:
                    return ConnectionState.DISCONNECTING;
                default:
                    return ConnectionState.DISCONNECTED;
            }
        }
        return ConnectionState.DISCONNECTED;
    }
    handleReadyEvent = () => {
        if (this.options.debug)
            console.log(`(teckos:client) [${this.url}] Connected!`);
        this.receivedReady = true;
        if (this.currentReconnectionAttempts > 0) {
            if (this.options.debug)
                console.log(`(teckos:client) [${this.url}] Reconnected!`);
            this.listeners('reconnect').forEach((listener) => listener());
            // Reset reconnection settings to default
            this.currentReconnectDelay = this.options.reconnectionDelay;
            this.currentReconnectionAttempts = 0;
        }
        this.listeners('connect').forEach((listener) => listener());
    };
    handleOpen = () => {
        this.receivedReady = false;
        this.once('ready', this.handleReadyEvent);
        if (this.options.debug)
            console.log(`(teckos:client) Connection opened, sending token now`);
        this.emit('token', {
            token: this.token,
            ...this.initialData,
        });
    };
}
export { TeckosClientWithJWT };
//# sourceMappingURL=TeckosClientWithJWT.js.map