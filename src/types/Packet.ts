import { PacketType } from './PacketType'

export interface Packet {
    type: PacketType
    data: any[]
    id?: number
}
