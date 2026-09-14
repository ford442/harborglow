import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { audioRuntime } from '../../systems/audio/AudioRuntime'
import { useGameStore } from '../../store/useGameStore'

// Regression guard for the audio test setup and the Tone.js removal.
//
// Audio runs on the in-tree WASM AudioRuntime + BeatTransport. `tone` must not
// come back — not as a dependency, not as a Vite alias, not as an import.
// If the fake-runtime assertion fails, test.setupFiles was dropped from
// vite.config.ts — re-add setupFiles: ['./src/test/setup.ts'].

const ROOT = join(__dirname, '..', '..', '..')
const SRC = join(ROOT, 'src')
const TONE_IMPORT = /(?:from\s+|import\s*\(\s*|require\s*\(\s*|^\s*import\s+)['"]tone(?:\/[^'"]*)?['"]/m

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(tsx?|jsx?|mjs)$/.test(name) ? [path] : []
  })
}

describe('audio test setup', () => {
  it('collects the game store module', () => {
    expect(useGameStore).toBeTypeOf('function')
    expect(useGameStore.getState()).toBeTypeOf('object')
  })

  it('serves the recording fake for the audioRuntime singleton', () => {
    expect((audioRuntime as unknown as { isFakeAudioRuntime?: boolean }).isFakeAudioRuntime).toBe(true)
  })

  it('runs a basic store action + selector round trip', () => {
    const { setTimeOfDay } = useGameStore.getState()
    const original = useGameStore.getState().timeOfDay
    setTimeOfDay(7)
    expect(useGameStore.getState().timeOfDay).toBe(7)
    setTimeOfDay(original)
  })
})

describe('tone is gone', () => {
  it('no source file imports `tone`', () => {
    const self = relative(ROOT, __filename)
    const offenders = sourceFiles(SRC)
      .filter((file) => relative(ROOT, file) !== self)
      .filter((file) => TONE_IMPORT.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ROOT, file))
    expect(offenders).toEqual([])
  })

  it('package.json does not depend on tone', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies }
    expect(Object.keys(deps)).not.toContain('tone')
  })

  it('vite.config.ts does not alias or chunk tone', () => {
    const config = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8')
    expect(config).not.toMatch(/['"]?\btone\b['"]?\s*:/)
    expect(config).not.toMatch(/['"]tone['"]/)
    expect(config).not.toContain('toneCompat')
  })
})
