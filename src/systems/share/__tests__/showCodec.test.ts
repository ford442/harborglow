import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  decodeShow,
  encodeShow,
  fromBase64Url,
  packShow,
  toBase64Url,
  ShowDecodeError,
  SHARE_FRAGMENT_MAX,
  MAX_INFLATED_BYTES,
} from '../showCodec'
import { buildShowDocument } from '../buildShowDocument'
import { getLightShowV2 } from '../../lightShows'
import type { ShowDocument } from '../../../schemas/showDocument'
import { simScheduler } from '../../sim/FixedStepScheduler'
import { hashSimSnapshot } from '../../sim/hashState'
import { bootHeadlessRegistry, resetDeterministicSystems, runHeadlessReplay, stepHeadless } from '../../sim/headless'
import { stormSystem } from '../../StormSystem'
import { SIM_DT } from '../../sim/SimContext'

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

function presetDoc(shipType: ShowDocument['shipType'] = 'cruise'): ShowDocument {
  const show = getLightShowV2(shipType)!
  return { v: 1, shipType, trackId: shipType, loopBeats: show.loopBeats, cues: show.cues }
}

/** Valid-header bytes around arbitrary raw deflate content. */
async function frame(payload: Uint8Array, version = 1): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate-raw')
  const w = cs.writable.getWriter()
  void w.write(payload as BufferSource).then(() => w.close())
  const chunks: Uint8Array[] = []
  const r = cs.readable.getReader()
  for (;;) {
    const { done, value } = await r.read()
    if (done) break
    chunks.push(value)
  }
  const body = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let at = 0
  for (const c of chunks) { body.set(c, at); at += c.length }
  return new Uint8Array([0x48, 0x47, 0x53, 0x48, version, ...body])
}

describe('codec round-trip', () => {
  it('round-trips a preset show', async () => {
    const doc = presetDoc()
    expect(await decodeShow(await encodeShow(doc))).toEqual(doc)
  })

  it('round-trips through base64url', () => {
    const bytes = new Uint8Array([0, 250, 251, 252, 253, 254, 255, 1, 2])
    const text = toBase64Url(bytes)
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(fromBase64Url(text)).toEqual(bytes)
  })

  it('packs a preset show as a fragment under the 8 KB limit', async () => {
    for (const type of ['cruise', 'container', 'icebreaker'] as const) {
      const packed = await packShow(presetDoc(type))
      expect(packed.kind).toBe('fragment')
      if (packed.kind === 'fragment') expect(packed.fragment.length).toBeLessThanOrEqual(SHARE_FRAGMENT_MAX)
    }
  })

  it('falls back to a .hgshow file past 8 KB, decoding to the same document', async () => {
    const base = presetDoc()
    // Many distinct cues so deflate cannot shrink it under the limit.
    const cues = Array.from({ length: 600 }, (_, i) => ({
      ...base.cues[0],
      id: `big:${i}`,
      beat: (i * 31) / 600,
      color: `#${((i * 2654435761) >>> 8).toString(16).padStart(6, '0').slice(0, 6)}`,
      intensity: ((i * 7919) % 1000) / 1000,
    }))
    const doc: ShowDocument = { ...base, cues }
    const packed = await packShow(doc)
    expect(packed.kind).toBe('file')
    if (packed.kind === 'file') {
      expect(packed.filename).toBe('cruise.hgshow')
      expect(await decodeShow(packed.bytes)).toEqual(doc)
    }
  })
})

describe('rejects bad input with ShowDecodeError', () => {
  it('bad magic', async () => {
    await expect(decodeShow(new Uint8Array([1, 2, 3, 4, 5, 6, 7]))).rejects.toBeInstanceOf(ShowDecodeError)
  })

  it('unsupported version', async () => {
    const bytes = await encodeShow(presetDoc())
    bytes[4] = 9
    await expect(decodeShow(bytes)).rejects.toThrow(/version/)
  })

  it('truncated and corrupted data', async () => {
    const bytes = await encodeShow(presetDoc())
    await expect(decodeShow(bytes.subarray(0, 20))).rejects.toBeInstanceOf(ShowDecodeError)
    const corrupt = bytes.slice()
    for (let i = 8; i < corrupt.length; i += 3) corrupt[i] ^= 0xff
    await expect(decodeShow(corrupt)).rejects.toBeInstanceOf(ShowDecodeError)
  })

  it('invalid base64url', () => {
    expect(() => fromBase64Url('abc+/=')).toThrow(ShowDecodeError)
  })

  it('inflated size over the cap (decompression bomb)', async () => {
    const bomb = await frame(new Uint8Array(MAX_INFLATED_BYTES + 1024))
    await expect(decodeShow(bomb)).rejects.toThrow(/too large/)
  })

  it('unknown shipType, unsorted cues, non-whitelisted action, non-monotonic ticks', async () => {
    const good = presetDoc()
    const { encode } = await import('@msgpack/msgpack')
    const enc = async (doc: unknown) => frame(encode(doc))

    await expect(decodeShow(await enc({ ...good, shipType: 'submarine', trackId: 'submarine' }))).rejects.toBeInstanceOf(ShowDecodeError)
    await expect(decodeShow(await enc({ ...good, cues: [...good.cues].reverse() }))).rejects.toThrow(/sorted/)

    const sim = { seed: 1, dt: SIM_DT, ticks: 100, hash: '0123abcd' }
    await expect(
      decodeShow(await enc({ ...good, sim, inputLog: [{ tick: 1, action: 'rm -rf', payload: null }] })),
    ).rejects.toBeInstanceOf(ShowDecodeError)
    await expect(
      decodeShow(await enc({
        ...good,
        sim,
        inputLog: [
          { tick: 20, action: 'storm.stop', payload: null },
          { tick: 10, action: 'storm.stop', payload: null },
        ],
      })),
    ).rejects.toThrow(/non-decreasing/)
    await expect(decodeShow(await enc({ ...good, inputLog: [] }))).rejects.toThrow(/sim is required/)
    await expect(decodeShow(await enc({ ...good, extra: 1 }))).rejects.toBeInstanceOf(ShowDecodeError)
  })
})

describe('acceptance: shared performance reproduces the final sim hash', () => {
  it('records, shares, decodes and replays to the same hash', async () => {
    simScheduler.reset(9)
    resetDeterministicSystems()
    bootHeadlessRegistry()
    simScheduler.startRecording()
    stepHeadless(SIM_DT, () => {
      stormSystem.start(180)
      simScheduler.record('storm.start', { duration: 180 })
    })
    while (simScheduler.tick < 120) stepHeadless(SIM_DT)
    const liveHash = hashSimSnapshot()

    const doc = buildShowDocument('cruise')
    expect(doc.sim).toMatchObject({ seed: 9, ticks: 120, hash: liveHash })
    expect(doc.inputLog?.some((e) => e.action === 'storm.start')).toBe(true)

    const packed = await packShow(doc)
    const bytes = packed.bytes
    const decoded = await decodeShow(fromBase64Url(toBase64Url(bytes)))

    const replayHash = runHeadlessReplay(
      { version: 1, seed: decoded.sim!.seed, dt: decoded.sim!.dt, inputs: decoded.inputLog! },
      decoded.sim!.ticks,
    )
    expect(replayHash).toBe(decoded.sim!.hash)
  })

  it('omits the performance when the recording did not start at tick 0', () => {
    simScheduler.reset(3)
    resetDeterministicSystems()
    bootHeadlessRegistry()
    while (simScheduler.tick < 10) stepHeadless(SIM_DT)
    simScheduler.startRecording()
    const doc = buildShowDocument('cruise')
    expect(doc.inputLog).toBeUndefined()
    expect(doc.sim).toBeUndefined()
  })
})
