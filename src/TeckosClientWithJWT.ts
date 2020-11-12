import debug from 'debug';
import TeckosClient from './TeckosClient';
import { TeckosConnectionOptions } from './types';

const d = debug('teckos:client');

class TeckosClientWithJWT extends TeckosClient {
  protected readonly token: string;

  protected readonly initialData: any;

  constructor(url: string, options: TeckosConnectionOptions, token: string, initialData?: any) {
    super(url, options);
    this.token = token;
    this.initialData = initialData;
  }

  protected handleOpen = () => {
    if (this.options && this.options.reconnection && this.currentReconnectionAttempts > 0) {
      this.resetReconnectionState();
      this.once('ready', () => {
        d(`[${this.url}] Reconnected!`);
        this.listeners('reconnect').forEach((listener) => listener());
      });
    } else {
      this.once('ready', () => {
        d(`[${this.url}] Connected!`);
        this.listeners('connect').forEach((listener) => listener());
      });
    }
    this.emit('token', {
      token: this.token,
      ...this.initialData,
    });
  };
}

export default TeckosClientWithJWT;
