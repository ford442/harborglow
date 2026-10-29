// =============================================================================
// GPU PARTICLE SYSTEM — TSL compute particles on storage buffers (#248)
//
// Storage, 32 B per particle (8 MB at 250k):
//   posAge [vec4]  xyz = world position, w = normalised age (>= 1 is dead)
//   velCode[vec4]  xyz = velocity,       w = presetIndex*16 + paletteSlot + 0.005 + 0.99*rand
//
// The CPU holds one ring cursor and nothing per particle. Each frame:
//   1. update kernel (N threads): integrate every slot, dead ones stay frozen
//   2. spawn kernel (padded spawn count): thread k finds its batch by prefix
//      range and overwrites ring slot (cursor + k) % N — wrapping overwrites
//      the oldest particles, which is the budget policy
// Kernels are arithmetic only: no `select` / `If` (three #33650 on 0.183
// emits divergent if/else in loops that kills Lavapipe-class devices). No
// StorageTexture (three #33147), so no float32-filterable dependency.
// Rendering is one instanced Sprite draw reading the buffers as attributes.
// =============================================================================

import * as THREE from 'three/webgpu'
import {
  Fn,
  cos,
  float,
  floor,
  fract,
  hash,
  instanceIndex,
  instancedArray,
  int,
  length,
  max,
  min,
  mix,
  mod,
  normalize,
  saturate,
  sin,
  smoothstep,
  sqrt,
  step,
  uint,
  uniform,
  uniformArray,
  uv,
  varying,
  vec3,
  vec4,
  compute,
} from 'three/tsl'
import { EMITTER_PRESETS, PRESET_TABLE_ROWS, packPresetTable, type EmitterPresetId } from './emitterPresets'
import { fxUniforms } from './fxFrameUniforms'
import { MAX_SPAWN_BATCHES, PALETTE_SLOTS, PARTICLE_WORKGROUP, maxSpawnPerFrame, particleCapacity } from './particleBudget'
import { BATCH_VEC4S, PaletteAllocator, SpawnBatchPacker } from './spawnBatches'

/** The subset of WebGPURenderer the engine calls. */
export interface ParticleRenderer {
  compute(node: unknown, dispatchSize?: number): unknown
  computeAsync(node: unknown, dispatchSize?: number): Promise<unknown>
}

const TAU = 6.283185307

export class GpuParticleSystem {
  readonly capacity: number
  readonly maxSpawn: number
  readonly object3d: THREE.Sprite
  readonly material: THREE.SpriteNodeMaterial
  readonly packer: SpawnBatchPacker
  readonly computeNodes: { init: unknown; update: unknown; spawn: unknown }

  private readonly posAge
  private readonly velCode
  private readonly batchVecs: THREE.Vector4[]
  private readonly paletteColors: THREE.Color[]
  private readonly palette = new PaletteAllocator()
  // Float uniforms holding integers < 2^24 (exact in f32), converted in-kernel.
  private readonly uCursor = uniform(0)
  private readonly uSpawnSeed = uniform(0)
  private cursor = 0
  private frame = 0
  private live = false
  private disposed = false

  constructor(budget: number) {
    this.capacity = particleCapacity(budget)
    this.maxSpawn = maxSpawnPerFrame(this.capacity)
    this.packer = new SpawnBatchPacker(this.maxSpawn)

    this.posAge = instancedArray(this.capacity, 'vec4')
    this.velCode = instancedArray(this.capacity, 'vec4')

    const table = packPresetTable()
    const presetRows: THREE.Vector4[] = []
    for (let i = 0; i < PRESET_TABLE_ROWS * 2; i++) presetRows.push(new THREE.Vector4().fromArray(table, i * 4))
    const presets = uniformArray<'vec4'>(presetRows, 'vec4')

    this.batchVecs = Array.from({ length: MAX_SPAWN_BATCHES * BATCH_VEC4S }, () => new THREE.Vector4())
    const batches = uniformArray<'vec4'>(this.batchVecs, 'vec4')

    this.paletteColors = Array.from({ length: PALETTE_SLOTS }, () => new THREE.Color(1, 1, 1))
    const palette = uniformArray<'color'>(this.paletteColors, 'color')

    const posAge = this.posAge
    const velCode = this.velCode
    const u = fxUniforms
    const cap = this.capacity

    // ---- init: every slot dead, parked below the world --------------------
    const initFn = Fn(() => {
      posAge.element(instanceIndex).assign(vec4(0, -1000, 0, 2))
      velCode.element(instanceIndex).assign(vec4(0, 0, 0, 0.005))
    })

    // ---- update: integrate all N slots ------------------------------------
    const updateFn = Fn(() => {
      const pa = posAge.element(instanceIndex)
      const vc = velCode.element(instanceIndex)
      const p = vec3(pa.xyz).toVar()
      const age = float(pa.w).toVar()
      const v = vec3(vc.xyz).toVar()
      const code = float(vc.w).toVar()
      const row = int(floor(code.div(16))).mul(2)
      const r0 = presets.element(row) // gravity, drag, life, size
      const r1 = presets.element(row.add(1)) // turbulence, bassGain, trebleGain, sizeEnd
      const seed = fract(code)
      const alive = step(age, 1)
      const dt = u.uDt
      const t = u.uTime
      const turb = vec3(
        sin(p.y.mul(0.9).add(t.mul(1.3)).add(seed.mul(TAU))),
        sin(p.z.mul(1.1).add(t.mul(0.7))),
        sin(p.x.mul(0.8).sub(t.mul(1.1)).add(seed.mul(3.1))),
      ).mul(r1.x)
      const acc = vec3(0, r0.x, 0).add(turb)
      const v2 = v.add(acc.mul(dt)).mul(max(float(0), float(1).sub(r0.y.mul(dt))))
      const p2 = p.add(v2.mul(dt))
      const life = r0.z.mul(mix(0.7, 1.3, seed))
      const age2 = min(age.add(dt.div(life)), 2)
      posAge.element(instanceIndex).assign(vec4(mix(p, p2, alive), age2))
      velCode.element(instanceIndex).assign(vec4(mix(v, v2, alive), code))
    })

    // ---- spawn: one thread per new particle, batch found by prefix range --
    const spawnFn = Fn(() => {
      const k = float(instanceIndex)
      const inAny = float(0).toVar()
      const origin = vec3(0).toVar()
      const dir = vec3(0).toVar()
      const presetIdx = float(0).toVar()
      const cone = float(0).toVar()
      const speedLo = float(0).toVar()
      const speedHi = float(0).toVar()
      const slot = float(0).toVar()
      const bseed = float(0).toVar()
      const jitter = float(0).toVar()
      // Unrolled over a fixed batch count: a constant-bound mask, no branch.
      for (let b = 0; b < MAX_SPAWN_BATCHES; b++) {
        const v0 = batches.element(b * BATCH_VEC4S)
        const v1 = batches.element(b * BATCH_VEC4S + 1)
        const v2 = batches.element(b * BATCH_VEC4S + 2)
        const v3 = batches.element(b * BATCH_VEC4S + 3)
        const inB = step(v2.x, k).mul(float(1).sub(step(v2.x.add(v2.y), k)))
        inAny.addAssign(inB)
        origin.addAssign(v0.xyz.mul(inB))
        presetIdx.addAssign(v0.w.mul(inB))
        dir.addAssign(v1.xyz.mul(inB))
        cone.addAssign(v1.w.mul(inB))
        speedLo.addAssign(v2.z.mul(inB))
        speedHi.addAssign(v2.w.mul(inB))
        slot.addAssign(v3.x.mul(inB))
        bseed.addAssign(v3.y.mul(inB))
        jitter.addAssign(v3.z.mul(inB))
      }
      const base = instanceIndex.mul(uint(4)).add(uint(this.uSpawnSeed))
      const r1 = fract(hash(base).add(bseed))
      const r2 = fract(hash(base.add(uint(1))).add(bseed))
      const r3 = hash(base.add(uint(2)))
      const r4 = hash(base.add(uint(3)))
      // Uniform random direction on the sphere (y-up).
      const z = r1.mul(2).sub(1)
      const rxy = sqrt(max(float(0), float(1).sub(z.mul(z))))
      const phi = r2.mul(TAU)
      const rnd = vec3(rxy.mul(cos(phi)), z, rxy.mul(sin(phi)))
      const d = normalize(mix(dir, rnd, cone).add(vec3(0, 0.0001, 0)))
      const speed = mix(speedLo, speedHi, r3)
      const pos = origin.add(rnd.mul(jitter.mul(r4)))
      // Padding threads (inAny = 0) write dead particles into the oldest slots.
      const age0 = mix(float(2), r4.mul(0.05), inAny)
      const code = presetIdx.mul(16).add(slot).add(0.005).add(r3.mul(0.99))
      const idx = instanceIndex.add(uint(this.uCursor)).mod(uint(cap))
      posAge.element(idx).assign(vec4(pos, age0))
      velCode.element(idx).assign(vec4(d.mul(speed), code))
    })

    const init = compute(initFn(), cap, [PARTICLE_WORKGROUP])
    const update = compute(updateFn(), cap, [PARTICLE_WORKGROUP])
    const spawn = compute(spawnFn(), this.maxSpawn, [PARTICLE_WORKGROUP])
    this.computeNodes = { init, update, spawn }

    // ---- render: one instanced sprite draw ---------------------------------
    const paAttr = posAge.toAttribute()
    const vcAttr = velCode.toAttribute()
    const age = paAttr.w
    const code = vcAttr.w
    const row = int(floor(code.div(16))).mul(2)
    const r0 = presets.element(row)
    const r1 = presets.element(row.add(1))
    const slot = int(mod(floor(code), 16))
    const alive = step(age, 1)
    const life01 = saturate(age)
    const audioGain = float(1).add(u.uBass.mul(r1.y).mul(0.6))
    const fade = smoothstep(0, 0.06, life01).mul(float(1).sub(life01).pow(1.5))
    const brightness = float(1).add(u.uTreble.mul(r1.z)).add(u.uBeatPulse.mul(0.5))
    // Colour and fade are per-instance: evaluate once per vertex, not per fragment.
    const tint = vec3(varying(palette.element(slot).mul(brightness).mul(fade).mul(alive)))
    const mask = smoothstep(0.5, 0.15, length(uv().sub(0.5)))

    const material = new THREE.SpriteNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    material.positionNode = paAttr.xyz
    material.scaleNode = r0.w.mul(mix(1, r1.w, life01)).mul(audioGain).mul(alive)
    material.colorNode = vec4(tint.mul(mask), 1)
    material.opacityNode = mask
    material.userData = { ...fxUniforms }
    this.material = material

    const sprite = new THREE.Sprite(material)
    sprite.count = cap
    sprite.frustumCulled = false
    sprite.raycast = () => {}
    sprite.name = 'GpuParticles'
    this.object3d = sprite
  }

  get ready(): boolean {
    return this.live
  }

  /** Clears every slot. Must resolve before step() dispatches. */
  async init(renderer: ParticleRenderer): Promise<void> {
    await renderer.computeAsync(this.computeNodes.init)
    if (!this.disposed) this.live = true
  }

  /** Bind a CSS colour to a palette slot (slot 0 is white). */
  paletteSlot(color: string | null): number {
    return this.palette.slotFor(color, (slot, c) => this.paletteColors[slot].set(c))
  }

  /** Queue particles of `preset` for this frame; returns how many fit. */
  emit(
    preset: EmitterPresetId,
    ox: number, oy: number, oz: number,
    dx: number, dy: number, dz: number,
    count: number,
    color: string | null,
    seed: number,
  ): number {
    return this.packer.push(EMITTER_PRESETS[preset], ox, oy, oz, dx, dy, dz, count, this.paletteSlot(color), seed)
  }

  /** Dispatch update + this frame's spawns. Call once per frame after emit(). */
  step(renderer: ParticleRenderer): void {
    if (!this.live) {
      this.packer.reset()
      return
    }
    this.frame++
    renderer.compute(this.computeNodes.update)
    const n = this.packer.dispatchCount()
    if (n > 0) {
      const d = this.packer.data
      for (let i = 0; i < this.batchVecs.length; i++) this.batchVecs[i].fromArray(d, i * 4)
      this.uCursor.value = this.cursor
      this.uSpawnSeed.value = (Math.imul(this.frame, 2654435761) >>> 8) & 0xffffff
      renderer.compute(this.computeNodes.spawn, n)
      this.cursor = (this.cursor + n) % this.capacity
    }
    this.packer.reset()
  }

  /** Ring write position (diagnostics / tests). */
  get ringCursor(): number {
    return this.cursor
  }

  /** The storage attributes, for readback in the e2e fixture. */
  get buffers() {
    return { posAge: this.posAge.value, velCode: this.velCode.value }
  }

  dispose(renderer?: unknown): void {
    this.disposed = true
    this.live = false
    this.material.dispose()
    // Storage buffers have no public dispose in three 0.183; release them via
    // the renderer's attribute cache when available, else leave them to GC.
    const attrs = (renderer as { attributes?: { delete?: (a: unknown) => void } } | undefined)?.attributes
    if (attrs?.delete) {
      attrs.delete(this.posAge.value)
      attrs.delete(this.velCode.value)
    }
  }
}
