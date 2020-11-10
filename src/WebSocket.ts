import { w3cwebsocket as W3CWebSocket } from 'websocket';
import * as Console from 'console';
import SocketEventEmitter from './SocketEventEmitter';
import SocketEvent from './SocketEvent';
import { decodePacket, encodePacket } from './Converter';
import { Packet, PacketType } from './Packet';

export interface WebSocketConnectionOptions {
  reconnection: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

class WebSocket extends SocketEventEmitter<SocketEvent> {
  private _acks: Map<number, (...args: any[]) => void> = new Map();

  private _fnId: number = 0;

  protected readonly _options: WebSocketConnectionOptions | undefined;

  protected readonly _ws: W3CWebSocket;

  constructor(url: string, options?: WebSocketConnectionOptions) {
    super();
    this._options = options;
    this._ws = new W3CWebSocket(url);
    this._ws.onopen = this._handleOpen;
    this._ws.onerror = this._handleError;
    this._ws.onclose = this._handleClose;
    this._ws.onmessage = this._handleMessage;
  }

  public get connected(): boolean {
    return this._ws.readyState === 1;
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
      this._acks.set(this._fnId, args.pop());
      packet.id = this._fnId;
      this._fnId += 1;
    }

    return this._send(packet);
  };

  public send = (...args: any[]): boolean => {
    args.unshift('message');
    return this._send({
      type: PacketType.EVENT,
      data: args,
    });
  };

  private _send = (packet: Packet): boolean => {
    if (this.connected) {
      const buffer = encodePacket(packet);
      this._ws.send(buffer);
      return true;
    }
    return false;
  };

  protected _handleMessage = (msg: {
    data: string | Buffer | ArrayBuffer;
  }) => {
    const packet = typeof msg.data === 'string' ? JSON.parse(msg.data) : decodePacket(msg.data);

    if (packet.type === PacketType.EVENT) {
      const event = packet.data[0];
      const args = packet.data.slice(1);
      if (event) {
        this.listeners(event).forEach((listener) => listener(...args));
      } else {
        Console.error(msg.data);
      }
    } else if (packet.type === PacketType.ACK && packet.id !== undefined) {
      // Call assigned function
      const ack = this._acks.get(packet.id);
      if (typeof ack === 'function') {
        ack.apply(this, packet.data);
        this._acks.delete(packet.id);
      }
    } else {
      Console.error(`Invalid type: ${packet.type}`);
    }
  };

  protected _handleOpen = () => {
    this.listeners('connect').forEach((listener) => listener());
  };

  protected _handleError = (error: Error) => {
    if (this._handlers && this._handlers.error) {
      this._handlers.error.forEach((listener) => listener(error.message));
    }
  };

  protected _handleClose = () => {
    this.listeners('disconnect').forEach((listener) => listener());
  };

  public close = () => {
    this._ws.close();
  };
}

export default WebSocket;
