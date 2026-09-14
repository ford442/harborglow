import { vi } from 'vitest'
import { createAudioRuntimeMock } from './audioRuntimeMock'

// Replace the audioRuntime singleton with a recording fake so no suite touches
// a real AudioContext / AudioWorklet. The AudioRuntime class and protocol
// helpers stay real — AudioRuntime.test.ts constructs its own instances.
vi.mock('../systems/audio/AudioRuntime', async (importActual) => ({
  ...(await importActual<typeof import('../systems/audio/AudioRuntime')>()),
  audioRuntime: createAudioRuntimeMock(),
}))
