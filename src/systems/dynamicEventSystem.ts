// =============================================================================
// DYNAMIC EVENT SYSTEM - HarborGlow
// Lightweight real-time event coordinator that triggers realistic port events
// Integrates with lighting, wildlife, crane sway, and ship arrival patterns
// =============================================================================

import { useGameStore, HarborEvent, WeatherState, ShipType } from '../store/useGameStore'
import { harborEventSystem, HarborEventType } from './eventSystem'
import { weatherSystem } from './weatherSystem'
import { swaySystem } from './swaySystem'
import { wildlifeSystem } from './wildlifeSystem'
import { seaEventsSystem } from './seaEventsSystem'
import { musicSystem } from './musicSystem'
import { lightingSystem } from './lightingSystem'
import { timeSystem } from './timeSystem'
import { moonSystem } from './moonSystem'

// =============================================================================
// DYNAMIC EVENT TYPES
// =============================================================================

export type DynamicEventCategory = 'weather' | 'wildlife' | 'operational' | 'emergency' | 'geopolitical' | 'seasonal'

export interface DynamicEventEffect {
  lighting?: {
    intensity?: number
    colorTemp?: number
    fogDensity?: number
    ambientMultiplier?: number
  }
  weather?: {
    forceWeather?: WeatherState
    windSpeed?: number
    windDirection?: number
  }
  crane?: {
    swayMultiplier?: number
    maxSpeed?: number
    damping?: number
  }
  wildlife?: {
    spawnType?: string
    count?: number
    behavior?: string
  }
  ships?: {
    arrivalModifier?: number
    typeFilter?: ShipType[]
    queueBump?: boolean
  }
  audio?: {
    bpmModifier?: number
    intensity?: number
    alertTone?: boolean
  }
}

export interface DynamicEvent {
  id: string
  type: HarborEventType
  category: DynamicEventCategory
  title: string
  description: string
  duration: number
  remaining: number
  intensity: number
  effects: DynamicEventEffect
  affectedShips?: string[]
  position?: [number, number, number]
  metadata?: Record<string, unknown>
}

// =============================================================================
// EVENT TEMPLATES
// =============================================================================

interface EventTemplate {
  type: HarborEventType
  category: DynamicEventCategory
  title: string
  getDescription: (intensity: number, metadata?: Record<string, unknown>) => string
  baseDuration: number
  durationVariance: number
  probability: number
  cooldown: number
  effects: (intensity: number, metadata?: Record<string, unknown>) => DynamicEventEffect
  conditions?: {
    minHour?: number
    maxHour?: number
    weather?: WeatherState[]
    requiresShip?: boolean
    shipTypes?: ShipType[]
    seasonality?: number[] // months 1-12
    moonPhase?: string[]
  }
}

const EVENT_TEMPLATES: EventTemplate[] = [
  // WEATHER EVENTS
  {
    type: 'atmospheric_river',
    category: 'weather',
    title: 'Atmospheric River (Pineapple Express)',
    getDescription: (i, m) => `Pineapple Express storm from Hawaii - ${m?.windSpeed || 40}mph winds, ${i > 0.7 ? 'heavy' : 'moderate'} rainfall`,
    baseDuration: 480,
    durationVariance: 720,
    probability: 0.08,
    cooldown: 1800,
    effects: (i) => ({
      lighting: { fogDensity: 0.05 + i * 0.05, ambientMultiplier: 0.4 + (1 - i) * 0.3 },
      weather: { forceWeather: 'storm', windSpeed: 30 + i * 50 },
      crane: { swayMultiplier: 1 + i * 2, maxSpeed: 1 - i * 0.4 },
      ships: { arrivalModifier: 0.1 + (1 - i) * 0.3 }
    }),
    conditions: { seasonality: [11, 12, 1, 2, 3, 4] }
  },
  {
    type: 'whale_migration',
    category: 'wildlife',
    title: 'Gray Whale Migration',
    getDescription: () => 'Gray whales migrating south to Baja breeding grounds',
    baseDuration: 900,
    durationVariance: 600,
    probability: 0.06,
    cooldown: 2400,
    effects: (i) => ({
      wildlife: { spawnType: 'humpback_whale', count: 1 + Math.floor(i * 3), behavior: 'migrating' },
      audio: { bpmModifier: 0.95, intensity: 0.6 }
    }),
    conditions: { seasonality: [12, 1, 2, 3, 4, 5], minHour: 6, maxHour: 20 }
  },
  {
    type: 'shark_patrol',
    category: 'wildlife',
    title: 'Great White Shark Patrol',
    getDescription: () => 'Great white shark hunting near harbor entrance',
    baseDuration: 300,
    durationVariance: 300,
    probability: 0.04,
    cooldown: 3600,
    effects: (i) => ({
      wildlife: { spawnType: 'great_white_shark', count: 1, behavior: 'hunting' },
      ships: { arrivalModifier: 0.9 }
    }),
    conditions: { seasonality: [6, 7, 8, 9, 10] }
  },
  {
    type: 'plankton_bloom',
    category: 'wildlife',
    title: 'Bioluminescent Plankton Bloom',
    getDescription: () => 'Red tide dinoflagellates creating blue sparkles in water',
    baseDuration: 600,
    durationVariance: 600,
    probability: 0.1,
    cooldown: 1200,
    effects: (i) => ({
      lighting: { ambientMultiplier: 1 + i * 0.5 },
      wildlife: { spawnType: 'bioluminescent_plankton', count: 100 + Math.floor(i * 200) }
    }),
    conditions: { seasonality: [6, 7, 8, 9], maxHour: 6, moonPhase: ['new_moon', 'waning_crescent', 'waxing_crescent'] }
  },
  {
    type: 'ship_fire',
    category: 'emergency',
    title: 'Vessel Fire Emergency',
    getDescription: (i, m) => `${m?.deck === 'engine' ? 'Engine room' : 'Cargo deck'} fire on vessel - ${i > 0.8 ? 'MAYDAY' : 'PAN-PAN'}`,
    baseDuration: 300,
    durationVariance: 240,
    probability: 0.015,
    cooldown: 3600,
    effects: (i) => ({
      lighting: { intensity: 1 + i * 2, colorTemp: 2000, ambientMultiplier: 1.2 },
      crane: { swayMultiplier: 1.2, maxSpeed: 0.5 },
      ships: { arrivalModifier: 0.3, queueBump: true },
      audio: { bpmModifier: 1.3, alertTone: true, intensity: 0.9 }
    }),
    conditions: { requiresShip: true, shipTypes: ['container', 'tanker', 'cruise'] }
  },
  {
    type: 'navy_fleet_week',
    category: 'operational',
    title: 'Fleet Week Naval Visit',
    getDescription: (i, m) => `USS ${m?.vesselType || 'Vessel'} visiting for Fleet Week festivities`,
    baseDuration: 1200,
    durationVariance: 600,
    probability: 0.05,
    cooldown: 7200,
    effects: (i) => ({
      ships: { arrivalModifier: 0.7, typeFilter: ['cruise', 'container'] },
      audio: { bpmModifier: 1.1, intensity: 0.7 }
    }),
    conditions: { seasonality: [5, 10] }
  },
  {
    type: 'cruise_arrival',
    category: 'operational',
    title: 'Cruise Ship Arrival',
    getDescription: (i, m) => `${m?.passengers || 3000} passengers arriving Pier ${m?.pier || '27'}`,
    baseDuration: 240,
    durationVariance: 120,
    probability: 0.12,
    cooldown: 600,
    effects: (i) => ({
      lighting: { intensity: 1.1 },
      ships: { arrivalModifier: 0.8 },
      audio: { intensity: 0.6 }
    }),
    conditions: { minHour: 6, maxHour: 18 }
  },
  {
    type: 'sea_lion_haulout',
    category: 'wildlife',
    title: 'Sea Lion Haulout',
    getDescription: (i, m) => `${m?.count || 30} California sea lions on breakwater - ${m?.vocalizing ? 'vocalizing' : 'resting'}`,
    baseDuration: 900,
    durationVariance: 900,
    probability: 0.2,
    cooldown: 300,
    effects: () => ({
      audio: { intensity: 0.5 }
    })
  },
  {
    type: 'suspicious_vessel',
    category: 'emergency',
    title: 'Suspicious Vessel Alert',
    getDescription: () => 'Small craft exhibiting erratic behavior - Coast Guard notified',
    baseDuration: 180,
    durationVariance: 300,
    probability: 0.03,
    cooldown: 2400,
    effects: (i) => ({
      lighting: { intensity: 1.3 },
      ships: { arrivalModifier: 0.6 },
      audio: { alertTone: true, intensity: 0.7 }
    }),
    conditions: { maxHour: 6 }
  },
  {
    type: 'dolphin_pod',
    category: 'wildlife',
    title: 'Dolphin Pod',
    getDescription: () => 'Bottlenose dolphins bow-riding incoming vessels',
    baseDuration: 300,
    durationVariance: 300,
    probability: 0.15,
    cooldown: 600,
    effects: (i) => ({
      wildlife: { spawnType: 'bottlenose_dolphin', count: 3 + Math.floor(i * 8), behavior: 'playing' },
      audio: { bpmModifier: 1.05, intensity: 0.6 }
    })
  }
]

// =============================================================================
// DYNAMIC EVENT SYSTEM CLASS
// =============================================================================

export class DynamicEventSystem {
  private activeEvents: Map<string, DynamicEvent> = new Map()
  private cooldowns: Map<HarborEventType, number> = new Map()
  private lastUpdate: number = Date.now()
  private eventHistory: Array<{ type: HarborEventType; time: number; intensity: number }> = []
  private maxHistorySize: number = 50
  
  // Effect application tracking
  private appliedEffects: Map<string, DynamicEventEffect> = new Map()
  private baseValues: Map<string, number> = new Map()

  constructor() {
    this.initBaseValues()
  }

  private initBaseValues() {
    this.baseValues.set('lightingIntensity', 1.0)
    this.baseValues.set('fogDensity', 0.02)
    this.baseValues.set('ambientMultiplier', 1.0)
    this.baseValues.set('craneSwayMult', 1.0)
    this.baseValues.set('craneMaxSpeed', 1.0)
    this.baseValues.set('shipArrivalMult', 1.0)
    this.baseValues.set('musicBPM', 128)
  }

  // ========================================================================
  // MAIN UPDATE LOOP
  // ========================================================================

  update(delta: number) {
    const now = Date.now()
    const store = useGameStore.getState()
    
    // Update cooldowns
    this.cooldowns.forEach((time, type) => {
      if (time > 0) {
        this.cooldowns.set(type, Math.max(0, time - delta))
      }
    })

    // Check for event triggers
    this.checkEventTriggers(delta, store)

    // Update active events
    this.activeEvents.forEach((event, id) => {
      event.remaining -= delta
      
      // Apply/update effects
      this.applyEventEffects(event)
      
      // End expired events
      if (event.remaining <= 0) {
        this.endEvent(id)
      }
    })

    // Recalculate combined effects
    this.recalculateEffects()

    this.lastUpdate = now
  }

  private checkEventTriggers(delta: number, store: ReturnType<typeof useGameStore.getState>) {
    const hour = store.gameTime?.hour ?? timeSystem.getGameHour() % 24
    const month = new Date().getMonth() + 1
    const moonPhase = moonSystem.getPhase()

    EVENT_TEMPLATES.forEach(template => {
      // Check cooldown
      if ((this.cooldowns.get(template.type) || 0) > 0) return
      
      // Check conditions
      if (!this.checkConditions(template, hour, month, moonPhase, store)) return

      // Roll for event
      if (Math.random() < template.probability * delta) {
        this.triggerEvent(template)
      }
    })
  }

  private checkConditions(
    template: EventTemplate,
    hour: number,
    month: number,
    moonPhase: string,
    store: ReturnType<typeof useGameStore.getState>
  ): boolean {
    const conditions = template.conditions
    if (!conditions) return true

    if (conditions.minHour !== undefined && hour < conditions.minHour) return false
    if (conditions.maxHour !== undefined && hour > conditions.maxHour) return false
    if (conditions.seasonality && !conditions.seasonality.includes(month)) return false
    if (conditions.moonPhase && !conditions.moonPhase.includes(moonPhase)) return false
    if (conditions.weather && !conditions.weather.includes(store.weather)) return false
    if (conditions.requiresShip && store.ships.length === 0) return false

    return true
  }

  // ========================================================================
  // EVENT TRIGGERING
  // ========================================================================

  triggerEvent(template: EventTemplate, forceIntensity?: number): DynamicEvent | null {
    const intensity = forceIntensity ?? 0.3 + Math.random() * 0.7
    const duration = template.baseDuration + Math.random() * template.durationVariance
    
    const event: DynamicEvent = {
      id: `${template.type}-${Date.now()}`,
      type: template.type,
      category: template.category,
      title: template.title,
      description: template.getDescription(intensity),
      duration,
      remaining: duration,
      intensity,
      effects: template.effects(intensity)
    }

    // Apply immediate effects
    this.applyEventEffects(event)
    
    // Store event
    this.activeEvents.set(event.id, event)
    this.appliedEffects.set(event.id, event.effects)
    
    // Set cooldown
    this.cooldowns.set(template.type, template.cooldown)
    
    // Add to history
    this.eventHistory.push({ type: template.type, time: Date.now(), intensity })
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }

    // Trigger through harbor event system for consistency
    this.syncWithHarborEventSystem(event)

    console.log(`🌊 Dynamic Event: ${event.title} (${(duration / 60).toFixed(1)}min, ${(intensity * 100).toFixed(0)}% intensity)`)
    
    return event
  }

  forceEvent(type: HarborEventType, intensity?: number): DynamicEvent | null {
    const template = EVENT_TEMPLATES.find(t => t.type === type)
    if (!template) return null
    
    // Clear cooldown
    this.cooldowns.set(type, 0)
    
    return this.triggerEvent(template, intensity)
  }

  private syncWithHarborEventSystem(event: DynamicEvent) {
    // Delegate to existing harbor event system for wildlife spawning, etc.
    switch (event.type) {
      case 'whale_migration':
        harborEventSystem.forceEvent('whale_migration')
        break
      case 'shark_patrol':
        harborEventSystem.forceEvent('shark_patrol')
        break
      case 'dolphin_pod':
        harborEventSystem.forceEvent('dolphin_pod')
        break
      case 'sea_lion_haulout':
        harborEventSystem.forceEvent('sea_lion_haulout')
        break
      case 'plankton_bloom':
        harborEventSystem.forceEvent('plankton_bloom')
        break
      case 'ship_fire':
        harborEventSystem.forceEvent('ship_fire')
        break
      case 'atmospheric_river':
        harborEventSystem.forceEvent('atmospheric_river')
        break
      case 'navy_fleet_week':
        harborEventSystem.forceEvent('navy_fleet_week')
        break
      case 'cruise_arrival':
        harborEventSystem.forceEvent('cruise_arrival')
        break
      case 'suspicious_vessel':
        harborEventSystem.forceEvent('suspicious_vessel')
        break
    }
  }

  // ========================================================================
  // EFFECT APPLICATION
  // ========================================================================

  private applyEventEffects(event: DynamicEvent) {
    const effects = event.effects
    const intensity = event.intensity

    // Apply weather effects
    if (effects.weather?.forceWeather) {
      weatherSystem.forceWeather(effects.weather.forceWeather)
      useGameStore.getState().setWeather(effects.weather.forceWeather)
    }

    if (effects.weather?.windSpeed) {
      // Wind effects applied through weather system
      swaySystem.setDebugGustMultiplier(effects.weather.windSpeed / 25)
    }

    // Apply audio effects
    if (effects.audio) {
      if (effects.audio.bpmModifier) {
        const baseBPM = this.baseValues.get('musicBPM') || 128
        musicSystem.setBPM(baseBPM * effects.audio.bpmModifier)
      }
      if (effects.audio.alertTone) {
        // Trigger alert through music system if available
      }
    }
  }

  private recalculateEffects() {
    // Reset to base values
    const combinedLighting = { intensity: 1, fogDensity: 0.02, ambientMultiplier: 1 }
    const combinedCrane = { swayMultiplier: 1, maxSpeed: 1 }
    const combinedShips = { arrivalModifier: 1 }

    // Combine all active event effects
    this.activeEvents.forEach(event => {
      const e = event.effects
      const fade = event.remaining / event.duration // Fade out near end

      if (e.lighting) {
        combinedLighting.intensity *= 1 + ((e.lighting.intensity || 1) - 1) * fade
        combinedLighting.fogDensity *= 1 + ((e.lighting.fogDensity || 0.02) - 0.02) * fade
        combinedLighting.ambientMultiplier *= 1 + ((e.lighting.ambientMultiplier || 1) - 1) * fade
      }

      if (e.crane) {
        combinedCrane.swayMultiplier *= 1 + ((e.crane.swayMultiplier || 1) - 1) * fade
        combinedCrane.maxSpeed *= e.crane.maxSpeed || 1
      }

      if (e.ships?.arrivalModifier) {
        combinedShips.arrivalModifier *= e.ships.arrivalModifier
      }
    })

    // Apply to systems
    this.applyLightingEffects(combinedLighting)
    this.applyCraneEffects(combinedCrane)
    
    // Store for external access
    useGameStore.setState({
      weatherIntensity: combinedLighting.fogDensity * 50
    })
  }

  private applyLightingEffects(effects: { intensity: number; fogDensity: number; ambientMultiplier: number }) {
    // Apply through lighting system if available
    if (lightingSystem) {
      // lightingSystem.setAmbientMultiplier(effects.ambientMultiplier)
    }
  }

  private applyCraneEffects(effects: { swayMultiplier: number; maxSpeed: number }) {
    // Apply through sway system
    swaySystem.setDebugDampingMultiplier(1 / effects.swayMultiplier)
  }

  private endEvent(id: string) {
    const event = this.activeEvents.get(id)
    if (!event) return

    // Revert weather if needed
    if (event.effects.weather?.forceWeather) {
      weatherSystem.clearOverride()
      useGameStore.getState().setWeather('clear')
    }

    // Revert audio
    if (event.effects.audio?.bpmModifier) {
      const baseBPM = this.baseValues.get('musicBPM') || 128
      musicSystem.setBPM(baseBPM)
    }

    console.log(`✅ Event ended: ${event.title}`)
    
    this.activeEvents.delete(id)
    this.appliedEffects.delete(id)
  }

  // ========================================================================
  // GETTERS & QUERIES
  // ========================================================================

  getActiveEvents(): DynamicEvent[] {
    return Array.from(this.activeEvents.values())
  }

  getEventsByCategory(category: DynamicEventCategory): DynamicEvent[] {
    return this.getActiveEvents().filter(e => e.category === category)
  }

  getCurrentEffects(): DynamicEventEffect {
    const combined: DynamicEventEffect = {}
    
    this.activeEvents.forEach(event => {
      const fade = event.remaining / event.duration
      
      if (event.effects.lighting) {
        combined.lighting = {
          ...combined.lighting,
          ...event.effects.lighting
        }
      }
      if (event.effects.crane) {
        combined.crane = {
          ...combined.crane,
          ...event.effects.crane
        }
      }
      if (event.effects.ships) {
        combined.ships = {
          ...combined.ships,
          ...event.effects.ships
        }
      }
    })

    return combined
  }

  getArrivalModifier(shipType: ShipType): number {
    let modifier = 1.0
    
    this.activeEvents.forEach(event => {
      if (event.effects.ships?.arrivalModifier) {
        // Check type filter
        const filter = event.effects.ships.typeFilter
        if (!filter || filter.includes(shipType)) {
          modifier *= event.effects.ships.arrivalModifier
        }
      }
    })

    return modifier
  }

  getCraneSwayMultiplier(): number {
    let mult = 1.0
    
    this.activeEvents.forEach(event => {
      if (event.effects.crane?.swayMultiplier) {
        mult *= event.remaining / event.duration * (event.effects.crane.swayMultiplier - 1) + 1
      }
    })

    return mult
  }

  getEventHistory(): Array<{ type: HarborEventType; time: number; intensity: number }> {
    return [...this.eventHistory]
  }

  // ========================================================================
  // DEBUG & CONTROL
  // ========================================================================

  clearAllEvents() {
    this.activeEvents.forEach((_, id) => this.endEvent(id))
    this.activeEvents.clear()
    this.cooldowns.clear()
    console.log('🧹 All dynamic events cleared')
  }

  setCooldown(type: HarborEventType, seconds: number) {
    this.cooldowns.set(type, seconds)
  }

  getCooldown(type: HarborEventType): number {
    return this.cooldowns.get(type) || 0
  }

  enableEventType(type: HarborEventType, enabled: boolean) {
    const template = EVENT_TEMPLATES.find(t => t.type === type)
    if (template) {
      template.probability = enabled ? 0.05 : 0
    }
  }
}

// Export singleton
export const dynamicEventSystem = new DynamicEventSystem()

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react'

export function useDynamicEventSystem() {
  const [events, setEvents] = useState<DynamicEvent[]>([])
  const [effects, setEffects] = useState<DynamicEventEffect>({})

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(dynamicEventSystem.getActiveEvents())
      setEffects(dynamicEventSystem.getCurrentEffects())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    events,
    effects,
    forceEvent: dynamicEventSystem.forceEvent.bind(dynamicEventSystem),
    clearAllEvents: dynamicEventSystem.clearAllEvents.bind(dynamicEventSystem),
    getArrivalModifier: dynamicEventSystem.getArrivalModifier.bind(dynamicEventSystem),
    getCraneSwayMultiplier: dynamicEventSystem.getCraneSwayMultiplier.bind(dynamicEventSystem)
  }
}

export function useEventArrivalModifier(shipType: ShipType) {
  const [modifier, setModifier] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setModifier(dynamicEventSystem.getArrivalModifier(shipType))
    }, 2000)

    return () => clearInterval(interval)
  }, [shipType])

  return modifier
}

export function useEventCraneEffects() {
  const [swayMult, setSwayMult] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setSwayMult(dynamicEventSystem.getCraneSwayMultiplier())
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return { swayMultiplier: swayMult }
}
