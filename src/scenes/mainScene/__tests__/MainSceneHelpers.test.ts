import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const mainSceneDir = resolve(__dirname, '..')

function readModule(name: string): string {
  return readFileSync(join(mainSceneDir, name), 'utf-8')
}

/**
 * Static regression guards for the corrupted auto-modularization that broke
 * `npm run dev`. Full Babel-pipeline coverage lives in
 * `scripts/smoke-dev-transform.mjs` (also run in CI).
 */
describe('MainSceneHelpers module integrity', () => {
  const moduleFiles = readdirSync(mainSceneDir).filter(
    (f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && f !== 'index.ts'
  )

  it('has no @ts-nocheck in any mainScene module', () => {
    for (const file of moduleFiles) {
      const source = readModule(file)
      expect(source, file).not.toMatch(/@ts-nocheck/)
    }
  })

  it('MainSceneHelpers.tsx is a thin barrel (re-exports only)', () => {
    const barrel = readModule('MainSceneHelpers.tsx')
    expect(barrel).toMatch(/from '\.\/index'/)
    expect(barrel.length).toBeLessThan(1500)
    expect(barrel).not.toMatch(/useControls\(/)
  })

  it('shipFleet.tsx imports real Ship component (not a null stub)', () => {
    const source = readModule('shipFleet.tsx')
    expect(source).toMatch(/import ShipComponent from '\.\.\/Ship'/)
    expect(source).not.toMatch(/const ShipComponent = \(\) => null/)
  })

  it('levaControls.ts declares LevaControlsConfig only once (via types import)', () => {
    const source = readModule('levaControls.ts')
    expect(source).toMatch(/from '\.\/types'/)
    expect(source).not.toMatch(/export interface LevaControlsConfig/)
    expect(source).not.toMatch(/export type LevaControlsConfig =/)
  })

  it('levaControls.ts defines real CAMERA_MODES array', () => {
    const source = readModule('levaControls.ts')
    expect(source).toMatch(/const CAMERA_MODES = \[\s*\n\s*'orbit'/)
    expect(source).not.toMatch(/const CAMERA_MODES = \{\}/)
  })

  it('levaControls.ts imports crane and ambient sound helpers (not no-op stubs)', () => {
    const source = readModule('levaControls.ts')
    expect(source).toMatch(/from '\.\.\/\.\.\/systems\/craneSoundSystem'/)
    expect(source).toMatch(/from '\.\.\/\.\.\/systems\/ambientSoundSystem'/)
    expect(source).not.toMatch(/const setCraneSoundVolume = \(\) => \{\}/)
  })
})
