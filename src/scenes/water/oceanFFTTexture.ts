// =============================================================================
// OCEAN FFT TEXTURE — packs an OceanFFTField into a tiling DataTexture
//
// Layout: RGBA half-float, R = Dx, G = height, B = Dz, A = 1.
//
// Half-float rather than float32 on purpose. `rgba16float` is filterable in
// core WebGPU, so the water vertex shader can sample it with LinearFilter
// without negotiating the `float32-filterable` device feature (#199). Ocean
// displacement is a handful of metres, comfortably inside half precision
// (±0.001 m at these magnitudes).
//
// This is the only THREE-aware part of the FFT ocean; the simulation itself
// (`src/systems/ocean/`) stays a pure-math module so the headless determinism
// harness can run it without a renderer.
// =============================================================================

import * as THREE from 'three'
import type { OceanFFTField } from '../../systems/ocean/OceanFFTField'

const CHANNELS = 4

export interface OceanFFTTexture {
  texture: THREE.DataTexture
  /** Re-pack the field's current IFFT output and flag the texture for upload. */
  sync(field: OceanFFTField): void
  dispose(): void
}

/**
 * Create a tiling displacement texture sized to `field`.
 *
 * `RepeatWrapping` is what makes `uv = worldXZ / patchSize` tile correctly, so
 * the shader never needs an explicit fract().
 */
export function createOceanFFTTexture(field: OceanFFTField): OceanFFTTexture {
  const size = field.size
  const data = new Uint16Array(size * size * CHANNELS)

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.HalfFloatType)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.colorSpace = THREE.NoColorSpace
  texture.name = 'oceanFFTDisplacement'

  const one = THREE.DataUtils.toHalfFloat(1)
  for (let i = 3; i < data.length; i += CHANNELS) data[i] = one

  const sync = (source: OceanFFTField) => {
    if (source.size !== size) {
      throw new Error('createOceanFFTTexture: field resized; recreate the texture')
    }
    const { heights, displacementX, displacementZ } = source
    const toHalf = THREE.DataUtils.toHalfFloat
    for (let i = 0, o = 0; i < heights.length; i++, o += CHANNELS) {
      data[o] = toHalf(displacementX[i])
      data[o + 1] = toHalf(heights[i])
      data[o + 2] = toHalf(displacementZ[i])
    }
    texture.needsUpdate = true
  }

  sync(field)

  return {
    texture,
    sync,
    dispose: () => texture.dispose(),
  }
}
