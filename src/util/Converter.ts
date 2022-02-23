import * as Bowser from 'bowser'
import { Packet } from '../types'

const enc = new TextEncoder()
const dec = new TextDecoder()

const isWebkit15 =
    (window !== undefined &&
        Bowser.getParser(window.navigator.userAgent).satisfies({
            safari: '~15',
        })) ||
    false

const encodePacketDefault = (packet: Packet): ArrayBufferLike => enc.encode(JSON.stringify(packet))

const encodePacketOnWebkit15 = (packet: Packet): ArrayBufferLike => {
    let encoded = JSON.stringify(packet)
    if (encoded.length < 25) {
        encoded = JSON.stringify({
            ...packet,
            data: [packet.data, 'additionalpayload'],
        })
    }
    return enc.encode(encoded)
}

const encodePacket = isWebkit15 ? encodePacketDefault : encodePacketOnWebkit15

const decodePacket = (buffer: ArrayBuffer): Packet =>
    JSON.parse(dec.decode(buffer).toString()) as Packet
export { encodePacket, decodePacket }
