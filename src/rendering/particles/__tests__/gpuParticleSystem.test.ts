import * as THREE from 'three/webgpu'
import { describe, expect, it } from 'vitest'
import { GpuParticleSystem, type ParticleRenderer } from '../GpuParticleSystem'
import { PARTICLE_WORKGROUP } from '../particleBudget'

/**
 * A WebGPURenderer that never touches a device: enough for its backend's
 * WGSL node builder to compile kernels and materials under Node.
 */
function wgslCompiler() {
  const canvas = { style: {}, addEventListener() {}, removeEventListener() {}, getContext: () => null, width: 1, height: 1 }
  const renderer = new THREE.WebGPURenderer({ canvas: canvas as unknown as HTMLCanvasElement }) as any
  renderer.hasFeature = () => false
  renderer._initialized = true
  return {
    compute(node: unknown): string {
      const b = renderer.backend.createNodeBuilder(node, renderer)
      b.build()
      return String(b.computeShader)
    },
    material(object: THREE.Object3D, material: THREE.Material): { vertex: string; fragment: string } {
      const scene = new THREE.Scene()
      scene.add(object)
      const b = renderer.backend.createNodeBuilder(object, renderer)
      b.scene = scene
      b.camera = new THREE.PerspectiveCamera()
      b.material = material
      b.context.material = material
      b.build()
      return { vertex: String(b.vertexShader), fragment: String(b.fragmentShader) }
    },
  }
}

function fakeRenderer() {
  const calls: Array<{ node: unknown; n: number | undefined }> = []
  const r: ParticleRenderer = {
    compute: (node, n) => { calls.push({ node, n }) },
    computeAsync: async (node, n) => { calls.push({ node, n }) },
  }
  return { r, calls }
}

describe('GpuParticleSystem graph', () => {
  it('sizes the ring and kernels from the budget', () => {
    const sys = new GpuParticleSystem(1000)
    expect(sys.capacity).toBe(1024)
    expect(sys.capacity % PARTICLE_WORKGROUP).toBe(0)
    expect((sys.computeNodes.update as { count: number }).count).toBe(1024)
    expect((sys.computeNodes.spawn as { count: number }).count).toBe(sys.maxSpawn)
    expect(sys.object3d.count).toBe(1024)
    expect(sys.object3d.frustumCulled).toBe(false)
    expect(sys.buffers.posAge.count).toBe(1024)
  })

  it('compiles every kernel to WGSL with no branches (three #33650)', () => {
    const c = wgslCompiler()
    const sys = new GpuParticleSystem(1000)
    for (const node of [sys.computeNodes.init, sys.computeNodes.update, sys.computeNodes.spawn]) {
      const wgsl = c.compute(node)
      expect(wgsl).toContain('@compute @workgroup_size( 64, 1, 1 )')
      expect(wgsl).not.toMatch(/\bif\s*\(|\bselect\s*\(|\bloop\b|\bfor\s*\(/)
      expect(wgsl).not.toMatch(/texture_storage/)
    }
  })

  it('compiles the sprite material with per-instance storage attributes', () => {
    const c = wgslCompiler()
    const sys = new GpuParticleSystem(1000)
    const { vertex, fragment } = c.material(sys.object3d, sys.material)
    expect(vertex).toMatch(/nodeAttribute\d+ : vec4<f32>/)
    expect(fragment).toContain('smoothstep')
    expect(sys.material.blending).toBe(THREE.AdditiveBlending)
    expect(sys.material.depthWrite).toBe(false)
  })

  it('exposes the shared beat uniforms on material.userData', () => {
    const sys = new GpuParticleSystem(1000)
    for (const k of ['uBass', 'uTreble', 'uBeatPhase', 'uBeatPulse', 'uDt']) {
      expect(sys.material.userData[k]).toHaveProperty('value')
    }
  })
})

describe('GpuParticleSystem dispatch', () => {
  it('does nothing until init resolves, then runs update every frame', async () => {
    const sys = new GpuParticleSystem(1000)
    const { r, calls } = fakeRenderer()
    sys.emit('spark', 0, 0, 0, 0, 1, 0, 100, null, 0)
    sys.step(r)
    expect(calls).toHaveLength(0)
    expect(sys.packer.total).toBe(0)
    await sys.init(r)
    expect(calls.map((c) => c.node)).toEqual([sys.computeNodes.init])
    sys.step(r)
    expect(calls.at(-1)?.node).toBe(sys.computeNodes.update)
  })

  it('dispatches padded spawn counts and wraps the ring cursor', async () => {
    const sys = new GpuParticleSystem(1000)
    const { r, calls } = fakeRenderer()
    await sys.init(r)
    calls.length = 0
    expect(sys.emit('firework', 1, 2, 3, 0, 1, 0, 40, '#ff0000', 0.3)).toBe(40)
    sys.step(r)
    expect(calls).toEqual([
      { node: sys.computeNodes.update, n: undefined },
      { node: sys.computeNodes.spawn, n: 64 },
    ])
    expect(sys.ringCursor).toBe(64)
    for (let i = 0; i < 20; i++) {
      sys.emit('spark', 0, 0, 0, 0, 1, 0, sys.maxSpawn, null, 0)
      sys.step(r)
    }
    expect(sys.ringCursor).toBeLessThan(sys.capacity)
    expect(sys.packer.total).toBe(0)
  })

  it('stops dispatching after dispose', async () => {
    const sys = new GpuParticleSystem(1000)
    const { r, calls } = fakeRenderer()
    await sys.init(r)
    sys.dispose()
    calls.length = 0
    sys.step(r)
    expect(calls).toHaveLength(0)
  })
})
