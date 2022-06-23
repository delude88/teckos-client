/* eslint-disable no-console */
import * as IsomorphicWebSocket from 'isomorphic-ws';
import { decodePacket, encodePacket } from './util/Converter';
import { SocketEventEmitter } from './util/SocketEventEmitter';
import { ConnectionState, PacketType } from './types';
const DEFAULT_OPTIONS = {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    randomizationFactor: 0.5,
    timeout: 5000,
    debug: false,
};
class TeckosClient extends SocketEventEmitter {
    url;
    options;
    ws;
    currentReconnectDelay;
    currentReconnectionAttempts = 0;
    acks = new Map();
    fnId = 0;
    connectionTimeout;
    reconnectionTimeout;
    constructor(url, options) {
        super();
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
        this.currentReconnectDelay = this.options.reconnectionDelay;
        this.url = url;
    }
    attachHandler = () => {
        if (this.ws) {
            this.ws.onopen = this.handleOpen;
            this.ws.onerror = this.handleError;
            this.ws.onclose = this.handleClose;
            this.ws.onmessage = this.handleMessage;
        }
    };
    get webSocket() {
        return this.ws;
    }
    connect = () => {
        if (this.options.debug)
            console.log(`(teckos:client) Connecting to ${this.url}...`);
        // This will try to connect immediately
        // eslint-disable-next-line new-cap
        this.ws = new IsomorphicWebSocket.WebSocket(this.url);
        // Attach handlers
        this.attachHandler();
        // Handle timeout
        this.connectionTimeout = setTimeout(() => {
            if (this.ws && this.ws.readyState === 0 /* = CONNECTING */) {
                this.ws.close();
            }
        }, this.options.timeout);
    };
    reconnect = () => {
        this.listeners('reconnect_attempt').forEach((listener) => listener());
        this.connect();
    };
    getConnectionState() {
        if (this.ws) {
            switch (this.ws.readyState) {
                case 0 /* = CONNECTING */:
                    return ConnectionState.CONNECTING;
                case 1 /* = OPEN */:
                    return ConnectionState.CONNECTED;
                case 2 /* = CLOSING */:
                    return ConnectionState.DISCONNECTING;
                default: /* 3 = CLOSED */
                    return ConnectionState.DISCONNECTED;
            }
        }
        return ConnectionState.DISCONNECTED;
    }
    get state() {
        return this.getConnectionState();
    }
    get connected() {
        return this.getConnectionState() === ConnectionState.CONNECTED;
    }
    get disconnected() {
        return this.getConnectionState() === ConnectionState.DISCONNECTED;
    }
    emit = (event, ...args) => {
        args.unshift(event);
        const packet = {
            type: PacketType.EVENT,
            data: args,
        };
        if (typeof args[args.length - 1] === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.acks.set(this.fnId, args.pop());
            packet.id = this.fnId;
            this.fnId += 1;
        }
        return this.sendPackage(packet);
    };
    send = (...args) => {
        args.unshift('message');
        return this.sendPackage({
            type: PacketType.EVENT,
            data: args,
        });
    };
    sendPackage = (packet) => {
        if (this.ws !== undefined && this.ws.readyState === 1 /* = OPEN */) {
            const buffer = encodePacket(packet);
            if (this.options.debug)
                console.log(`(teckos:client) [${this.url}] Send packet: ${JSON.stringify(packet)}`);
            this.ws.send(buffer);
            return true;
        }
        return false;
    };
    handleMessage = (msg) => {
        const packet = typeof msg.data === 'string'
            ? JSON.parse(msg.data)
            : decodePacket(msg.data);
        if (this.options.debug)
            console.log(`(teckos:client) [${this.url}] Got packet: ${JSON.stringify(packet)}`);
        if (packet.type === PacketType.EVENT) {
            const event = packet.data[0];
            const args = packet.data.slice(1);
            if (event) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                this.listeners(event).forEach((listener) => listener(...args));
            }
            else {
                throw new Error(`(teckos-client) [${this.url}] Got invalid event message: ${JSON.stringify(msg.data)}`);
            }
        }
        else if (packet.type === PacketType.ACK && packet.id !== undefined) {
            // Call assigned function
            const ack = this.acks.get(packet.id);
            if (typeof ack === 'function') {
                ack.apply(this, packet.data);
                this.acks.delete(packet.id);
            }
        }
        else {
            throw new Error(`(teckos-client) [${this.url}] Got invalid message type: ${packet.type}`);
        }
    };
    handleOpen = () => {
        if (this.currentReconnectionAttempts > 0) {
            // Reset reconnection settings to default
            this.currentReconnectDelay = this.options.reconnectionDelay;
            this.currentReconnectionAttempts = 0;
            // Inform listeners
            if (this.options.debug)
                console.log(`(teckos:client) [${this.url}] Reconnected!`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            this.listeners('reconnect').forEach((listener) => listener());
        }
        // Inform listeners
        if (this.options.debug)
            console.log(`(teckos:client) [${this.url}] Connected!`);
        this.listeners('connect').forEach((listener) => listener());
    };
    handleError = (error) => {
        if (this.handlers && this.handlers.error) {
            if (this.options.debug)
                console.log(`(teckos:client) [${this.url}] Got error from server: ${JSON.stringify(error)}`);
            this.handlers.error.forEach((listener) => listener(error));
        }
    };
    handleClose = () => {
        // Stop connection timeout
        if (this.connectionTimeout) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            clearTimeout(this.connectionTimeout);
        }
        // Stop reconnection timeout
        if (this.reconnectionTimeout) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            clearTimeout(this.reconnectionTimeout);
        }
        // Inform listeners
        if (this.currentReconnectionAttempts > 0) {
            if (this.options.debug)
                console.log(`(teckos:client) [${this.url}] Reconnect #${this.currentReconnectionAttempts} failed!`);
            this.listeners('reconnect_error').forEach((listener) => {
                if (listener)
                    listener();
            });
        }
        else {
            if (this.options.debug)
                console.log(`(teckos:client) [${this.url}] Disconnected!`);
            this.listeners('disconnect').forEach((listener) => {
                if (listener)
                    listener();
            });
        }
        if (this.options.reconnection) {
            // Apply reconnection logic
            this.currentReconnectionAttempts += 1;
            if (this.options.reconnectionAttempts === Infinity ||
                this.currentReconnectionAttempts <= this.options.reconnectionAttempts) {
                const timeout = Math.min(this.options.reconnectionDelayMax, this.currentReconnectDelay);
                // Increase reconnection delay
                this.currentReconnectDelay = Math.round(this.currentReconnectDelay +
                    this.currentReconnectDelay * this.options.randomizationFactor);
                if (this.options.debug)
                    console.log(`(teckos:client) [${this.url}] Try reconnecting (${this.currentReconnectionAttempts}/${this.options.reconnectionAttempts}) in ${timeout}ms to ${this.url}...`);
                this.reconnectionTimeout = setTimeout(() => {
                    this.reconnect();
                }, timeout);
            }
            else {
                if (this.options.debug)
                    console.log(`(teckos:client) [${this.url}] Reconnection maximum of ${this.options.reconnectionAttempts} reached`);
                this.listeners('reconnect_failed').forEach((listener) => listener());
            }
        }
    };
    close = () => {
        if (this.options.debug)
            console.log(`(teckos:client) [${this.url}] Closing connection (client-side)`);
        if (this.ws !== undefined) {
            this.ws.onclose = () => { };
            this.ws.close();
            this.listeners('disconnect').forEach((listener) => listener());
        }
    };
    disconnect = () => {
        this.close();
    };
}
export { TeckosClient };
//# sourceMappingURL=TeckosClient.js.map