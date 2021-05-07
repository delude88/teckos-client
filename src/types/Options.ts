export interface Options {
    reconnection: boolean
    reconnectionAttempts: number
    reconnectionDelay: number
    reconnectionDelayMax: number
    randomizationFactor: number
    timeout: number
    debug: boolean
}
export type OptionalOptions = Partial<Options>
