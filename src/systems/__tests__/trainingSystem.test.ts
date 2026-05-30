import { describe, expect, it, vi } from 'vitest'

vi.mock('../../utils/storage_manager', () => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(() => null),
  clearSave: vi.fn(),
}))

vi.mock('../../systems/commsSystem', () => ({
  ACOUSTIC_NOTE_LAYOUT: [
    'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1',
    'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2',
  ],
}))
import {
  TRAINING_MODULES,
  DEFAULT_TRAINING_PROGRESS,
  TUGBOAT_TRAINING_MODULE_IDS,
  isTugboatTrainingModule,
} from '../trainingSystem'

describe('TrainingSystem tugboat modules', () => {
  it('registers dedicated tugboat modules in the catalog', () => {
    const moduleIds = new Set(TRAINING_MODULES.map((module) => module.id))

    expect(TUGBOAT_TRAINING_MODULE_IDS).toEqual([
      'tugboat-basics',
      'twin-screw-differential',
      'acoustic-handshake',
      'storm-rescue',
    ])

    TUGBOAT_TRAINING_MODULE_IDS.forEach((moduleId) => {
      expect(moduleIds.has(moduleId)).toBe(true)
      expect(isTugboatTrainingModule(moduleId)).toBe(true)
    })
  })

  it('starts tugboat progression with basics available and advanced modules locked', () => {
    expect(DEFAULT_TRAINING_PROGRESS.moduleStates['tugboat-basics']).toBe('available')
    expect(DEFAULT_TRAINING_PROGRESS.moduleStates['twin-screw-differential']).toBe('locked')
    expect(DEFAULT_TRAINING_PROGRESS.moduleStates['acoustic-handshake']).toBe('locked')
    expect(DEFAULT_TRAINING_PROGRESS.moduleStates['storm-rescue']).toBe('locked')
  })
})
