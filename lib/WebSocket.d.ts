import { w3cwebsocket as W3CWebSocket } from 'websocket';
import SocketEventEmitter from './SocketEventEmitter';
import SocketEvent from './SocketEvent';
export interface WebSocketConnectionOptions {
    reconnection: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
}
declare class WebSocket extends SocketEventEmitter<SocketEvent> {
    private _acks;
    private _fnId;
    protected readonly _options: WebSocketConnectionOptions;
    protected readonly _ws: W3CWebSocket;
    constructor(url: string, options?: WebSocketConnectionOptions);
    get connected(): boolean;
    get disconnected(): boolean;
    emit: (event: SocketEvent, ...args: any[]) => boolean;
    send: (...args: any[]) => boolean;
    private _send;
    protected _handleMessage: (msg: {
        data: ArrayBuffer;
    }) => void;
    protected _handleOpen: () => void;
    protected _handleError: (error: Error) => void;
    protected _handleClose: () => void;
    close: () => void;
}
export default WebSocket;
