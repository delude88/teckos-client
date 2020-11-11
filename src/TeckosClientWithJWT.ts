import TeckosClient from './TeckosClient';

class TeckosClientWithJWT extends TeckosClient {
  private readonly token: string;

  private readonly initialData: any;

  constructor(url: string, token: string, initialData?: any) {
    super(url);
    this.token = token;
    this.initialData = initialData;
  }

  protected handleOpen = () => {
    this.once('ready', () => {
      if (this.reconnectionsAttemps > 0) {
        this.listeners('reconnect').forEach((listener) => listener());
      } else {
        this.listeners('connect').forEach((listener) => listener());
      }
    });
    this.emit('token', {
      token: this.token,
      ...this.initialData,
    });
  };
}

export default TeckosClientWithJWT;
