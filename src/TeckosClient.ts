/* eslint-disable no-console */
import WebSocket from 'isomorphic-ws'
import { decodePacket, encodePacket } from './util/Converter'
import { ITeckosClient } from './ITeckosClient'
import { SocketEventEmitter } from './util/SocketEventEmitter'
import { OptionalOptions, Options, SocketEvent, ConnectionState, Packet, PacketType } from './types'

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

    protected _ws: WebSocket | undefined

    protected currentReconnectDelay: number

    protected currentReconnectionAttempts = 0

    protected acks: Map<number, (...args: any[]) => void> = new Map()

    protected fnId = 0

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

    protected attachHandler = (): void => {
        if (this._ws) {
            this._ws.onopen = this.handleOpen
            this._ws.onerror = this.handleError
            this._ws.onclose = this.handleClose
            this._ws.onmessage = this.handleMessage
        }
    }

    public connect = (): void => {
        if (this.options.debug) console.log(`(teckos:client) Connecting to ${this.url}...`)

        // This will try to connect immediately
        // eslint-disable-next-line new-cap
        this._ws = new WebSocket(this.url)
        // Attach handlers
        this.attachHandler()
        // Handle timeout
        this.connectionTimeout = setTimeout(() => {
            if (this._ws && this._ws.readyState === 0 /* = CONNECTING */) {
                this._ws.close()
            }
        }, this.options.timeout)
    }

    protected reconnect = (): void => {
        this.listeners('reconnect_attempt').forEach((listener) => listener())
        this.connect()
    }

    protected getConnectionState(): ConnectionState {
        if (this._ws) {
            switch (this._ws.readyState) {
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

    get state(): ConnectionState {
        return this.getConnectionState()
    }

    get ws(): WebSocket | undefined {
        return this._ws
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
        if (this._ws !== undefined && this._ws.readyState === 1 /* = OPEN */) {
            const buffer = encodePacket(packet)
            if (this.options.debug)
                console.log(`(teckos:client) [${this.url}] Send packet: ${JSON.stringify(packet)}`)
            this._ws.send(buffer)
            return true
        }
        return false
    }

    protected handleMessage = (msg: WebSocket.MessageEvent): void => {
        const packet =
            typeof msg.data === 'string'
                ? (JSON.parse(msg.data) as Packet)
                : decodePacket(msg.data as ArrayBuffer)
        if (this.options.debug)
            console.log(`(teckos:client) [${this.url}] Got packet: ${JSON.stringify(packet)}`)
        if (packet.type === PacketType.EVENT) {
            const event = packet.data[0] as SocketEvent
            const args = packet.data.slice(1)
            if (event) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                this.listeners(event).forEach((listener) => listener(...args))
            } else {
                throw new Error(
                    `(teckos-client) [${this.url}] Got invalid event message: ${JSON.stringify(
                        msg.data
                    )}`
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
            throw new Error(
                `(teckos-client) [${this.url}] Got invalid message type: ${packet.type}`
            )
        }
    }

    protected handleOpen = (): void => {
        if (this.currentReconnectionAttempts > 0) {
            // Reset reconnection settings to default
            this.currentReconnectDelay = this.options.reconnectionDelay
            this.currentReconnectionAttempts = 0

            // Inform listeners
            if (this.options.debug) console.log(`(teckos:client) [${this.url}] Reconnected!`)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            this.listeners('reconnect').forEach((listener) => listener())
        }
        // Inform listeners
        if (this.options.debug) console.log(`(teckos:client) [${this.url}] Connected!`)
        this.listeners('connect').forEach((listener) => listener())
    }

    protected handleError = (error: WebSocket.ErrorEvent): void => {
        if (this.handlers && this.handlers.error) {
            if (this.options.debug)
                console.log(
                    `(teckos:client) [${this.url}] Got error from server: ${JSON.stringify(error)}`
                )
            this.handlers.error.forEach((listener) => listener(error))
        }
    }

    protected handleClose = (): void => {
        // Stop connection timeout
        if (this.connectionTimeout) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            clearTimeout(this.connectionTimeout)
        }
        // Stop reconnection timeout
        if (this.reconnectionTimeout) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            clearTimeout(this.reconnectionTimeout)
        }

        // Inform listeners
        if (this.currentReconnectionAttempts > 0) {
            if (this.options.debug)
                console.log(
                    `(teckos:client) [${this.url}] Reconnect #${this.currentReconnectionAttempts} failed!`
                )
            this.listeners('reconnect_error').forEach((listener) => {
                if (listener) listener()
            })
        } else {
            if (this.options.debug) console.log(`(teckos:client) [${this.url}] Disconnected!`)
            this.listeners('disconnect').forEach((listener) => {
                if (listener) listener()
            })
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
                    console.log(
                        `(teckos:client) [${this.url}] Try reconnecting (${this.currentReconnectionAttempts}/${this.options.reconnectionAttempts}) in ${timeout}ms to ${this.url}...`
                    )
                this.reconnectionTimeout = setTimeout(() => {
                    this.reconnect()
                }, timeout)
            } else {
                if (this.options.debug)
                    console.log(
                        `(teckos:client) [${this.url}] Reconnection maximum of ${this.options.reconnectionAttempts} reached`
                    )
                this.listeners('reconnect_failed').forEach((listener) => listener())
            }
        }
    }

    public close = (): void => {
        if (this.options.debug)
            console.log(`(teckos:client) [${this.url}] Closing connection (client-side)`)
        if (this._ws !== undefined) {
            this._ws.onclose = () => {}
            this._ws.close()
            this.listeners('disconnect').forEach((listener) => listener())
        }
    }

    public disconnect = (): void => {
        this.close()
    }
}

export { TeckosClient }
