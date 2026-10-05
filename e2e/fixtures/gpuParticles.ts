// Browser-side harness for e2e/gpu-particles-smoke.spec.ts. Loaded through a
// Vite dev server so it can import src/ directly. Runs the real
// GpuParticleSystem kernels and draws, plus the laser material (depth fade on,
// MSAA on), on a raw WebGPU device, then reads the particle storage back.

import * as THREE from 'three/webgpu'
import { GpuParticleSystem } from '../../src/rendering/particles/GpuParticleSystem'
import { fxUniforms } from '../../src/rendering/particles/fxFrameUniforms'
import { createLaserBeamGeometry, createLaserBeamMaterial } from '../../src/rendering/particles/laserBeamMaterial'

export interface GpuParticlesSmokeResult {
  adapter: boolean
  capacity: number
  maxSpawn: number
  /** Alive slots after one 100-particle burst. */
  aliveAfterBurst: number
  /** Alive slots after enough spawns to wrap the ring. */
  aliveAfterWrap: number
  /** Alive slots after 2 s with no spawning. */
  aliveAfterIdle: number
  cursorWrapped: boolean
  allFinite: boolean
  /** Mean age of live particles after the burst + one step (> 0 means the update kernel ran). */
  meanAgeAfterBurst: number
  /** Max height reached by a burst launched upward from y = 10. */
  maxY: number
  rendered: boolean
  deviceErrors: string[]
}

const DT = 1 / 60

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
    rendered: false, deviceErrors: [],
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
  await renderer.renderAsync(scene, camera)
  await device.queue.onSubmittedWorkDone()
  result.rendered = true

  // C: two idle seconds — every particle should age out.
  for (let i = 0; i < 120; i++) sys.step(renderer)
  s = stats(await readPosAge(renderer, sys))
  result.aliveAfterIdle = s.alive
  finite &&= s.finite
  result.allFinite = finite

  sys.dispose(renderer)
  renderer.dispose()
  return result
}
