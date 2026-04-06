// =============================================================================
// TRAFFIC SYSTEM - HarborGlow Bay
// Dynamic ship scheduling, queuing, and turnaround management
// =============================================================================

import { useGameStore, Ship, ShipType } from '../store/useGameStore'
import { timeSystem, DayPhase } from './timeSystem'
import { weatherSystem } from './weatherSystem'
import { harborEventSystem } from './eventSystem'
import { musicSystem } from './musicSystem'

// =============================================================================
// TYPES & CONFIG
// =============================================================================

export type ShipPriority = 'normal' | 'priority' | 'vip' | 'emergency'
export type ShipStatus = 'queued' | 'approaching' | 'docking' | 'docked' | 'departing' | 'departed'

export interface TrafficShip extends Ship {
    priority: ShipPriority
    status: ShipStatus
    scheduledArrival: number        // Game minutes since midnight
    dockedAt: number | null         // When it actually docked
    departureDeadline: number       // Must leave by this time
    turnaroundMinutes: number       // How long they can stay
    timeRemaining: number           // Minutes until departure
    upgradesRequired: number        // Target upgrades to complete
    upgradesCompleted: number
    reputationValue: number         // Reputation reward/penalty
    origin: string                  // Where ship came from
    destination: string             // Where it's going
    cargoType: string               // What's being carried
}

export interface TrafficQueue {
    ships: TrafficShip[]           // All ships in system
    docked: string | null          // Currently docked ship ID
    approaching: string[]          // Ships visible approaching
    queued: string[]               // Waiting to approach
    completed: string[]            // Successfully serviced ships
    missed: string[]               // Ships that left incomplete
}

export interface PortSchedule {
    day: number
    expectedArrivals: number
    peakHours: number[]            // Hours with heavy traffic
    currentUtilization: number     // 0-1 how busy the port is
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TRAFFIC_CONFIG = {
    // Arrival rates by time of day (ships per hour)
    rushHourMultiplier: 2.0,
    nightReduction: 0.4,
    baseArrivalRate: 0.5,         // Ships per game hour
    
    // Turnaround times by ship type (game minutes)
    turnaroundTimes: {
        cruise: 120,      // 2 hours - passengers need to disembark
        container: 180,   // 3 hours - cargo operations
        tanker: 240,      // 4 hours - safety protocols
        bulk: 200,
        lng: 300,
        roro: 90,
        research: 60,
        droneship: 45
    } as Record<ShipType, number>,
    
    // Time pressure thresholds
    warningThreshold: 30,         // Minutes - yellow warning
    urgentThreshold: 10,          // Minutes - red warning
    criticalThreshold: 3,         // Minutes - intense music
    
    // Queue management
    maxQueueSize: 5,
    approachDistance: 500,        // Meters - when ship becomes visible
    dockingDistance: 50,          // Meters - when ship locks to berth
    
    // Ship priorities
    priorityWeights: {
        emergency: 100,   // Coast guard, rescue
        vip: 50,          // Cruise ships in peak season
        priority: 20,     // Delayed cargo
        normal: 0
    }
}

// Ship types by time of day preference
const SCHEDULE_PREFERENCES: Record<DayPhase, ShipType[]> = {
    pre_dawn: ['tanker', 'container', 'bulk'],
    sunrise: ['container', 'cruise', 'roro'],
    mid_morning: ['cruise', 'container', 'roro'],
    midday: ['cruise', 'container', 'roro', 'research'],
    golden_hour: ['cruise', 'droneship'],
    night: ['tanker', 'lng', 'container']
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateShipName(type: ShipType): string {
    const prefixes: Record<ShipType, string[]> = {
        cruise: ['Pacific', 'Golden', 'Star', 'Majestic', 'Royal'],
        container: ['MSC', 'Maersk', 'Ever', 'COSCO', 'Hapag'],
        tanker: ['Oil', 'Petro', 'Marine', 'Atlantic', 'Global'],
        bulk: ['Iron', 'Coal', 'Grain', 'Mineral', 'Bulk'],
        lng: ['Gas', 'LNG', 'Cryo', 'Arctic', 'Energy'],
        roro: ['Auto', 'Wheel', 'Drive', 'Ferry', 'Carrier'],
        research: ['Research', 'Survey', 'Ocean', 'Marine', 'Polar'],
        droneship: ['SpaceX', 'Blue', 'Rocket', 'Launch', 'Orbit']
    }
    const suffixes = ['Star', 'Queen', 'Leader', 'Express', 'Glory', 'Venture', 'Pioneer']
    
    const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    const number = Math.floor(Math.random() * 900) + 100
    
    return type === 'container' || type === 'tanker' 
        ? `${prefix} ${suffix} ${number}`
        : `${prefix} ${suffix}`
}

function generateOriginDestination(type: ShipType): { origin: string; destination: string } {
    const ports: Record<ShipType, string[]> = {
        cruise: ['Vancouver', 'Seattle', 'Los Angeles', 'Mexico', 'Alaska'],
        container: ['Shanghai', 'Singapore', 'Busan', 'Tokyo', 'Long Beach'],
        tanker: ['Valdez', 'Houston', 'Rotterdam', 'Singapore', 'Vladivostok'],
        bulk: ['Port Hedland', 'Santos', 'Cape Town', 'Qingdao', 'Norfolk'],
        lng: ['Qatar', 'Australia', 'Malaysia', 'Nigeria', 'Norway'],
        roro: ['Japan', 'Korea', 'Germany', 'Belgium', 'California'],
        research: ['Scripps', 'Woods Hole', 'Monterey', 'Hawaii', 'Antarctica'],
        droneship: ['Cape Canaveral', 'Vandenberg', 'Kennedy', 'Canaveral', 'Kwajalein']
    }
    
    const possiblePorts = ports[type]
    const origin = possiblePorts[Math.floor(Math.random() * possiblePorts.length)]
    let destination = possiblePorts[Math.floor(Math.random() * possiblePorts.length)]
    while (destination === origin) {
        destination = possiblePorts[Math.floor(Math.random() * possiblePorts.length)]
    }
    
    return { origin, destination }
}

function generateCargoType(type: ShipType): string {
    const cargos: Record<ShipType, string[]> = {
        cruise: ['Tourists', 'Cruise Passengers', 'Expedition'],
        container: ['Electronics', 'Automotive', 'Consumer Goods', 'Machinery'],
        tanker: ['Crude Oil', 'Refined Products', 'Chemicals'],
        bulk: ['Iron Ore', 'Coal', 'Grain', 'Bauxite'],
        lng: ['Liquefied Natural Gas', 'LNG'],
        roro: ['Vehicles', 'Heavy Equipment', 'Trailers'],
        research: ['Scientific Equipment', 'Research Team', 'Samples'],
        droneship: ['Rocket Booster', 'Fairing Recovery', 'Satellite']
    }
    const options = cargos[type]
    return options[Math.floor(Math.random() * options.length)]
}

// =============================================================================
// TRAFFIC SYSTEM CLASS
// =============================================================================

class TrafficSystem {
    private queue: TrafficQueue = {
        ships: [],
        docked: null,
        approaching: [],
        queued: [],
        completed: [],
        missed: []
    }
    
    private schedule: PortSchedule = {
        day: 1,
        expectedArrivals: 6,
        peakHours: [8, 9, 10, 17, 18, 19],
        currentUtilization: 0
    }
    
    private lastUpdate: number = 0
    private listeners: Set<(queue: TrafficQueue) => void> = new Set()
    private timePressureActive: boolean = false
    
    // Configuration overrides
    private densityMultiplier: number = 1.0
    private timePressureMultiplier: number = 1.0
    private simulationEvent: string | null = null
    
    // ===================================================================
    // INITIALIZATION
    // ===================================================================
    
    initializeDay(dayNumber: number) {
        this.schedule.day = dayNumber
        this.generateDaySchedule()
        this.queue.completed = []
        this.queue.missed = []
    }
    
    private generateDaySchedule() {
        const gameHour = timeSystem.getState().hour
        const isPeakHour = this.schedule.peakHours.includes(Math.floor(gameHour))
        const weather = weatherSystem.getCurrentWeather()
        
        // Base arrivals
        let baseArrivals = 4 + Math.floor(Math.random() * 4) // 4-8 ships per day
        
        // Adjust for peak hours
        if (isPeakHour) baseArrivals *= TRAFFIC_CONFIG.rushHourMultiplier
        
        // Weather affects traffic
        if (weather === 'storm') baseArrivals *= 0.3
        if (weather === 'fog') baseArrivals *= 0.6
        
        // Time of day
        const currentPhase = timeSystem.getState().currentPhase
        if (currentPhase === 'night') baseArrivals *= TRAFFIC_CONFIG.nightReduction
        
        // Event override
        if (this.simulationEvent === 'surge') baseArrivals *= 2
        if (this.simulationEvent === 'strike') baseArrivals *= 0.1
        
        this.schedule.expectedArrivals = Math.floor(baseArrivals * this.densityMultiplier)
        
        // Pre-generate some ships for the queue
        const initialShips = Math.min(3, this.schedule.expectedArrivals)
        for (let i = 0; i < initialShips; i++) {
            this.scheduleShipArrival(i * 30 + Math.random() * 20) // Stagger arrivals
        }
    }
    
    // ===================================================================
    // SHIP SCHEDULING
    // ===================================================================
    
    private scheduleShipArrival(arrivalOffsetMinutes: number) {
        const gameState = timeSystem.getState()
        const arrivalTime = (gameState.gameTime + arrivalOffsetMinutes) % 1440
        
        // Determine ship type based on time preference
        const currentPhase = gameState.currentPhase
        const preferredTypes = SCHEDULE_PREFERENCES[currentPhase]
        const shipType = preferredTypes[Math.floor(Math.random() * preferredTypes.length)]
        
        // Determine priority
        let priority: ShipPriority = 'normal'
        if (Math.random() < 0.05) priority = 'emergency'
        else if (Math.random() < 0.15) priority = 'vip'
        else if (Math.random() < 0.25) priority = 'priority'
        
        // Calculate turnaround
        let turnaround = TRAFFIC_CONFIG.turnaroundTimes[shipType]
        turnaround *= this.timePressureMultiplier
        if (priority === 'vip') turnaround *= 0.8 // VIP ships expect faster service
        if (priority === 'emergency') turnaround *= 1.5 // Emergency ships can stay longer
        
        const { origin, destination } = generateOriginDestination(shipType)
        
        const trafficShip: TrafficShip = {
            id: `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: shipType,
            modelName: shipType,
            position: [500, 0, 0], // Start in distance
            length: 200 + Math.random() * 100,
            attachmentPoints: [], // Will be populated when spawning
            name: generateShipName(shipType),
            priority,
            status: 'queued',
            scheduledArrival: arrivalTime,
            dockedAt: null,
            departureDeadline: arrivalTime + turnaround,
            turnaroundMinutes: turnaround,
            timeRemaining: turnaround,
            upgradesRequired: 6 + Math.floor(Math.random() * 4),
            upgradesCompleted: 0,
            reputationValue: this.calculateReputationValue(shipType, priority),
            origin,
            destination,
            cargoType: generateCargoType(shipType)
        }
        
        this.queue.ships.push(trafficShip)
        this.queue.queued.push(trafficShip.id)
        
        this.notifyListeners()
    }
    
    private calculateReputationValue(type: ShipType, priority: ShipPriority): number {
        const baseValue: Record<ShipType, number> = {
            cruise: 15, container: 10, tanker: 12, bulk: 8,
            lng: 14, roro: 8, research: 20, droneship: 25
        }
        const priorityMult: Record<ShipPriority, number> = {
            normal: 1, priority: 1.5, vip: 2, emergency: 3
        }
        return Math.floor(baseValue[type] * priorityMult[priority])
    }
    
    // ===================================================================
    // UPDATE LOOP
    // ===================================================================
    
    update(deltaSeconds: number) {
        const gameMinutes = deltaSeconds * (timeSystem.getState().timeScale / 60)
        const gameState = timeSystem.getState()
        
        // Update each ship
        this.queue.ships.forEach(ship => {
            switch (ship.status) {
                case 'queued':
                    this.updateQueuedShip(ship, gameState.gameTime)
                    break
                case 'approaching':
                    this.updateApproachingShip(ship, gameMinutes)
                    break
                case 'docked':
                    this.updateDockedShip(ship, gameMinutes)
                    break
                case 'departing':
                    this.updateDepartingShip(ship, gameMinutes)
                    break
            }
        })
        
        // Check for new ship generation
        if (this.queue.ships.length < this.schedule.expectedArrivals && Math.random() < 0.01) {
            this.scheduleShipArrival(60 + Math.random() * 60)
        }
        
        // Update music based on time pressure
        this.updateMusicPressure()
        
        // Clean up departed ships
        this.cleanupDepartedShips()
        
        this.notifyListeners()
    }
    
    private updateQueuedShip(ship: TrafficShip, currentGameTime: number) {
        // Check if it's time to start approaching
        const timeUntilArrival = ship.scheduledArrival - currentGameTime
        if (timeUntilArrival <= 30 && timeUntilArrival > 0) {
            // Can start approach if nothing is docking/docked
            if (!this.queue.docked && this.queue.approaching.length === 0) {
                ship.status = 'approaching'
                this.queue.queued = this.queue.queued.filter(id => id !== ship.id)
                this.queue.approaching.push(ship.id)
            }
        }
    }
    
    private updateApproachingShip(ship: TrafficShip, deltaMinutes: number) {
        // Move ship closer
        const approachSpeed = 2 // meters per game minute
        ship.position[0] -= approachSpeed * deltaMinutes
        
        // Check if docked
        if (ship.position[0] <= TRAFFIC_CONFIG.dockingDistance) {
            this.dockShip(ship)
        }
    }
    
    private dockShip(ship: TrafficShip) {
        ship.status = 'docked'
        ship.dockedAt = timeSystem.getState().gameTime
        ship.position[0] = 0 // Lock to dock position
        this.queue.docked = ship.id
        this.queue.approaching = this.queue.approaching.filter(id => id !== ship.id)
        
        // Add to game store
        useGameStore.getState().addShip(ship as Ship)
        useGameStore.getState().setCurrentShip(ship.id)
        
        // Trigger arrival event
        harborEventSystem.triggerShipArrival({
            name: ship.name || `${ship.type}-${ship.id.slice(0, 4)}`,
            type: ship.type
        })
        
        console.log(`⚓ ${ship.name} docked - Departure in ${Math.floor(ship.turnaroundMinutes)} mins`)
    }
    
    private updateDockedShip(ship: TrafficShip, deltaMinutes: number) {
        ship.timeRemaining -= deltaMinutes
        
        // Check for deadline
        if (ship.timeRemaining <= 0) {
            this.forceDeparture(ship)
        }
    }
    
    private updateDepartingShip(ship: TrafficShip, deltaMinutes: number) {
        // Move ship away
        const departureSpeed = 3 // meters per game minute
        ship.position[0] += departureSpeed * deltaMinutes
        
        // Mark as departed when far enough
        if (ship.position[0] > TRAFFIC_CONFIG.approachDistance) {
            ship.status = 'departed'
        }
    }
    
    private forceDeparture(ship: TrafficShip) {
        ship.status = 'departing'
        this.queue.docked = null
        
        // Calculate completion
        const completionRate = ship.upgradesCompleted / ship.upgradesRequired
        
        if (completionRate >= 1) {
            this.queue.completed.push(ship.id)
            console.log(`✅ ${ship.name} departed complete - +${ship.reputationValue} rep`)
        } else {
            this.queue.missed.push(ship.id)
            const penalty = Math.floor(ship.reputationValue * (1 - completionRate))
            console.log(`⚠️ ${ship.name} departed incomplete (${Math.floor(completionRate * 100)}%) - ${penalty} rep penalty`)
        }
        
        // Remove from game store
        useGameStore.getState().removeShip(ship.id)
        
        // Reset music
        if (this.timePressureActive) {
            musicSystem.setBPM(128) // Reset to normal
            this.timePressureActive = false
        }
    }
    
    // ===================================================================
    // MUSIC INTEGRATION
    // ===================================================================
    
    private updateMusicPressure() {
        const dockedShip = this.getDockedShip()
        if (!dockedShip) return
        
        const timeLeft = dockedShip.timeRemaining
        const threshold = TRAFFIC_CONFIG.criticalThreshold
        
        if (timeLeft <= threshold && !this.timePressureActive) {
            // Intense music when deadline is near
            musicSystem.setBPM(150)
            this.timePressureActive = true
        } else if (timeLeft > threshold && this.timePressureActive) {
            musicSystem.setBPM(128)
            this.timePressureActive = false
        }
    }
    
    // ===================================================================
    // PLAYER ACTIONS
    // ===================================================================
    
    requestEarlyDeparture(shipId: string) {
        const ship = this.queue.ships.find(s => s.id === shipId)
        if (ship && ship.status === 'docked') {
            console.log(`🚢 ${ship.name} requested early departure`)
            this.forceDeparture(ship)
        }
    }
    
    extendDeadline(shipId: string, extraMinutes: number) {
        const ship = this.queue.ships.find(s => s.id === shipId)
        if (ship && ship.status === 'docked') {
            ship.departureDeadline += extraMinutes
            ship.timeRemaining += extraMinutes
            ship.turnaroundMinutes += extraMinutes
            console.log(`⏱️ ${ship.name} deadline extended by ${extraMinutes} mins`)
            this.notifyListeners()
        }
    }
    
    upgradeCompleted(shipId: string) {
        const ship = this.queue.ships.find(s => s.id === shipId)
        if (ship) {
            ship.upgradesCompleted++
            this.notifyListeners()
        }
    }
    
    // ===================================================================
    // GETTERS
    // ===================================================================
    
    getQueue(): TrafficQueue {
        return { ...this.queue }
    }
    
    getDockedShip(): TrafficShip | null {
        if (!this.queue.docked) return null
        return this.queue.ships.find(s => s.id === this.queue.docked) || null
    }
    
    getApproachingShips(): TrafficShip[] {
        return this.queue.ships.filter(s => this.queue.approaching.includes(s.id))
    }
    
    getQueuedShips(): TrafficShip[] {
        return this.queue.ships.filter(s => this.queue.queued.includes(s.id))
    }
    
    getTimeRemaining(shipId: string): number {
        const ship = this.queue.ships.find(s => s.id === shipId)
        return ship?.timeRemaining || 0
    }
    
    getDeadlineStatus(shipId: string): 'normal' | 'warning' | 'urgent' | 'critical' {
        const ship = this.queue.ships.find(s => s.id === shipId)
        if (!ship) return 'normal'
        
        if (ship.timeRemaining <= TRAFFIC_CONFIG.criticalThreshold) return 'critical'
        if (ship.timeRemaining <= TRAFFIC_CONFIG.urgentThreshold) return 'urgent'
        if (ship.timeRemaining <= TRAFFIC_CONFIG.warningThreshold) return 'warning'
        return 'normal'
    }
    
    // ===================================================================
    // CONFIGURATION
    // ===================================================================
    
    setDensityMultiplier(multiplier: number) {
        this.densityMultiplier = Math.max(0.1, Math.min(3, multiplier))
        this.generateDaySchedule()
    }
    
    setTimePressureMultiplier(multiplier: number) {
        this.timePressureMultiplier = Math.max(0.5, Math.min(2, multiplier))
        // Update existing ships
        this.queue.ships.forEach(ship => {
            if (ship.status === 'queued') {
                const baseTurnaround = TRAFFIC_CONFIG.turnaroundTimes[ship.type]
                ship.turnaroundMinutes = baseTurnaround * this.timePressureMultiplier
                ship.departureDeadline = ship.scheduledArrival + ship.turnaroundMinutes
            }
        })
    }
    
    setSimulationEvent(event: string | null) {
        this.simulationEvent = event
        if (event) {
            console.log(`🚨 Traffic Event: ${event}`)
            switch (event) {
                case 'surge':
                    // Spawn extra ships
                    for (let i = 0; i < 3; i++) {
                        this.scheduleShipArrival(i * 10)
                    }
                    break
                case 'strike':
                    // Cancel all queued ships
                    this.queue.queued = []
                    break
                case 'storm_delay':
                    // Delay all approaching ships
                    this.queue.ships.forEach(ship => {
                        if (ship.status === 'approaching') {
                            ship.scheduledArrival += 60
                        }
                    })
                    break
            }
        }
    }
    
    // ===================================================================
    // SUBSCRIPTION
    // ===================================================================
    
    subscribe(listener: (queue: TrafficQueue) => void): () => void {
        this.listeners.add(listener)
        listener(this.queue)
        return () => this.listeners.delete(listener)
    }
    
    private notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.queue)
            } catch (e) {
                console.error('Error in traffic system listener:', e)
            }
        })
    }
    
    // ===================================================================
    // CLEANUP
    // ===================================================================
    
    private cleanupDepartedShips() {
        const departed = this.queue.ships.filter(s => s.status === 'departed')
        if (departed.length > 10) {
            // Keep only last 10 departed ships
            const toRemove = departed.slice(0, departed.length - 10)
            this.queue.ships = this.queue.ships.filter(s => !toRemove.includes(s))
        }
    }
    
    // ===================================================================
    // STATS
    // ===================================================================
    
    getDailyStats() {
        const completed = this.queue.ships.filter(s => 
            this.queue.completed.includes(s.id)
        ).length
        const missed = this.queue.ships.filter(s => 
            this.queue.missed.includes(s.id)
        ).length
        
        const completionRate = completed + missed > 0 
            ? completed / (completed + missed) 
            : 0
            
        return {
            completed,
            missed,
            completionRate,
            totalReputation: this.queue.ships
                .filter(s => this.queue.completed.includes(s.id))
                .reduce((sum, s) => sum + s.reputationValue, 0)
        }
    }
}

// Export singleton
export const trafficSystem = new TrafficSystem()

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react'

export function useTrafficSystem() {
    const [queue, setQueue] = useState<TrafficQueue>(trafficSystem.getQueue())
    
    useEffect(() => {
        return trafficSystem.subscribe(setQueue)
    }, [])
    
    return queue
}

export function useDockedShip() {
    const [ship, setShip] = useState<TrafficShip | null>(trafficSystem.getDockedShip())
    
    useEffect(() => {
        return trafficSystem.subscribe(() => {
            setShip(trafficSystem.getDockedShip())
        })
    }, [])
    
    return ship
}
