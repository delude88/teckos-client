import debug from 'debug'
import WebSocket from 'isomorphic-ws'
import { decodePacket, encodePacket } from './util/Converter'
import { ConnectionState, OptionalOptions, Options, Packet, PacketType, SocketEvent } from './types'
import ITeckosClient from './ITeckosClient'
import SocketEventEmitter from './util/SocketEventEmitter'

const d = debug('teckos:client')

const DEFAULT_OPTIONS: Options = {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    randomizationFactor: 0.5,
    timeout: 5000,
    debug: false,
}

class TeckosClient extends SocketEventEmitter<SocketEvent> implements ITeckosClient {
    protected readonly url: string

    protected readonly options: Options

    ws: WebSocket | undefined

    protected currentReconnectDelay: number

    protected currentReconnectionAttempts: number = 0

    protected acks: Map<number, (...args: any[]) => void> = new Map()

    protected fnId: number = 0

    protected connectionTimeout: any | undefined

    protected reconnectionTimeout: any | undefined

    constructor(url: string, options?: OptionalOptions) {
        super()
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        }
        this.currentReconnectDelay = this.options.reconnectionDelay
        this.url = url
    }

    protected attachHandler = () => {
        if (this.ws) {
            this.ws.onopen = this.handleOpen
            this.ws.onerror = this.handleError
            this.ws.onclose = this.handleClose
            this.ws.onmessage = this.handleMessage
        }
    }

    public get webSocket() {
        return this.ws
    }

    public connect = () => {
        if (this.options.debug) d(`Connecting to ${this.url}...`)

        // This will try to connect immediately
        this.ws = new WebSocket(this.url)
        // Attach handlers
        this.attachHandler()
        // Handle timeout
        this.connectionTimeout = setTimeout(() => {
            if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close()
            }
        }, this.options.timeout)
    }

    protected reconnect = () => {
        this.listeners('reconnect_attempt').forEach((listener) => listener())
        this.connect()
    }

    protected getConnectionState(): ConnectionState {
        if (this.ws) {
            switch (this.ws.readyState) {
                case WebSocket.OPEN:
                    return ConnectionState.CONNECTED
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

    public get state(): ConnectionState {
        return this.getConnectionState()
    }

    get connected(): boolean {
        return this.getConnectionState() === ConnectionState.CONNECTED
    }

    get disconnected(): boolean {
        return this.getConnectionState() === ConnectionState.DISCONNECTED
    }

    public emit = (event: SocketEvent, ...args: any[]): boolean => {
        args.unshift(event)

        const packet: Packet = {
            type: PacketType.EVENT,
            data: args,
        }

        if (typeof args[args.length - 1] === 'function') {
            this.acks.set(this.fnId, args.pop())
            packet.id = this.fnId
            this.fnId += 1
        }

        return this.sendPackage(packet)
    }

    public send = (...args: any[]): boolean => {
        args.unshift('message')
        return this.sendPackage({
            type: PacketType.EVENT,
            data: args,
        })
    }

    public sendPackage = (packet: Packet): boolean => {
        if (this.ws !== undefined && this.ws.readyState === WebSocket.OPEN) {
            const buffer = encodePacket(packet)
            if (this.options.debug) d(`[${this.url}] Send packet: ${JSON.stringify(packet)}`)
            this.ws.send(buffer)
            return true
        }
        return false
    }

    protected handleMessage = (msg: WebSocket.MessageEvent) => {
        const packet =
            typeof msg.data === 'string'
                ? JSON.parse(msg.data)
                : decodePacket(msg.data as ArrayBuffer)
        if (this.options.debug) d(`[${this.url}] Got packet: ${JSON.stringify(packet)}`)
        if (packet.type === PacketType.EVENT) {
            const event = packet.data[0]
            const args = packet.data.slice(1)
            if (event) {
                this.listeners(event).forEach((listener) => listener(...args))
            } else {
                throw new Error(
                    `[teckos-client@${this.url}] Got invalid event message: ${msg.data}`
                )
            }
        } else if (packet.type === PacketType.ACK && packet.id !== undefined) {
            // Call assigned function
            const ack = this.acks.get(packet.id)
            if (typeof ack === 'function') {
                ack.apply(this, packet.data)
                this.acks.delete(packet.id)
            }
        } else {
            throw new Error(`[teckos-client@${this.url}] Got invalid message type: ${packet.type}`)
        }
    }

    protected handleOpen = () => {
        if (this.currentReconnectionAttempts > 0) {
            // Reset reconnection settings to default
            this.currentReconnectDelay = this.options.reconnectionDelay
            this.currentReconnectionAttempts = 0

            // Inform listeners
            if (this.options.debug) d(`[${this.url}] Reconnected!`)
            this.listeners('reconnect').forEach((listener) => listener())
        }
        // Inform listeners
        if (this.options.debug) d(`[${this.url}] Connected!`)
        this.listeners('connect').forEach((listener) => listener())
    }

    protected handleError = (error: WebSocket.ErrorEvent) => {
        if (this.handlers && this.handlers.error) {
            if (this.options.debug) d(`[${this.url}] Got error from server: ${error}`)
            this.handlers.error.forEach((listener) => listener(error))
        }
    }

    protected handleClose = () => {
        // Stop connection timeout
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout)
        }
        // Stop reconnection timeout
        if (this.reconnectionTimeout) {
            clearTimeout(this.reconnectionTimeout)
        }

        // Inform listeners
        if (this.currentReconnectionAttempts > 0) {
            if (this.options.debug)
                d(`[${this.url}] Reconnect #${this.currentReconnectionAttempts} failed!`)
            this.listeners('reconnect_error').forEach((listener) => listener())
        } else {
            if (this.options.debug) d(`[${this.url}] Disconnected!`)
            this.listeners('disconnect').forEach((listener) => listener())
        }

        if (this.options.reconnection) {
            // Apply reconnection logic
            this.currentReconnectionAttempts += 1

            if (
                this.options.reconnectionAttempts === Infinity ||
                this.currentReconnectionAttempts <= this.options.reconnectionAttempts
            ) {
                const timeout = Math.min(
                    this.options.reconnectionDelayMax,
                    this.currentReconnectDelay
                )
                // Increase reconnection delay
                this.currentReconnectDelay = Math.round(
                    this.currentReconnectDelay +
                        this.currentReconnectDelay * this.options.randomizationFactor
                )

                if (this.options.debug)
                    d(
                        `[${this.url}] Try reconnecting (${this.currentReconnectionAttempts}/${this.options.reconnectionAttempts}) in ${timeout}ms to ${this.url}...`
                    )
                this.reconnectionTimeout = setTimeout(() => {
                    this.reconnect()
                }, timeout)
            } else {
                if (this.options.debug)
                    d(
                        `[${this.url}] Reconnection maximum of ${this.options.reconnectionAttempts} reached`
                    )
                this.listeners('reconnect_failed').forEach((listener) => listener())
            }
        }
    }

    public close = () => {
        if (this.options.debug) d(`[${this.url}] Closing connection (client-side)`)
        if (this.ws !== undefined) {
            this.ws.onclose = () => {}
            this.ws.close()
        }
    }

    public disconnect = () => {
        this.close()
    }
}

export default TeckosClient
