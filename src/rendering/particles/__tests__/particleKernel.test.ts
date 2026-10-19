import { describe, expect, it } from 'vitest'
import { createParticleSystem } from '../particleKernel'

describe('createParticleSystem', () => {
  it('builds a storage-buffer pool without throwing', () => {
    const system = createParticleSystem(64)
    expect(system.drawnCount).toBe(64)
    expect(system.sprite.count).toBe(64)
    expect(system.isReady).toBe(false)
    system.writeAudio(0.2, 0.3, 0.4, 0.5, 0.016, 1)
    system.uploadEmitters(new Float32Array(64 * 12), 0)
    system.dispose()
  })
})