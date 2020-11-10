export declare enum PacketType {
    EVENT = 0,
    ACK = 1
}
export interface Packet {
    type: PacketType;
    data: any[];
    id?: number;
}
