import { describe, expect, it } from 'vitest'

// Regression guard for the shared Tone.js test stub.
//
// If this fails with a tone/core/Global resolution error, test.setupFiles was
// dropped from vite.config.ts — re-add setupFiles: ['./src/test/setup.ts'].
//
// The store transitively imports the audio systems, which do
// `import * as Tone from 'tone'`. tone@14.x ships ESM that re-exports from
// "./core/Global" without a file extension, which the Vitest resolver rejects,
// so every suite touching the store fails to *collect* without the global mock.
import * as Tone from 'tone'
import { useGameStore } from '../store/useGameStore'

describe('tone test setup', () => {
  it('collects the game store module without loading real tone ESM', () => {
    expect(useGameStore).toBeTypeOf('function')
    expect(useGameStore.getState()).toBeTypeOf('object')
  })

  it('serves the shared stub for `tone`, not the real library', () => {
    // `_setSeconds` is a marker that only exists on the stub transport in
    // src/test/toneMock.ts. If this assertion fails while the suite still
    // collects, setupFiles was dropped and only `test.server.deps.inline`
    // is keeping tone resolvable — re-add setupFiles: ['./src/test/setup.ts'].
    expect((Tone.getTransport() as unknown as Record<string, unknown>)._setSeconds).toBeTypeOf('function')
  })

  it('runs a basic store action + selector round trip', () => {
    const { setTimeOfDay } = useGameStore.getState()
    expect(setTimeOfDay).toBeTypeOf('function')

    const original = useGameStore.getState().timeOfDay
    setTimeOfDay(7)
    expect(useGameStore.getState().timeOfDay).toBe(7)
    setTimeOfDay(original)
  })
})
