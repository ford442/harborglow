import { describe, it, expect } from 'vitest'
import {
  encodeHello,
  encodeInputPacket,
  encodeHashPacket,
  encodeResync,
  encodeChat,
  decodeChatPacket,
  encodePing,
  decodePacket,
  decodeHelloPacket,
  decodeInputPacket,
  decodeHashPacket,
  WIRE_VERSION,
} from '../multiplayerCodec'
import { encode } from '@msgpack/msgpack'

describe('multiplayerCodec v2', () => {
  it('hello packet round-trips seed, tick, and replay', () => {
    const replay = {
      version: 1 as const,
      seed: 42,
      dt: 1 / 60,
      inputs: [{ tick: 12, action: 'storm.start', payload: { duration: 180 } }],
    }
    const bytes = encodeHello({ seed: 42, tick: 90, replay })
    const envelope = decodePacket(bytes)
    expect(envelope.v).toBe(WIRE_VERSION)
    expect(envelope.t).toBe('hello')
    const body = decodeHelloPacket(bytes)
    expect(body.seed).toBe(42)
    expect(body.tick).toBe(90)
    expect(body.replay.inputs[0]?.action).toBe('storm.start')
  })

  it('input packet round-trips', () => {
    const bytes = encodeInputPacket({
      tick: 7,
      action: 'ship.spawn',
      payload: { type: 'cruise' },
    })
    const body = decodeInputPacket(bytes)
    expect(body.tick).toBe(7)
    expect(body.action).toBe('ship.spawn')
    expect(body.payload).toEqual({ type: 'cruise' })
  })

  it('hash packet round-trips', () => {
    const bytes = encodeHashPacket({ tick: 60, fnv: 'deadbeef' })
    const body = decodeHashPacket(bytes)
    expect(body.tick).toBe(60)
    expect(body.fnv).toBe('deadbeef')
  })

  it('resync packet has correct type', () => {
    const envelope = decodePacket(encodeResync())
    expect(envelope.t).toBe('resync')
  })

  it('chat packet round-trips', () => {
    const bytes = encodeChat('hello harbor', 'spectator-1')
    const msg = decodeChatPacket(bytes)
    expect(msg.text).toBe('hello harbor')
    expect(msg.sender).toBe('spectator-1')
  })

  it('ping packet has correct type', () => {
    const bytes = encodePing()
    const envelope = decodePacket(bytes)
    expect(envelope.t).toBe('ping')
  })

  it('rejects v1 envelopes', () => {
    const bytes = encode({
      v: 1,
      t: 'hello',
      seq: 1,
      ts: 0,
      body: { seed: 1, tick: 0, replay: { version: 1, seed: 1, dt: 1 / 60, inputs: [] } },
    })
    expect(() => decodePacket(bytes)).toThrow(/Unsupported packet version/)
  })
})
