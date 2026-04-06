// =============================================================================
// HARBOR EVENT SYSTEM CLASS - HarborGlow Bay
// Main event management logic, business patterns, and event triggers
// =============================================================================

import { useGameStore, WildlifeEntity, Ship, ShipType } from '../../store/useGameStore'
import { wildlifeSystem } from '../wildlifeSystem'
import { musicSystem } from '../musicSystem'
import { weatherSystem } from '../weatherSystem'
import { HarborEvent, HarborEventType, BusinessPattern, BusinessPatternType, PortOperations } from './types'
import { EVENT_CONFIGS } from './eventConfigs'

export class HarborEventSystem {
    private activeEvents: Map<string, HarborEvent> = new Map()
    private eventTimers: Map<HarborEventType, number> = new Map()
    private lastEventTime: Map<HarborEventType, number> = new Map()
    private fireboatPositions: [number, number, number][] = [
        [-40, 0, -20],  // Fireboat 1
        [-30, 0, -15],  // Fireboat 2
        [-20, 0, -10],  // Fireboat 3
        [-10, 0, -5],   // Fireboat 4
        [0, 0, 0]       // Fireboat 5 (lead)
    ]
    private levaEnabled: Record<HarborEventType, boolean> = {
        whale_migration: true,
        dolphin_pod: true,
        porpoise_sighting: true,
        shark_patrol: true,
        sea_lion_haulout: true,
        plankton_bloom: true,
        ship_fire: true,
        fireboat_response: true,
        navy_fleet_week: true,
        navy_resupply: true,
        atmospheric_river: true,
        cruise_arrival: true,
        cruise_departure: true,
        suspicious_vessel: true,
        clear: true
    }
    
    private activeBusinessPatterns: Map<BusinessPatternType, BusinessPattern> = new Map()
    private operations: PortOperations = {
        craneSwayFactor: 0.1,
        loadingSpeedModifier: 1.0,
        queueLength: 0,
        railActivity: 0.5
    }
    private businessPatternTimer: number = 0
    private distantShipQueue: { type: ShipType; eta: number }[] = []

    constructor() {
        Object.keys(EVENT_CONFIGS).forEach(type => {
            this.eventTimers.set(type as HarborEventType, 0)
            this.lastEventTime.set(type as HarborEventType, 0)
        })
        this.initSeasonalPattern()
    }
    
    private initSeasonalPattern() {
        this.updateSeasonalPattern()
    }

    // ========================================================================
    // BUSINESS PATTERNS
    // ========================================================================
    
    private updateSeasonalPattern() {
        const month = new Date().getMonth() + 1
        
        let containerModifier = 1.0
        if (month >= 8 && month <= 10) containerModifier = 1.4
        else if (month === 1 || month === 2) containerModifier = 0.6
        
        let tankerModifier = 1.0
        if (month >= 11 || month <= 3) tankerModifier = 1.2
        
        this.operations.loadingSpeedModifier = containerModifier
        this.operations.railActivity = 0.4 + (containerModifier - 0.6) * 0.5
    }
    
    triggerGeopoliticalEvent(region: 'red_sea' | 'hormuz' | 'panama'): BusinessPattern {
        const pattern: BusinessPattern = {
            type: 'tanker_geopolitical',
            active: true,
            intensity: 0.7 + Math.random() * 0.3,
            startTime: Date.now(),
            duration: 600 + Math.random() * 1200,
            affectedShipTypes: ['tanker', 'lng'],
            arrivalModifier: 1.5 + Math.random() * 0.5,
            description: `Tanker traffic surge due to ${region.replace('_', ' ')} disruption`
        }
        
        this.activeBusinessPatterns.set('tanker_geopolitical', pattern)
        console.log(`📈 GEOPOLITICAL EVENT: ${region.replace('_', ' ')} disruption`)
        console.log(`   Tanker arrivals increased ${(pattern.arrivalModifier * 100).toFixed(0)}%`)
        
        return pattern
    }
    
    triggerTariffEvent(): BusinessPattern {
        const pattern: BusinessPattern = {
            type: 'tariff_event',
            active: true,
            intensity: 0.5 + Math.random() * 0.3,
            startTime: Date.now(),
            duration: 900 + Math.random() * 900,
            affectedShipTypes: ['container'],
            arrivalModifier: 0.4 + Math.random() * 0.3,
            description: 'Container traffic reduced due to tariff uncertainty'
        }
        
        this.activeBusinessPatterns.set('tariff_event', pattern)
        console.log(`📉 TARIFF EVENT: Container shipping slowdown`)
        
        return pattern
    }
    
    triggerLaborAction(): BusinessPattern {
        const pattern: BusinessPattern = {
            type: 'labor_action',
            active: true,
            intensity: 0.6 + Math.random() * 0.4,
            startTime: Date.now(),
            duration: 300 + Math.random() * 600,
            affectedShipTypes: ['container', 'bulk'],
            arrivalModifier: 0.3,
            description: 'Port worker slowdown - operations affected'
        }
        
        this.operations.loadingSpeedModifier = 0.3
        this.activeBusinessPatterns.set('labor_action', pattern)
        console.log(`⚠️ LABOR ACTION: Port operations slowed`)
        
        return pattern
    }
    
    triggerPeakSeason(): BusinessPattern {
        const pattern: BusinessPattern = {
            type: 'peak_season',
            active: true,
            intensity: 0.8,
            startTime: Date.now(),
            duration: 1200,
            affectedShipTypes: ['container'],
            arrivalModifier: 1.5,
            description: 'Holiday peak season - maximum throughput'
        }
        
        this.operations.loadingSpeedModifier = 1.3
        this.operations.railActivity = 0.9
        this.activeBusinessPatterns.set('peak_season', pattern)
        console.log(`🎄 PEAK SEASON: Holiday shipping rush`)
        
        return pattern
    }
    
    getArrivalModifier(shipType: ShipType): number {
        let modifier = 1.0
        const month = new Date().getMonth() + 1
        
        if (shipType === 'container') {
            if (month >= 8 && month <= 10) modifier *= 1.4
            else if (month === 1 || month === 2) modifier *= 0.6
        } else if (shipType === 'tanker' || shipType === 'lng') {
            if (month >= 11 || month <= 3) modifier *= 1.2
        }
        
        this.activeBusinessPatterns.forEach(pattern => {
            if (pattern.affectedShipTypes.includes(shipType)) {
                modifier *= pattern.arrivalModifier
            }
        })
        
        const weather = useGameStore.getState().weather
        if (weather === 'storm') modifier *= 0.2
        else if (weather === 'rain') modifier *= 0.7
        else if (weather === 'fog') modifier *= 0.5
        
        return modifier
    }
    
    getOperations(): PortOperations {
        return { ...this.operations }
    }
    
    updateOperationsFromWeather(windSpeed: number, weather: string) {
        this.operations.craneSwayFactor = Math.min(1, windSpeed / 50)
        
        if (weather === 'storm') {
            this.operations.loadingSpeedModifier = 0.3
        } else if (weather === 'rain') {
            this.operations.loadingSpeedModifier = Math.max(0.5, this.operations.loadingSpeedModifier * 0.8)
        } else if (weather === 'clear') {
            this.updateSeasonalPattern()
        }
    }
    
    getDistantShipQueue(): { type: ShipType; eta: number; position: [number, number, number] }[] {
        return this.distantShipQueue.map((ship, i) => ({
            ...ship,
            position: [150 + i * 30, 0, -100 + (Math.random() - 0.5) * 50]
        }))
    }
    
    addToQueue(shipType: ShipType) {
        this.distantShipQueue.push({
            type: shipType,
            eta: Date.now() + 300000 + Math.random() * 600000
        })
        this.operations.queueLength = this.distantShipQueue.length
    }

    // ========================================================================
    // LEVA CONTROLS
    // ========================================================================
    
    setEventEnabled(type: HarborEventType, enabled: boolean) {
        this.levaEnabled[type] = enabled
        console.log(`🎛️ Event ${type} ${enabled ? 'enabled' : 'disabled'}`)
    }

    isEventEnabled(type: HarborEventType): boolean {
        return this.levaEnabled[type] && EVENT_CONFIGS[type].enabled
    }

    getEnabledEvents(): HarborEventType[] {
        return (Object.keys(this.levaEnabled) as HarborEventType[])
            .filter(type => this.levaEnabled[type])
    }

    // ========================================================================
    // EVENT TRIGGERS
    // ========================================================================

    triggerWhaleMigration(whaleType: 'gray' | 'humpback' = 'humpback'): HarborEvent {
        const event: HarborEvent = {
            id: `whale-${Date.now()}`,
            type: 'whale_migration',
            startTime: Date.now(),
            duration: 600 + Math.random() * 600,
            intensity: 0.7 + Math.random() * 0.3,
            position: [80 + Math.random() * 40, 0, -50 + Math.random() * 100]
        }

        const whaleCount = whaleType === 'gray' ? 1 + Math.floor(Math.random() * 2) : 1
        
        for (let i = 0; i < whaleCount; i++) {
            const whale: WildlifeEntity = {
                id: `migration-whale-${Date.now()}-${i}`,
                type: 'humpback_whale',
                position: [
                    event.position[0] + (Math.random() - 0.5) * 30,
                    -2,
                    event.position[2] + (Math.random() - 0.5) * 50
                ],
                velocity: [-3, 0, (Math.random() - 0.5) * 2],
                behaviorState: 'migrating',
                createdAt: Date.now()
            }
            useGameStore.getState().addWildlife(whale)
        }

        this.triggerWhaleDuet()
        this.activeEvents.set(event.id, event)
        console.log(`🐋 ${whaleType === 'gray' ? 'Gray' : 'Humpback'} whale migration event started`)
        
        return event
    }

    triggerDolphinPod(): HarborEvent {
        const event: HarborEvent = {
            id: `dolphin-${Date.now()}`,
            type: 'dolphin_pod',
            startTime: Date.now(),
            duration: 180 + Math.random() * 300,
            intensity: 0.5 + Math.random() * 0.5,
            position: [0, 0, 0]
        }

        const ships = useGameStore.getState().ships
        const targetShip = ships.find(s => s.type === 'cruise' || s.type === 'container')
        
        if (targetShip) {
            event.affectedShipId = targetShip.id
            event.position = targetShip.position

            const podSize = 3 + Math.floor(Math.random() * 10)
            for (let i = 0; i < podSize; i++) {
                const dolphin: WildlifeEntity = {
                    id: `dolphin-${Date.now()}-${i}`,
                    type: 'bottlenose_dolphin',
                    position: [
                        targetShip.position[0] + 15 + (Math.random() - 0.5) * 10,
                        0.5 + Math.random() * 0.5,
                        targetShip.position[2] + (Math.random() - 0.5) * 15
                    ],
                    velocity: [8, 0, (Math.random() - 0.5) * 3],
                    behaviorState: 'playing',
                    targetShipId: targetShip.id,
                    createdAt: Date.now()
                }
                useGameStore.getState().addWildlife(dolphin)
            }
            console.log(`🐬 Bottlenose dolphin pod bow-riding ${targetShip.type} ship`)
        }

        this.activeEvents.set(event.id, event)
        return event
    }

    triggerSeaLionHaulout(): HarborEvent {
        const hauloutSites: [number, number, number][] = [
            [-60, 0.5, -30],  // North breakwater
            [60, 0.5, -25],   // South breakwater
            [-40, 0.5, 40],   // Pier area
        ]
        
        const site = hauloutSites[Math.floor(Math.random() * hauloutSites.length)]
        
        const event: HarborEvent = {
            id: `sealions-${Date.now()}`,
            type: 'sea_lion_haulout',
            startTime: Date.now(),
            duration: 600 + Math.random() * 1200,
            intensity: 0.4 + Math.random() * 0.4,
            position: site,
            metadata: {
                count: 10 + Math.floor(Math.random() * 50),
                vocalizing: Math.random() > 0.3
            }
        }

        this.activeEvents.set(event.id, event)
        console.log(`🦭 Sea lion haulout: ${event.metadata?.count} animals at breakwater`)
        
        return event
    }

    triggerPlanktonBloom(): HarborEvent {
        const event: HarborEvent = {
            id: `plankton-${Date.now()}`,
            type: 'plankton_bloom',
            startTime: Date.now(),
            duration: 300 + Math.random() * 300,
            intensity: 0.6 + Math.random() * 0.4,
            position: [
                (Math.random() - 0.5) * 100,
                -2,
                (Math.random() - 0.5) * 60
            ],
            metadata: {
                species: 'Lingulodinium polyedrum',
                triggerDistance: 20
            }
        }

        this.activeEvents.set(event.id, event)
        console.log(`✨ Bioluminescent plankton bloom - disturb water to see glow`)
        
        return event
    }

    triggerShipFire(shipId?: string): HarborEvent | null {
        const state = useGameStore.getState()
        const ships = state.ships
        
        let targetShip: Ship | undefined
        if (shipId) {
            targetShip = ships.find(s => s.id === shipId)
        } else {
            const flammableShips = ships.filter(s => 
                s.type === 'container' || s.type === 'tanker' || s.type === 'cruise'
            )
            if (flammableShips.length === 0) return null
            targetShip = flammableShips[Math.floor(Math.random() * flammableShips.length)]
        }

        if (!targetShip) return null

        // Store ship ID locally since targetShip may become undefined in async callbacks
        const targetShipId = targetShip.id
        const targetShipPosition = targetShip.position

        const event: HarborEvent = {
            id: `fire-${Date.now()}`,
            type: 'ship_fire',
            startTime: Date.now(),
            duration: 240 + Math.random() * 300,
            intensity: 0.7 + Math.random() * 0.3,
            affectedShipId: targetShipId,
            position: targetShipPosition,
            metadata: {
                deck: Math.random() > 0.5 ? 'cargo' : 'engine',
                spreading: false,
                contained: false
            }
        }

        this.activeEvents.set(event.id, event)
        
        setTimeout(() => {
            if (useGameStore.getState().ships.find(s => s.id === targetShipId)) {
                this.triggerFireboatResponse(targetShipId)
            }
        }, 5000)

        this.triggerEmergencyMusic()
        
        return event
    }

    triggerFireboatResponse(shipId: string): HarborEvent {
        const ship = useGameStore.getState().ships.find(s => s.id === shipId)
        if (!ship) throw new Error('Ship not found')

        const event: HarborEvent = {
            id: `fireboats-${Date.now()}`,
            type: 'fireboat_response',
            startTime: Date.now(),
            duration: 300,
            intensity: 1.0,
            affectedShipId: shipId,
            position: ship.position,
            metadata: {
                fireboatCount: 5,
                waterPressure: 'high',
                foamDeployed: Math.random() > 0.5
            }
        }

        this.activeEvents.set(event.id, event)
        console.log(`🚒 Fireboat response: 5 vessels deploying`)
        
        return event
    }

    triggerNavyFleetWeek(): HarborEvent {
        const event: HarborEvent = {
            id: `fleetweek-${Date.now()}`,
            type: 'navy_fleet_week',
            startTime: Date.now(),
            duration: 900 + Math.random() * 900,
            intensity: 0.8,
            position: [100, 0, -50],
            metadata: {
                vesselType: ['destroyer', 'cruiser', 'carrier_escort'][Math.floor(Math.random() * 3)],
                hasAirShow: Math.random() > 0.5,
                libertyPending: true
            }
        }

        this.activeEvents.set(event.id, event)
        console.log(`⚓ Fleet Week visit: ${event.metadata?.vesselType}`)
        
        return event
    }

    triggerNavyResupply(): HarborEvent {
        const event: HarborEvent = {
            id: `navy-${Date.now()}`,
            type: 'navy_resupply',
            startTime: Date.now(),
            duration: 600,
            intensity: 0.5,
            position: [80, 0, 0],
            metadata: {
                vesselType: 'supply_ship',
                daysAtSea: 60 + Math.floor(Math.random() * 60)
            }
        }

        this.activeEvents.set(event.id, event)
        console.log(`⚓ Naval resupply ship arriving after ${event.metadata?.daysAtSea} days at sea`)
        
        return event
    }

    triggerAtmosphericRiver(): HarborEvent {
        const event: HarborEvent = {
            id: `storm-${Date.now()}`,
            type: 'atmospheric_river',
            startTime: Date.now(),
            duration: 480 + Math.random() * 720,
            intensity: 0.4 + Math.random() * 0.6,
            position: [0, 0, 0],
            metadata: {
                windSpeed: 40 + Math.floor(Math.random() * 40),
                rainfall: 'heavy',
                origin: 'Hawaii',
                waveHeight: 3 + Math.random() * 4
            }
        }

        weatherSystem.forceWeather('storm')
        useGameStore.getState().setWeather('storm')

        this.activeEvents.set(event.id, event)
        console.log(`⛈️ Atmospheric River (Pineapple Express) approaching`)
        
        return event
    }

    triggerCruiseArrival(): HarborEvent {
        const event: HarborEvent = {
            id: `cruise-arr-${Date.now()}`,
            type: 'cruise_arrival',
            startTime: Date.now(),
            duration: 300,
            intensity: 0.6,
            position: [0, 0, 50],
            metadata: {
                passengers: 2000 + Math.floor(Math.random() * 2000),
                destination: ['Mexico', 'Alaska', 'Hawaii'][Math.floor(Math.random() * 3)],
                pier: ['27', '35'][Math.floor(Math.random() * 2)]
            }
        }

        this.activeEvents.set(event.id, event)
        console.log(`🛳️ Cruise ship arriving Pier ${event.metadata?.pier}`)
        
        return event
    }

    triggerShipArrival(ship: { name: string; type: string }): HarborEvent {
        const event: HarborEvent = {
            id: `ship-arr-${Date.now()}`,
            type: 'clear',
            startTime: Date.now(),
            duration: 60,
            intensity: 0.3,
            position: [0, 0, 0],
            metadata: {
                shipName: ship.name,
                shipType: ship.type
            }
        }

        this.activeEvents.set(event.id, event)
        console.log(`⚓ Ship arrival: ${ship.name}`)
        
        return event
    }

    triggerCruiseDeparture(): HarborEvent {
        const event: HarborEvent = {
            id: `cruise-dep-${Date.now()}`,
            type: 'cruise_departure',
            startTime: Date.now(),
            duration: 180,
            intensity: 0.5,
            position: [0, 0, 50],
            metadata: {
                hornBlast: true,
                tugboats: 2
            }
        }

        this.activeEvents.set(event.id, event)
        console.log(`🛳️ Cruise ship departing - bon voyage!`)
        
        return event
    }

    triggerSuspiciousVessel(): HarborEvent {
        const event: HarborEvent = {
            id: `suspicious-${Date.now()}`,
            type: 'suspicious_vessel',
            startTime: Date.now(),
            duration: 120 + Math.random() * 180,
            intensity: 0.3,
            position: [
                40 + Math.random() * 40,
                0,
                -40 + Math.random() * 80
            ],
            metadata: {
                vesselType: 'small_craft',
                behavior: 'loitering',
                coastGuardNotified: true
            }
        }

        this.activeEvents.set(event.id, event)
        console.log(`⚠️ Suspicious small vessel detected`)
        
        return event
    }

    // ========================================================================
    // MUSIC INTEGRATION
    // ========================================================================

    private triggerWhaleDuet() {
        const store = useGameStore.getState()
        const cruiseShip = store.ships.find(s => s.type === 'cruise')
        
        if (cruiseShip && store.musicPlaying.get(cruiseShip.id)) {
            console.log(`🎵 Whale song duet with cruise ship music`)
        }
    }

    private triggerEmergencyMusic() {
        musicSystem.setBPM(useGameStore.getState().bpm * 1.3)
        console.log(`🎵 Emergency tempo increase`)
        
        setTimeout(() => {
            musicSystem.setBPM(useGameStore.getState().bpm / 1.3)
        }, 30000)
    }

    // ========================================================================
    // EVENT UPDATE LOOP
    // ========================================================================

    update(delta: number) {
        const now = Date.now()
        const state = useGameStore.getState()
        const month = new Date().getMonth() + 1
        const isNight = state.isNight

        this.businessPatternTimer += delta
        if (this.businessPatternTimer >= 60) {
            this.businessPatternTimer = 0
            this.updateSeasonalPattern()
            
            this.activeBusinessPatterns.forEach((pattern, type) => {
                const elapsed = (now - pattern.startTime) / 1000
                if (elapsed >= pattern.duration) {
                    this.activeBusinessPatterns.delete(type)
                    console.log(`📊 Business pattern ended: ${type}`)
                }
            })
        }
        
        if (state.weather === 'storm' || state.weather === 'rain') {
            const windSpeed = state.weather === 'storm' ? 60 : 25
            this.updateOperationsFromWeather(windSpeed, state.weather)
        }
        
        this.distantShipQueue = this.distantShipQueue.filter(ship => ship.eta > now)
        this.operations.queueLength = this.distantShipQueue.length

        this.activeEvents.forEach((event, id) => {
            const elapsed = (now - event.startTime) / 1000
            
            if (elapsed >= event.duration) {
                this.endEvent(id)
            } else {
                this.updateEvent(event, delta)
            }
        })

        this.eventTimers.forEach((timer, type) => {
            if (type === 'clear') return
            
            const newTimer = timer + delta
            this.eventTimers.set(type, newTimer)

            const config = EVENT_CONFIGS[type]
            const lastTime = this.lastEventTime.get(type) || 0
            const timeSinceLast = (now - lastTime) / 1000

            if (newTimer >= config.minInterval && timeSinceLast >= config.minInterval) {
                if (this.canSpawnEvent(type, config, month, isNight, state)) {
                    if (Math.random() < config.probability * delta) {
                        const event = this.spawnEvent(type)
                        if (event) {
                            this.eventTimers.set(type, 0)
                            this.lastEventTime.set(type, now)
                        }
                    }
                }
            }
        })
    }

    private canSpawnEvent(
        type: HarborEventType, 
        config: typeof EVENT_CONFIGS[HarborEventType], 
        month: number, 
        isNight: boolean,
        state: ReturnType<typeof useGameStore.getState>
    ): boolean {
        if (!this.isEventEnabled(type)) return false
        if (config.seasonality && !config.seasonality.includes(month)) return false
        if (config.timeOfDay === 'night' && !isNight) return false
        if (config.timeOfDay === 'day' && isNight) return false
        if (config.requiresShip && state.ships.length === 0) return false

        const currentCount = Array.from(this.activeEvents.values())
            .filter(e => e.type === type).length
        if (currentCount >= config.maxConcurrent) return false

        if (type === 'atmospheric_river' && state.weather === 'storm') return false
        if (type === 'ship_fire') {
            const flammableShips = state.ships.filter(s => 
                s.type === 'container' || s.type === 'tanker' || s.type === 'cruise'
            )
            if (flammableShips.length === 0) return false
        }

        return true
    }

    private spawnEvent(type: HarborEventType): HarborEvent | null {
        switch (type) {
            case 'whale_migration':
                return this.triggerWhaleMigration()
            case 'dolphin_pod':
                return this.triggerDolphinPod()
            case 'porpoise_sighting':
                return this.triggerPorpoiseSighting()
            case 'shark_patrol':
                return this.triggerSharkPatrol()
            case 'sea_lion_haulout':
                return this.triggerSeaLionHaulout()
            case 'plankton_bloom':
                return this.triggerPlanktonBloom()
            case 'ship_fire':
                return this.triggerShipFire()
            case 'navy_fleet_week':
                return this.triggerNavyFleetWeek()
            case 'navy_resupply':
                return this.triggerNavyResupply()
            case 'atmospheric_river':
                return this.triggerAtmosphericRiver()
            case 'cruise_arrival':
                return this.triggerCruiseArrival()
            case 'cruise_departure':
                return this.triggerCruiseDeparture()
            case 'suspicious_vessel':
                return this.triggerSuspiciousVessel()
            default:
                return null
        }
    }

    private updateEvent(event: HarborEvent, _delta: number) {
        switch (event.type) {
            case 'ship_fire':
                event.intensity = 0.6 + Math.random() * 0.4
                break
            case 'atmospheric_river':
                event.intensity = 0.4 + Math.sin(Date.now() / 5000) * 0.3
                break
        }
    }

    private endEvent(id: string) {
        const event = this.activeEvents.get(id)
        if (!event) return

        switch (event.type) {
            case 'atmospheric_river':
                weatherSystem.forceWeather('clear')
                useGameStore.getState().setWeather('clear')
                console.log(`⛈️ Atmospheric River passed - resuming normal operations`)
                break
            case 'ship_fire':
                console.log(`✅ Fire extinguished on vessel`)
                break
            case 'whale_migration':
                console.log(`🐋 Whales continued migration`)
                break
        }

        this.activeEvents.delete(id)
    }

    // ========================================================================
    // WILDLIFE SPAWNING HELPERS
    // ========================================================================

    private triggerPorpoiseSighting(): HarborEvent {
        const event: HarborEvent = {
            id: `porpoise-${Date.now()}`,
            type: 'porpoise_sighting',
            startTime: Date.now(),
            duration: 60 + Math.random() * 120,
            intensity: 0.3,
            position: [
                (Math.random() - 0.5) * 40,
                -0.5,
                (Math.random() - 0.5) * 40
            ]
        }

        console.log(`🐬 Harbor porpoise sighting (rare!)`)
        this.activeEvents.set(event.id, event)
        return event
    }

    private triggerSharkPatrol(): HarborEvent {
        const event: HarborEvent = {
            id: `shark-${Date.now()}`,
            type: 'shark_patrol',
            startTime: Date.now(),
            duration: 180 + Math.random() * 240,
            intensity: 0.5,
            position: [90, -5, (Math.random() - 0.5) * 60]
        }

        const shark: WildlifeEntity = {
            id: `shark-${Date.now()}`,
            type: 'great_white_shark',
            position: [...event.position],
            velocity: [-5, 0, (Math.random() - 0.5) * 2],
            behaviorState: 'hunting',
            createdAt: Date.now()
        }
        useGameStore.getState().addWildlife(shark)

        console.log(`🦈 Great white shark patrolling near harbor entrance`)
        this.activeEvents.set(event.id, event)
        return event
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    getActiveEvents(): HarborEvent[] {
        return Array.from(this.activeEvents.values())
    }

    getEventsByType(type: HarborEventType): HarborEvent[] {
        return this.getActiveEvents().filter(e => e.type === type)
    }

    hasActiveEvent(type: HarborEventType): boolean {
        return this.activeEvents.has(type)
    }

    forceEvent(type: HarborEventType, shipId?: string): HarborEvent | null {
        this.eventTimers.set(type, EVENT_CONFIGS[type].minInterval + 1)
        
        switch (type) {
            case 'whale_migration':
                return this.triggerWhaleMigration()
            case 'ship_fire':
                return this.triggerShipFire(shipId)
            case 'atmospheric_river':
                return this.triggerAtmosphericRiver()
            default:
                return this.spawnEvent(type)
        }
    }

    endAllEvents() {
        this.activeEvents.forEach((_, id) => this.endEvent(id))
    }

    getFireboatPositions(): [number, number, number][] {
        return this.fireboatPositions
    }

    isShipOnFire(shipId: string): boolean {
        return Array.from(this.activeEvents.values())
            .some(e => e.type === 'ship_fire' && e.affectedShipId === shipId)
    }

    getShipFireIntensity(shipId: string): number {
        const fireEvent = Array.from(this.activeEvents.values())
            .find(e => e.type === 'ship_fire' && e.affectedShipId === shipId)
        return fireEvent?.intensity || 0
    }
    
    getActiveBusinessPatterns(): BusinessPattern[] {
        return Array.from(this.activeBusinessPatterns.values())
    }
    
    forceBusinessPattern(type: BusinessPatternType): BusinessPattern | null {
        switch (type) {
            case 'tanker_geopolitical':
                return this.triggerGeopoliticalEvent(['red_sea', 'hormuz', 'panama'][Math.floor(Math.random() * 3)] as 'red_sea' | 'hormuz' | 'panama')
            case 'tariff_event':
                return this.triggerTariffEvent()
            case 'labor_action':
                return this.triggerLaborAction()
            case 'peak_season':
                return this.triggerPeakSeason()
            default:
                return null
        }
    }
}

export const harborEventSystem = new HarborEventSystem()
