// =============================================================================
// WILDLIFE SYSTEM - HarborGlow
// Scientifically-accurate marine wildlife simulation
// 
// References:
// - Humpback whales (Megaptera novaeangliae): 12-16m length, breaching behavior
// - Great white sharks (Carcharodon carcharias): 15-20ft, coastal patrol patterns  
// - Bottlenose dolphins (Tursiops truncatus): 10-14ft, bow-riding behavior
// - Bioluminescent plankton: Dinoflagellates, flash when disturbed
// =============================================================================

import { useGameStore, WildlifeEntity, WildlifeType, Ship } from '../store/useGameStore'
// Three.js types used for position calculations

// Scientific constants based on real marine biology data
const WILDLIFE_SPECS: Record<WildlifeType, {
    length: number           // meters
    maxSpeed: number        // m/s
    diveDepth: number       // meters
    socialBehavior: 'solitary' | 'pod' | 'school'
    typicalGroupSize: number
    activityPattern: 'diurnal' | 'nocturnal' | 'crepuscular'
    surfaceTime: number     // seconds
    breathHold: number      // seconds
}> = {
    humpback_whale: {
        // Megaptera novaeangliae
        // Length: 12-16m, Weight: 25-30 tonnes
        // Migration: up to 25,000 km annually
        // Breaching: spectacular aerial behavior
        length: 14,
        maxSpeed: 7.5,           // 27 km/h burst speed
        diveDepth: 200,          // Typical feeding dives
        socialBehavior: 'solitary',
        typicalGroupSize: 1,
        activityPattern: 'diurnal',
        surfaceTime: 4,          // 3-5 minutes
        breathHold: 45           // Up to 45 minutes possible
    },
    great_white_shark: {
        // Carcharodon carcharias
        // Length: 4.5-6m (females larger)
        // Depth range: surface to 1,200m
        length: 5,
        maxSpeed: 11,            // 40 km/h burst
        diveDepth: 300,          // Regular dives
        socialBehavior: 'solitary',
        typicalGroupSize: 1,
        activityPattern: 'crepuscular',
        surfaceTime: 30,         // Must keep moving
        breathHold: 60           // Ram ventilation
    },
    bottlenose_dolphin: {
        // Tursiops truncatus
        // Length: 2.5-4m
        // Pod sizes: 2-30 individuals
        // Bow-riding: energy-efficient travel
        length: 3,
        maxSpeed: 11,            // 40 km/h sustained
        diveDepth: 300,          // Can dive deeper
        socialBehavior: 'pod',
        typicalGroupSize: 12,
        activityPattern: 'diurnal',
        surfaceTime: 10,
        breathHold: 7            // Typically surface every 1-2 min
    },
    bioluminescent_plankton: {
        // Dinoflagellates (Lingulodinium polyedrum)
        // Individual: 0.02-0.5mm
        // Bloom densities: millions per liter
        // Flash response to mechanical disturbance
        length: 0.001,
        maxSpeed: 0.01,          // Passive drift
        diveDepth: 10,           // Surface waters
        socialBehavior: 'school',
        typicalGroupSize: 1000000,
        activityPattern: 'nocturnal',
        surfaceTime: 3600,       // Continuous
        breathHold: Infinity
    }
}

// Behavior state machine for each wildlife type
interface BehaviorState {
    update: (entity: WildlifeEntity, delta: number, ships: Ship[]) => Partial<WildlifeEntity>
    onEnter?: (entity: WildlifeEntity) => void
}

class WildlifeSystem {
    private spawnTimer: number = 0
    private readonly SPAWN_INTERVAL = 30 // seconds
    private behaviors: Record<string, BehaviorState> = {}
    
    constructor() {
        this.initializeBehaviors()
    }
    
    private initializeBehaviors() {
        // Humpback whale behavior - breaching and diving
        this.behaviors.humpback_whale = {
            update: (entity) => {
                const time = Date.now() / 1000
                const specs = WILDLIFE_SPECS.humpback_whale
                
                // Breaching behavior - jump out of water
                if (entity.behaviorState === 'breaching') {
                    const breachProgress = (time - entity.createdAt) % 8
                    if (breachProgress < 2) {
                        // Rising
                        return { 
                            position: [
                                entity.position[0],
                                Math.sin(breachProgress * Math.PI / 2) * specs.length * 0.6,
                                entity.position[2]
                            ] as [number, number, number]
                        }
                    } else if (breachProgress < 4) {
                        // Falling
                        return { 
                            position: [
                                entity.position[0],
                                Math.max(-2, specs.length * 0.6 - (breachProgress - 2) * 3),
                                entity.position[2]
                            ] as [number, number, number],
                            behaviorState: breachProgress > 3.5 ? 'idle' as const : 'breaching'
                        }
                    }
                }
                
                // Random breaching (10% chance per check)
                if (Math.random() < 0.001 && entity.position[1] <= 0) {
                    return { behaviorState: 'breaching' }
                }
                
                // Normal swimming - slow cruise
                const swimRadius = 100
                const swimSpeed = 0.02
                const angle = time * swimSpeed + entity.createdAt
                return {
                    position: [
                        Math.cos(angle) * swimRadius,
                        -1,  // Just below surface
                        Math.sin(angle) * swimRadius
                    ] as [number, number, number]
                }
            }
        }
        
        // Great white shark behavior - patrol pattern
        this.behaviors.great_white_shark = {
            update: (entity) => {
                const time = Date.now() / 1000
                const specs = WILDLIFE_SPECS.great_white_shark
                
                // Shark patrol pattern - coastal grid search
                const patrolSpeed = 0.03
                const x = Math.sin(time * patrolSpeed) * 80
                const z = Math.cos(time * patrolSpeed * 0.7) * 60
                
                // Occasional deep dive
                const depth = entity.behaviorState === 'hunting' 
                    ? -specs.diveDepth * 0.3
                    : -2 - Math.sin(time * 0.5) * 3
                
                return {
                    position: [x, depth, z] as [number, number, number],
                    velocity: [
                        Math.cos(time * patrolSpeed) * specs.maxSpeed * 0.1,
                        0,
                        -Math.sin(time * patrolSpeed * 0.7) * specs.maxSpeed * 0.1
                    ] as [number, number, number]
                }
            }
        }
        
        // Bottlenose dolphin behavior - bow riding and pod swimming
        this.behaviors.bottlenose_dolphin = {
            update: (entity, _delta, ships) => {
                const time = Date.now() / 1000
                const specs = WILDLIFE_SPECS.bottlenose_dolphin
                
                // Find nearest ship for bow-riding
                let targetShip = ships.find(s => s.id === entity.targetShipId)
                
                if (!targetShip && ships.length > 0) {
                    // Find closest ship
                    let minDist = Infinity
                    for (const ship of ships) {
                        const dist = Math.sqrt(
                            Math.pow(ship.position[0] - entity.position[0], 2) +
                            Math.pow(ship.position[2] - entity.position[2], 2)
                        )
                        if (dist < minDist && dist < 50) {
                            minDist = dist
                            targetShip = ship
                        }
                    }
                    
                    if (targetShip) {
                        return { targetShipId: targetShip.id, behaviorState: 'playing' }
                    }
                }
                
                if (targetShip) {
                    // Bow-riding position - pressure wave surfing
                    const bowOffset = 15
                    const lateralOffset = 5 + Math.sin(time * 2) * 3
                    
                    return {
                        position: [
                            targetShip.position[0] + bowOffset,
                            0.5,  // Riding the pressure wave
                            targetShip.position[2] + lateralOffset
                        ] as [number, number, number],
                        velocity: [specs.maxSpeed * 0.3, 0, 0]
                    }
                }
                
                // Pod swimming - synchronized movement
                const podAngle = time * 0.05 + entity.createdAt
                return {
                    position: [
                        Math.cos(podAngle) * 60 + Math.sin(time * 3) * 5,
                        -0.5 + Math.sin(time * 4) * 0.3,  // Porpoising
                        Math.sin(podAngle) * 60 + Math.cos(time * 2.5) * 5
                    ] as [number, number, number],
                    behaviorState: 'migrating'
                }
            }
        }
        
        // Bioluminescent plankton - passive drift with flash response
        this.behaviors.bioluminescent_plankton = {
            update: (entity, delta, ships) => {
                const time = Date.now() / 1000
                
                // Check for ship disturbance
                let flashIntensity = 0
                for (const ship of ships) {
                    const dist = Math.sqrt(
                        Math.pow(ship.position[0] - entity.position[0], 2) +
                        Math.pow(ship.position[2] - entity.position[2], 2)
                    )
                    if (dist < 20) {
                        flashIntensity = Math.max(flashIntensity, 1 - dist / 20)
                    }
                }
                
                // Plankton drift with current
                const driftSpeed = 0.5
                return {
                    position: [
                        entity.position[0] + Math.sin(time * 0.1) * driftSpeed * delta,
                        -1 + Math.sin(time * 0.3) * 0.5,  // Gentle vertical movement
                        entity.position[2] + Math.cos(time * 0.08) * driftSpeed * delta
                    ] as [number, number, number],
                    // Intensity stored in velocity magnitude for rendering
                    velocity: [flashIntensity, 0, 0] as [number, number, number]
                }
            }
        }
    }
    
    // Spawn new wildlife entity
    spawnWildlife(type: WildlifeType): WildlifeEntity {
        const id = `wildlife-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        // Get specs via WILDLIFE_SPECS[type]
        
        // Random spawn position away from ships
        const angle = Math.random() * Math.PI * 2
        const distance = 50 + Math.random() * 100
        
        const entity: WildlifeEntity = {
            id,
            type,
            position: [
                Math.cos(angle) * distance,
                type === 'humpback_whale' ? -2 : type === 'bioluminescent_plankton' ? -1 : -3,
                Math.sin(angle) * distance
            ],
            velocity: [0, 0, 0],
            behaviorState: type === 'bottlenose_dolphin' ? 'migrating' : 'idle',
            createdAt: Date.now()
        }
        
        // For dolphins, sometimes spawn in pods
        if (type === 'bottlenose_dolphin' && Math.random() < 0.7) {
            useGameStore.getState().addWildlife(entity)
            
            // Spawn pod members
            const podSize = Math.floor(Math.random() * 8) + 3
            for (let i = 0; i < podSize; i++) {
                const podMember: WildlifeEntity = {
                    ...entity,
                    id: `wildlife-${type}-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                    position: [
                        entity.position[0] + (Math.random() - 0.5) * 20,
                        entity.position[1] + (Math.random() - 0.5) * 2,
                        entity.position[2] + (Math.random() - 0.5) * 20
                    ]
                }
                useGameStore.getState().addWildlife(podMember)
            }
        } else {
            useGameStore.getState().addWildlife(entity)
        }
        
        console.log(`🐋 Wildlife spawned: ${type} (${entity.id})`)
        return entity
    }
    
    // Main update loop - called every frame
    update(delta: number) {
        const state = useGameStore.getState()
        const { wildlife, ships } = state
        
        // Update spawn timer
        this.spawnTimer += delta
        if (this.spawnTimer >= this.SPAWN_INTERVAL) {
            this.spawnTimer = 0
            this.attemptSpawn()
        }
        
        // Update each wildlife entity
        wildlife.forEach(entity => {
            const behavior = this.behaviors[entity.type]
            if (behavior) {
                const updates = behavior.update(entity, delta, ships)
                if (updates) {
                    useGameStore.getState().updateWildlife(entity.id, updates)
                }
            }
        })
    }
    
    private attemptSpawn() {
        const state = useGameStore.getState()
        const { wildlife, timeOfDay } = state
        
        // Limit total wildlife count
        if (wildlife.length >= 20) return
        
        // Spawn probabilities based on time of day
        const isNight = timeOfDay < 6 || timeOfDay > 18
        
        const spawnChances: { type: WildlifeType; chance: number }[] = [
            { type: 'bottlenose_dolphin', chance: 0.4 },
            { type: 'humpback_whale', chance: 0.2 },
            { type: 'great_white_shark', chance: 0.2 },
            { type: 'bioluminescent_plankton', chance: isNight ? 0.6 : 0.1 }
        ]
        
        for (const { type, chance } of spawnChances) {
            if (Math.random() < chance) {
                this.spawnWildlife(type)
                break
            }
        }
    }
    
    // Get wildlife specifications for rendering
    getSpecs(type: WildlifeType) {
        return WILDLIFE_SPECS[type]
    }
    
    // Clean up old wildlife
    cleanup(maxAge: number = 300) { // 5 minutes
        const state = useGameStore.getState()
        const now = Date.now()
        
        state.wildlife.forEach(entity => {
            if ((now - entity.createdAt) / 1000 > maxAge) {
                state.removeWildlife(entity.id)
            }
        })
    }
}

export const wildlifeSystem = new WildlifeSystem()
export { WILDLIFE_SPECS }
