/* eslint-disable no-restricted-syntax -- wall-clock / audio / network; see docs/systems/DETERMINISM.md */
import { encode, decode } from '@msgpack/msgpack'
import type { ReplayFile } from './sim/replay'

export type PacketType = 'hello' | 'input' | 'hash' | 'resync' | 'ping' | 'pong' | 'chat'

export const WIRE_VERSION = 2 as const

export interface WireEnvelope {
    v: typeof WIRE_VERSION
    t: PacketType
    seq: number
    ts: number
    body: unknown
}

export interface HelloBody {
    seed: number
    tick: number
    replay: ReplayFile
}

export interface InputBody {
    tick: number
    action: string
    payload: unknown
}

export interface HashBody {
    tick: number
    fnv: string
}

let seqCounter = 0

function nextSeq(): number {
    seqCounter += 1
    return seqCounter
}

function wrapEnvelope(t: PacketType, body: unknown): Uint8Array {
    const envelope: WireEnvelope = {
        v: WIRE_VERSION,
        t,
        seq: nextSeq(),
        ts: Date.now(),
        body,
    }
    return encode(envelope)
}

export function encodeHello(body: HelloBody): Uint8Array {
    return wrapEnvelope('hello', body)
}

export function encodeInputPacket(body: InputBody): Uint8Array {
    return wrapEnvelope('input', body)
}

export function encodeHashPacket(body: HashBody): Uint8Array {
    return wrapEnvelope('hash', body)
}

export function encodeResync(): Uint8Array {
    return wrapEnvelope('resync', null)
}

export function encodePing(): Uint8Array {
    return wrapEnvelope('ping', null)
}

export function encodePong(pingTs: number): Uint8Array {
    return wrapEnvelope('pong', { pingTs })
}

export function encodeChat(text: string, sender: string): Uint8Array {
    return wrapEnvelope('chat', { text, sender, ts: Date.now() })
}

export function decodePacket(bytes: Uint8Array): WireEnvelope {
    const envelope = decode(bytes) as WireEnvelope
    if (envelope.v !== WIRE_VERSION) {
        throw new Error(`Unsupported packet version: ${envelope.v}`)
    }
    return envelope
}

export function decodeHelloPacket(bytes: Uint8Array): HelloBody {
    const envelope = decodePacket(bytes)
    if (envelope.t !== 'hello') {
        throw new Error(`Not a hello packet: ${envelope.t}`)
    }
    return envelope.body as HelloBody
}

export function decodeInputPacket(bytes: Uint8Array): InputBody {
    const envelope = decodePacket(bytes)
    if (envelope.t !== 'input') {
        throw new Error(`Not an input packet: ${envelope.t}`)
    }
    return envelope.body as InputBody
}

export function decodeHashPacket(bytes: Uint8Array): HashBody {
    const envelope = decodePacket(bytes)
    if (envelope.t !== 'hash') {
        throw new Error(`Not a hash packet: ${envelope.t}`)
    }
    return envelope.body as HashBody
}

export function decodeChatPacket(bytes: Uint8Array): { text: string; sender: string; ts: number } {
    const envelope = decodePacket(bytes)
    if (envelope.t !== 'chat') {
        throw new Error(`Not a chat packet: ${envelope.t}`)
    }
    return envelope.body as { text: string; sender: string; ts: number }
}

export function decodePongPacket(bytes: Uint8Array): { pingTs: number } | null {
    const envelope = decodePacket(bytes)
    if (envelope.t !== 'pong') return null
    return envelope.body as { pingTs: number }
}
