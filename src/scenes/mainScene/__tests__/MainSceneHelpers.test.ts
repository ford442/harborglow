import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const helpersPath = resolve(__dirname, '../MainSceneHelpers.tsx')
const source = readFileSync(helpersPath, 'utf-8')

/**
 * Static regression guards for the corrupted auto-modularization that broke
 * `npm run dev`. Full Babel-pipeline coverage lives in
 * `scripts/smoke-dev-transform.mjs` (also run in CI).
 */
describe('MainSceneHelpers source integrity', () => {
  it('imports real Ship component (not a null stub)', () => {
    expect(source).toMatch(/import ShipComponent from '\.\.\/Ship'/)
    expect(source).not.toMatch(/const ShipComponent = \(\) => null/)
  })

  it('does not hide behind @ts-nocheck', () => {
    expect(source).not.toMatch(/@ts-nocheck/)
  })

  it('declares LevaControlsConfig only once', () => {
    const matches = source.match(/LevaControlsConfig/g) ?? []
    // interface name + useLevaControls param + export — no duplicate type alias
    expect(source).not.toMatch(/export type LevaControlsConfig/)
    expect(matches.length).toBeGreaterThanOrEqual(2)
    expect(matches.length).toBeLessThanOrEqual(4)
  })

  it('defines real CAMERA_MODES array', () => {
    expect(source).toMatch(/const CAMERA_MODES = \[\s*\n\s*'orbit'/)
    expect(source).not.toMatch(/const CAMERA_MODES = \{\}/)
  })

  it('imports crane and ambient sound helpers (not no-op stubs)', () => {
    expect(source).toMatch(/from '\.\.\/\.\.\/systems\/craneSoundSystem'/)
    expect(source).toMatch(/from '\.\.\/\.\.\/systems\/ambientSoundSystem'/)
    expect(source).not.toMatch(/const setCraneSoundVolume = \(\) => \{\}/)
  })
})
