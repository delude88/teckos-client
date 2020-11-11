import SocketEventEmitter from './util/SocketEventEmitter';
import { decodePacket, encodePacket } from './util/Converter';
import {
  Packet, PacketType, TeckosConnectionOptions, SocketEvent,
} from './types';

class TeckosClient extends SocketEventEmitter<SocketEvent> {
  protected readonly url: string;

  protected reconnectDelay: number = 250;

  protected reconnectionsAttemps: number = 0;

  protected acks: Map<number, (...args: any[]) => void> = new Map();

  protected fnId: number = 0;

  protected readonly options: TeckosConnectionOptions | undefined;

  protected ws: WebSocket | undefined;

  constructor(url: string, options?: TeckosConnectionOptions) {
    super();
    this.options = options;
    this.url = url;
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
      this.ws.send(buffer);
      return true;
    }
    return false;
  };

  protected handleMessage = (msg: MessageEvent) => {
    const packet = typeof msg.data === 'string' ? JSON.parse(msg.data) : decodePacket(msg.data);

    if (packet.type === PacketType.EVENT) {
      const event = packet.data[0];
      const args = packet.data.slice(1);
      if (event) {
        this.listeners(event).forEach((listener) => listener(...args));
      } else {
        console.error(msg.data);
      }
    } else if (packet.type === PacketType.ACK && packet.id !== undefined) {
      // Call assigned function
      const ack = this.acks.get(packet.id);
      if (typeof ack === 'function') {
        ack.apply(this, packet.data);
        this.acks.delete(packet.id);
      }
    } else {
      console.error(`Invalid type: ${packet.type}`);
    }
  };

  protected handleOpen = () => {
    if (this.reconnectionsAttemps > 0) {
      this.listeners('reconnect').forEach((listener) => listener());
    } else {
      this.listeners('connect').forEach((listener) => listener());
    }
  };

  protected handleError = (error: Event) => {
    if (this.handlers && this.handlers.error) {
      this.handlers.error.forEach((listener) => listener(error));
    }
  };

  protected handleClose = () => {
    this.listeners('disconnect').forEach((listener) => listener());

    // Try reconnect
    this.reconnectDelay = (this.options && this.options.reconnectionDelay) || 250;
    setTimeout(() => {
      this.reconnectionsAttemps += 1;
      this.reconnect();
    }, Math.min(
      (this.options && this.options.reconnectionDelayMax)
      || 4000, this.reconnectDelay + this.reconnectDelay,
    ));
  };

  public close = () => {
    if (this.ws !== undefined) this.ws.close();
  };
}

export default TeckosClient;
