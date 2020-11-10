import WebSocket from './WebSocket';
declare class JWTWebSocket extends WebSocket {
    constructor(url: string, token: string, initialData?: any);
}
export default JWTWebSocket;
