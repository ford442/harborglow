// =============================================================================
// TRAINING OBJECTIVE EVALUATOR - Pure helpers for module pass/fail checks
// =============================================================================

import type { TrainingMetrics, TrainingModuleId, TrainingRank } from './trainingSystem'

export interface TrainingRuntimeState {
  /** Module 5: player acknowledged Crane B coordination channel */
  craneBCoordinated: boolean
  /** Module 5: installs completed on two distinct ships */
  shipsWithInstalls: Set<string>
  /** Module 5/6: crane-to-crane or spreader collision events */
  craneCollisionCount: number
  /** Module 6: emergency brake engaged */
  emergencyStopExecuted: boolean
  /** Module 6: load held steady after emergency stop */
  loadSecured: boolean
  /** Module 6: switched to tugboat for assist */
  operationModeSwitched: boolean
  /** Module 6: returned to crane after tugboat assist */
  returnedToCrane: boolean
  /** Module 7: music sync verified after full install */
  syncTestPassed: boolean
  /** Tracks which ship IDs have at least one install */
  primaryShipId: string | null
  secondaryShipId: string | null
}

export const DEFAULT_TRAINING_RUNTIME: TrainingRuntimeState = {
  craneBCoordinated: false,
  shipsWithInstalls: new Set(),
  craneCollisionCount: 0,
  emergencyStopExecuted: false,
  loadSecured: false,
  operationModeSwitched: false,
  returnedToCrane: false,
  syncTestPassed: false,
  primaryShipId: null,
  secondaryShipId: null,
}

export interface ObjectiveEvaluationContext {
  moduleId: TrainingModuleId
  objectiveId: string
  metrics: TrainingMetrics
  runtime: TrainingRuntimeState
  /** Current operation mode from game store */
  operationMode?: 'crane' | 'tugboat' | 'walking'
  /** Whether music/light show is active */
  musicPlaying?: boolean
  /** Installed upgrade count for current training ship */
  installedCount?: number
  /** Total attachment points on training ship */
  installTarget?: number
}

/**
 * Returns true when a single training objective is satisfied.
 */
export function isObjectiveComplete(ctx: ObjectiveEvaluationContext): boolean {
  const { moduleId, objectiveId, metrics, runtime } = ctx

  switch (moduleId) {
  // -------------------------------------------------------------------------
  // Module 1: Basic Hooks
  // -------------------------------------------------------------------------
  case 'basic-hooks':
    switch (objectiveId) {
    case 'move-to-target': return metrics.timeElapsed >= 15
    case 'lower-securely': return metrics.timeElapsed >= 30
    case 'hold-position': return metrics.maxSway < 0.15 && metrics.timeElapsed >= 45
    case 'return-home': return metrics.timeElapsed >= 60
    default: return false
    }

  // -------------------------------------------------------------------------
  // Module 2: Precision
  // -------------------------------------------------------------------------
  case 'precision':
    switch (objectiveId) {
    case 'install-funnel': return metrics.installationsCompleted >= 1
    case 'install-bridge': return metrics.installationsCompleted >= 2
    case 'install-rails': return metrics.installationsCompleted >= 3
    case 'zero-damage': return metrics.installationsCompleted >= 3 && metrics.totalDamage === 0
    default: return false
    }

  // -------------------------------------------------------------------------
  // Module 3: Wind & Sway
  // -------------------------------------------------------------------------
  case 'wind-sway':
    switch (objectiveId) {
    case 'survive-gusts': return metrics.timeElapsed >= 60
    case 'sway-control': return metrics.maxSway < 0.3
    case 'install-weather': return metrics.installationsCompleted >= 4
    case 'no-emergency': return metrics.installationsCompleted >= 4
    default: return false
    }

  // -------------------------------------------------------------------------
  // Module 4: Night Ops
  // -------------------------------------------------------------------------
  case 'night-ops':
    switch (objectiveId) {
    case 'camera-reliance': return metrics.installationsCompleted >= 3
    case 'night-lights': return metrics.installationsCompleted >= 3
    case 'no-collisions': return metrics.totalDamage === 0 && metrics.installationsCompleted >= 3
    case 'efficiency': return metrics.accuracyScore >= 80 && metrics.installationsCompleted >= 3
    default: return false
    }

  // -------------------------------------------------------------------------
  // Module 5: Multi-Crane Coordination
  // -------------------------------------------------------------------------
  case 'multi-crane':
    switch (objectiveId) {
    case 'coordinate-1':
      return runtime.craneBCoordinated || runtime.shipsWithInstalls.size >= 1
    case 'dual-install':
      return runtime.shipsWithInstalls.size >= 2 || metrics.installationsCompleted >= 2
    case 'no-interference':
      return runtime.craneCollisionCount === 0
        && metrics.totalDamage === 0
        && (runtime.shipsWithInstalls.size >= 2 || metrics.installationsCompleted >= 2)
    default: return false
    }

  // -------------------------------------------------------------------------
  // Module 6: Emergency Response
  // -------------------------------------------------------------------------
  case 'emergency':
    switch (objectiveId) {
    case 'emergency-stop':
      return runtime.emergencyStopExecuted
    case 'secure-load':
      return runtime.loadSecured
    case 'evacuate':
      return runtime.operationModeSwitched && runtime.returnedToCrane
    default: return false
    }

  // -------------------------------------------------------------------------
  // Module 7: Advanced Light Show Install
  // -------------------------------------------------------------------------
  case 'light-show': {
    const target = ctx.installTarget ?? metrics.installationsTarget ?? 6
    const installed = ctx.installedCount ?? metrics.installationsCompleted
    switch (objectiveId) {
    case 'complete-show':
      return installed >= target
    case 'sync-test':
      return (ctx.musicPlaying ?? runtime.syncTestPassed) && installed >= target
    case 's-rank':
      return isSRank(metrics) && installed >= target
    default: return false
    }
  }

  default:
    return false
  }
}

/**
 * Evaluate all objectives for a module; returns IDs that are complete.
 */
export function evaluateCompletedObjectives(
  moduleId: TrainingModuleId,
  objectiveIds: string[],
  metrics: TrainingMetrics,
  runtime: TrainingRuntimeState,
  extras: Omit<ObjectiveEvaluationContext, 'moduleId' | 'objectiveId' | 'metrics' | 'runtime'> = {},
): string[] {
  return objectiveIds.filter(id =>
    isObjectiveComplete({
      moduleId,
      objectiveId: id,
      metrics,
      runtime,
      ...extras,
    }),
  )
}

/** Rank threshold labels for display */
export const RANK_THRESHOLDS: Record<TrainingRank, string> = {
  S: 'Sway <15%, zero damage, accuracy ≥95%',
  A: 'Sway <25%, damage <10, accuracy ≥85%',
  B: 'Sway <40%, damage <30, accuracy ≥70%',
  C: 'Accuracy ≥50%',
  F: 'Below pass thresholds',
}

/** Inline S-rank check to avoid circular import with trainingSystem */
function isSRank(metrics: TrainingMetrics): boolean {
  return metrics.maxSway < 0.15 && metrics.totalDamage === 0 && metrics.accuracyScore >= 95
}

/** Returns whether a module attempt passes (rank C or better). */
export function isModulePassing(metrics: TrainingMetrics): boolean {
  return metrics.accuracyScore >= 50
}
