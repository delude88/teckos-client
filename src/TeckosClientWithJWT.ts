import debug from 'debug';
import WebSocket from 'isomorphic-ws';
import TeckosClient from './TeckosClient';
import { OptionalOptions } from './types/Options';
import { ConnectionState } from './types/ConnectionState';

const d = debug('teckos:client');

class TeckosClientWithJWT extends TeckosClient {
  protected readonly token: string;

  protected readonly initialData: any;

  protected receivedReady: boolean = false;

  constructor(
    url: string,
    options: OptionalOptions,
    token: string,
    initialData?: any
  ) {
    super(url, options);
    this.token = token;
    this.initialData = initialData;
  }

  protected getConnectionState(): ConnectionState {
    if (this.ws) {
      switch (this.ws.readyState) {
        case WebSocket.OPEN:
          if (this.receivedReady) {
            return ConnectionState.CONNECTED;
          }
          return ConnectionState.CONNECTING;

        case WebSocket.CONNECTING:
          return ConnectionState.CONNECTING;
        case WebSocket.CLOSING:
          return ConnectionState.DISCONNECTING;
        default:
          return ConnectionState.DISCONNECTED;
      }
    }
    return ConnectionState.DISCONNECTED;
  }

  protected handleOpen = () => {
    if (this.currentReconnectionAttempts > 0) {
      // Reset reconnection settings to default
      this.currentReconnectDelay = this.options.reconnectionDelay;
      this.currentReconnectionAttempts = 0;
      // Inform listeners about reconnect
      this.once('ready', () => {
        d(`[${this.url}] Reconnected!`);
        this.listeners('reconnect').forEach((listener) => listener());
      });
    }
    // Inform listeners about connect in general
    this.receivedReady = false;
    this.once('ready', () => {
      this.receivedReady = true;
      d(`[${this.url}] Connected!`);
      this.listeners('connect').forEach((listener) => listener());
    });
    this.emit('token', {
      token: this.token,
      ...this.initialData,
    });
  };
}

export default TeckosClientWithJWT;
