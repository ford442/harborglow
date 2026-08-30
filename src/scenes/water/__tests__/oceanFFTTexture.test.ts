import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { OceanFFTField } from '../../../systems/ocean/OceanFFTField'
import { createOceanFFTTexture } from '../oceanFFTTexture'

const SMALL = { size: 32, patchSize: 64, seed: 4 }

function halfAt(data: Uint16Array, texel: number, channel: number): number {
  return THREE.DataUtils.fromHalfFloat(data[texel * 4 + channel])
}

describe('createOceanFFTTexture', () => {
  it('is configured to tile and filter without float32-filterable', () => {
    const field = new OceanFFTField(SMALL)
    const { texture } = createOceanFFTTexture(field)

    expect(texture.type).toBe(THREE.HalfFloatType)
    expect(texture.format).toBe(THREE.RGBAFormat)
    expect(texture.wrapS).toBe(THREE.RepeatWrapping)
    expect(texture.wrapT).toBe(THREE.RepeatWrapping)
    expect(texture.minFilter).toBe(THREE.LinearFilter)
    expect(texture.magFilter).toBe(THREE.LinearFilter)
    expect(texture.generateMipmaps).toBe(false)
    expect(texture.image.width).toBe(field.size)
    expect(texture.image.height).toBe(field.size)
  })

  it('packs Dx / height / Dz into R / G / B', () => {
    const field = new OceanFFTField(SMALL)
    field.update(2.5)

    const packed = createOceanFFTTexture(field)
    packed.sync(field)
    const data = packed.texture.image.data as Uint16Array

    for (const texel of [0, 17, 512, field.size * field.size - 1]) {
      expect(halfAt(data, texel, 0)).toBeCloseTo(field.displacementX[texel], 2)
      expect(halfAt(data, texel, 1)).toBeCloseTo(field.heights[texel], 2)
      expect(halfAt(data, texel, 2)).toBeCloseTo(field.displacementZ[texel], 2)
      expect(halfAt(data, texel, 3)).toBe(1)
    }
  })

  it('flags the texture for re-upload on sync', () => {
    const field = new OceanFFTField(SMALL)
    const packed = createOceanFFTTexture(field)
    // `needsUpdate` is write-only in THREE; it bumps `version` instead.
    const before = packed.texture.version

    field.update(9)
    packed.sync(field)
    expect(packed.texture.version).toBeGreaterThan(before)
  })

  it('refuses a field of a different size', () => {
    const packed = createOceanFFTTexture(new OceanFFTField(SMALL))
    expect(() => packed.sync(new OceanFFTField({ ...SMALL, size: 64 }))).toThrow(/recreate/)
  })
})
