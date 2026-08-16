import { encode, decode } from '@msgpack/msgpack';
import type { NetworkSyncState } from '../store/gameStoreTypes';

export type PacketType = 'full' | 'delta' | 'ping' | 'pong' | 'chat';

export interface WireEnvelope {
    v: 1;
    t: PacketType;
    seq: number;
    ts: number;
    body: unknown;
}

export interface DecodedStatePacket {
    type: 'full' | 'delta';
    patch: Partial<NetworkSyncState>;
}

let seqCounter = 0;

function nextSeq(): number {
    seqCounter += 1;
    return seqCounter;
}

function valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object') {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
}

/** Shallow diff — only keys whose values changed between prev and next. */
export function computeDelta(
    prev: NetworkSyncState,
    next: NetworkSyncState,
): Partial<NetworkSyncState> | null {
    const patch: Partial<NetworkSyncState> = {};
    let changed = false;

    for (const key of Object.keys(next) as (keyof NetworkSyncState)[]) {
        const prevVal = prev[key];
        const nextVal = next[key];
        if (!valuesEqual(prevVal, nextVal)) {
            (patch as Record<string, unknown>)[key] = nextVal;
            changed = true;
        }
    }

    return changed ? patch : null;
}

function wrapEnvelope(t: PacketType, body: unknown): Uint8Array {
    const envelope: WireEnvelope = {
        v: 1,
        t,
        seq: nextSeq(),
        ts: Date.now(),
        body,
    };
    return encode(envelope);
}

export function encodeSnapshot(state: NetworkSyncState): Uint8Array {
    return wrapEnvelope('full', state);
}

export function encodeDeltaPacket(
    prev: NetworkSyncState,
    next: NetworkSyncState,
): Uint8Array | null {
    const patch = computeDelta(prev, next);
    if (!patch) return null;
    return wrapEnvelope('delta', patch);
}

export function encodePing(): Uint8Array {
    return wrapEnvelope('ping', null);
}

export function encodePong(pingTs: number): Uint8Array {
    return wrapEnvelope('pong', { pingTs });
}

export function encodeChat(text: string, sender: string): Uint8Array {
    return wrapEnvelope('chat', { text, sender, ts: Date.now() });
}

export function decodePacket(bytes: Uint8Array): WireEnvelope {
    const envelope = decode(bytes) as WireEnvelope;
    if (envelope.v !== 1) {
        throw new Error(`Unsupported packet version: ${envelope.v}`);
    }
    return envelope;
}

export function decodeStatePacket(bytes: Uint8Array): DecodedStatePacket {
    const envelope = decodePacket(bytes);
    if (envelope.t === 'full') {
        return { type: 'full', patch: envelope.body as NetworkSyncState };
    }
    if (envelope.t === 'delta') {
        return { type: 'delta', patch: envelope.body as Partial<NetworkSyncState> };
    }
    throw new Error(`Not a state packet: ${envelope.t}`);
}

export function decodeChatPacket(bytes: Uint8Array): { text: string; sender: string; ts: number } {
    const envelope = decodePacket(bytes);
    if (envelope.t !== 'chat') {
        throw new Error(`Not a chat packet: ${envelope.t}`);
    }
    return envelope.body as { text: string; sender: string; ts: number };
}

export function decodePongPacket(bytes: Uint8Array): { pingTs: number } | null {
    const envelope = decodePacket(bytes);
    if (envelope.t !== 'pong') return null;
    return envelope.body as { pingTs: number };
}
