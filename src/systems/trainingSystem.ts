/* eslint-disable no-restricted-syntax -- wall-clock / audio / network; see docs/systems/DETERMINISM.md */
// =============================================================================
// TRAINING SYSTEM - HarborGlow Crane Operator Training Simulations
// Professional training mode with progressive skill development
//
// Module data, types, voice lines, and scoring live in sibling files
// (trainingTypes.ts, trainingModules.ts, trainingVoiceLines.ts,
// trainingScoring.ts) and are re-exported here so existing imports of
// './trainingSystem' keep working unchanged.
// =============================================================================

import { useGameStore } from '../store/useGameStore'
import { reputationSystem } from './reputationSystem'
import {
  TrainingRuntimeState,
  DEFAULT_TRAINING_RUNTIME,
  evaluateCompletedObjectives,
} from './trainingObjectiveEvaluator'
import { ShipSpawner } from './shipSpawner'
import { stormSystem } from './StormSystem'
import { startIceEscort } from './ice/iceEscortMission'

import {
  TrainingModuleId,
  TrainingProgress,
  TrainingMetrics,
  TrainingModule,
  TrainingStep,
  TrainingResult,
  DEFAULT_TRAINING_PROGRESS,
} from './trainingTypes'
import { TRAINING_MODULES } from './trainingModules'

export * from './trainingTypes'
export * from './trainingModules'
export * from './trainingVoiceLines'
export * from './trainingScoring'

import { calculateRank, calculateScore } from './trainingScoring'

// =============================================================================
// TRAINING SYSTEM CLASS
// =============================================================================

export class TrainingSystem {
  private progress: TrainingProgress = { ...DEFAULT_TRAINING_PROGRESS }
  private listeners: Set<(progress: TrainingProgress) => void> = new Set()
  private runtimeState: TrainingRuntimeState = { ...DEFAULT_TRAINING_RUNTIME, shipsWithInstalls: new Set() }
  private runtimeListeners: Set<(runtime: TrainingRuntimeState) => void> = new Set()
  private currentMetrics: TrainingMetrics = {
    timeElapsed: 0,
    maxSway: 0,
    totalDamage: 0,
    accuracyScore: 100,
    installationsCompleted: 0,
    installationsTarget: 0
  }
  private metricsInterval: ReturnType<typeof setInterval> | null = null
  private startTime: number = 0

  // Getters
  getProgress(): TrainingProgress {
    return { ...this.progress }
  }

  getModule(moduleId: TrainingModuleId): TrainingModule | undefined {
    return TRAINING_MODULES.find(m => m.id === moduleId)
  }

  isModuleAvailable(moduleId: TrainingModuleId): boolean {
    return this.progress.moduleStates[moduleId] !== 'locked'
  }

  isModuleCompleted(moduleId: TrainingModuleId): boolean {
    return this.progress.results.some(r => r.moduleId === moduleId)
  }

  getBestResult(moduleId: TrainingModuleId): TrainingResult | undefined {
    const results = this.progress.results.filter(r => r.moduleId === moduleId)
    if (results.length === 0) return undefined
    return results.reduce((best, current) => current.score > best.score ? current : best)
  }

  // State Management
  startModule(moduleId: TrainingModuleId): boolean {
    if (!this.isModuleAvailable(moduleId)) {
      console.warn(`[Training] Module ${moduleId} is locked`)
      return false
    }

    const module = this.getModule(moduleId)
    if (!module) return false

    this.progress.currentModule = moduleId
    this.progress.currentStep = 0
    this.progress.moduleStates[moduleId] = 'in-progress'
    this.resetRuntimeState()

    // Reset metrics
    this.currentMetrics = {
      timeElapsed: 0,
      maxSway: 0,
      totalDamage: 0,
      accuracyScore: 100,
      installationsCompleted: 0,
      installationsTarget: this.getInstallTargetForModule(module)
    }

    this.startTime = Date.now()
    this.startMetricsTracking()

    this.notifyListeners()
    console.log(`[Training] Started module: ${module.title}`)

    return true
  }

  exitModule(): void {
    if (this.progress.currentModule) {
      const moduleId = this.progress.currentModule
      if (this.progress.moduleStates[moduleId] === 'in-progress') {
        this.progress.moduleStates[moduleId] = 'available'
      }
    }

    this.progress.currentModule = null
    this.progress.currentStep = 0
    this.stopMetricsTracking()

    this.notifyListeners()
    console.log('[Training] Exited module')
  }

  completeModule(): TrainingResult {
    const moduleId = this.progress.currentModule
    if (!moduleId) {
      throw new Error('No active module to complete')
    }

    this.stopMetricsTracking()

    // Calculate final metrics
    this.currentMetrics.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000)

    const rank = calculateRank(this.currentMetrics)
    const score = calculateScore(this.currentMetrics)

    const result: TrainingResult = {
      moduleId,
      rank,
      score,
      metrics: { ...this.currentMetrics },
      completedAt: Date.now(),
      attempts: (this.progress.results.filter(r => r.moduleId === moduleId).length) + 1
    }

    this.progress.results.push(result)
    this.progress.moduleStates[moduleId] = 'completed'
    this.progress.totalScore += score

    // Unlock next module
    this.unlockNextModules(moduleId)

    // Apply rewards
    this.applyModuleRewards(moduleId)

    // Record with reputation system
    reputationSystem.recordTrainingComplete(rank)

    this.progress.currentModule = null
    this.progress.currentStep = 0

    this.notifyListeners()
    console.log(`[Training] Completed ${moduleId} with rank ${rank}, score ${score}`)

    return result
  }

  private unlockNextModules(completedModuleId: TrainingModuleId): void {
    TRAINING_MODULES.forEach(module => {
      if (module.prerequisites.includes(completedModuleId)) {
        const allPrereqsMet = module.prerequisites.every(
          prereq => this.progress.moduleStates[prereq] === 'completed'
        )
        if (allPrereqsMet && this.progress.moduleStates[module.id] === 'locked') {
          this.progress.moduleStates[module.id] = 'available'
          console.log(`[Training] Unlocked module: ${module.title}`)
        }
      }
    })
  }

  private applyModuleRewards(moduleId: TrainingModuleId): void {
    const module = this.getModule(moduleId)
    if (!module) return

    // Add reputation bonus
    this.progress.permanentReputationBonus += module.rewards.reputation

    // Track unlocked rewards
    module.rewards.unlocks.forEach(unlock => {
      if (!this.progress.unlockedRewards.includes(unlock)) {
        this.progress.unlockedRewards.push(unlock)
      }
    })

    // Apply to game store
    const store = useGameStore.getState()
    store.addReputation(module.rewards.reputation)
  }

  // Tutorial Step Navigation
  nextStep(): void {
    if (!this.progress.currentModule) return
    const module = this.getModule(this.progress.currentModule)
    if (!module) return

    if (this.progress.currentStep < module.tutorial.length - 1) {
      this.progress.currentStep++
      this.notifyListeners()
    }
  }

  previousStep(): void {
    if (this.progress.currentStep > 0) {
      this.progress.currentStep--
      this.notifyListeners()
    }
  }

  getCurrentStep(): TrainingStep | null {
    if (!this.progress.currentModule) return null
    const module = this.getModule(this.progress.currentModule)
    if (!module) return null
    return module.tutorial[this.progress.currentStep] || null
  }

  // Metrics Tracking
  private startMetricsTracking(): void {
    this.metricsInterval = setInterval(() => {
      // In real implementation, this would read from swaySystem, etc.
      // For now, we simulate metric updates
      this.updateMetricsFromGameState()
    }, 100)
  }

  private stopMetricsTracking(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
  }

  private updateMetricsFromGameState(): void {
    const store = useGameStore.getState()

    // Get sway from store if available
    // This would integrate with swaySystem in full implementation
    // For now, placeholder
  }

  updateMetrics(updates: Partial<TrainingMetrics>): void {
    this.currentMetrics = { ...this.currentMetrics, ...updates }
  }

  recordSway(sway: number): void {
    if (sway > this.currentMetrics.maxSway) {
      this.currentMetrics.maxSway = sway
    }
  }

  recordDamage(damage: number): void {
    this.currentMetrics.totalDamage += damage
  }

  recordInstallation(shipId?: string): void {
    this.currentMetrics.installationsCompleted++
    if (shipId) {
      this.runtimeState.shipsWithInstalls.add(shipId)
      if (!this.runtimeState.primaryShipId) {
        this.runtimeState.primaryShipId = shipId
      } else if (shipId !== this.runtimeState.primaryShipId) {
        this.runtimeState.secondaryShipId = shipId
      }
    }
    this.notifyRuntimeListeners()
  }

  recordEmergencyStop(): void {
    this.runtimeState.emergencyStopExecuted = true
    this.notifyRuntimeListeners()
  }

  recordLoadSecured(): void {
    this.runtimeState.loadSecured = true
    this.notifyRuntimeListeners()
  }

  recordCraneBCoordinated(): void {
    this.runtimeState.craneBCoordinated = true
    this.notifyRuntimeListeners()
  }

  recordOperationModeSwitch(mode: 'crane' | 'tugboat' | 'walking'): void {
    if (mode === 'tugboat') {
      this.runtimeState.operationModeSwitched = true
    } else if (mode === 'crane' && this.runtimeState.operationModeSwitched) {
      this.runtimeState.returnedToCrane = true
    }
    this.notifyRuntimeListeners()
  }

  recordSyncTestPassed(): void {
    this.runtimeState.syncTestPassed = true
    this.notifyRuntimeListeners()
  }

  recordCollision(): void {
    this.runtimeState.craneCollisionCount++
    this.notifyRuntimeListeners()
  }

  getRuntimeState(): TrainingRuntimeState {
    return {
      ...this.runtimeState,
      shipsWithInstalls: new Set(this.runtimeState.shipsWithInstalls),
    }
  }

  resetRuntimeState(): void {
    this.runtimeState = { ...DEFAULT_TRAINING_RUNTIME, shipsWithInstalls: new Set() }
    this.notifyRuntimeListeners()
  }

  setTrainingShipIds(primaryId: string, secondaryId?: string): void {
    this.runtimeState.primaryShipId = primaryId
    if (secondaryId) this.runtimeState.secondaryShipId = secondaryId
    this.notifyRuntimeListeners()
  }

  getCompletedObjectiveIds(): string[] {
    const moduleId = this.progress.currentModule
    if (!moduleId) return []
    const module = this.getModule(moduleId)
    if (!module) return []

    const store = useGameStore.getState()
    const currentShip = store.ships.find(s => s.id === store.currentShipId)
    const installedCount = currentShip
      ? store.installedUpgrades.filter(u => u.shipId === currentShip.id).length
      : this.currentMetrics.installationsCompleted

    return evaluateCompletedObjectives(
      moduleId,
      module.objectives.map(o => o.id),
      this.currentMetrics,
      this.runtimeState,
      {
        operationMode: store.operationMode,
        musicPlaying: store.currentShipId
          ? store.musicPlaying.get(store.currentShipId) === true
          : false,
        installedCount,
        installTarget: currentShip?.attachmentPoints.length ?? this.currentMetrics.installationsTarget,
      },
    )
  }

  private getInstallTargetForModule(module: TrainingModule): number {
    if (module.id === 'light-show') return 6 // cruise attachment points
    if (module.id === 'multi-crane') return 2
    if (module.id === 'wind-sway') return 4
    if (module.id === 'precision') return 3
  if (module.id === 'night-ops') return 3
    return module.objectives.filter(o => o.id.includes('install')).length || 3
  }

  subscribeRuntime(listener: (runtime: TrainingRuntimeState) => void): () => void {
    this.runtimeListeners.add(listener)
    return () => this.runtimeListeners.delete(listener)
  }

  private notifyRuntimeListeners(): void {
    const snapshot = this.getRuntimeState()
    this.runtimeListeners.forEach(listener => listener(snapshot))
  }

  getCurrentMetrics(): TrainingMetrics {
    return { ...this.currentMetrics }
  }

  // Listeners
  subscribe(listener: (progress: TrainingProgress) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.progress))
  }

  // Persistence
  serialize(): string {
    return JSON.stringify(this.progress)
  }

  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data)
      this.progress = { ...DEFAULT_TRAINING_PROGRESS, ...parsed }
      this.notifyListeners()
    } catch (e) {
      console.error('[Training] Failed to deserialize progress:', e)
    }
  }

  reset(): void {
    this.progress = { ...DEFAULT_TRAINING_PROGRESS }
    this.currentMetrics = {
      timeElapsed: 0,
      maxSway: 0,
      totalDamage: 0,
      accuracyScore: 100,
      installationsCompleted: 0,
      installationsTarget: 0
    }
    this.stopMetricsTracking()
    this.notifyListeners()
  }

  // Debug / Testing
  unlockAll(): void {
    TRAINING_MODULES.forEach(module => {
      this.progress.moduleStates[module.id] = 'available'
    })
    this.notifyListeners()
  }

  completeAll(): void {
    TRAINING_MODULES.forEach(module => {
      this.progress.moduleStates[module.id] = 'completed'
      if (!this.progress.results.some(r => r.moduleId === module.id)) {
        this.progress.results.push({
          moduleId: module.id,
          rank: 'S',
          score: 2500,
          metrics: {
            timeElapsed: 300,
            maxSway: 0.1,
            totalDamage: 0,
            accuracyScore: 95,
            installationsCompleted: 5,
            installationsTarget: 5
          },
          completedAt: Date.now(),
          attempts: 1
        })
      }
    })
    this.notifyListeners()
  }
}

// =============================================================================
// TRAINING SCENARIO SETUP
// =============================================================================

/**
 * Spawns ships and configures environment for a training module.
 * Called from the game store when a module starts.
 */
export function setupTrainingScenario(moduleId: TrainingModuleId): void {
  const module = TRAINING_MODULES.find(m => m.id === moduleId)
  if (!module) return

  const store = useGameStore.getState()

  // Clear existing fleet for a clean training scenario
  ;[...store.ships].forEach(ship => store.removeShip(ship.id))

  trainingSystem.resetRuntimeState()

  switch (moduleId) {
  case 'multi-crane': {
    // Pin adjacent berths under Crane A (origin) and Crane B (x≈30)
    const primary = ShipSpawner.spawnShip('cruise', { position: [-5, 0, 2] })
    const secondary = ShipSpawner.spawnShip('container', { position: [30, 0, 2] })
    store.setCurrentShip(primary.id)
    trainingSystem.setTrainingShipIds(primary.id, secondary.id)
    break
  }
  case 'ice-escort': {
    startIceEscort({ seed: 204 })
    break
  }
  case 'emergency': {
    const ship = ShipSpawner.spawnShip('container')
    store.setCurrentShip(ship.id)
    stormSystem.start(180)
    store.setWeather('storm')
    break
  }
  case 'light-show': {
    const ship = ShipSpawner.spawnShip('cruise')
    store.setCurrentShip(ship.id)
    break
  }
  default: {
    const ship = ShipSpawner.spawnShip(module.shipType)
    store.setCurrentShip(ship.id)
    break
  }
  }

  console.log(`[Training] Scenario ready for ${module.title}`)
}

// Export singleton
export const trainingSystem = new TrainingSystem()

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react'

export function useTrainingSystem() {
  const [progress, setProgress] = useState<TrainingProgress>(trainingSystem.getProgress())

  useEffect(() => {
    return trainingSystem.subscribe(setProgress)
  }, [])

  return {
    progress,
    startModule: trainingSystem.startModule.bind(trainingSystem),
    exitModule: trainingSystem.exitModule.bind(trainingSystem),
    completeModule: trainingSystem.completeModule.bind(trainingSystem),
    nextStep: trainingSystem.nextStep.bind(trainingSystem),
    previousStep: trainingSystem.previousStep.bind(trainingSystem),
    getCurrentStep: trainingSystem.getCurrentStep.bind(trainingSystem),
    isModuleAvailable: trainingSystem.isModuleAvailable.bind(trainingSystem),
    isModuleCompleted: trainingSystem.isModuleCompleted.bind(trainingSystem),
    getBestResult: trainingSystem.getBestResult.bind(trainingSystem),
    getCurrentMetrics: trainingSystem.getCurrentMetrics.bind(trainingSystem),
    unlockAll: trainingSystem.unlockAll.bind(trainingSystem),
    completeAll: trainingSystem.completeAll.bind(trainingSystem),
    reset: trainingSystem.reset.bind(trainingSystem),
    recordSway: trainingSystem.recordSway.bind(trainingSystem),
    recordDamage: trainingSystem.recordDamage.bind(trainingSystem),
    recordInstallation: trainingSystem.recordInstallation.bind(trainingSystem),
    recordEmergencyStop: trainingSystem.recordEmergencyStop.bind(trainingSystem),
    recordLoadSecured: trainingSystem.recordLoadSecured.bind(trainingSystem),
    recordCraneBCoordinated: trainingSystem.recordCraneBCoordinated.bind(trainingSystem),
    recordOperationModeSwitch: trainingSystem.recordOperationModeSwitch.bind(trainingSystem),
    recordSyncTestPassed: trainingSystem.recordSyncTestPassed.bind(trainingSystem),
    getRuntimeState: trainingSystem.getRuntimeState.bind(trainingSystem),
    getCompletedObjectiveIds: trainingSystem.getCompletedObjectiveIds.bind(trainingSystem),
  }
}
