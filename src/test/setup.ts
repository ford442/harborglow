import { vi } from 'vitest'
import { createToneMock } from './toneMock'

// Global Tone.js mock — prevents Vitest from loading real tone ESM (extensionless
// ./core/Global import fails under the test resolver). Per-suite vi.mock('tone')
// factories still override this when they need bespoke transport behavior.
vi.mock('tone', () => createToneMock())
