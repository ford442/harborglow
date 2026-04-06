// =============================================================================
// PORT ECONOMY SYSTEM - HarborGlow
// Lightweight economy layer tied to crane + light-upgrade gameplay
// =============================================================================

import { useGameStore, ShipType, WeatherState } from '../store/useGameStore'
import { reputationSystem } from './reputationSystem'
import { playSound } from './soundEffects'

// =============================================================================
// CURRENCY TYPES
// =============================================================================

export interface EconomyState {
  harborCredits: number
  lifetimeCredits: number
  portReputation: number // 0-1000 scale
  shiftPerformance: {
    installations: number
    perfectInstalls: number
    totalEarnings: number
    startTime: number
  }
  unlockedUpgrades: string[]
  activeBoosts: ActiveBoost[]
  dockLevel: number
}

export interface ActiveBoost {
  id: string
  type: BoostType
  multiplier: number
  expiresAt: number
  description: string
}

export type BoostType = 
  | 'speed' 
  | 'precision' 
  | 'sync' 
  | 'event' 
  | 'rare_ships'

export const DEFAULT_ECONOMY_STATE: EconomyState = {
  harborCredits: 0,
  lifetimeCredits: 0,
  portReputation: 0,
  shiftPerformance: {
    installations: 0,
    perfectInstalls: 0,
    totalEarnings: 0,
    startTime: 0
  },
  unlockedUpgrades: [],
  activeBoosts: [],
  dockLevel: 1
}

// =============================================================================
// EARNING CALCULATION
// =============================================================================

export interface InstallationEarnings {
  baseAmount: number
  speedBonus: number
  precisionBonus: number
  syncBonus: number
  weatherBonus: number
  eventBonus: number
  streakBonus: number
  total: number
}

export interface EarningFactors {
  timeSeconds: number
  targetTimeSeconds: number
  swayPercent: number
  syncAccuracy: number // 0-1 music sync
  weather: WeatherState
  isEventActive: boolean
  consecutiveSuccesses: number
  rigType: string
}

// Base earnings by rig type
const RIG_BASE_VALUES: Record<string, number> = {
  basic_led: 50,
  rgb_matrix: 75,
  spotlight: 100,
  laser_array: 150,
  holographic: 200,
  plasma_rig: 300
}

// =============================================================================
// DOCK UPGRADES
// =============================================================================

export interface DockUpgrade {
  id: string
  name: string
  description: string
  cost: number
  maxLevel: number
  effect: UpgradeEffect
  icon: string
}

export interface UpgradeEffect {
  type: 'crane_speed' | 'sway_reduction' | 'unlock_rig' | 'credit_bonus' | 'reputation_bonus' | 'cosmetic'
  value: number
}

export const DOCK_UPGRADES: DockUpgrade[] = [
  {
    id: 'hydraulic_boost',
    name: 'Hydraulic Boost',
    description: 'Increase crane movement speed by 10%',
    cost: 500,
    maxLevel: 5,
    effect: { type: 'crane_speed', value: 0.1 },
    icon: '⚡'
  },
  {
    id: 'stabilizers',
    name: 'Active Stabilizers',
    description: 'Reduce load sway by 15%',
    cost: 750,
    maxLevel: 3,
    effect: { type: 'sway_reduction', value: 0.15 },
    icon: '🎯'
  },
  {
    id: 'business_license',
    name: 'Business License',
    description: 'Earn 20% more credits per installation',
    cost: 1000,
    maxLevel: 3,
    effect: { type: 'credit_bonus', value: 0.2 },
    icon: '💰'
  },
  {
    id: 'port_authority',
    name: 'Port Authority Partnership',
    description: 'Gain reputation 25% faster',
    cost: 1500,
    maxLevel: 2,
    effect: { type: 'reputation_bonus', value: 0.25 },
    icon: '⭐'
  },
  {
    id: 'advanced_rigs',
    name: 'Advanced Rig License',
    description: 'Unlock Laser Array installations',
    cost: 2500,
    maxLevel: 1,
    effect: { type: 'unlock_rig', value: 1 },
    icon: '🔮'
  },
  {
    id: 'led_upgrade',
    name: 'Premium LED Package',
    description: 'Cosmetic: Brighter, more vibrant lights',
    cost: 1000,
    maxLevel: 1,
    effect: { type: 'cosmetic', value: 1 },
    icon: '✨'
  }
]

// =============================================================================
// SPECIALIST HIRES (Temporary Boosts)
// =============================================================================

export interface Specialist {
  id: string
  name: string
  role: string
  description: string
  cost: number
  duration: number // seconds
  boostType: BoostType
  multiplier: number
  icon: string
}

export const SPECIALISTS: Specialist[] = [
  {
    id: 'speed_demon',
    name: 'Jack "Speed" Morrison',
    role: 'Speed Specialist',
    description: '2x speed bonus for 10 minutes',
    cost: 300,
    duration: 600,
    boostType: 'speed',
    multiplier: 2,
    icon: '🏃'
  },
  {
    id: 'precision_pro',
    name: 'Sarah Chen',
    role: 'Precision Expert',
    description: '2x precision bonus, reduced sway for 15 minutes',
    cost: 400,
    duration: 900,
    boostType: 'precision',
    multiplier: 2,
    icon: '🎯'
  },
  {
    id: 'sync_master',
    name: 'DJ Kaito',
    role: 'Music Sync Specialist',
    description: '3x music sync bonus for 10 minutes',
    cost: 350,
    duration: 600,
    boostType: 'sync',
    multiplier: 3,
    icon: '🎵'
  },
  {
    id: 'event_coordinator',
    name: 'Maria Rodriguez',
    role: 'Event Coordinator',
    description: '2x event bonuses for 20 minutes',
    cost: 500,
    duration: 1200,
    boostType: 'event',
    multiplier: 2,
    icon: '🌊'
  },
  {
    id: 'ship_broker',
    name: 'Captain Wei',
    role: 'Rare Ship Broker',
    description: 'Double chance of rare ships for 30 minutes',
    cost: 600,
    duration: 1800,
    boostType: 'rare_ships',
    multiplier: 2,
    icon: '🚢'
  }
]

// =============================================================================
// ECONOMY SYSTEM CLASS
// =============================================================================

export class EconomySystem {
  private state: EconomyState = { ...DEFAULT_ECONOMY_STATE }
  private upgradeLevels: Map<string, number> = new Map()
  private consecutiveSuccesses: number = 0
  private listeners: Set<(state: EconomyState) => void> = new Set()

  constructor() {
    this.startShift()
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  getState(): EconomyState {
    return { ...this.state }
  }

  getCredits(): number {
    return this.state.harborCredits
  }

  getReputation(): number {
    return this.state.portReputation
  }

  getUpgradeLevel(upgradeId: string): number {
    return this.upgradeLevels.get(upgradeId) || 0
  }

  isUpgradeMaxed(upgradeId: string): boolean {
    const upgrade = DOCK_UPGRADES.find(u => u.id === upgradeId)
    if (!upgrade) return true
    return this.getUpgradeLevel(upgradeId) >= upgrade.maxLevel
  }

  canAfford(cost: number): boolean {
    return this.state.harborCredits >= cost
  }

  getActiveBoosts(): ActiveBoost[] {
    const now = Date.now()
    // Clean expired boosts
    this.state.activeBoosts = this.state.activeBoosts.filter(b => b.expiresAt > now)
    return this.state.activeBoosts
  }

  getBoostMultiplier(type: BoostType): number {
    const boosts = this.getActiveBoosts().filter(b => b.type === type)
    return boosts.reduce((mult, b) => mult * b.multiplier, 1)
  }

  // ========================================================================
  // CREDIT EARNINGS
  // ========================================================================

  calculateInstallationEarnings(factors: EarningFactors): InstallationEarnings {
    const baseAmount = RIG_BASE_VALUES[factors.rigType] || 50
    
    // Speed bonus: faster = more credits (max 2x)
    const timeRatio = factors.targetTimeSeconds / factors.timeSeconds
    const speedBonus = Math.min(baseAmount, Math.floor(baseAmount * Math.max(0, timeRatio - 0.5)))
    
    // Precision bonus: low sway = bonus (max 1.5x)
    const precisionMultiplier = factors.swayPercent < 0.1 ? 1.5 : 
                                 factors.swayPercent < 0.3 ? 1.2 : 1
    const precisionBonus = Math.floor(baseAmount * (precisionMultiplier - 1))
    
    // Music sync bonus
    const syncBonus = Math.floor(baseAmount * factors.syncAccuracy * 0.5)
    
    // Weather bonus: challenging weather = more credits
    const weatherMultiplier = factors.weather === 'storm' ? 2 :
                               factors.weather === 'rain' ? 1.3 :
                               factors.weather === 'fog' ? 1.5 : 1
    const weatherBonus = Math.floor(baseAmount * (weatherMultiplier - 1))
    
    // Event bonus
    const eventBonus = factors.isEventActive ? Math.floor(baseAmount * 0.5) : 0
    
    // Streak bonus: consecutive successes
    const streakMultiplier = Math.min(0.5, factors.consecutiveSuccesses * 0.05)
    const streakBonus = Math.floor(baseAmount * streakMultiplier)
    
    // Apply dock upgrade bonus
    const upgradeLevel = this.getUpgradeLevel('business_license')
    const upgradeMultiplier = 1 + (upgradeLevel * 0.2)
    
    // Apply active boost
    const speedBoost = this.getBoostMultiplier('speed')
    const precisionBoost = this.getBoostMultiplier('precision')
    const syncBoost = this.getBoostMultiplier('sync')
    const eventBoost = this.getBoostMultiplier('event')
    
    const total = Math.floor(
      (baseAmount + 
       speedBonus * speedBoost + 
       precisionBonus * precisionBoost + 
       syncBonus * syncBoost + 
       weatherBonus + 
       eventBonus * eventBoost + 
       streakBonus) * upgradeMultiplier
    )

    return {
      baseAmount,
      speedBonus: Math.floor(speedBonus * speedBoost),
      precisionBonus: Math.floor(precisionBonus * precisionBoost),
      syncBonus: Math.floor(syncBonus * syncBoost),
      weatherBonus,
      eventBonus: Math.floor(eventBonus * eventBoost),
      streakBonus,
      total
    }
  }

  recordInstallation(data: {
    rigType: string
    timeSeconds: number
    targetTimeSeconds: number
    swayPercent: number
    syncAccuracy: number
    weather: WeatherState
    isEventActive: boolean
  }): InstallationEarnings {
    const earnings = this.calculateInstallationEarnings({
      ...data,
      consecutiveSuccesses: this.consecutiveSuccesses
    })

    // Award credits
    this.addCredits(earnings.total, 'installation')
    
    // Track shift performance
    this.state.shiftPerformance.installations++
    this.state.shiftPerformance.totalEarnings += earnings.total
    
    if (data.swayPercent < 0.1) {
      this.state.shiftPerformance.perfectInstalls++
      this.consecutiveSuccesses++
    } else {
      this.consecutiveSuccesses = 0
    }

    // Play earning sound
    if (earnings.total > 100) {
      playSound('installComplete')
    }

    this.notifyListeners()
    return earnings
  }

  recordShipCompletion(shipType: ShipType, completionRate: number): void {
    // Big bonus for fully upgrading ships
    const baseBonus = shipType === 'cruise' ? 500 :
                      shipType === 'container' ? 750 :
                      shipType === 'tanker' ? 1000 :
                      shipType === 'lng' ? 1500 : 800
    
    const bonus = Math.floor(baseBonus * completionRate)
    
    if (bonus > 0) {
      this.addCredits(bonus, 'ship_completion')
      this.addReputation(Math.floor(bonus / 10))
    }

    // Reputation gain based on completion rate
    if (completionRate >= 1) {
      this.addReputation(50)
    } else if (completionRate >= 0.8) {
      this.addReputation(25)
    }
  }

  private addCredits(amount: number, source: string): void {
    if (amount <= 0) return
    
    this.state.harborCredits += amount
    this.state.lifetimeCredits += amount
    
    console.log(`💰 +${amount} HC (${source}) - Total: ${this.state.harborCredits}`)
  }

  private addReputation(amount: number): void {
    if (amount <= 0) return
    
    const upgradeLevel = this.getUpgradeLevel('port_authority')
    const multiplier = 1 + (upgradeLevel * 0.25)
    
    this.state.portReputation = Math.min(1000, this.state.portReputation + Math.floor(amount * multiplier))
    
    // Sync with main reputation system
    reputationSystem.addReputation(amount, 'port_economy')
  }

  // ========================================================================
  // SPENDING
  // ========================================================================

  purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = DOCK_UPGRADES.find(u => u.id === upgradeId)
    if (!upgrade) return false
    
    const currentLevel = this.getUpgradeLevel(upgradeId)
    if (currentLevel >= upgrade.maxLevel) return false
    
    // Calculate cost (increases with level)
    const costMultiplier = 1 + (currentLevel * 0.5)
    const cost = Math.floor(upgrade.cost * costMultiplier)
    
    if (!this.canAfford(cost)) return false
    
    // Deduct credits
    this.state.harborCredits -= cost
    
    // Apply upgrade
    this.upgradeLevels.set(upgradeId, currentLevel + 1)
    this.state.unlockedUpgrades.push(upgradeId)
    
    console.log(`🔧 Purchased ${upgrade.name} (Level ${currentLevel + 1}) for ${cost} HC`)
    
    this.notifyListeners()
    return true
  }

  hireSpecialist(specialistId: string): boolean {
    const specialist = SPECIALISTS.find(s => s.id === specialistId)
    if (!specialist) return false
    
    if (!this.canAfford(specialist.cost)) return false
    
    // Deduct credits
    this.state.harborCredits -= specialist.cost
    
    // Add boost
    const boost: ActiveBoost = {
      id: `${specialistId}-${Date.now()}`,
      type: specialist.boostType,
      multiplier: specialist.multiplier,
      expiresAt: Date.now() + (specialist.duration * 1000),
      description: `${specialist.name}: ${specialist.description}`
    }
    
    this.state.activeBoosts.push(boost)
    
    console.log(`👷 Hired ${specialist.name} for ${specialist.cost} HC`)
    
    this.notifyListeners()
    return true
  }

  // ========================================================================
  // SHIFT MANAGEMENT
  // ========================================================================

  startShift(): void {
    this.state.shiftPerformance = {
      installations: 0,
      perfectInstalls: 0,
      totalEarnings: 0,
      startTime: Date.now()
    }
    this.consecutiveSuccesses = 0
  }

  endShift(): { credits: number; reputation: number; bonus: number } {
    const shift = this.state.shiftPerformance
    const duration = (Date.now() - shift.startTime) / 1000 / 60 // minutes
    
    // Calculate shift bonus
    let bonus = 0
    
    // Perfect shift bonus (all installs perfect)
    if (shift.installations > 0 && shift.perfectInstalls === shift.installations) {
      bonus += 500
    }
    
    // High volume bonus
    if (shift.installations >= 10) {
      bonus += 200
    }
    
    // Apply bonus
    if (bonus > 0) {
      this.addCredits(bonus, 'shift_bonus')
    }
    
    // Reputation based on performance
    const repGain = Math.floor(shift.totalEarnings / 100) + Math.floor(shift.perfectInstalls * 5)
    this.addReputation(repGain)
    
    const result = {
      credits: shift.totalEarnings + bonus,
      reputation: repGain,
      bonus
    }
    
    // Start new shift
    this.startShift()
    
    return result
  }

  // ========================================================================
  // UPGRADE EFFECTS
  // ========================================================================

  getCraneSpeedBonus(): number {
    const level = this.getUpgradeLevel('hydraulic_boost')
    return level * 0.1 // 10% per level
  }

  getSwayReduction(): number {
    const level = this.getUpgradeLevel('stabilizers')
    return level * 0.15 // 15% per level
  }

  isRigUnlocked(rigType: string): boolean {
    if (rigType === 'laser_array') {
      return this.getUpgradeLevel('advanced_rigs') > 0
    }
    return true
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  serialize(): string {
    return JSON.stringify({
      state: this.state,
      upgradeLevels: Array.from(this.upgradeLevels.entries())
    })
  }

  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data)
      this.state = { ...DEFAULT_ECONOMY_STATE, ...parsed.state }
      this.upgradeLevels = new Map(parsed.upgradeLevels || [])
      this.notifyListeners()
    } catch (e) {
      console.error('Failed to deserialize economy state:', e)
    }
  }

  reset(): void {
    this.state = { ...DEFAULT_ECONOMY_STATE }
    this.upgradeLevels.clear()
    this.consecutiveSuccesses = 0
    this.startShift()
    this.notifyListeners()
  }

  // ========================================================================
  // LISTENERS
  // ========================================================================

  subscribe(listener: (state: EconomyState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()))
  }

  // ========================================================================
  // DEBUG
  // ========================================================================

  setCredits(amount: number): void {
    this.state.harborCredits = amount
    this.notifyListeners()
  }

  setReputation(amount: number): void {
    this.state.portReputation = Math.min(1000, Math.max(0, amount))
    this.notifyListeners()
  }

  simulateShift(installations: number = 5, perfectRate: number = 0.6): void {
    for (let i = 0; i < installations; i++) {
      const isPerfect = Math.random() < perfectRate
      this.recordInstallation({
        rigType: 'rgb_matrix',
        timeSeconds: isPerfect ? 20 : 35,
        targetTimeSeconds: 30,
        swayPercent: isPerfect ? 0.05 : 0.4,
        syncAccuracy: 0.7,
        weather: 'clear',
        isEventActive: false
      })
    }
    this.endShift()
  }
}

// Export singleton
export const economySystem = new EconomySystem()

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react'

export function useEconomySystem() {
  const [state, setState] = useState<EconomyState>(economySystem.getState())

  useEffect(() => {
    return economySystem.subscribe(setState)
  }, [])

  return {
    state,
    credits: state.harborCredits,
    reputation: state.portReputation,
    canAfford: economySystem.canAfford.bind(economySystem),
    getUpgradeLevel: economySystem.getUpgradeLevel.bind(economySystem),
    purchaseUpgrade: economySystem.purchaseUpgrade.bind(economySystem),
    hireSpecialist: economySystem.hireSpecialist.bind(economySystem),
    getActiveBoosts: economySystem.getActiveBoosts.bind(economySystem),
    getBoostMultiplier: economySystem.getBoostMultiplier.bind(economySystem),
    startShift: economySystem.startShift.bind(economySystem),
    endShift: economySystem.endShift.bind(economySystem),
    calculateEarnings: economySystem.calculateInstallationEarnings.bind(economySystem),
    recordInstallation: economySystem.recordInstallation.bind(economySystem),
    recordShipCompletion: economySystem.recordShipCompletion.bind(economySystem)
  }
}
