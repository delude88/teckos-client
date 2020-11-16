import debug from 'debug';
import SocketEventEmitter from './util/SocketEventEmitter';
import { decodePacket, encodePacket } from './util/Converter';
import {
  Packet, PacketType, TeckosConnectionOptions, SocketEvent,
} from './types';
// eslint-disable-next-line
import WebSocket = require('isomorphic-ws');

const d = debug('teckos:client');

const DEFAULT_OPTIONS = {
  reconnectionDelay: 250,
  reconnectionDelayMax: 4000,
  reconnectionAttempts: 100,
};

class TeckosClient extends SocketEventEmitter<SocketEvent> {
  protected readonly url: string;

  protected currentReconnectDelay: number = DEFAULT_OPTIONS.reconnectionDelay;

  protected currentReconnectionAttempts: number = 0;

  protected acks: Map<number, (...args: any[]) => void> = new Map();

  protected fnId: number = 0;

  protected readonly options: TeckosConnectionOptions | undefined;

  protected ws: WebSocket | undefined;

  constructor(url: string, options?: TeckosConnectionOptions) {
    super();
    this.options = options;
    this.url = url;
    this.resetReconnectionState();
  }

  protected attachHandler = () => {
    if (this.ws) {
      this.ws.onopen = this.handleOpen;
      this.ws.onerror = this.handleError;
      this.ws.onclose = this.handleClose;
      this.ws.onmessage = this.handleMessage;
    }
  };

  public connect = () => {
    d(`Connecting to ${this.url}...`);

    this.ws = new WebSocket(this.url);
    this.attachHandler();
  };

  protected reconnect = () => {
    this.connect();
  };

  public get connected(): boolean {
    return this.ws !== undefined && this.ws.readyState === 1;
  }

  public get disconnected() {
    return !this.connected;
  }

  public emit = (event: SocketEvent, ...args: any[]): boolean => {
    args.unshift(event);

    const packet: Packet = {
      type: PacketType.EVENT,
      data: args,
    };

    if (typeof args[args.length - 1] === 'function') {
      this.acks.set(this.fnId, args.pop());
      packet.id = this.fnId;
      this.fnId += 1;
    }

    return this.sendPackage(packet);
  };

  public send = (...args: any[]): boolean => {
    args.unshift('message');
    return this.sendPackage({
      type: PacketType.EVENT,
      data: args,
    });
  };

  protected sendPackage = (packet: Packet): boolean => {
    if (this.ws !== undefined && this.connected) {
      const buffer = encodePacket(packet);
      d(`[${this.url}] Send packet: ${JSON.stringify(packet)}`);
      this.ws.send(buffer);
      return true;
    }
    return false;
  };

  protected handleMessage = (msg: WebSocket.MessageEvent) => {
    const packet = typeof msg.data === 'string' ? JSON.parse(msg.data) : decodePacket(msg.data as ArrayBuffer);

    d(`[${this.url}] Got packet: ${JSON.stringify(packet)}`);
    if (packet.type === PacketType.EVENT) {
      const event = packet.data[0];
      const args = packet.data.slice(1);
      if (event) {
        this.listeners(event).forEach((listener) => listener(...args));
      } else {
        throw new Error(`[teckos-client@${this.url}] Got invalid event message: ${msg.data}`);
      }
    } else if (packet.type === PacketType.ACK && packet.id !== undefined) {
      // Call assigned function
      const ack = this.acks.get(packet.id);
      if (typeof ack === 'function') {
        ack.apply(this, packet.data);
        this.acks.delete(packet.id);
      }
    } else {
      throw new Error(`[teckos-client@${this.url}] Got invalid message type: ${packet.type}`);
    }
  };

  protected resetReconnectionState = () => {
    this.currentReconnectionAttempts = 0;
    this.currentReconnectDelay = this.options && this.options.reconnectionDelay
      ? this.options.reconnectionDelay : DEFAULT_OPTIONS.reconnectionDelay;
  };

  protected handleOpen = () => {
    if (this.options && this.options.reconnection && this.currentReconnectionAttempts > 0) {
      // Reset reconnection settings to default
      this.resetReconnectionState();
      d(`[${this.url}] Reconnected!`);
      this.listeners('reconnect').forEach((listener) => listener());
    } else {
      d(`[${this.url}] Connected!`);
      this.listeners('connect').forEach((listener) => listener());
    }
  };

  protected handleError = (error: WebSocket.ErrorEvent) => {
    if (this.handlers && this.handlers.error) {
      d(`[${this.url}] Got error from server: ${error}`);
      this.handlers.error.forEach((listener) => listener(error));
    }
  };

  protected handleClose = () => {
    d(`[${this.url}] Disconnected!`);
    this.listeners('disconnect').forEach((listener) => listener());

    if (this.options && this.options.reconnection) {
      // Try reconnect
      const reconnectionAttempts = this.options.reconnectionAttempts
        || DEFAULT_OPTIONS.reconnectionAttempts;
      const reconnectionDelayMax = this.options.reconnectionDelayMax
        || DEFAULT_OPTIONS.reconnectionDelayMax;
      // Increase count of reconnections
      this.currentReconnectionAttempts += this.currentReconnectionAttempts;
      // Is the count still under the max value?
      if (this.currentReconnectionAttempts <= reconnectionAttempts) {
        const timeout = Math.min(reconnectionDelayMax, this.currentReconnectDelay);
        // Increase reconnection delay
        this.currentReconnectDelay += this.currentReconnectDelay;
        d(`[${this.url}] Try reconnecting in ${timeout}ms to ${this.url}...`);
        setTimeout(() => {
          this.reconnect();
        }, timeout);
      }
    }
  };

  public close = () => {
    d(`[${this.url}] Closing connection (client-side)`);
    if (this.ws !== undefined) this.ws.close();
  };
}

export default TeckosClient;
