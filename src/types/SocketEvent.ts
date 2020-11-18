interface BaseSocketEvents {
  reconnect: 'reconnect';
  disconnect: 'disconnect';
}

export type SocketEvent = BaseSocketEvents[keyof BaseSocketEvents] | string;
