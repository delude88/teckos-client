import WebSocket from 'isomorphic-ws'
import { ConnectionState, Packet, SocketEvent } from './types'
import SocketEventEmitter from './util/SocketEventEmitter'

interface ITeckosClient extends SocketEventEmitter<SocketEvent> {
    ws: WebSocket | undefined
    readonly webSocket: WebSocket | undefined
    readonly state: ConnectionState
    readonly connected: boolean
    readonly disconnected: boolean
    emit: (event: SocketEvent, ...args: any[]) => boolean
    send: (...args: any[]) => boolean
    sendPackage: (packet: Packet) => boolean
    close: () => void
    connect: () => void
    disconnect: () => void
}
export default ITeckosClient
