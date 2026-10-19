// Browser-side harness for e2e/gpu-particles-smoke.spec.ts. Loaded through a
// Vite dev server so it can import src/ directly. Runs the real
// GpuParticleSystem kernels and draws, plus the laser material (depth fade on,
// MSAA on), on a raw WebGPU device, then reads the particle storage back.

import * as THREE from 'three/webgpu'
import { GpuParticleSystem } from '../../src/rendering/particles/GpuParticleSystem'
import { fxUniforms } from '../../src/rendering/particles/fxFrameUniforms'
import { createLaserBeamGeometry, createLaserBeamMaterial } from '../../src/rendering/particles/laserBeamMaterial'
import { AliveEstimator } from '../../src/scenes/particles/aliveEstimate'
import { emitterAnchorKey } from '../../src/scenes/particles/emitterAnchors'
import { createBindingFrame, ShowBindingDriver } from '../../src/scenes/particles/showBindingDriver'
import { FIREWORK_ALTITUDE } from '../../src/scenes/particles/showEmitterDriver'

export interface GpuParticlesSmokeResult {
  adapter: boolean
  capacity: number
  maxSpawn: number
  /** Alive slots after one 100-particle burst. */
  aliveAfterBurst: number
  /** Alive slots after enough spawns to wrap the ring. */
  aliveAfterWrap: number
  /** Alive slots after 5 s with no spawning (longer than any preset's longest life, 3.5 s × 1.3). */
  aliveAfterIdle: number
  cursorWrapped: boolean
  allFinite: boolean
  /** Mean age of live particles after the burst + one step (> 0 means the update kernel ran). */
  meanAgeAfterBurst: number
  /** Max height reached by a burst launched upward from y = 10. */
  maxY: number
  /** The real ShowBindingDriver feeding the real ring, read back from the GPU. */
  bindings: BindingsStage
  /**
   * 'ok': a trivial scene and the particle + laser draw both submitted.
   * 'canary-failed': even a plain floor lost the device, so this adapter cannot present
   *   to a canvas (current SwiftShader builds) and the draw cannot be judged here.
   * 'failed': the floor rendered but the particle / laser draw did not.
   */
  render: 'ok' | 'canary-failed' | 'failed'
  deviceErrors: string[]
}

export interface BindingsStage {
  /** Cruise beat 24: shells emitted, particles alive on the GPU, and how many sit within 2 m of a shell origin. */
  fireworks: { emitted: number; alive: number; nearOrigin: number; estimate: number }
  /** Fireboat beat 2: particles alive after 20 frames, and how many sit within 8 m of a cannon, above its muzzle. */
  mist: { emitted: number; alive: number; nearCannon: number; estimate: number }
}

const DT = 1 / 60

/** Render once and wait for the queue; false if the device was lost or the submit threw. */
async function submit(
  renderer: THREE.WebGPURenderer,
  device: GPUDevice,
  scene: THREE.Scene,
  camera: THREE.Camera,
): Promise<boolean> {
  try {
    await renderer.renderAsync(scene, camera)
    await device.queue.onSubmittedWorkDone()
    return true
  } catch {
    return false
  }
}

async function readPosAge(renderer: THREE.WebGPURenderer, sys: GpuParticleSystem): Promise<Float32Array> {
  const buf = await renderer.getArrayBufferAsync(sys.buffers.posAge)
  return new Float32Array(buf)
}

function stats(posAge: Float32Array) {
  let alive = 0
  let ageSum = 0
  let maxY = -Infinity
  let finite = true
  for (let i = 0; i < posAge.length; i += 4) {
    const x = posAge[i], y = posAge[i + 1], z = posAge[i + 2], age = posAge[i + 3]
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(age)) finite = false
    if (age <= 1) {
      alive++
      ageSum += age
      if (y > maxY) maxY = y
    }
  }
  return { alive, meanAge: alive ? ageSum / alive : 0, maxY, finite }
}

export async function runGpuParticlesSmoke(): Promise<GpuParticlesSmokeResult> {
  const result: GpuParticlesSmokeResult = {
    adapter: false, capacity: 0, maxSpawn: 0,
    aliveAfterBurst: 0, aliveAfterWrap: 0, aliveAfterIdle: 0,
    cursorWrapped: false, allFinite: false, meanAgeAfterBurst: 0, maxY: 0,
    bindings: {
      fireworks: { emitted: 0, alive: 0, nearOrigin: 0, estimate: 0 },
      mist: { emitted: 0, alive: 0, nearCannon: 0, estimate: 0 },
    },
    render: 'failed', deviceErrors: [],
  }
  const adapter = await navigator.gpu?.requestAdapter()
  if (!adapter) return result
  result.adapter = true
  const device = await adapter.requestDevice()
  device.addEventListener('uncapturederror', (e) => {
    result.deviceErrors.push((e as GPUUncapturedErrorEvent).error.message)
  })

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  document.body.appendChild(canvas)
  const renderer = new THREE.WebGPURenderer({ canvas, device, antialias: true } as ConstructorParameters<typeof THREE.WebGPURenderer>[0])
  await renderer.init()

  const sys = new GpuParticleSystem(4000)
  result.capacity = sys.capacity
  result.maxSpawn = sys.maxSpawn
  fxUniforms.uDt.value = DT
  await sys.init(renderer)

  // A: one burst of 100 sparks straight up from y = 10, then one step.
  sys.emit('spark', 0, 10, 0, 0, 1, 0, 100, '#ff00ff', 0.25)
  sys.step(renderer)
  sys.step(renderer)
  let s = stats(await readPosAge(renderer, sys))
  result.aliveAfterBurst = s.alive
  result.meanAgeAfterBurst = s.meanAge
  result.maxY = s.maxY
  let finite = s.finite

  // B: spawn the frame cap for enough frames to wrap the ring.
  const before = sys.ringCursor
  const frames = Math.ceil((sys.capacity * 1.5) / sys.maxSpawn)
  for (let i = 0; i < frames; i++) {
    sys.emit('glitter', 0, 5, 0, 0, 1, 0, sys.maxSpawn, null, i / frames)
    sys.step(renderer)
  }
  result.cursorWrapped = frames * sys.maxSpawn > sys.capacity && sys.ringCursor !== before
  s = stats(await readPosAge(renderer, sys))
  result.aliveAfterWrap = s.alive
  finite &&= s.finite

  // C: five idle seconds — every particle should age out (longest life is 3.5 s × 1.3).
  for (let i = 0; i < 300; i++) sys.step(renderer)
  s = stats(await readPosAge(renderer, sys))
  result.aliveAfterIdle = s.alive
  finite &&= s.finite
  result.allFinite = finite

  // D: show bindings -> driver -> ring, on the GPU. Everything is dead after C, so what is
  // alive afterwards is what the driver emitted, and where it is says whether the anchor
  // lookup, the firework altitude and the stream direction reached the kernels.
  const anchors = new Map<string, { position: THREE.Vector3; quaternion: THREE.Quaternion }>()
  const place = (id: string, x: number, y: number, z: number) =>
    anchors.set(emitterAnchorKey('ship-1', id), { position: new THREE.Vector3(x, y, z), quaternion: new THREE.Quaternion() })
  place('funnel1', -30, 12, 0)
  place('funnel2', 30, 12, 0)
  place('waterCannonPort', -4, 5, 40)
  place('waterCannonStbd', 4, 5, 40)
  place('foamDeck', 0, 3, 50)
  const estimator = new AliveEstimator()
  let clock = 0
  let emittedNow = 0
  const driver = new ShowBindingDriver(sys.capacity, sys.maxSpawn, (key) => anchors.get(key))
  const emit = (
    preset: Parameters<GpuParticleSystem['emit']>[0],
    ox: number, oy: number, oz: number,
    dx: number, dy: number, dz: number,
    count: number, color: string | null, seed: number,
  ) => {
    const fit = sys.emit(preset, ox, oy, oz, dx, dy, dz, count, color, seed)
    estimator.add(preset, clock, fit)
    emittedNow += fit
  }
  const bframe = createBindingFrame()
  const near = (posAge: Float32Array, origins: Array<[number, number, number]>, radius: number, aboveOnly = false) => {
    let alive = 0
    let hits = 0
    for (let i = 0; i < posAge.length; i += 4) {
      if (posAge[i + 3] > 1) continue
      alive++
      for (const [ox, oy, oz] of origins) {
        const d = Math.hypot(posAge[i] - ox, posAge[i + 1] - oy, posAge[i + 2] - oz)
        if (d <= radius && (!aboveOnly || posAge[i + 1] >= oy - 0.5)) { hits++; break }
      }
    }
    return { alive, hits }
  }

  // D1: cruise, beat 24 -> one shell above each funnel.
  Object.assign(bframe, { shipId: 'ship-1', shipType: 'cruise', beatInLoop: 24, beatSeconds: 0.5, dt: DT })
  driver.update(bframe, emit)
  sys.step(renderer)
  sys.step(renderer)
  clock += 2 * DT
  let d = near(
    await readPosAge(renderer, sys),
    [[-30, 12 + FIREWORK_ALTITUDE, 0], [30, 12 + FIREWORK_ALTITUDE, 0]],
    2,
  )
  result.bindings.fireworks = { emitted: emittedNow, alive: d.alive, nearOrigin: d.hits, estimate: estimator.estimate(clock, sys.capacity) }

  // Let the shells die, then D2: fireboat, beat 2 -> mist from both cannons for 20 frames.
  for (let i = 0; i < 300; i++) sys.step(renderer)
  clock += 300 * DT
  emittedNow = 0
  Object.assign(bframe, { shipId: 'ship-1', shipType: 'fireboat', beatInLoop: 2, beatSeconds: 60 / 152, dt: DT })
  for (let i = 0; i < 20; i++) {
    driver.update(bframe, emit)
    sys.step(renderer)
    clock += DT
  }
  d = near(await readPosAge(renderer, sys), [[-4, 5, 40], [4, 5, 40]], 8, true)
  result.bindings.mist = { emitted: emittedNow, alive: d.alive, nearCannon: d.hits, estimate: estimator.estimate(clock, sys.capacity) }
  // Idle again so the render stage below starts from a clean ring.
  for (let i = 0; i < 300; i++) sys.step(renderer)

  // Re-seed a burst so the draw below has live particles to rasterise.
  sys.emit('firework', 0, 8, 0, 0, 1, 0, 500, '#ffcc00', 0.5)
  sys.step(renderer)

  // Draw the particles and a depth-faded laser over an opaque floor (MSAA on).
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500)
  camera.position.set(0, 8, 40)
  camera.lookAt(0, 8, 0)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicNodeMaterial({ color: 0x223344 }))
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)
  scene.add(sys.object3d)
  fxUniforms.uCueIntensity.value = 1
  const laser = new THREE.InstancedMesh(createLaserBeamGeometry(), createLaserBeamMaterial({ depthFade: true }), 1)
  laser.setMatrixAt(0, new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.4), new THREE.Vector3(0.4, 40, 0.4),
  ))
  scene.add(laser)

  // Canary first: a plain floor. If that already loses the device, the adapter cannot
  // present to a canvas and the particle draw below would only repeat the loss.
  const canary = new THREE.Scene()
  canary.add(floor.clone())
  if (!(await submit(renderer, device, canary, camera))) {
    result.render = 'canary-failed'
  } else {
    result.render = (await submit(renderer, device, scene, camera)) ? 'ok' : 'failed'
  }

  sys.dispose(renderer)
  renderer.dispose()
  return result
}
