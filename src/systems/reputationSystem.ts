// =============================================================================
// REPUTATION / PORT AUTHORITY RATING SYSTEM - HarborGlow
// Simple progression system unlocking ships, light rigs, and training modules
// =============================================================================

import { useGameStore, ShipType } from '../store/useGameStore'
import { TrainingModuleId } from './trainingSystem'

// =============================================================================
// REPUTATION TIERS
// =============================================================================

export type ReputationTier = 
  | 'novice'      // 0-499
  | 'apprentice'  // 500-1499
  | 'operator'    // 1500-2999
  | 'veteran'     // 3000-4999
  | 'expert'      // 5000-7499
  | 'master'      // 7500-9999
  | 'legendary'   // 10000+

export interface ReputationTierConfig {
  name: string
  minRep: number
  color: string
  badge: string
  description: string
}

export const REPUTATION_TIERS: Record<ReputationTier, ReputationTierConfig> = {
  novice: {
    name: 'Novice Operator',
    minRep: 0,
    color: '#888888',
    badge: '🌱',
    description: 'New to the harbor - learning the basics'
  },
  apprentice: {
    name: 'Apprentice',
    minRep: 500,
    color: '#4a9eff',
    badge: '🔧',
    description: 'Building skills and proving reliability'
  },
  operator: {
    name: 'Port Operator',
    minRep: 1500,
    color: '#00d4aa',
    badge: '⚓',
    description: 'Trusted crane operator - handling regular traffic'
  },
  veteran: {
    name: 'Veteran Operator',
    minRep: 3000,
    color: '#ff9500',
    badge: '🏗️',
    description: 'Experienced professional - mentor to newcomers'
  },
  expert: {
    name: 'Expert Operator',
    minRep: 5000,
    color: '#ff4757',
    badge: '⭐',
    description: 'Elite crane operator - specialized vessel certified'
  },
  master: {
    name: 'Master Operator',
    minRep: 7500,
    color: '#a855f7',
    badge: '🏆',
    description: 'Harbor master - few can match your skill'
  },
  legendary: {
    name: 'Legendary Operator',
    minRep: 10000,
    color: '#ffd700',
    badge: '👑',
    description: 'Port legend - your name is spoken with reverence'
  }
}

// =============================================================================
// UNLOCKABLE CONTENT
// =============================================================================

export type UnlockableType = 'ship' | 'lightRig' | 'training' | 'harbor' | 'cosmetic'

export interface Unlockable {
  id: string
  type: UnlockableType
  name: string
  description: string
  reputationRequired: number
  icon: string
  unlocked: boolean
}

// Ships unlocked by reputation
export const UNLOCKABLE_SHIPS: Unlockable[] = [
  { id: 'cruise', type: 'ship', name: 'Cruise Liner', description: 'Standard passenger vessel', reputationRequired: 0, icon: '🚢', unlocked: true },
  { id: 'container', type: 'ship', name: 'Container Ship', description: 'Standard cargo vessel', reputationRequired: 0, icon: '📦', unlocked: true },
  { id: 'tanker', type: 'ship', name: 'Oil Tanker', description: 'Petroleum transport - requires precision', reputationRequired: 500, icon: '🛢️', unlocked: false },
  { id: 'bulk', type: 'ship', name: 'Bulk Carrier', description: 'Raw materials transport', reputationRequired: 800, icon: '🌾', unlocked: false },
  { id: 'roro', type: 'ship', name: 'RORO Vessel', description: 'Vehicle transport - roll-on/roll-off', reputationRequired: 1200, icon: '🚗', unlocked: false },
  { id: 'lng', type: 'ship', name: 'LNG Carrier', description: 'Liquid natural gas - high value cargo', reputationRequired: 2000, icon: '❄️', unlocked: false },
  { id: 'research', type: 'ship', name: 'Research Vessel', description: 'Scientific expedition ship', reputationRequired: 3500, icon: '🔬', unlocked: false },
  { id: 'droneship', type: 'ship', name: 'Autonomous Ship', description: 'Experimental unmanned vessel', reputationRequired: 5000, icon: '🤖', unlocked: false }
]

// Light rig types unlocked by reputation
export const UNLOCKABLE_LIGHT_RIGS: Unlockable[] = [
  { id: 'basic_led', type: 'lightRig', name: 'Basic LED Strips', description: 'Standard deck lighting', reputationRequired: 0, icon: '💡', unlocked: true },
  { id: 'rgb_matrix', type: 'lightRig', name: 'RGB Matrix', description: 'Color-changing light panels', reputationRequired: 300, icon: '🎨', unlocked: false },
  { id: 'spotlight', type: 'lightRig', name: 'Marine Spotlights', description: 'High-intensity beam lights', reputationRequired: 600, icon: '🔦', unlocked: false },
  { id: 'laser_array', type: 'lightRig', name: 'Laser Array', description: 'Precision laser light show', reputationRequired: 1500, icon: '✨', unlocked: false },
  { id: 'holographic', type: 'lightRig', name: 'Holographic Projectors', description: '3D light projections', reputationRequired: 3000, icon: '🔮', unlocked: false },
  { id: 'plasma_rig', type: 'lightRig', name: 'Plasma Light Rig', description: 'Experimental plasma lighting', reputationRequired: 6000, icon: '⚡', unlocked: false }
]

// Training modules unlocked by reputation (supplementing the training system)
export const UNLOCKABLE_TRAINING: Unlockable[] = [
  { id: 'basic-hooks', type: 'training', name: 'Basic Hook Control', description: 'Fundamentals certification', reputationRequired: 0, icon: '🎓', unlocked: true },
  { id: 'precision', type: 'training', name: 'Precision Placement', description: 'Advanced installation techniques', reputationRequired: 0, icon: '🎯', unlocked: false },
  { id: 'wind-sway', type: 'training', name: 'Wind & Sway', description: 'Weather operations certification', reputationRequired: 800, icon: '💨', unlocked: false },
  { id: 'night-ops', type: 'training', name: 'Night Operations', description: 'Low visibility operations', reputationRequired: 1200, icon: '🌙', unlocked: false },
  { id: 'emergency', type: 'training', name: 'Emergency Response', description: 'Crisis management certification', reputationRequired: 2500, icon: '🚨', unlocked: false },
  { id: 'multi-crane', type: 'training', name: 'Multi-Crane Coordination', description: 'Advanced coordination', reputationRequired: 4000, icon: '🏗️', unlocked: false }
]

// Harbor themes unlocked by reputation
export const UNLOCKABLE_HARBORS: Unlockable[] = [
  { id: 'longbeach', type: 'harbor', name: 'Port of Long Beach', description: 'California mega-port - home base', reputationRequired: 0, icon: '🌴', unlocked: true },
  { id: 'singapore', type: 'harbor', name: 'Port of Singapore', description: 'Busiest transshipment hub', reputationRequired: 2000, icon: '🏙️', unlocked: false },
  { id: 'rotterdam', type: 'harbor', name: 'Port of Rotterdam', description: 'Europe\'s largest seaport', reputationRequired: 3500, icon: '🏛️', unlocked: false },
  { id: 'yokohama', type: 'harbor', name: 'Yokohama Port', description: 'Japan\'s gateway port', reputationRequired: 5000, icon: '⛩️', unlocked: false },
  { id: 'dubai', type: 'harbor', name: 'Jebel Ali Port', description: 'Middle East mega-hub', reputationRequired: 7500, icon: '🏜️', unlocked: false }
]

// =============================================================================
// REPUTATION GAIN SOURCES
// =============================================================================

export interface ReputationSource {
  action: string
  baseAmount: number
  multiplierFactors: string[]
  description: string
}

export const REPUTATION_SOURCES: ReputationSource[] = [
  {
    action: 'installation_complete',
    baseAmount: 25,
    multiplierFactors: ['speed', 'accuracy', 'sway'],
    description: 'Complete light rig installation'
  },
  {
    action: 'fast_installation',
    baseAmount: 15,
    multiplierFactors: ['time_bonus'],
    description: 'Complete under target time'
  },
  {
    action: 'perfect_installation',
    baseAmount: 30,
    multiplierFactors: ['zero_sway', 'zero_damage'],
    description: 'Perfect installation - no sway, no damage'
  },
  {
    action: 'ship_departure_complete',
    baseAmount: 50,
    multiplierFactors: ['completion_rate'],
    description: 'Ship departs with all upgrades'
  },
  {
    action: 'event_handled',
    baseAmount: 40,
    multiplierFactors: ['event_difficulty'],
    description: 'Successfully handle dynamic event'
  },
  {
    action: 'emergency_resolved',
    baseAmount: 75,
    multiplierFactors: ['response_time'],
    description: 'Resolve emergency (fire, etc.)'
  },
  {
    action: 'training_complete',
    baseAmount: 100,
    multiplierFactors: ['rank'],
    description: 'Complete training module'
  },
  {
    action: 'whale_observation',
    baseAmount: 10,
    multiplierFactors: ['photo_quality'],
    description: 'Observe wildlife without disturbance'
  },
  {
    action: 'night_operation',
    baseAmount: 20,
    multiplierFactors: ['safety'],
    description: 'Complete night-time installation'
  },
  {
    action: 'streak_bonus',
    baseAmount: 5,
    multiplierFactors: ['consecutive_successes'],
    description: 'Consecutive successful operations'
  }
]

// =============================================================================
// REPUTATION SYSTEM CLASS
// =============================================================================

export interface ReputationState {
  totalReputation: number
  lifetimeReputation: number
  tier: ReputationTier
  unlocks: {
    ships: string[]
    lightRigs: string[]
    training: string[]
    harbors: string[]
  }
  recentGains: Array<{ source: string; amount: number; time: number }>
  stats: {
    totalInstallations: number
    perfectInstallations: number
    shipsServed: number
    eventsHandled: number
    trainingCompleted: number
  }
}

export const DEFAULT_REPUTATION_STATE: ReputationState = {
  totalReputation: 0,
  lifetimeReputation: 0,
  tier: 'novice',
  unlocks: {
    ships: ['cruise', 'container'],
    lightRigs: ['basic_led'],
    training: ['basic-hooks'],
    harbors: ['longbeach']
  },
  recentGains: [],
  stats: {
    totalInstallations: 0,
    perfectInstallations: 0,
    shipsServed: 0,
    eventsHandled: 0,
    trainingCompleted: 0
  }
}

export class ReputationSystem {
  private state: ReputationState = { ...DEFAULT_REPUTATION_STATE }
  private listeners: Set<(state: ReputationState) => void> = new Set()
  private consecutiveSuccesses: number = 0

  // ========================================================================
  // GETTERS
  // ========================================================================

  getState(): ReputationState {
    return { ...this.state }
  }

  getTier(): ReputationTier {
    return this.state.tier
  }

  getTierConfig(): ReputationTierConfig {
    return REPUTATION_TIERS[this.state.tier]
  }

  getProgressToNextTier(): { current: number; required: number; progress: number } {
    const tiers = Object.entries(REPUTATION_TIERS) as [ReputationTier, ReputationTierConfig][]
    const currentIndex = tiers.findIndex(([t]) => t === this.state.tier)
    
    if (currentIndex === tiers.length - 1) {
      return { current: this.state.totalReputation, required: this.state.totalReputation, progress: 100 }
    }

    const nextTier = tiers[currentIndex + 1][1]
    const currentTier = tiers[currentIndex][1]
    const range = nextTier.minRep - currentTier.minRep
    const progress = Math.min(100, Math.max(0, (this.state.totalReputation - currentTier.minRep) / range * 100))

    return {
      current: this.state.totalReputation,
      required: nextTier.minRep,
      progress
    }
  }

  isUnlocked(type: UnlockableType, id: string): boolean {
    return this.state.unlocks[this.getUnlockKey(type)].includes(id)
  }

  private getUnlockKey(type: UnlockableType): keyof ReputationState['unlocks'] {
    switch (type) {
      case 'ship': return 'ships'
      case 'lightRig': return 'lightRigs'
      case 'training': return 'training'
      case 'harbor': return 'harbors'
      default: return 'ships'
    }
  }

  // ========================================================================
  // REPUTATION GAIN
  // ========================================================================

  addReputation(amount: number, source: string, metadata?: Record<string, number>): void {
    if (amount <= 0) return

    // Calculate multipliers
    let finalAmount = amount
    
    // Tier bonus - higher tiers get slight bonus
    const tierBonus = this.getTierBonus()
    finalAmount *= tierBonus

    // Consecutive success bonus
    if (source.includes('installation') || source.includes('complete')) {
      finalAmount *= (1 + this.consecutiveSuccesses * 0.05)
    }

    // Round to whole number
    finalAmount = Math.round(finalAmount)

    // Apply
    this.state.totalReputation += finalAmount
    this.state.lifetimeReputation += finalAmount
    
    // Track recent gain
    this.state.recentGains.unshift({ source, amount: finalAmount, time: Date.now() })
    if (this.state.recentGains.length > 20) {
      this.state.recentGains.pop()
    }

    // Check tier upgrade
    this.checkTierUpgrade()

    // Check unlocks
    this.checkUnlocks()

    // Notify
    this.notifyListeners()

    // Sync with game store
    useGameStore.getState().addReputation(finalAmount)

    console.log(`⭐ Reputation +${finalAmount} (${source}) - Total: ${this.state.totalReputation}`)
  }

  private getTierBonus(): number {
    switch (this.state.tier) {
      case 'novice': return 1.0
      case 'apprentice': return 1.05
      case 'operator': return 1.1
      case 'veteran': return 1.15
      case 'expert': return 1.2
      case 'master': return 1.25
      case 'legendary': return 1.3
    }
  }

  recordInstallation(data: { 
    success: boolean
    timeSeconds: number
    swayPercent: number
    damage: number
    targetTime?: number
  }): void {
    if (!data.success) {
      this.consecutiveSuccesses = 0
      return
    }

    this.consecutiveSuccesses++
    this.state.stats.totalInstallations++

    // Base completion
    let repGain = 25

    // Speed bonus
    if (data.targetTime && data.timeSeconds < data.targetTime) {
      const speedBonus = Math.floor((data.targetTime - data.timeSeconds) / 10)
      repGain += Math.min(15, speedBonus)
    }

    // Perfect installation bonus
    if (data.swayPercent < 0.1 && data.damage === 0) {
      repGain += 30
      this.state.stats.perfectInstallations++
    }

    // Sway penalty (small)
    if (data.swayPercent > 0.5) {
      repGain -= 5
    }

    this.addReputation(repGain, 'installation_complete', {
      time: data.timeSeconds,
      sway: data.swayPercent,
      damage: data.damage
    })
  }

  recordShipDeparture(shipId: string, completionRate: number): void {
    this.state.stats.shipsServed++
    
    let repGain = Math.floor(50 * completionRate)
    
    // Bonus for 100% completion
    if (completionRate >= 1.0) {
      repGain += 25
    }

    this.addReputation(repGain, 'ship_departure_complete', { completionRate })
  }

  recordEventHandled(eventType: string, difficulty: number): void {
    this.state.stats.eventsHandled++
    
    const repGain = Math.floor(40 * difficulty)
    this.addReputation(repGain, 'event_handled', { difficulty })
  }

  recordEmergencyResolved(responseTimeSeconds: number): void {
    let repGain = 75
    
    // Bonus for fast response
    if (responseTimeSeconds < 60) repGain += 25
    else if (responseTimeSeconds < 120) repGain += 10

    this.addReputation(repGain, 'emergency_resolved', { responseTime: responseTimeSeconds })
  }

  recordTrainingComplete(rank: 'S' | 'A' | 'B' | 'C' | 'F'): void {
    this.state.stats.trainingCompleted++
    
    const rankMultiplier = { S: 1.5, A: 1.2, B: 1.0, C: 0.8, F: 0.5 }
    const repGain = Math.floor(100 * rankMultiplier[rank])
    
    this.addReputation(repGain, 'training_complete', { rank: rankMultiplier[rank] })
  }

  // ========================================================================
  // TIER & UNLOCK MANAGEMENT
  // ========================================================================

  private checkTierUpgrade(): void {
    const tiers = Object.entries(REPUTATION_TIERS) as [ReputationTier, ReputationTierConfig][]
    
    for (let i = tiers.length - 1; i >= 0; i--) {
      const [tier, config] = tiers[i]
      if (this.state.totalReputation >= config.minRep) {
        if (this.state.tier !== tier) {
          const oldTier = this.state.tier
          this.state.tier = tier
          console.log(`🎉 TIER UPGRADE: ${REPUTATION_TIERS[oldTier].name} → ${config.name}!`)
        }
        break
      }
    }
  }

  private checkUnlocks(): void {
    // Check ships
    UNLOCKABLE_SHIPS.forEach(ship => {
      if (!this.isUnlocked('ship', ship.id) && this.state.totalReputation >= ship.reputationRequired) {
        this.state.unlocks.ships.push(ship.id)
        console.log(`🔓 UNLOCKED: ${ship.name}`)
      }
    })

    // Check light rigs
    UNLOCKABLE_LIGHT_RIGS.forEach(rig => {
      if (!this.isUnlocked('lightRig', rig.id) && this.state.totalReputation >= rig.reputationRequired) {
        this.state.unlocks.lightRigs.push(rig.id)
        console.log(`🔓 UNLOCKED: ${rig.name}`)
      }
    })

    // Check training
    UNLOCKABLE_TRAINING.forEach(module => {
      if (!this.isUnlocked('training', module.id) && this.state.totalReputation >= module.reputationRequired) {
        this.state.unlocks.training.push(module.id)
        console.log(`🔓 UNLOCKED: ${module.name}`)
      }
    })

    // Check harbors
    UNLOCKABLE_HARBORS.forEach(harbor => {
      if (!this.isUnlocked('harbor', harbor.id) && this.state.totalReputation >= harbor.reputationRequired) {
        this.state.unlocks.harbors.push(harbor.id)
        console.log(`🔓 UNLOCKED: ${harbor.name}`)
      }
    })
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  serialize(): string {
    return JSON.stringify(this.state)
  }

  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data)
      this.state = { ...DEFAULT_REPUTATION_STATE, ...parsed }
      this.checkTierUpgrade()
      this.notifyListeners()
    } catch (e) {
      console.error('Failed to deserialize reputation state:', e)
    }
  }

  reset(): void {
    this.state = { ...DEFAULT_REPUTATION_STATE }
    this.consecutiveSuccesses = 0
    this.notifyListeners()
  }

  // ========================================================================
  // LISTENERS
  // ========================================================================

  subscribe(listener: (state: ReputationState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()))
  }

  // ========================================================================
  // DEBUG
  // ========================================================================

  forceTier(tier: ReputationTier): void {
    this.state.tier = tier
    this.state.totalReputation = REPUTATION_TIERS[tier].minRep
    this.checkUnlocks()
    this.notifyListeners()
  }

  addDebugReputation(amount: number): void {
    this.state.totalReputation += amount
    this.state.lifetimeReputation += amount
    this.checkTierUpgrade()
    this.checkUnlocks()
    this.notifyListeners()
  }
}

// Export singleton
export const reputationSystem = new ReputationSystem()

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react'

export function useReputationSystem() {
  const [state, setState] = useState<ReputationState>(reputationSystem.getState())

  useEffect(() => {
    return reputationSystem.subscribe(setState)
  }, [])

  return {
    state,
    tier: state.tier,
    tierConfig: reputationSystem.getTierConfig(),
    progress: reputationSystem.getProgressToNextTier(),
    isUnlocked: reputationSystem.isUnlocked.bind(reputationSystem),
    addReputation: reputationSystem.addReputation.bind(reputationSystem),
    recordInstallation: reputationSystem.recordInstallation.bind(reputationSystem),
    recordShipDeparture: reputationSystem.recordShipDeparture.bind(reputationSystem),
    recordEventHandled: reputationSystem.recordEventHandled.bind(reputationSystem),
    recordTrainingComplete: reputationSystem.recordTrainingComplete.bind(reputationSystem)
  }
}

export function useUnlocks(type: UnlockableType) {
  const [unlocks, setUnlocks] = useState<string[]>([])

  useEffect(() => {
    const update = () => {
      setUnlocks(reputationSystem.getState().unlocks[reputationSystem['getUnlockKey'](type)])
    }
    update()
    return reputationSystem.subscribe(update)
  }, [type])

  return unlocks
}
