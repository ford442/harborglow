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

vi.mock('../../store/useGameStore', () => ({
  useGameStore: {
    getState: () => ({
      ships: [],
      currentShipId: null,
      installedUpgrades: [],
      operationMode: 'crane',
      musicPlaying: new Map(),
      removeShip: vi.fn(),
      setCurrentShip: vi.fn(),
      setWeather: vi.fn(),
      addReputation: vi.fn(),
    }),
  },
}))

vi.mock('../../systems/reputationSystem', () => ({
  reputationSystem: { recordTrainingComplete: vi.fn() },
}))

vi.mock('../../systems/StormSystem', () => ({
  stormSystem: { start: vi.fn(), stop: vi.fn(), update: vi.fn() },
}))

vi.mock('../../systems/shipSpawner', () => ({
  ShipSpawner: { spawnShip: vi.fn(() => ({ id: 'test-ship', attachmentPoints: [] })) },
}))

import {
  TRAINING_MODULES,
  DEFAULT_TRAINING_PROGRESS,
  TUGBOAT_TRAINING_MODULE_IDS,
  isTugboatTrainingModule,
  calculateRank,
  calculateScore,
  getRankDescription,
  TrainingMetrics,
  TrainingSystem,
} from '../trainingSystem'
import {
  DEFAULT_TRAINING_RUNTIME,
  evaluateCompletedObjectives,
  isModulePassing,
  isObjectiveComplete,
  RANK_THRESHOLDS,
} from '../trainingObjectiveEvaluator'

const perfectMetrics: TrainingMetrics = {
  timeElapsed: 60,
  maxSway: 0.1,
  totalDamage: 0,
  accuracyScore: 98,
  installationsCompleted: 6,
  installationsTarget: 6,
}

const failingMetrics: TrainingMetrics = {
  timeElapsed: 300,
  maxSway: 0.6,
  totalDamage: 50,
  accuracyScore: 30,
  installationsCompleted: 1,
  installationsTarget: 6,
}

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

describe('calculateRank', () => {
  it('awards S-rank for perfect metrics', () => {
    expect(calculateRank(perfectMetrics)).toBe('S')
  })

  it('awards F-rank for poor metrics', () => {
    expect(calculateRank(failingMetrics)).toBe('F')
  })

  it('awards C-rank at the pass threshold', () => {
    expect(calculateRank({
      ...failingMetrics,
      maxSway: 0.5,
      totalDamage: 40,
      accuracyScore: 55,
    })).toBe('C')
  })

  it('documents rank thresholds', () => {
    expect(RANK_THRESHOLDS.S).toContain('15%')
    expect(RANK_THRESHOLDS.F).toContain('Below')
  })
})

describe('calculateScore', () => {
  it('returns higher score for better performance', () => {
    const perfect = calculateScore(perfectMetrics)
    const failing = calculateScore(failingMetrics)
    expect(perfect).toBeGreaterThan(failing)
  })

  it('never returns negative scores', () => {
    expect(calculateScore(failingMetrics)).toBeGreaterThanOrEqual(0)
  })

  it('includes time bonus for fast completion', () => {
    const fast = calculateScore({ ...perfectMetrics, timeElapsed: 30 })
    const slow = calculateScore({ ...perfectMetrics, timeElapsed: 200 })
    expect(fast).toBeGreaterThan(slow)
  })
})

describe('isModulePassing', () => {
  it('passes at C-rank or better', () => {
    expect(isModulePassing(perfectMetrics)).toBe(true)
    expect(isModulePassing({
      ...perfectMetrics,
      maxSway: 0.5,
      totalDamage: 20,
      accuracyScore: 60,
    })).toBe(true)
    expect(isModulePassing(failingMetrics)).toBe(false)
  })
})

describe('advanced crane modules 5-7', () => {
  const modules = ['multi-crane', 'emergency', 'light-show'] as const

  it.each(modules)('%s has tutorials, objectives, and rank thresholds', (id) => {
    const mod = TRAINING_MODULES.find(m => m.id === id)!
    expect(mod.tutorial.length).toBeGreaterThan(0)
    expect(mod.objectives.length).toBe(3)
    expect(mod.rewards.reputation).toBeGreaterThan(0)
  })

  it('chains prerequisites night-ops → multi-crane → emergency → light-show', () => {
    const multi = TRAINING_MODULES.find(m => m.id === 'multi-crane')!
    const emergency = TRAINING_MODULES.find(m => m.id === 'emergency')!
    const lightShow = TRAINING_MODULES.find(m => m.id === 'light-show')!

    expect(multi.prerequisites).toContain('night-ops')
    expect(emergency.prerequisites).toContain('multi-crane')
    expect(lightShow.prerequisites).toContain('emergency')
  })

  it('unlocks next module on completion', () => {
    const system = new TrainingSystem()
    system['progress'].moduleStates['night-ops'] = 'completed'
    system['progress'].moduleStates['multi-crane'] = 'locked'
    system['unlockNextModules']('night-ops')
    expect(system.isModuleAvailable('multi-crane')).toBe(true)
  })
})

describe('evaluateCompletedObjectives — modules 5-7', () => {
  it('multi-crane: completes coordination when Crane B acknowledged', () => {
    const runtime = { ...DEFAULT_TRAINING_RUNTIME, shipsWithInstalls: new Set(['ship-a']), craneBCoordinated: true }
    const completed = evaluateCompletedObjectives(
      'multi-crane',
      ['coordinate-1', 'dual-install', 'no-interference'],
      { ...perfectMetrics, installationsCompleted: 2 },
      runtime,
    )
    expect(completed).toContain('coordinate-1')
    expect(completed).toContain('dual-install')
  })

  it('emergency: requires stop, secure, and mode switch protocol', () => {
    const runtime = {
      ...DEFAULT_TRAINING_RUNTIME,
      emergencyStopExecuted: true,
      loadSecured: true,
      operationModeSwitched: true,
      returnedToCrane: true,
      shipsWithInstalls: new Set(),
    }
    const ids = ['emergency-stop', 'secure-load', 'evacuate']
    const completed = evaluateCompletedObjectives('emergency', ids, perfectMetrics, runtime)
    expect(completed).toEqual(ids)
  })

  it('light-show: requires full install, sync, and S-rank', () => {
    const runtime = { ...DEFAULT_TRAINING_RUNTIME, syncTestPassed: true, shipsWithInstalls: new Set() }
    const completed = evaluateCompletedObjectives(
      'light-show',
      ['complete-show', 'sync-test', 's-rank'],
      perfectMetrics,
      runtime,
      { installedCount: 6, installTarget: 6, musicPlaying: true },
    )
    expect(completed).toContain('complete-show')
    expect(completed).toContain('sync-test')
    expect(completed).toContain('s-rank')
  })

  it('light-show s-rank fails without perfect metrics', () => {
    expect(isObjectiveComplete({
      moduleId: 'light-show',
      objectiveId: 's-rank',
      metrics: failingMetrics,
      runtime: DEFAULT_TRAINING_RUNTIME,
      installedCount: 6,
      installTarget: 6,
    })).toBe(false)
  })
})

describe('getRankDescription', () => {
  it('returns human labels for all ranks', () => {
    expect(getRankDescription('S')).toBe('Perfect Execution')
    expect(getRankDescription('F')).toBe('Needs Improvement')
  })
})
