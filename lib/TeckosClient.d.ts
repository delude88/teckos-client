import SocketEventEmitter from './SocketEventEmitter';
import SocketEvent from './SocketEvent';
export interface WebSocketConnectionOptions {
    reconnection: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
}
declare class TeckosClient extends SocketEventEmitter<SocketEvent> {
    private readonly _url;
    protected _reconnectDelay: number;
    protected _reconnectionsAttemps: number;
    private _acks;
    private _fnId;
    protected readonly _options: WebSocketConnectionOptions | undefined;
    protected _ws: WebSocket | undefined;
    constructor(url: string, options?: WebSocketConnectionOptions);
    protected _attachHandler: () => void;
    connect: () => void;
    protected _reconnect: () => void;
    get connected(): boolean;
    get disconnected(): boolean;
    emit: (event: SocketEvent, ...args: any[]) => boolean;
    send: (...args: any[]) => boolean;
    private _send;
    protected _handleMessage: (msg: MessageEvent) => void;
    protected _handleOpen: () => void;
    protected _handleError: (error: Event) => void;
    protected _handleClose: () => void;
    close: () => void;
}
export default TeckosClient;
