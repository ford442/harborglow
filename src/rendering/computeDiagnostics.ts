import type ComputeNode from 'three/src/nodes/gpgpu/ComputeNode.js'
import { buildStorageTextureProbeNode } from '../shaders/lightShowNodes'

export type ComputeProbeStatus = 'not-run' | 'passed' | 'unsupported' | 'failed'

export interface ComputeProbeRenderer {
  computeAsync?: (computeNode: ComputeNode) => Promise<void>
}

/**
 * Submits a tiny real storage-texture compute pass and waits for completion.
 *
 * The probe is deliberately separate from the WebGL fallback path: a renderer
 * without computeAsync is reported as unsupported instead of pretending that a
 * DataTexture is writable by a compute shader.
 */
export async function runStorageTextureComputeProbe(
  renderer: ComputeProbeRenderer
): Promise<ComputeProbeStatus> {
  if (typeof renderer.computeAsync !== 'function') return 'unsupported'

  let disposeTexture: (() => void) | undefined

  try {
    const { computeNode, displacementTex } = buildStorageTextureProbeNode(4, 4)
    disposeTexture = () => displacementTex.dispose()
    await renderer.computeAsync(computeNode)
    return 'passed'
  } catch {
    return 'failed'
  } finally {
    disposeTexture?.()
  }
}
