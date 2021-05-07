interface BaseSocketEvents {
    connect: 'connect'
    reconnect: 'reconnect'
    disconnect: 'disconnect'
    reconnect_attempt: 'reconnect_attempt'
    reconnect_error: 'reconnect_error'
    reconnect_failed: 'reconnect_failed'
}

export type SocketEvent = BaseSocketEvents[keyof BaseSocketEvents] | string
