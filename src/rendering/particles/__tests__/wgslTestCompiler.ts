import * as THREE from 'three/webgpu'

/**
 * A WebGPURenderer that never touches a device: enough for its backend's
 * WGSL node builder to compile kernels and materials under Node.
 */
export function wgslCompiler() {
  const canvas = { style: {}, addEventListener() {}, removeEventListener() {}, getContext: () => null, width: 1, height: 1 }
  const renderer = new THREE.WebGPURenderer({ canvas: canvas as unknown as HTMLCanvasElement }) as any
  renderer.hasFeature = () => false
  renderer._initialized = true
  // Core WebGPU default limits, for builders that size uniform buffers.
  renderer.backend.renderer = renderer
  renderer.backend.device = { limits: { maxUniformBufferBindingSize: 65536, maxStorageBufferBindingSize: 134217728 } }
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
