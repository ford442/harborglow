// =============================================================================
// SEA EVENTS SYSTEM - HarborGlow
// Scientifically-accurate ocean phenomena simulation
//
// Events:
// 1. Milky Seas - Bioluminescent bacteria (Vibrio harveyi) quorum sensing
// 2. Whale Migration - Seasonal humpback whale movements
// 3. Shark Patrol - Great white shark coastal hunting patterns
// 4. Meteor Shower - Celestial events affecting night visibility
// 5. Bioluminescent Bloom - Dinoflagellate flashing displays
//
// Scientific References:
// - Milky seas caused by Vibrio harveyi bacteria via quorum sensing
//   (Miller et al. 2005, Hudson et al. 2025)
// - Can span 100,000+ km², visible from space
// - Linked to Indian Ocean Dipole and ENSO climate patterns
// =============================================================================

import { useGameStore, SeaEvent, SeaEventType, Ship } from '../store/useGameStore'

// Scientific event specifications
interface EventSpec {
    name: string
    description: string
    minDuration: number      // seconds
    maxDuration: number      // seconds
    minIntensity: number     // 0-1
    maxIntensity: number     // 0-1
    seasonality?: number[]   // Months when event is most likely (1-12)
    timeOfDay?: 'day' | 'night' | 'any'
    affectedRadius: number   // meters
    scientificCause: string
}

const EVENT_SPECS: Record<SeaEventType, EventSpec> = {
    none: {
        name: 'None',
        description: 'No special event',
        minDuration: 0,
        maxDuration: 0,
        minIntensity: 0,
        maxIntensity: 0,
        affectedRadius: 0,
        scientificCause: 'N/A'
    },
    
    milky_seas: {
        name: 'Milky Seas',
        description: 'Massive bioluminescent glow from bacterial quorum sensing',
        minDuration: 600,      // 10 minutes minimum
        maxDuration: 3600,     // Up to 1 hour
        minIntensity: 0.3,
        maxIntensity: 1.0,
        seasonality: [6, 7, 8, 9, 10, 11], // Summer/fall peak
        timeOfDay: 'night',
        affectedRadius: 500,
        scientificCause: 'Vibrio harveyi bacteria reaching quorum sensing threshold (10^8 cells/ml)'
    },
    
    whale_migration: {
        name: 'Humpback Whale Migration',
        description: 'Seasonal north-south migration of Megaptera novaeangliae',
        minDuration: 900,      // 15 minutes
        maxDuration: 1800,     // 30 minutes
        minIntensity: 0.5,
        maxIntensity: 1.0,
        seasonality: [1, 2, 3, 10, 11, 12], // Winter months
        timeOfDay: 'any',
        affectedRadius: 300,
        scientificCause: 'Megaptera novaeangliae traveling between feeding (polar) and breeding (tropical) grounds'
    },
    
    shark_patrol: {
        name: 'Great White Shark Patrol',
        description: 'Coastal hunting patterns of Carcharodon carcharias',
        minDuration: 300,      // 5 minutes
        maxDuration: 900,      // 15 minutes
        minIntensity: 0.4,
        maxIntensity: 0.9,
        seasonality: [5, 6, 7, 8, 9], // Summer months
        timeOfDay: 'any',
        affectedRadius: 200,
        scientificCause: 'Carcharodon carcharias utilizing coastal upwelling zones for hunting pinnipeds'
    },
    
    meteor_shower: {
        name: 'Meteor Shower',
        description: 'Celestial debris entering atmosphere',
        minDuration: 600,      // 10 minutes
        maxDuration: 1200,     // 20 minutes
        minIntensity: 0.3,
        maxIntensity: 1.0,
        timeOfDay: 'night',
        affectedRadius: 1000,  // Visible across entire scene
        scientificCause: 'Earth passing through comet debris trail'
    },
    
    bioluminescent_bloom: {
        name: 'Bioluminescent Plankton Bloom',
        description: 'Dinoflagellate flashing display when disturbed',
        minDuration: 300,      // 5 minutes
        maxDuration: 600,      // 10 minutes
        minIntensity: 0.4,
        maxIntensity: 1.0,
        seasonality: [5, 6, 7, 8], // Summer
        timeOfDay: 'night',
        affectedRadius: 150,
        scientificCause: 'Lingulodinium polyedrum mechanical stimulation causing scintillon-mediated flash'
    }
}

// Event state machine
interface EventState {
    update: (event: SeaEvent, delta: number, ships: Ship[]) => Partial<SeaEvent> | null
    onStart?: (event: SeaEvent) => void
    onEnd?: (event: SeaEvent) => void
}

class SeaEventsSystem {
    private eventTimer: number = 0
    private readonly CHECK_INTERVAL = 60 // Check for new events every minute
    private states: Record<SeaEventType, EventState> = {}
    private currentEvent: SeaEvent | null = null
    
    constructor() {
        this.initializeStates()
    }
    
    private initializeStates() {
        // Milky seas - steady bacterial glow
        this.states.milky_seas = {
            update: (event, delta, ships) => {
                // Intensity varies slightly over time
                const variation = Math.sin(Date.now() / 10000) * 0.1
                return { intensity: Math.max(0, Math.min(1, event.intensity + variation)) }
            },
            onStart: (event) => {
                console.log(`🌊 MILKY SEAS EVENT STARTED`)
                console.log(`   Cause: ${EVENT_SPECS.milky_seas.scientificCause}`)
                console.log(`   Area: ${event.affectedArea.radius}m radius`)
            },
            onEnd: (event) => {
                console.log(`🌊 Milky seas dissipated (bacterial population below quorum threshold)`)
            }
        }
        
        // Whale migration - directional movement
        this.states.whale_migration = {
            update: (event, delta, ships) => {
                // Migration progresses across the scene
                const progress = (Date.now() - event.startTime) / 1000 / event.duration
                
                // Spawn additional whales during migration
                if (Math.random() < 0.01) {
                    // This would trigger wildlife system to spawn whales
                    const { wildlifeSystem } = require('./wildlifeSystem')
                    wildlifeSystem.spawnWildlife('humpback_whale')
                }
                
                return { intensity: Math.sin(progress * Math.PI) } // Peak in middle
            },
            onStart: (event) => {
                console.log(`🐋 WHALE MIGRATION EVENT STARTED`)
                console.log(`   Species: Megaptera novaeangliae`)
                console.log(`   Distance: Up to 25,000 km annually`)
            }
        }
        
        // Shark patrol - coastal grid pattern
        this.states.shark_patrol = {
            update: (event, delta, ships) => {
                // Sharks more aggressive/active during patrol
                const { wildlifeSystem } = require('./wildlifeSystem')
                
                // Random shark spawns near ships
                if (Math.random() < 0.02) {
                    wildlifeSystem.spawnWildlife('great_white_shark')
                }
                
                return null
            },
            onStart: (event) => {
                console.log(`🦈 SHARK PATROL EVENT STARTED`)
                console.log(`   Species: Carcharodon carcharias`)
                console.log(`   Behavior: Coastal hunting pattern`)
            }
        }
        
        // Meteor shower - falling stars
        this.states.meteor_shower = {
            update: (event, delta, ships) => {
                // No state changes, just visual effect handled in renderer
                return null
            },
            onStart: (event) => {
                console.log(`☄️ METEOR SHOWER EVENT STARTED`)
                console.log(`   Cause: Earth passing through comet debris`)
                console.log(`   Best viewing: Away from harbor lights`)
            }
        }
        
        // Bioluminescent bloom - flashing response
        this.states.bioluminescent_bloom = {
            update: (event, delta, ships) => {
                // Spawn plankton entities
                const { wildlifeSystem } = require('./wildlifeSystem')
                
                if (Math.random() < 0.05) {
                    wildlifeSystem.spawnWildlife('bioluminescent_plankton')
                }
                
                return null
            },
            onStart: (event) => {
                console.log(`✨ BIOLUMINESCENT BLOOM STARTED`)
                console.log(`   Species: Lingulodinium polyedrum (dinoflagellates)`)
                console.log(`   Mechanism: Scintillon-mediated flash response`)
            }
        }
    }
    
    // Start a new event
    startEvent(type: SeaEventType): SeaEvent | null {
        if (type === 'none') return null
        
        const spec = EVENT_SPECS[type]
        const duration = spec.minDuration + Math.random() * (spec.maxDuration - spec.minDuration)
        const intensity = spec.minIntensity + Math.random() * (spec.maxIntensity - spec.minIntensity)
        
        const event: SeaEvent = {
            id: `event-${type}-${Date.now()}`,
            type,
            startTime: Date.now(),
            duration,
            intensity,
            affectedArea: {
                center: [0, 0, 0],
                radius: spec.affectedRadius
            }
        }
        
        this.currentEvent = event
        useGameStore.getState().setActiveSeaEvent(event)
        
        // Trigger onStart callback
        const state = this.states[type]
        if (state?.onStart) {
            state.onStart(event)
        }
        
        return event
    }
    
    // End current event
    endEvent() {
        if (!this.currentEvent) return
        
        const state = this.states[this.currentEvent.type]
        if (state?.onEnd) {
            state.onEnd(this.currentEvent)
        }
        
        this.currentEvent = null
        useGameStore.getState().setActiveSeaEvent(null)
    }
    
    // Main update loop
    update(delta: number) {
        const state = useGameStore.getState()
        const { timeOfDay, ships } = state
        const currentEvent = state.activeSeaEvent
        
        // Update existing event
        if (currentEvent) {
            const elapsed = (Date.now() - currentEvent.startTime) / 1000
            
            // Check if event should end
            if (elapsed >= currentEvent.duration) {
                this.endEvent()
            } else {
                // Update event state
                const eventState = this.states[currentEvent.type]
                if (eventState) {
                    const updates = eventState.update(currentEvent, delta, ships)
                    if (updates) {
                        useGameStore.getState().setActiveSeaEvent({
                            ...currentEvent,
                            ...updates
                        })
                    }
                }
            }
        }
        
        // Check for new events
        this.eventTimer += delta
        if (this.eventTimer >= this.CHECK_INTERVAL) {
            this.eventTimer = 0
            this.attemptStartEvent(timeOfDay)
        }
    }
    
    private attemptStartEvent(timeOfDay: number) {
        // Don't start if event already active
        if (this.currentEvent) return
        
        const isNight = timeOfDay < 6 || timeOfDay > 18
        const month = new Date().getMonth() + 1
        
        // Calculate probabilities for each event type
        const candidates: { type: SeaEventType; weight: number }[] = []
        
        for (const [type, spec] of Object.entries(EVENT_SPECS)) {
            if (type === 'none') continue
            
            // Check time of day requirement
            if (spec.timeOfDay === 'night' && !isNight) continue
            if (spec.timeOfDay === 'day' && isNight) continue
            
            // Check seasonality
            let weight = 0.1 // Base chance
            if (spec.seasonality?.includes(month)) {
                weight = 0.3 // Boost during peak season
            }
            
            candidates.push({ type: type as SeaEventType, weight })
        }
        
        // Weighted random selection
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
        let random = Math.random() * totalWeight
        
        for (const candidate of candidates) {
            random -= candidate.weight
            if (random <= 0) {
                this.startEvent(candidate.type)
                break
            }
        }
    }
    
    // Force start an event (for debugging/manual control)
    forceEvent(type: SeaEventType) {
        this.endEvent()
        return this.startEvent(type)
    }
    
    // Get current event info
    getCurrentEvent(): SeaEvent | null {
        return this.currentEvent
    }
    
    // Get event specifications
    getSpec(type: SeaEventType): EventSpec {
        return EVENT_SPECS[type]
    }
    
    // Get event progress (0-1)
    getEventProgress(): number {
        if (!this.currentEvent) return 0
        const elapsed = (Date.now() - this.currentEvent.startTime) / 1000
        return Math.min(1, elapsed / this.currentEvent.duration)
    }
    
    // Get remaining time
    getRemainingTime(): number {
        if (!this.currentEvent) return 0
        const elapsed = (Date.now() - this.currentEvent.startTime) / 1000
        return Math.max(0, this.currentEvent.duration - elapsed)
    }
}

export const seaEventsSystem = new SeaEventsSystem()
export { EVENT_SPECS }
