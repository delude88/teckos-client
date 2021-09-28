import debug from 'debug'
import WebSocket from 'isomorphic-ws'
import { TeckosClient } from './TeckosClient'
import { OptionalOptions, ConnectionState } from './types'

const d = debug('teckos:client')

class TeckosClientWithJWT extends TeckosClient {
    protected readonly token: string

    protected readonly initialData: any

    protected receivedReady = false

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(url: string, options: OptionalOptions, token: string, initialData?: any) {
        super(url, options)
        this.token = token
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.initialData = initialData
        this.on('disconnect', () => {
            this.receivedReady = false
        })
    }

    protected getConnectionState(): ConnectionState {
        if (this.ws) {
            switch (this.ws.readyState) {
                case WebSocket.OPEN:
                    if (this.receivedReady) {
                        return ConnectionState.CONNECTED
                    }
                    return ConnectionState.CONNECTING
                case WebSocket.CONNECTING:
                    return ConnectionState.CONNECTING
                case WebSocket.CLOSING:
                    return ConnectionState.DISCONNECTING
                default:
                    return ConnectionState.DISCONNECTED
            }
        }
        return ConnectionState.DISCONNECTED
    }

    protected handleReadyEvent = (): void => {
        if (this.options.debug) d(`[${this.url}] Connected!`)
        this.receivedReady = true
        if (this.currentReconnectionAttempts > 0) {
            if (this.options.debug) d(`[${this.url}] Reconnected!`)
            this.listeners('reconnect').forEach((listener) => listener())
            // Reset reconnection settings to default
            this.currentReconnectDelay = this.options.reconnectionDelay
            this.currentReconnectionAttempts = 0
        }
        console.log('SENDING TO ALL LISTENERS')
        this.listeners('connect').forEach((listener) => listener())
    }

    protected handleOpen = (): void => {
        this.receivedReady = false
        this.once('ready', this.handleReadyEvent)
        if (this.options.debug) d('Connection opened, sending token now')
        this.emit('token', {
            token: this.token,
            ...this.initialData,
        })
    }
}

export { TeckosClientWithJWT }
