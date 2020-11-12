import TeckosClient from './TeckosClient';
import { TeckosConnectionOptions } from './types';

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
        this.debug(`Reconnected to ${this.url}`);
        this.listeners('reconnect').forEach((listener) => listener());
      });
    } else {
      this.once('ready', () => {
        this.debug(`Connected to ${this.url}`);
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
