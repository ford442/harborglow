// =============================================================================
// EXPERIMENTAL PORT TECH SYSTEM - HarborGlow Bay
// Cutting-edge 2025-2026 port technologies as optional visual features
//
// TECHNOLOGIES IMPLEMENTED:
// 1. Remote Cabless Cranes - Control tower operation, AI-assisted
// 2. Digital Twin Overlay - Holographic port visualization
// 3. Underwater ROV Swarms - AI inspection drones
// 4. Hydrogen AGVs - Blue-glowing fuel cell vehicles
// 5. Aerial Drone Swarms - Formation flying security drones
// 6. AI Smart Cranes - Glowing status lights, predictive paths
// 7. Emissions Capture Barges - Giant exhaust processing systems
// =============================================================================

import { useGameStore, Ship, ShipType } from '../store/useGameStore'
import { harborEventSystem } from './eventSystem'

// =============================================================================
// TYPES
// =============================================================================

export type ExperimentalTechType =
    | 'cabless_cranes'
    | 'digital_twin'
    | 'underwater_rov_swarm'
    | 'hydrogen_agvs'
    | 'aerial_drone_swarm'
    | 'ai_smart_cranes'
    | 'emissions_barges'

export interface ExperimentalTech {
    id: string
    type: ExperimentalTechType
    enabled: boolean
    intensity: number  // 0-1, affects visual prominence
    unlocked: boolean  // Must be unlocked through gameplay
    position: [number, number, number]
    metadata?: Record<string, unknown>
}

export interface TechActivationEvent {
    techType: ExperimentalTechType
    trigger: 'manual' | 'ship_upgrade' | 'weather' | 'emergency' | 'night_mode'
    duration?: number  // seconds, undefined = permanent
}

// =============================================================================
// TECH CONFIGURATION
// =============================================================================

export const TECH_CONFIGS: Record<ExperimentalTechType, {
    name: string
    description: string
    unlockRequirement: 'none' | 'first_ship_upgraded' | 'all_ships_upgraded' | 'storm_weather'
    baseIntensity: number
    maxInstances: number
    performanceImpact: 'low' | 'medium' | 'high'
}> = {
    cabless_cranes: {
        name: 'Remote Cabless Cranes',
        description: 'AI-assisted cranes operated from distant control tower',
        unlockRequirement: 'none',
        baseIntensity: 0.7,
        maxInstances: 1,
        performanceImpact: 'low'
    },
    digital_twin: {
        name: 'Port Digital Twin',
        description: 'Holographic overlay of real-time port operations',
        unlockRequirement: 'first_ship_upgraded',
        baseIntensity: 0.5,
        maxInstances: 1,
        performanceImpact: 'medium'
    },
    underwater_rov_swarm: {
        name: 'Underwater ROV Swarm',
        description: 'AI inspection drones swimming beneath ships',
        unlockRequirement: 'none',
        baseIntensity: 0.6,
        maxInstances: 3,
        performanceImpact: 'medium'
    },
    hydrogen_agvs: {
        name: 'Hydrogen Fuel Cell AGVs',
        description: 'Silent blue-glowing autonomous vehicles',
        unlockRequirement: 'none',
        baseIntensity: 0.8,
        maxInstances: 1,
        performanceImpact: 'low'
    },
    aerial_drone_swarm: {
        name: 'Aerial Security Drone Swarm',
        description: 'Formation-flying inspection drones',
        unlockRequirement: 'storm_weather',
        baseIntensity: 0.7,
        maxInstances: 2,
        performanceImpact: 'high'
    },
    ai_smart_cranes: {
        name: 'AI Edge-Controlled Smart Cranes',
        description: 'Predictive positioning with glowing status systems',
        unlockRequirement: 'none',
        baseIntensity: 0.9,
        maxInstances: 1,
        performanceImpact: 'low'
    },
    emissions_barges: {
        name: 'Emissions Capture Barges',
        description: 'Giant exhaust processing systems for ships',
        unlockRequirement: 'first_ship_upgraded',
        baseIntensity: 0.8,
        maxInstances: 2,
        performanceImpact: 'medium'
    }
}

// =============================================================================
// TECH SYSTEM CLASS
// =============================================================================

class ExperimentalTechSystem {
    private activeTech: Map<string, ExperimentalTech> = new Map()
    private techTimers: Map<string, number> = new Map()
    private levaEnabled: Record<ExperimentalTechType, boolean> = {
        cabless_cranes: true,
        digital_twin: true,
        underwater_rov_swarm: true,
        hydrogen_agvs: true,
        aerial_drone_swarm: true,
        ai_smart_cranes: true,
        emissions_barges: true
    }
    
    // Unlock state
    private unlockedTech: Set<ExperimentalTechType> = new Set(['cabless_cranes', 'underwater_rov_swarm', 'hydrogen_agvs', 'ai_smart_cranes'])
    
    // ROV swarm positions
    private rovPositions: Array<{id: number, offset: [number, number, number], phase: number}> = []
    
    // Drone formation positions
    private droneFormation: Array<{id: number, angle: number, altitude: number}> = []
    
    constructor() {
        // Initialize ROV swarm positions
        for (let i = 0; i < 12; i++) {
            this.rovPositions.push({
                id: i,
                offset: [
                    Math.cos(i * Math.PI / 6) * (5 + Math.random() * 5),
                    -2 - Math.random() * 3,
                    Math.sin(i * Math.PI / 6) * (5 + Math.random() * 5)
                ],
                phase: Math.random() * Math.PI * 2
            })
        }
        
        // Initialize drone formation
        for (let i = 0; i < 8; i++) {
            this.droneFormation.push({
                id: i,
                angle: (i / 8) * Math.PI * 2,
                altitude: 30 + Math.random() * 20
            })
        }
    }

    // ========================================================================
    // LEVA CONTROLS
    // ========================================================================
    
    setTechEnabled(type: ExperimentalTechType, enabled: boolean) {
        this.levaEnabled[type] = enabled
        console.log(`🔬 ${type} ${enabled ? 'enabled' : 'disabled'}`)
    }

    isTechEnabled(type: ExperimentalTechType): boolean {
        return this.levaEnabled[type] && this.unlockedTech.has(type)
    }

    getAllTechStatus(): Array<{type: ExperimentalTechType; enabled: boolean; unlocked: boolean}> {
        return (Object.keys(TECH_CONFIGS) as ExperimentalTechType[]).map(type => ({
            type,
            enabled: this.levaEnabled[type],
            unlocked: this.unlockedTech.has(type)
        }))
    }

    // ========================================================================
    // UNLOCK SYSTEM
    // ========================================================================
    
    unlockTech(type: ExperimentalTechType) {
        if (!this.unlockedTech.has(type)) {
            this.unlockedTech.add(type)
            console.log(`🔓 ${TECH_CONFIGS[type].name} unlocked!`)
        }
    }

    checkUnlockConditions() {
        const state = useGameStore.getState()
        const ships = state.ships
        
        // Check first ship upgraded
        const anyShipUpgraded = ships.some(ship => {
            const upgrades = state.installedUpgrades.filter(u => u.shipId === ship.id)
            return upgrades.length > 0
        })
        
        if (anyShipUpgraded) {
            this.unlockTech('digital_twin')
            this.unlockTech('emissions_barges')
        }
        
        // Check all ships upgraded
        const allShipsUpgraded = ships.length > 0 && ships.every(ship => {
            const progress = this.getUpgradeProgress(ship.id)
            return progress >= 100
        })
        
        if (allShipsUpgraded) {
            // Could unlock special celebration tech
        }
        
        // Check storm weather for drone swarm
        if (state.weather === 'storm') {
            this.unlockTech('aerial_drone_swarm')
        }
    }

    private getUpgradeProgress(shipId: string): number {
        const state = useGameStore.getState()
        const ship = state.ships.find(s => s.id === shipId)
        if (!ship) return 0
        
        const upgradeCounts: Record<ShipType, number> = {
            cruise: 8, container: 10, tanker: 8, bulk: 9,
            lng: 10, roro: 8, research: 7, droneship: 6
        }
        
        const installed = state.installedUpgrades.filter(u => u.shipId === shipId).length
        return (installed / upgradeCounts[ship.type]) * 100
    }

    // ========================================================================
    // TECH ACTIVATION
    // ========================================================================
    
    activateTech(type: ExperimentalTechType, position?: [number, number, number]): ExperimentalTech | null {
        if (!this.isTechEnabled(type)) return null
        
        // Check max instances
        const currentCount = Array.from(this.activeTech.values()).filter(t => t.type === type).length
        if (currentCount >= TECH_CONFIGS[type].maxInstances) return null
        
        const id = `${type}-${Date.now()}`
        const tech: ExperimentalTech = {
            id,
            type,
            enabled: true,
            intensity: TECH_CONFIGS[type].baseIntensity,
            unlocked: true,
            position: position || this.getDefaultPosition(type),
            metadata: this.getTechMetadata(type)
        }
        
        this.activeTech.set(id, tech)
        console.log(`🔬 Activated: ${TECH_CONFIGS[type].name}`)
        
        return tech
    }

    deactivateTech(id: string) {
        const tech = this.activeTech.get(id)
        if (tech) {
            this.activeTech.delete(id)
            console.log(`🔬 Deactivated: ${TECH_CONFIGS[tech.type].name}`)
        }
    }

    private getDefaultPosition(type: ExperimentalTechType): [number, number, number] {
        switch (type) {
            case 'cabless_cranes':
                return [-100, 30, -50]  // Distant control tower
            case 'digital_twin':
                return [0, 20, 0]  // Center of port, elevated
            case 'underwater_rov_swarm':
                return [0, -5, 0]  // Underwater center
            case 'hydrogen_agvs':
                return [0, 0, 30]  // Yard area
            case 'aerial_drone_swarm':
                return [50, 50, 0]  // Aerial position
            case 'ai_smart_cranes':
                return [0, 25, -10]  // Crane level
            case 'emissions_barges':
                return [40, 0, -20]  // Alongside ships
            default:
                return [0, 0, 0]
        }
    }

    private getTechMetadata(type: ExperimentalTechType): Record<string, unknown> {
        switch (type) {
            case 'cabless_cranes':
                return {
                    operatorCount: 3,
                    videoWallScreens: 12,
                    aiAssistanceLevel: 0.8
                }
            case 'digital_twin':
                return {
                    wireframeOpacity: 0.3,
                    dataStreamCount: 50,
                    predictionHorizon: 30  // seconds
                }
            case 'underwater_rov_swarm':
                return {
                    droneCount: 12,
                    scanBeamColor: '#00ff88',
                    formationType: 'sphere'
                }
            case 'hydrogen_agvs':
                return {
                    vehicleCount: 6,
                    h2TankLevel: 0.85,
                    vaporTrail: true
                }
            case 'aerial_drone_swarm':
                return {
                    droneCount: 8,
                    formationType: 'v_wing',
                    spotlightIntensity: 0.7
                }
            case 'ai_smart_cranes':
                return {
                    predictionPaths: true,
                    statusLedColor: '#00aaff',
                    laserScanEnabled: true
                }
            case 'emissions_barges':
                return {
                    captureEfficiency: 0.95,
                    armExtension: 250,  // feet
                    processingMode: 'normal'
                }
            default:
                return {}
        }
    }

    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
    update(delta: number) {
        // Check for unlock conditions
        this.checkUnlockConditions()
        
        // Update active tech timers
        this.techTimers.forEach((timer, id) => {
            const newTimer = timer - delta
            if (newTimer <= 0) {
                this.deactivateTech(id)
                this.techTimers.delete(id)
            } else {
                this.techTimers.set(id, newTimer)
            }
        })
        
        // Auto-activate tech based on conditions
        this.checkAutoActivation()
    }

    private checkAutoActivation() {
        const state = useGameStore.getState()
        
        // Auto-activate emissions barge when ship is being upgraded
        const currentShip = state.ships.find(s => s.id === state.currentShipId)
        if (currentShip && this.isTechEnabled('emissions_barges')) {
            const activeEmissions = Array.from(this.activeTech.values())
                .filter(t => t.type === 'emissions_barges' && t.metadata?.targetShipId === currentShip.id)
            
            if (activeEmissions.length === 0) {
                const tech = this.activateTech('emissions_barges', [
                    currentShip.position[0] + 30,
                    0,
                    currentShip.position[2]
                ])
                if (tech) {
                    tech.metadata = { ...tech.metadata, targetShipId: currentShip.id }
                }
            }
        }
        
        // Auto-activate ROV swarm for whale migration events
        const events = harborEventSystem.getActiveEvents()
        const hasWhaleEvent = events.some(e => e.type === 'whale_migration')
        if (hasWhaleEvent && this.isTechEnabled('underwater_rov_swarm')) {
            const activeRovs = Array.from(this.activeTech.values())
                .filter(t => t.type === 'underwater_rov_swarm')
            
            if (activeRovs.length === 0) {
                this.activateTech('underwater_rov_swarm')
            }
        }
    }

    // ========================================================================
    // GETTERS FOR RENDERING
    // ========================================================================
    
    getActiveTech(): ExperimentalTech[] {
        return Array.from(this.activeTech.values())
    }

    getTechByType(type: ExperimentalTechType): ExperimentalTech[] {
        return this.getActiveTech().filter(t => t.type === type)
    }

    getROVSwarmData(): Array<{id: number; offset: [number, number, number]; phase: number}> {
        return this.rovPositions
    }

    getDroneFormationData(): Array<{id: number; angle: number; altitude: number}> {
        return this.droneFormation
    }

    getTechIntensity(type: ExperimentalTechType): number {
        const tech = this.getTechByType(type)[0]
        return tech?.intensity || 0
    }

    isTechActive(type: ExperimentalTechType): boolean {
        return this.getTechByType(type).length > 0
    }

    // ========================================================================
    // EVENT RESPONSES
    // ========================================================================
    
    onShipFullyUpgraded(ship: Ship) {
        // Trigger celebration effects
        if (this.isTechEnabled('aerial_drone_swarm')) {
            const tech = this.activateTech('aerial_drone_swarm', ship.position)
            if (tech) {
                this.techTimers.set(tech.id, 60)  // 1 minute celebration
            }
        }
        
        if (this.isTechEnabled('digital_twin')) {
            // Flash the digital twin
            const twin = this.getTechByType('digital_twin')[0]
            if (twin) {
                twin.intensity = 1.0
                setTimeout(() => { twin.intensity = TECH_CONFIGS.digital_twin.baseIntensity }, 5000)
            }
        }
    }

    onWeatherChange(weather: string) {
        if (weather === 'storm' && this.isTechEnabled('aerial_drone_swarm')) {
            // Recall drones in storm
            const drones = this.getTechByType('aerial_drone_swarm')
            drones.forEach(d => this.deactivateTech(d.id))
        }
    }

    onEmergencyEvent(eventType: string) {
        if (eventType === 'ship_fire' && this.isTechEnabled('aerial_drone_swarm')) {
            // Deploy drones for emergency survey
            this.activateTech('aerial_drone_swarm')
        }
    }
}

export const experimentalTechSystem = new ExperimentalTechSystem()
