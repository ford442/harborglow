// =============================================================================
// TRAINING SYSTEM - HarborGlow Crane Operator Training Simulations
// Professional training mode with progressive skill development
// =============================================================================

import { useGameStore, ShipType, WeatherState } from '../store/useGameStore'
import { reputationSystem } from './reputationSystem'

// =============================================================================
// TRAINING MODULE TYPES
// =============================================================================

export type TrainingModuleId = 
  | 'basic-hooks'      // Module 1: Basic Hook Control
  | 'precision'        // Module 2: Precision Placement
  | 'wind-sway'        // Module 3: Wind & Sway Management
  | 'night-ops'        // Module 4: Night Operations
  | 'multi-crane'      // Module 5: Multi-Crane Coordination (planned)
  | 'emergency'        // Module 6: Emergency Response (planned)
  | 'light-show'       // Module 7: Advanced Light Show Install (planned)

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
// TRAINING MODULE DEFINITIONS
// =============================================================================

export const TRAINING_MODULES: TrainingModule[] = [
  // ============================================================================
  // MODULE 1: Basic Hook Control
  // ============================================================================
  {
    id: 'basic-hooks',
    title: 'Basic Hook Control',
    description: 'Master the fundamentals of crane operation in clear weather. Learn to move, lower, and stabilize the spreader.',
    difficulty: 1,
    estimatedTime: 5,
    shipType: 'container',
    weather: 'clear',
    timeOfDay: 12,
    prerequisites: [],
    objectives: [
      { id: 'move-to-target', title: 'Navigate to Target', description: 'Move the spreader to the designated practice zone' },
      { id: 'lower-securely', title: 'Controlled Lowering', description: 'Lower the spreader smoothly to 2m above deck' },
      { id: 'hold-position', title: 'Hold Position', description: 'Maintain position for 5 seconds with <10% sway' },
      { id: 'return-home', title: 'Return Home', description: 'Return spreader to starting position' }
    ],
    rewards: {
      reputation: 50,
      unlocks: ['precision-module', 'basic-crane-skin']
    },
    tutorial: [
      { id: 'welcome', title: 'Welcome', message: 'Welcome to HarborGlow Training. I\'ll be your instructor today.', voiceLine: 'training_welcome' },
      { id: 'controls-move', title: 'Movement', message: 'Use WASD or the joystick to move the spreader horizontally.', position: 'bottom', waitForAction: true, actionType: 'move' },
      { id: 'controls-lower', title: 'Lowering', message: 'Press Q/E or use the second joystick to raise and lower the spreader.', position: 'bottom', waitForAction: true, actionType: 'lower' },
      { id: 'first-target', title: 'First Target', message: 'Navigate to the green marker on the ship deck.', highlightElement: '.target-marker', waitForAction: true, actionType: 'move' },
      { id: 'sway-intro', title: 'Understanding Sway', message: 'Watch the sway indicator. Movement creates momentum - plan your stops.', position: 'left' },
      { id: 'lower-practice', title: 'Lower Practice', message: 'Lower to 2m above deck. Slow and steady wins.', waitForAction: true, actionType: 'lower' },
      { id: 'hold-steady', title: 'Hold Steady', message: 'Hold position for 5 seconds. Keep sway under control!', waitForAction: true, actionType: 'wait' },
      { id: 'complete', title: 'Module Complete', message: 'Excellent work! You\'re ready for precision training.', voiceLine: 'training_complete_basic' }
    ]
  },

  // ============================================================================
  // MODULE 2: Precision Placement
  // ============================================================================
  {
    id: 'precision',
    title: 'Precision Placement',
    description: 'Install LED light rigs on attachment points with millimeter precision. Master the art of delicate placement.',
    difficulty: 2,
    estimatedTime: 8,
    shipType: 'cruise',
    weather: 'clear',
    timeOfDay: 14,
    prerequisites: ['basic-hooks'],
    objectives: [
      { id: 'install-funnel', title: 'Funnel Installation', description: 'Install RGB matrix on the ship funnel' },
      { id: 'install-bridge', title: 'Bridge Installation', description: 'Install projector on the bridge' },
      { id: 'install-rails', title: 'Rail Installation', description: 'Install LED strips on deck rails' },
      { id: 'zero-damage', title: 'Zero Damage', description: 'Complete without any ship contact damage' }
    ],
    rewards: {
      reputation: 100,
      unlocks: ['wind-sway-module', 'precision-operator-title']
    },
    tutorial: [
      { id: 'intro-precision', title: 'Precision Work', message: 'Light rig installation requires precision. Watch for the magnetic snap zones.', voiceLine: 'training_precision_intro' },
      { id: 'attachment-points', title: 'Attachment Points', message: 'Colored markers indicate rig types. Cyan = RGB, Purple = Projector.', highlightElement: '.attachment-point' },
      { id: 'snap-zones', title: 'Magnetic Snap', message: 'When close to an attachment point, you\'ll feel magnetic assistance.', position: 'right' },
      { id: 'first-install', title: 'First Installation', message: 'Navigate to the funnel. Get within 2m to begin installation.', waitForAction: true, actionType: 'install' },
      { id: 'twistlock', title: 'Twistlock', message: 'The twistlock engages automatically when aligned. Green = locked, Red = open.', highlightElement: '.twistlock-indicator' },
      { id: 'accuracy-matters', title: 'Accuracy Matters', message: 'Sway and misalignment slow installation. Stay steady for best results.', position: 'left' },
      { id: 'complete-all', title: 'Install All', message: 'Install all three light rigs to complete the module.', waitForAction: true, actionType: 'install' }
    ]
  },

  // ============================================================================
  // MODULE 3: Wind & Sway Management
  // ============================================================================
  {
    id: 'wind-sway',
    title: 'Wind & Sway Management',
    description: 'Operate in challenging weather conditions. Learn to anticipate and compensate for wind gusts and load sway.',
    difficulty: 3,
    estimatedTime: 10,
    shipType: 'bulk',
    weather: 'storm',
    timeOfDay: 10,
    prerequisites: ['precision'],
    objectives: [
      { id: 'survive-gusts', title: 'Survive Gusts', description: 'Complete installations during 3 wind gusts' },
      { id: 'sway-control', title: 'Sway Control', description: 'Keep average sway below 30% during operations' },
      { id: 'install-weather', title: 'Weather Installation', description: 'Install 4 light rigs despite the storm' },
      { id: 'no-emergency', title: 'No Emergency Stop', description: 'Complete without using emergency brake' }
    ],
    rewards: {
      reputation: 150,
      unlocks: ['night-ops-module', 'storm-operator-badge']
    },
    tutorial: [
      { id: 'weather-warning', title: 'Weather Alert', message: 'Storm conditions detected. Wind speeds up to 25 m/s expected.', voiceLine: 'training_storm_warning' },
      { id: 'gust-forecast', title: 'Gust Forecast', message: 'Watch the weather panel. Wind arrows indicate gust direction.', position: 'right', highlightElement: '.weather-panel' },
      { id: 'sway-physics', title: 'Sway Physics', message: 'Wind creates pendulum motion. Counter-sway by moving into the wind.', position: 'left' },
      { id: 'timing', title: 'Timing is Everything', message: 'Wait for lulls between gusts. Patience is safer than speed.', waitForAction: true, actionType: 'wait' },
      { id: 'emergency-brake', title: 'Emergency Brake', message: 'Space bar engages emergency brake. Use sparingly - it stresses the cable.', highlightElement: '.emergency-brake' },
      { id: 'stability-bonus', title: 'Stability Bonus', message: 'Low sway = faster installs. The ship crew is watching!', position: 'bottom' }
    ]
  },

  // ============================================================================
  // MODULE 4: Night Operations
  // ============================================================================
  {
    id: 'night-ops',
    title: 'Night Operations',
    description: 'Master crane operation in darkness. Rely on camera feeds, instrument panels, and ship lighting to complete installations.',
    difficulty: 4,
    estimatedTime: 12,
    shipType: 'tanker',
    weather: 'clear',
    timeOfDay: 23,
    prerequisites: ['wind-sway'],
    objectives: [
      { id: 'camera-reliance', title: 'Camera Reliance', description: 'Complete 3 installations using only camera feeds' },
      { id: 'night-lights', title: 'Night Lights', description: 'Install emergency strobes on all designated points' },
      { id: 'no-collisions', title: 'Collision-Free', description: 'Complete without any collisions in low visibility' },
      { id: 'efficiency', title: 'Night Efficiency', description: 'Complete within time limit with >80% accuracy' }
    ],
    rewards: {
      reputation: 200,
      unlocks: ['multi-crane-module', 'night-vision-mode', 'midnight-operator-title']
    },
    tutorial: [
      { id: 'night-intro', title: 'Night Shift', message: 'Welcome to the night shift. Visibility is limited - trust your instruments.', voiceLine: 'training_night_intro' },
      { id: 'cameras', title: 'Camera Feeds', message: 'The multiview cameras are your eyes. Hook cam shows your target zone.', highlightElement: '.camera-feed' },
      { id: 'ship-lights', title: 'Ship Lighting', message: 'Ships glow under their lights. Look for the attachment point beacons.', position: 'center' },
      { id: 'instruments', title: 'Trust Instruments', message: 'When you can\'t see, read the numbers. Height, position, tension - they don\'t lie.', position: 'left', highlightElement: '.status-panel' },
      { id: 'bioluminescence', title: 'Bioluminescence', message: 'On some nights, the water itself glows. A beautiful but distracting phenomenon.', position: 'bottom' },
      { id: 'emergency-lights', title: 'Emergency Strobes', message: 'Install emergency strobes first - they\'ll help light the rest of the ship.', waitForAction: true, actionType: 'install' }
    ]
  },

  // ============================================================================
  // MODULE 5: Multi-Crane Coordination (PLANNED)
  // ============================================================================
  {
    id: 'multi-crane',
    title: 'Multi-Crane Coordination',
    description: 'Coordinate with AI crane operators to install large light shows. Learn communication and timing.',
    difficulty: 4,
    estimatedTime: 15,
    shipType: 'cruise',
    weather: 'clear',
    timeOfDay: 18,
    prerequisites: ['night-ops'],
    objectives: [
      { id: 'coordinate-1', title: 'Coordinate with Crane B', description: 'Sync operations with second crane' },
      { id: 'dual-install', title: 'Dual Installation', description: 'Complete simultaneous installation' },
      { id: 'no-interference', title: 'No Interference', description: 'Avoid crane-to-crane collisions' }
    ],
    rewards: {
      reputation: 250,
      unlocks: ['emergency-module', 'coordinator-badge']
    },
    tutorial: []
  },

  // ============================================================================
  // MODULE 6: Emergency Response (PLANNED)
  // ============================================================================
  {
    id: 'emergency',
    title: 'Emergency Response',
    description: 'Handle crane emergencies: cable failures, power outages, and severe weather events.',
    difficulty: 5,
    estimatedTime: 10,
    shipType: 'container',
    weather: 'storm',
    timeOfDay: 15,
    prerequisites: ['multi-crane'],
    objectives: [
      { id: 'emergency-stop', title: 'Emergency Stop', description: 'Execute emergency procedures' },
      { id: 'secure-load', title: 'Secure Load', description: 'Safely secure suspended load during failure' },
      { id: 'evacuate', title: 'Safe Evacuation', description: 'Complete crew evacuation protocol' }
    ],
    rewards: {
      reputation: 300,
      unlocks: ['light-show-module', 'emergency-responder-title']
    },
    tutorial: []
  },

  // ============================================================================
  // MODULE 7: Advanced Light Show Install (PLANNED)
  // ============================================================================
  {
    id: 'light-show',
    title: 'Advanced Light Show Install',
    description: 'The ultimate test: Install a complete music-synchronized light show on a mega-cruise ship.',
    difficulty: 5,
    estimatedTime: 20,
    shipType: 'cruise',
    weather: 'clear',
    timeOfDay: 20,
    prerequisites: ['emergency'],
    objectives: [
      { id: 'complete-show', title: 'Complete Installation', description: 'Install all 12 light rigs' },
      { id: 'sync-test', title: 'Sync Test', description: 'Verify music synchronization' },
      { id: 's-rank', title: 'S-Rank Performance', description: 'Achieve S-rank on final evaluation' }
    ],
    rewards: {
      reputation: 500,
      unlocks: ['master-operator-title', 'legendary-crane-skin', 'all-weather-unlocked']
    },
    tutorial: []
  }
]

// =============================================================================
// TRAINING STATE MANAGEMENT
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

// =============================================================================
// SCORING SYSTEM
// =============================================================================

export function calculateRank(metrics: TrainingMetrics): TrainingRank {
  const { timeElapsed, maxSway, totalDamage, accuracyScore } = metrics
  
  // S-Rank: Perfect execution
  if (maxSway < 0.15 && totalDamage === 0 && accuracyScore >= 95) return 'S'
  
  // A-Rank: Excellent
  if (maxSway < 0.25 && totalDamage < 10 && accuracyScore >= 85) return 'A'
  
  // B-Rank: Good
  if (maxSway < 0.4 && totalDamage < 30 && accuracyScore >= 70) return 'B'
  
  // C-Rank: Pass
  if (accuracyScore >= 50) return 'C'
  
  // F-Rank: Fail
  return 'F'
}

export function calculateScore(metrics: TrainingMetrics): number {
  const baseScore = 1000
  
  // Time bonus (faster = better, up to 500 pts)
  const timeBonus = Math.max(0, 500 - metrics.timeElapsed * 2)
  
  // Sway penalty (high sway = penalty, up to -300 pts)
  const swayPenalty = metrics.maxSway * 300
  
  // Damage penalty (damage = penalty, up to -400 pts)
  const damagePenalty = metrics.totalDamage * 10
  
  // Accuracy bonus (accuracy % * 5, up to 500 pts)
  const accuracyBonus = metrics.accuracyScore * 5
  
  return Math.max(0, Math.round(baseScore + timeBonus - swayPenalty - damagePenalty + accuracyBonus))
}

export function getRankColor(rank: TrainingRank): string {
  switch (rank) {
    case 'S': return '#ffd700' // Gold
    case 'A': return '#00d4aa' // Teal
    case 'B': return '#4a9eff' // Blue
    case 'C': return '#888888' // Gray
    case 'F': return '#ff4757' // Red
  }
}

export function getRankDescription(rank: TrainingRank): string {
  switch (rank) {
    case 'S': return 'Perfect Execution'
    case 'A': return 'Excellent'
    case 'B': return 'Good'
    case 'C': return 'Pass'
    case 'F': return 'Needs Improvement'
  }
}

// =============================================================================
// VOICE LINES
// =============================================================================

export const TRAINING_VOICE_LINES: Record<string, { text: string; tone: 'neutral' | 'encouraging' | 'urgent' | 'congratulatory' }> = {
  // Module 1: Basic Hooks
  training_welcome: { text: "Welcome to HarborGlow Training. I'll be your instructor today.", tone: 'neutral' },
  training_complete_basic: { text: "Excellent work! You're ready for precision training.", tone: 'congratulatory' },
  
  // Module 2: Precision
  training_precision_intro: { text: "Light rig installation requires precision. Watch for the magnetic snap zones.", tone: 'neutral' },
  training_first_install: { text: "Perfect! Feel that magnetic pull? That's the snap zone assisting you.", tone: 'encouraging' },
  
  // Module 3: Wind & Sway
  training_storm_warning: { text: "Storm conditions detected. Wind speeds up to 25 meters per second expected.", tone: 'urgent' },
  training_gust_approach: { text: "Gust approaching! Hold position and prepare for sway.", tone: 'urgent' },
  training_gust_passed: { text: "Gust has passed. Resume operations when ready.", tone: 'neutral' },
  
  // Module 4: Night Ops
  training_night_intro: { text: "Welcome to the night shift. Visibility is limited - trust your instruments.", tone: 'neutral' },
  training_night_complete: { text: "Outstanding work in challenging conditions. You're a true night operator.", tone: 'congratulatory' },
  
  // General
  training_good_job: { text: "Good job. Keep it steady.", tone: 'encouraging' },
  training_excellent: { text: "Excellent! That's textbook crane operation.", tone: 'congratulatory' },
  training_too_fast: { text: "Slow down. Precision over speed.", tone: 'neutral' },
  training_high_sway: { text: "Watch the sway! Counter-movement needed.", tone: 'urgent' },
  training_install_complete: { text: "Installation confirmed. Moving to next target.", tone: 'neutral' },
  training_module_complete: { text: "Module complete! Check your performance summary.", tone: 'congratulatory' }
}

// =============================================================================
// TRAINING SYSTEM CLASS
// =============================================================================

export class TrainingSystem {
  private progress: TrainingProgress = { ...DEFAULT_TRAINING_PROGRESS }
  private listeners: Set<(progress: TrainingProgress) => void> = new Set()
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
    
    // Reset metrics
    this.currentMetrics = {
      timeElapsed: 0,
      maxSway: 0,
      totalDamage: 0,
      accuracyScore: 100,
      installationsCompleted: 0,
      installationsTarget: module.objectives.filter(o => o.id.includes('install')).length || 3
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

  recordInstallation(): void {
    this.currentMetrics.installationsCompleted++
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
    recordInstallation: trainingSystem.recordInstallation.bind(trainingSystem)
  }
}
