class SocketEventEmitter<T extends string> {
  protected maxListeners: number = 50;

  protected handlers: {
    [event: string]: ((...args: any[]) => void)[];
  } = {};

  public addListener = (event: T, listener: (...args: any[]) => void): this => {
    if (Object.keys(this.handlers).length === this.maxListeners) {
      throw new Error('Max listeners reached');
    }
    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(listener);
    return this;
  };

  public once = (event: T, listener: (...args: any[]) => void): this => {
    if (Object.keys(this.handlers).length === this.maxListeners) {
      throw new Error('Max listeners reached');
    }
    this.handlers[event] = this.handlers[event] || [];
    const onceWrapper = () => {
      listener();
      this.off(event, onceWrapper);
    };
    this.handlers[event].push(onceWrapper);
    return this;
  };

  public removeListener = (
    event: T,
    listener: (...args: any[]) => void
  ): this => {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(
        handler => handler !== listener
      );
    }
    return this;
  };

  public off = (event: T, listener: (...args: any[]) => void): this =>
    this.removeListener(event, listener);

  public removeAllListeners = (event?: T): this => {
    if (event) {
      delete this.handlers[event];
    } else {
      this.handlers = {};
    }
    return this;
  };

  public setMaxListeners = (n: number): this => {
    this.maxListeners = n;
    return this;
  };

  public getMaxListeners = (): number => this.maxListeners;

  public listeners = (event: T): Function[] => {
    if (this.handlers[event]) {
      return [...this.handlers[event]];
    }
    return [];
  };

  public rawListeners = (event: T): Function[] => [...this.handlers[event]];

  public listenerCount = (event: T): number => {
    if (this.handlers[event]) {
      return Object.keys(this.handlers[event]).length;
    }
    return 0;
  };

  public prependListener = (
    event: T,
    listener: (...args: any[]) => void
  ): this => {
    if (Object.keys(this.handlers).length === this.maxListeners) {
      throw new Error('Max listeners reached');
    }
    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].unshift(listener);
    return this;
  };

  public prependOnceListener = (
    event: T,
    listener: (...args: any[]) => void
  ): this => {
    if (Object.keys(this.handlers).length === this.maxListeners) {
      throw new Error('Max listeners reached');
    }
    this.handlers[event] = this.handlers[event] || [];
    const onceWrapper = () => {
      listener();
      this.off(event, onceWrapper);
    };
    this.handlers[event].unshift(onceWrapper);
    return this;
  };

  public eventNames = (): T[] => Object.keys(this.handlers) as T[];

  public on = (event: T, listener: (...args: any[]) => void): this =>
    this.addListener(event, listener);

  public emit = (event: T, ...args: any[]): boolean => {
    const listeners = this.listeners(event);
    if (listeners.length > 0) {
      listeners.forEach(listener => listener(args));
      return true;
    }
    return false;
  };
}

export default SocketEventEmitter;
