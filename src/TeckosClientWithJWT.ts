import TeckosClient from './TeckosClient';

class TeckosClientWithJWT extends TeckosClient {
  private _token: string;

  private _initialData: any;

  constructor(url: string, token: string, initialData?: any) {
    super(url);
    this._token = token;
    this._initialData = initialData;
  }

  protected _handleOpen = () => {
    this.once('ready', () => {
      if (this._reconnectionsAttemps > 0) {
        this.listeners('reconnect').forEach((listener) => listener());
      } else {
        this.listeners('connect').forEach((listener) => listener());
      }
    });
    this.emit('token', {
      token: this._token,
      ...this._initialData,
    });
  };
}

export default TeckosClientWithJWT;
