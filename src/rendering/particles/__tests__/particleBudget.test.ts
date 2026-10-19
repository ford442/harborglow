import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PARTICLE_BUDGET,
  PARTICLE_WORKGROUP,
  dispatchCountFor,
  particleCountFor,
} from '../particleBudget'

describe('particle budget', () => {
  it('matches the quality tiers', () => {
    expect(particleCountFor('high')).toBe(250_000)
    expect(particleCountFor('medium')).toBe(80_000)
    expect(particleCountFor('low')).toBe(30_000)
    expect(PARTICLE_BUDGET.low).toBeLessThanOrEqual(30_000)
  })

  it('pads dispatch to the workgroup without shrinking the drawn count', () => {
    expect(dispatchCountFor(PARTICLE_BUDGET.high) % PARTICLE_WORKGROUP).toBe(0)
    expect(dispatchCountFor(PARTICLE_BUDGET.high)).toBeGreaterThanOrEqual(PARTICLE_BUDGET.high)
    expect(dispatchCountFor(PARTICLE_BUDGET.medium) % PARTICLE_WORKGROUP).toBe(0)
    expect(dispatchCountFor(PARTICLE_BUDGET.low) % PARTICLE_WORKGROUP).toBe(0)
    expect(dispatchCountFor(PARTICLE_BUDGET.medium)).toBe(PARTICLE_BUDGET.medium)
  })
})

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue
      out.push(...sourceFiles(path))
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      out.push(path)
    }
  }
  return out
}

describe('particle sources', () => {
  it('do not reference storage textures or float32 texture types', () => {
    const files = [
      ...sourceFiles('src/rendering/particles'),
      ...sourceFiles('src/scenes/particles'),
    ]
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toMatch(/StorageTexture/)
      expect(text, file).not.toMatch(/FloatType/)
    }
  })
})
