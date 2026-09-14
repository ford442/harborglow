// =============================================================================
// TRAINING SYSTEM - Type Definitions
// =============================================================================

import { ShipType, WeatherState } from '../store/useGameStore'

export type TrainingModuleId =
  | 'basic-hooks'      // Module 1: Basic Hook Control
  | 'precision'        // Module 2: Precision Placement
  | 'wind-sway'        // Module 3: Wind & Sway Management
  | 'night-ops'        // Module 4: Night Operations
  | 'tugboat-basics'   // Tugboat Module 1: Basic tug handling
  | 'twin-screw-differential' // Tugboat Module 2: Differential thrust
  | 'acoustic-handshake' // Tugboat Module 3: Acoustic handshake protocol
  | 'storm-rescue'     // Tugboat Module 4: Controlled storm tow
  | 'ice-escort'       // Tugboat Module 5: Polar channel for Yamal
  | 'multi-crane'      // Module 5: Multi-Crane Coordination
  | 'emergency'        // Module 6: Emergency Response
  | 'light-show'       // Module 7: Advanced Light Show Install

export const TUGBOAT_TRAINING_MODULE_IDS: TrainingModuleId[] = [
  'tugboat-basics',
  'twin-screw-differential',
  'acoustic-handshake',
  'storm-rescue',
  'ice-escort',
]

export function isTugboatTrainingModule(moduleId: TrainingModuleId): boolean {
  return TUGBOAT_TRAINING_MODULE_IDS.includes(moduleId)
}

export type TrainingRank = 'S' | 'A' | 'B' | 'C' | 'F'
export type TrainingState = 'locked' | 'available' | 'in-progress' | 'completed'

export interface TrainingObjective {
  id: string
  title: string
  description: string
  completed: boolean
  progress: number // 0-100
}

export interface TrainingMetrics {
  timeElapsed: number
  maxSway: number
  totalDamage: number
  accuracyScore: number
  installationsCompleted: number
  installationsTarget: number
}

export interface TrainingResult {
  moduleId: TrainingModuleId
  rank: TrainingRank
  score: number
  metrics: TrainingMetrics
  completedAt: number
  attempts: number
}

export interface TrainingModule {
  id: TrainingModuleId
  title: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedTime: number // minutes
  shipType: ShipType
  weather: WeatherState
  timeOfDay: number // 0-24
  prerequisites: TrainingModuleId[]
  objectives: Omit<TrainingObjective, 'completed' | 'progress'>[]
  rewards: {
    reputation: number
    unlocks: string[]
  }
  tutorial: TrainingStep[]
}

export interface TrainingStep {
  id: string
  title: string
  message: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlightElement?: string // CSS selector or element ID
  voiceLine?: string
  waitForAction?: boolean
  actionType?: 'move' | 'lower' | 'install' | 'wait'
}

// =============================================================================
// TRAINING PROGRESS STATE
// =============================================================================

export interface TrainingProgress {
  moduleStates: Record<TrainingModuleId, TrainingState>
  results: TrainingResult[]
  currentModule: TrainingModuleId | null
  currentStep: number
  totalScore: number
  unlockedRewards: string[]
  // Persistent bonuses
  permanentReputationBonus: number
  unlockedCosmetics: string[]
  unlockedWeather: WeatherState[]
}

export const DEFAULT_TRAINING_PROGRESS: TrainingProgress = {
  moduleStates: {
    'basic-hooks': 'available',
    'precision': 'locked',
    'wind-sway': 'locked',
    'night-ops': 'locked',
    'tugboat-basics': 'available',
    'twin-screw-differential': 'locked',
    'acoustic-handshake': 'locked',
    'storm-rescue': 'locked',
    'ice-escort': 'locked',
    'multi-crane': 'locked',
    'emergency': 'locked',
    'light-show': 'locked'
  },
  results: [],
  currentModule: null,
  currentStep: 0,
  totalScore: 0,
  unlockedRewards: [],
  permanentReputationBonus: 0,
  unlockedCosmetics: [],
  unlockedWeather: ['clear']
}
