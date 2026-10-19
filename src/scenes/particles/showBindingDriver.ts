// =============================================================================
// SHOW BINDING DRIVER — plays the factory shows' emitter bindings (#253 → #248)
//
// showEmitters.ts binds fireworks / mist / glitter to attachment-point ids and
// loop-relative beat windows. This turns the ones live at `beatInLoop` into
// engine emits, with no per-frame allocation:
//   fireworks → one shell above the anchor on every beat inside the window
//   mist      → a stream along the anchor's up axis (the cannon barrel)
//   glitter   → a stream around the anchor
// Budget: a binding's `density` is a share of the ring (density × capacity
// particles alive at once). Shares of concurrent bindings are scaled down
// together if they would exceed the ring, and one frame never asks for more
// than the engine's per-frame spawn cap (split between live bindings).
//
// Ships that have bindings are driven only from here; ShowEmitterDriver's
// cue-pattern look stays the fallback for every other ship. Visual only: reads
// the sim clock, never writes it, and uses no randomness.
// =============================================================================

import * as THREE from 'three'
import { EMITTER_PRESETS, type EmitterPresetId } from '../../rendering/particles/emitterPresets'
import type { ShipType } from '../../store/gameStoreTypes'
import {
  FACTORY_SHOW_EMITTERS,
  collectActiveShowEmitters,
  type ShowEmitterBinding,
  type ShowEmitterKind,
} from '../../systems/lightShows/showEmitters'
import { emitterAnchorKey, type EmitterAnchor } from './emitterAnchors'
import { FIREWORK_ALTITUDE, type EmitSink } from './showEmitterDriver'

const SHOW_EMITTER_PRESET: Readonly<Record<ShowEmitterKind, EmitterPresetId>> = {
  fireworks: 'firework',
  mist: 'mist',
  glitter: 'glitter',
}

/** True when `shipType`'s factory show carries emitter bindings. */
export function hasShowBindings(shipType: ShipType | null): boolean {
  return shipType !== null && FACTORY_SHOW_EMITTERS[shipType] !== undefined
}

/**
 * Beat within the show's loop. Same arithmetic as `lightingSystem.update()`, so
 * a binding window opens on the very frame its cue does.
 */
export function showBeatInLoop(elapsedMs: number, bpm: number, loopBeats: number): number {
  const beatDuration = 60 / bpm
  const elapsedBeats = (elapsedMs / 1000) / beatDuration
  return elapsedBeats % loopBeats
}

/**
 * Particles each live binding may keep alive: `density × capacity`, with all of
 * them scaled by the same factor when their densities sum past 1. Writes into
 * `out` (resized to `active.length`) and returns it.
 */
export function emitterShares(
  active: readonly ShowEmitterBinding[],
  capacity: number,
  out: number[],
): number[] {
  let total = 0
  for (let i = 0; i < active.length; i++) total += active[i].density
  const scale = total > 1 ? 1 / total : 1
  out.length = active.length
  for (let i = 0; i < active.length; i++) out[i] = active[i].density * scale * capacity
  return out
}

/** Where the show is, per frame. `shipId`/`shipType` null = nothing to play. */
export interface BindingFrame {
  shipId: string | null
  shipType: ShipType | null
  beatInLoop: number
  /** Seconds per beat at the show's BPM. */
  beatSeconds: number
  dt: number
}

export function createBindingFrame(): BindingFrame {
  return { shipId: null, shipType: null, beatInLoop: 0, beatSeconds: 0.5, dt: 0 }
}

export type AnchorLookup = (key: string) => Pick<EmitterAnchor, 'position' | 'quaternion'> | undefined

interface BindingState {
  /** Beat index a shell last fired on; -1 = none since the window opened. */
  lastBeat: number
  /** Fractional particles carried between frames (streams). */
  acc: number
  /** Driver tick this binding was last live on. */
  lastTick: number
  /** Stable 0..1 offset so anchors don't all pick the same palette seed. */
  seedBase: number
  /** Anchor registry key for `keyShipId`; rebuilt only when the ship changes (no string per frame). */
  anchorKey: string
  keyShipId: string | null
}

const scratchDir = new THREE.Vector3()

function hash01(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

export class ShowBindingDriver {
  /** Bindings live on the last `update()`. */
  activeCount = 0

  private readonly active: ShowEmitterBinding[] = []
  private readonly shares: number[] = []
  private readonly states = new Map<ShowEmitterBinding, BindingState>()
  private readonly warned = new Set<string>()
  private tick = 0

  constructor(
    private readonly capacity: number,
    private readonly maxSpawn: number,
    private readonly lookup: AnchorLookup,
  ) {}

  update(frame: BindingFrame, emit: EmitSink): void {
    this.tick++
    this.activeCount = 0
    if (!frame.shipId || !frame.shipType) return
    collectActiveShowEmitters(frame.shipType, frame.beatInLoop, this.active)
    const n = this.active.length
    if (n === 0) return
    emitterShares(this.active, this.capacity, this.shares)
    const frameCap = Math.floor(this.maxSpawn / n)
    const beat = Math.floor(frame.beatInLoop)

    for (let i = 0; i < n; i++) {
      const binding = this.active[i]
      const st = this.stateFor(binding)
      // A gap since the last live frame means the window just (re)opened.
      if (st.lastTick !== this.tick - 1) {
        st.lastBeat = -1
        st.acc = 0
      }
      st.lastTick = this.tick

      if (st.keyShipId !== frame.shipId) {
        st.keyShipId = frame.shipId
        st.anchorKey = emitterAnchorKey(frame.shipId, binding.attachmentPoint)
      }
      const anchor = this.lookup(st.anchorKey)
      if (!anchor) {
        this.warnMissing(frame.shipType, binding.attachmentPoint)
        continue
      }
      this.activeCount++

      const preset = EMITTER_PRESETS[SHOW_EMITTER_PRESET[binding.kind]]
      const share = this.shares[i]
      const p = anchor.position

      if (binding.kind === 'fireworks') {
        if (beat === st.lastBeat) continue
        st.lastBeat = beat
        // One shell per beat keeps lifeS / beatSeconds shells alive: size each to its slice of the share.
        const sustained = share * Math.min(1, frame.beatSeconds / preset.lifeS)
        const count = Math.max(1, Math.floor(Math.min(sustained, frameCap)))
        const seed = (beat * 0.618033 + st.seedBase) % 1
        emit('firework', p.x, p.y + FIREWORK_ALTITUDE, p.z, 0, 1, 0, count, binding.color, seed)
        continue
      }

      // Streams: steady state is rate × lifeS alive, so rate = share / lifeS.
      st.acc += (share / preset.lifeS) * frame.dt
      let count = Math.floor(st.acc)
      if (count <= 0) continue
      // Over the frame cap the excess is dropped, not queued behind later frames.
      st.acc -= count
      if (count > frameCap) count = frameCap
      scratchDir.set(0, 1, 0).applyQuaternion(anchor.quaternion)
      const seed = (st.seedBase + this.tick * 0.0137) % 1
      emit(preset.id, p.x, p.y, p.z, scratchDir.x, scratchDir.y, scratchDir.z, count, binding.color, seed)
    }
  }

  private stateFor(binding: ShowEmitterBinding): BindingState {
    let st = this.states.get(binding)
    if (!st) {
      st = {
        lastBeat: -1,
        acc: 0,
        lastTick: -2,
        seedBase: hash01(binding.attachmentPoint + binding.beat),
        anchorKey: '',
        keyShipId: null,
      }
      this.states.set(binding, st)
    }
    return st
  }

  private warnMissing(shipType: ShipType, id: string): void {
    const key = `${shipType}:${id}`
    if (this.warned.has(key)) return
    this.warned.add(key)
    console.warn(`✨ show emitter: ${shipType} has no attachment point "${id}" — skipping its emitters`)
  }
}
