import * as THREE from 'three'
import { METER_HEIGHT, METER_WIDTH } from './types'

let blitScene: THREE.Scene | null = null
let blitCam: THREE.OrthographicCamera | null = null
let blitMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null
let tinyRt: THREE.WebGLRenderTarget | null = null

function ensureBlit(): void {
  if (tinyRt) return
  tinyRt = new THREE.WebGLRenderTarget(METER_WIDTH, METER_HEIGHT, {
    type: THREE.UnsignedByteType,
    depthBuffer: false,
    stencilBuffer: false,
  })
  blitCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  blitScene = new THREE.Scene()
  blitMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({ depthTest: false, depthWrite: false }),
  )
  blitScene.add(blitMesh)
}

export function disposeTinySampler(): void {
  tinyRt?.dispose()
  blitMesh?.geometry.dispose()
  blitMesh?.material.dispose()
  tinyRt = null
  blitScene = null
  blitCam = null
  blitMesh = null
}

type SampleRenderer = {
  setRenderTarget?: (target: THREE.WebGLRenderTarget | null) => void
  getRenderTarget?: () => THREE.WebGLRenderTarget | null
  render?: (scene: THREE.Scene, camera: THREE.Camera) => void
  readRenderTargetPixels?: (
    target: THREE.WebGLRenderTarget,
    x: number,
    y: number,
    w: number,
    h: number,
    buffer: ArrayBufferView,
  ) => void
}

/**
 * Blit `srcTexture` to a 64×36 target and read it back.
 * Tiny CPU sample for the WASM/JS helper path — never a full-framebuffer readback.
 * Returns false when the renderer cannot sample (typical real-WebGPU default fb).
 */
export function sampleTinyRgba(
  renderer: SampleRenderer,
  srcTexture: THREE.Texture | null | undefined,
  out: Uint8Array,
): boolean {
  if (!srcTexture || typeof renderer.readRenderTargetPixels !== 'function') return false
  try {
    ensureBlit()
    if (!tinyRt || !blitScene || !blitCam || !blitMesh) return false
    blitMesh.material.map = srcTexture
    blitMesh.material.needsUpdate = true
    const prev = typeof renderer.getRenderTarget === 'function' ? renderer.getRenderTarget() : null
    renderer.setRenderTarget?.(tinyRt)
    renderer.render?.(blitScene, blitCam)
    renderer.readRenderTargetPixels(tinyRt, 0, 0, METER_WIDTH, METER_HEIGHT, out)
    renderer.setRenderTarget?.(prev)
    return true
  } catch {
    try {
      renderer.setRenderTarget?.(null)
    } catch {
      /* ignore restore failures */
    }
    return false
  }
}

export function composerColorTexture(composer: {
  readBuffer?: { texture?: THREE.Texture }
  writeBuffer?: { texture?: THREE.Texture }
  renderTarget2?: { texture?: THREE.Texture }
} | null): THREE.Texture | null {
  if (!composer) return null
  return (
    composer.writeBuffer?.texture ??
    composer.renderTarget2?.texture ??
    composer.readBuffer?.texture ??
    null
  )
}
