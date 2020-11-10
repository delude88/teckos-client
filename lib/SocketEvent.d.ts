interface BaseSocketEvents {
    reconnect: 'reconnect';
    disconnect: 'disconnect';
}
declare type SocketEvent = BaseSocketEvents[keyof BaseSocketEvents] | string;
export default SocketEvent;
