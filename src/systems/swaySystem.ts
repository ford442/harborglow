// =============================================================================
// SWAY SYSTEM - HarborGlow Bay
// Realistic pendulum physics for crane hook/spreader with environmental effects
// =============================================================================

import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'
import { weatherSystem, WeatherType } from './weatherSystem'
import { moonSystem } from './moonSystem'
import { timeSystem } from './timeSystem'

// =============================================================================
// WEATHER-SWAY MAPPING
// =============================================================================

interface WeatherSwayProfile {
    baseMultiplier: number      // Base sway amplitude multiplier
    frequencyMultiplier: number // Oscillation speed
    gustIntensity: number       // Random gust strength (0-1)
    gustFrequency: number       // How often gusts happen (per minute)
    visualDifficulty: number    // 0-1 fog/rain visual impairment
}

const WEATHER_SWAY_PROFILES: Record<WeatherType, WeatherSwayProfile> = {
    clear: {
        baseMultiplier: 1.0,
        frequencyMultiplier: 1.0,
        gustIntensity: 0.15,
        gustFrequency: 2,
        visualDifficulty: 0
    },
    golden_hour: {
        baseMultiplier: 0.9,
        frequencyMultiplier: 0.95,
        gustIntensity: 0.2,
        gustFrequency: 2,
        visualDifficulty: 0.05
    },
    fog: {
        baseMultiplier: 1.2,
        frequencyMultiplier: 0.9,
        gustIntensity: 0.3,
        gustFrequency: 3,
        visualDifficulty: 0.4
    },
    rain: {
        baseMultiplier: 1.4,
        frequencyMultiplier: 1.1,
        gustIntensity: 0.45,
        gustFrequency: 5,
        visualDifficulty: 0.25
    },
    storm: {
        baseMultiplier: 2.0,
        frequencyMultiplier: 1.3,
        gustIntensity: 0.8,
        gustFrequency: 12,
        visualDifficulty: 0.5
    }
}

// =============================================================================
// WIND GUST SYSTEM
// =============================================================================

interface WindGust {
    strength: number        // 0-1
    direction: number       // radians
    duration: number        // seconds
    timeRemaining: number   // seconds
    peakTime: number        // when it reaches max (seconds from start)
}

// Simple noise function for more natural gust patterns
function noise(t: number): number {
    return Math.sin(t) * 0.5 + Math.sin(t * 2.1) * 0.25 + Math.sin(t * 4.3) * 0.125
}

function smoothstep(min: number, max: number, value: number): number {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)))
    return x * x * (3 - 2 * x)
}

// =============================================================================
// TYPES
// =============================================================================

export interface SwayState {
    // Pendulum angles (radians from vertical)
    angleX: number
    angleZ: number
    
    // Angular velocities
    velocityX: number
    velocityZ: number
    
    // Sway magnitude (0-1 for UI)
    magnitude: number
    stability: number      // 0-1, 1 = perfectly stable
    
    // Cable tension
    tension: number        // 0-1 normalized
    tensionRaw: number     // Actual force
    cableStretch: number   // Visual stretch amount
    
    // Environmental
    windEffect: number
    shipRocking: number
    
    // Load properties
    loadWeight: number     // tons
    isLoaded: boolean
    
    // Wind gust feedback (for UI)
    gustActive: boolean
    gustStrength: number   // 0-1 current gust intensity
    gustWarning: boolean  // true during strong gust
}

export interface SwayConfig {
    // Physics constants
    cableLength: number    // meters
    gravity: number        // m/s²
    dampingBase: number    // Base damping factor
    massContainer: number  // Base container weight (tons)
    massSpreader: number   // Spreader weight (tons)
    
    // Environmental multipliers
    windSwayMultiplier: number
    shipRockMultiplier: number
    tideSwayMultiplier: number
    
    // Visual
    maxVisualSway: number  // Max angle before visual limits
    cableSegments: number  // For rope visualization
}

export interface SwayForces {
    wind: THREE.Vector3
    shipMotion: THREE.Vector3
    trolleyAcceleration: THREE.Vector3
    playerDamping: THREE.Vector3
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: SwayConfig = {
    cableLength: 15,
    gravity: 9.81,
    dampingBase: 0.98,
    massContainer: 25,      // 25 ton average container
    massSpreader: 8,        // 8 ton spreader
    windSwayMultiplier: 0.3,
    shipRockMultiplier: 0.4,
    tideSwayMultiplier: 0.1,
    maxVisualSway: 0.4,     // ~23 degrees
    cableSegments: 10
}

// Tension color thresholds
const TENSION_COLORS = {
    safe: { r: 0, g: 1, b: 0.3 },      // Green
    caution: { r: 1, g: 0.8, b: 0 },   // Yellow
    danger: { r: 1, g: 0.2, b: 0.1 },  // Red
    critical: { r: 1, g: 0, b: 0 }     // Bright red
}

// =============================================================================
// SWAY SYSTEM CLASS
// =============================================================================

class SwaySystem {
    private state: SwayState
    private config: SwayConfig
    private forces: SwayForces
    private listeners: Set<(state: SwayState) => void> = new Set()
    private lastTrolleyPos: THREE.Vector3 = new THREE.Vector3()
    private trolleyVelocity: THREE.Vector3 = new THREE.Vector3()
    private shipRockPhase: number = 0
    
    // Debug overrides
    private debugWindStrength: number = 1
    private debugDampingMultiplier: number = 1
    private debugLoadMultiplier: number = 1
    private debugGustMultiplier: number = 1
    private showDebugLines: boolean = false
    
    // Wind gust simulation (improved)
    private activeGust: WindGust | null = null
    private nextGustTime: number = 0
    private gustHistory: { time: number; strength: number }[] = []
    private timeSinceGustStart: number = 0
    
    // Gust Leva overrides
    private debugGustFrequencyMult: number = 1
    private debugGustDurationMin: number = 0.8
    private debugGustDurationMax: number = 4.0
    
    // Feedback state
    private lastGustPeak: number = 0
    private gustWarningActive: boolean = false
    
    constructor() {
        this.config = { ...DEFAULT_CONFIG }
        this.state = this.getInitialState()
        this.forces = {
            wind: new THREE.Vector3(),
            shipMotion: new THREE.Vector3(),
            trolleyAcceleration: new THREE.Vector3(),
            playerDamping: new THREE.Vector3()
        }
    }
    
    private getInitialState(): SwayState {
        return {
            angleX: 0,
            angleZ: 0,
            velocityX: 0,
            velocityZ: 0,
            magnitude: 0,
            stability: 1,
            tension: 0.3,
            tensionRaw: 0,
            cableStretch: 0,
            windEffect: 0,
            shipRocking: 0,
            loadWeight: this.config.massSpreader,
            isLoaded: false,
            gustActive: false,
            gustStrength: 0,
            gustWarning: false
        }
    }
    
    // ========================================================================
    // MAIN UPDATE LOOP
    // ========================================================================
    
    update(deltaSeconds: number, trolleyPosition: THREE.Vector3, shipPosition?: THREE.Vector3) {
        const dt = Math.min(deltaSeconds, 0.05) // Cap for stability
        
        // Calculate trolley acceleration
        this.trolleyVelocity.subVectors(trolleyPosition, this.lastTrolleyPos).divideScalar(dt)
        this.lastTrolleyPos.copy(trolleyPosition)
        
        // Update environmental forces
        this.updateForces(dt, trolleyPosition, shipPosition)
        
        // Physics integration
        this.integratePhysics(dt)
        
        // Calculate derived values
        this.calculateTension()
        this.calculateMagnitude()
        
        // Apply skill-based damping
        this.applyPlayerDamping()
        
        this.notifyListeners()
    }
    
    private updateForces(dt: number, trolleyPos: THREE.Vector3, shipPos?: THREE.Vector3) {
        // Wind force from weather system
        const weather = weatherSystem.getState()
        const profile = WEATHER_SWAY_PROFILES[weather.type]
        const windStrength = weather.windSpeed * this.debugWindStrength
        const windDir = THREE.MathUtils.degToRad(weather.windDirection)
        
        // Update wind gusts
        this.updateGusts(dt, profile, windDir)
        
        // Update ship rocking and trolley forces
        this.updateShipRocking(dt, shipPos)
        
        // Calculate gust force from active gust
        let gustForceX = 0
        let gustForceZ = 0
        if (this.activeGust) {
            const gustStrength = this.activeGust.strength * (this.state.gustStrength / (this.activeGust.strength / profile.gustIntensity || 1))
            gustForceX = Math.cos(this.activeGust.direction) * gustStrength
            gustForceZ = Math.sin(this.activeGust.direction) * gustStrength
        }
        
        // Base wind force
        const baseWindForce = windStrength * this.config.windSwayMultiplier * profile.baseMultiplier * 0.01
        
        this.forces.wind.set(
            Math.cos(windDir) * baseWindForce + gustForceX,
            0,
            Math.sin(windDir) * baseWindForce + gustForceZ
        )
        
        // Add frequency effect to velocity (simulated by adjusting effective gravity)
        this.state.velocityX *= profile.frequencyMultiplier
        this.state.velocityZ *= profile.frequencyMultiplier
        
        // Calculate total wind effect for UI
        const gustContribution = this.activeGust ? this.activeGust.strength * 50 : 0
        this.state.windEffect = Math.min(1, (windStrength + gustContribution) / 40)
    }
    
    private updateGusts(dt: number, profile: WeatherSwayProfile, windDir: number) {
        const now = Date.now() / 1000 // seconds
        
        // Update active gust
        if (this.activeGust) {
            this.timeSinceGustStart += dt
            this.activeGust.timeRemaining -= dt
            
            // Calculate envelope (attack → sustain → release)
            const elapsed = this.timeSinceGustStart
            const duration = this.activeGust.duration
            const peakTime = this.activeGust.peakTime
            
            let envelope = 0
            if (elapsed < peakTime) {
                // Attack phase - smooth ramp up
                envelope = smoothstep(0, peakTime, elapsed)
            } else if (elapsed < duration - 0.5) {
                // Sustain phase - slight variation using noise
                const t = elapsed * 2
                envelope = 0.85 + noise(t) * 0.15
            } else {
                // Release phase - smooth fade out
                const releaseProgress = (elapsed - (duration - 0.5)) / 0.5
                envelope = Math.max(0, (1 - releaseProgress) * 0.85)
            }
            
            // Apply envelope to gust strength
            const currentStrength = this.activeGust.strength * envelope
            
            // Update state for feedback
            this.state.gustStrength = envelope
            this.state.gustActive = true
            
            // Trigger warning for strong gusts
            if (envelope > 0.6 && !this.gustWarningActive) {
                this.gustWarningActive = true
                this.state.gustWarning = true
                this.lastGustPeak = now
                
                // Console feedback
                if (profile.gustIntensity > 0.3) {
                    console.log(`💨 Wind gust! ${Math.round(envelope * 100)}% strength`)
                }
            } else if (envelope < 0.4) {
                this.gustWarningActive = false
                this.state.gustWarning = false
            }
            
            // End gust when time is up
            if (this.activeGust.timeRemaining <= 0) {
                this.activeGust = null
                this.state.gustActive = false
                this.state.gustStrength = 0
                this.gustWarningActive = false
                this.state.gustWarning = false
            }
        } else {
            // No active gust - check if we should spawn one
            if (now >= this.nextGustTime) {
                this.spawnGust(profile, windDir, now)
            } else {
                this.state.gustActive = false
                this.state.gustStrength = 0
                this.state.gustWarning = false
            }
        }
    }
    
    private spawnGust(profile: WeatherSwayProfile, windDir: number, now: number) {
        // Use noise for natural timing variation
        const noiseValue = noise(now * 0.1)
        
        // Duration with natural variation
        const minDuration = this.debugGustDurationMin
        const maxDuration = this.debugGustDurationMax
        const duration = minDuration + (maxDuration - minDuration) * (0.5 + noiseValue * 0.5)
        
        // Peak occurs at 30-50% of duration
        const peakTime = duration * (0.3 + Math.random() * 0.2)
        
        // Strength with intensity variation
        const baseStrength = profile.gustIntensity * this.debugGustMultiplier
        const variation = 0.6 + noise(now * 0.3) * 0.4
        const strength = baseStrength * variation
        
        // Direction variation
        const dirVariation = (noise(now * 0.2) - 0.5) * 0.8
        
        this.activeGust = {
            strength,
            direction: windDir + dirVariation,
            duration,
            timeRemaining: duration,
            peakTime
        }
        
        this.timeSinceGustStart = 0
        
        // Schedule next gust using noise-based interval
        const baseInterval = 60 / (profile.gustFrequency * this.debugGustFrequencyMult)
        const intervalVariation = 0.5 + noise(now * 0.15) * 1.0
        this.nextGustTime = now + duration + baseInterval * intervalVariation
        
        // Add to history
        this.gustHistory.push({ time: now, strength })
        if (this.gustHistory.length > 10) this.gustHistory.shift()
    }
    
    private updateShipRocking(dt: number, shipPos?: THREE.Vector3) {
        // Ship rocking effect
        if (shipPos) {
            this.shipRockPhase += dt * 0.5
            const tideHeight = moonSystem.getTideHeight()
            const rockAmplitude = this.config.shipRockMultiplier * (1 + Math.abs(tideHeight) * 0.3)
            
            this.forces.shipMotion.set(
                Math.sin(this.shipRockPhase) * rockAmplitude * 0.02,
                0,
                Math.cos(this.shipRockPhase * 0.7) * rockAmplitude * 0.015
            )
            
            this.state.shipRocking = Math.abs(Math.sin(this.shipRockPhase)) * rockAmplitude
        } else {
            this.forces.shipMotion.set(0, 0, 0)
            this.state.shipRocking = 0
        }
        
        // Trolley acceleration force (inertia)
        const accel = this.trolleyVelocity.length()
        this.forces.trolleyAcceleration.copy(this.trolleyVelocity).normalize().multiplyScalar(accel * 0.001)
    }
    
    private integratePhysics(dt: number) {
        // Effective cable length changes with tension
        const tensionFactor = 1 + this.state.tension * 0.05
        const effectiveLength = this.config.cableLength * tensionFactor
        
        // Natural frequency of pendulum
        const omega = Math.sqrt(this.config.gravity / effectiveLength)
        
        // Total external torque
        const torqueX = this.forces.wind.x + this.forces.shipMotion.x + this.forces.trolleyAcceleration.x
        const torqueZ = this.forces.wind.z + this.forces.shipMotion.z + this.forces.trolleyAcceleration.z
        
        // Pendulum equation: θ'' = -(g/L)sin(θ) - damping*θ' + torque
        const accelX = -omega * omega * Math.sin(this.state.angleX) + torqueX
        const accelZ = -omega * omega * Math.sin(this.state.angleZ) + torqueZ
        
        // Integrate acceleration
        this.state.velocityX += accelX * dt
        this.state.velocityZ += accelZ * dt
        
        // Apply damping (air resistance + internal friction)
        const totalDamping = this.config.dampingBase * this.debugDampingMultiplier
        this.state.velocityX *= totalDamping
        this.state.velocityZ *= totalDamping
        
        // Integrate velocity
        this.state.angleX += this.state.velocityX * dt
        this.state.angleZ += this.state.velocityZ * dt
        
        // Soft limit on max angle
        const maxAngle = this.config.maxVisualSway
        if (Math.abs(this.state.angleX) > maxAngle) {
            this.state.angleX *= 0.95
            this.state.velocityX *= 0.5
        }
        if (Math.abs(this.state.angleZ) > maxAngle) {
            this.state.angleZ *= 0.95
            this.state.velocityZ *= 0.5
        }
    }
    
    private calculateTension() {
        // Tension = mg*cos(θ) + mv²/L (centrifugal)
        const totalMass = (this.state.loadWeight + this.config.massSpreader) * this.debugLoadMultiplier
        const cosAngle = Math.cos(Math.sqrt(this.state.angleX ** 2 + this.state.angleZ ** 2))
        const velocitySq = this.state.velocityX ** 2 + this.state.velocityZ ** 2
        
        const gravityComponent = totalMass * this.config.gravity * cosAngle
        const centrifugal = totalMass * velocitySq / this.config.cableLength
        
        this.state.tensionRaw = gravityComponent + centrifugal
        
        // Normalize for UI (0-1, where 1 is near max safe tension)
        const maxTension = totalMass * this.config.gravity * 2
        this.state.tension = Math.min(1, this.state.tensionRaw / maxTension)
        
        // Cable stretch visualization
        this.state.cableStretch = this.state.tension * 0.5
    }
    
    private calculateMagnitude() {
        // Combined sway magnitude
        const angleMagnitude = Math.sqrt(this.state.angleX ** 2 + this.state.angleZ ** 2)
        const velocityMagnitude = Math.sqrt(this.state.velocityX ** 2 + this.state.velocityZ ** 2)
        
        // Magnitude considers both angle and velocity (momentum)
        this.state.magnitude = Math.min(1, (angleMagnitude / 0.3) * 0.7 + (velocityMagnitude / 0.5) * 0.3)
        
        // Stability is inverse of magnitude, with smoothing for UI
        const targetStability = 1 - this.state.magnitude
        this.state.stability = this.state.stability * 0.9 + targetStability * 0.1
    }
    
    // ========================================================================
    // PLAYER DAMPING (SKILL MECHANIC)
    // ========================================================================
    
    private applyPlayerDamping() {
        // Check if player is making counter-movements
        const craneState = useGameStore.getState()
        const joystickLeft = craneState.joystickLeft
        const joystickRight = craneState.joystickRight
        
        // Calculate if joystick input opposes sway direction
        const opposingX = joystickLeft.x * this.state.angleX < 0
        const opposingZ = joystickLeft.y * this.state.angleZ < 0
        
        if (opposingX || opposingZ) {
            // Skillful counter-movement reduces sway
            const dampingBoost = 0.95
            if (opposingX) this.state.velocityX *= dampingBoost
            if (opposingZ) this.state.velocityZ *= dampingBoost
            
            // Bonus stability for skill
            if (this.state.magnitude > 0.3 && Math.abs(joystickLeft.x) > 0.3) {
                // Trigger skill feedback
                this.onSkillfulDamping()
            }
        }
    }
    
    private skillStreak: number = 0
    private lastSkillTime: number = 0
    
    private onSkillfulDamping() {
        const now = Date.now()
        if (now - this.lastSkillTime < 1000) {
            this.skillStreak++
        } else {
            this.skillStreak = 1
        }
        this.lastSkillTime = now
        
        // Bonus for sustained skill
        if (this.skillStreak > 3) {
            console.log('🎯 Sway Master! +' + this.skillStreak + ' combo')
        }
    }
    
    // ========================================================================
    // LOAD MANAGEMENT
    // ========================================================================
    
    setLoadWeight(weight: number) {
        this.state.loadWeight = weight
        this.state.isLoaded = weight > this.config.massSpreader
    }
    
    attachContainer(weight: number = 25) {
        this.setLoadWeight(weight)
        // Initial jolt when attaching
        this.state.velocityX += (Math.random() - 0.5) * 0.05
        this.state.velocityZ += (Math.random() - 0.5) * 0.05
    }
    
    detachContainer() {
        this.setLoadWeight(this.config.massSpreader)
        // Rebound when releasing
        this.state.velocityX *= 1.2
        this.state.velocityZ *= 1.2
    }
    
    // ========================================================================
    // TENSION COLOR
    // ========================================================================
    
    getTensionColor(): THREE.Color {
        const t = this.state.tension
        let color: typeof TENSION_COLORS.safe
        
        if (t < 0.5) color = TENSION_COLORS.safe
        else if (t < 0.7) color = TENSION_COLORS.caution
        else if (t < 0.85) color = TENSION_COLORS.danger
        else color = TENSION_COLORS.critical
        
        return new THREE.Color(color.r, color.g, color.b)
    }
    
    // ========================================================================
    // CABLE VISUALIZATION
    // ========================================================================
    
    getCablePoints(origin: THREE.Vector3): THREE.Vector3[] {
        const points: THREE.Vector3[] = []
        const hookPos = this.getHookPosition(origin)
        
        // Calculate catenary curve with sag
        const segments = this.config.cableSegments
        for (let i = 0; i <= segments; i++) {
            const t = i / segments
            const point = new THREE.Vector3().lerpVectors(origin, hookPos, t)
            
            // Add sag (parabola)
            const sagAmount = (1 - Math.abs(t - 0.5) * 2) * (1 - this.state.tension) * 2
            point.y -= sagAmount
            
            points.push(point)
        }
        
        return points
    }
    
    getHookPosition(origin: THREE.Vector3): THREE.Vector3 {
        const effectiveLength = this.config.cableLength * (1 + this.state.cableStretch * 0.02)
        
        // Calculate hook position based on angles
        const hookOffset = new THREE.Vector3(
            Math.sin(this.state.angleX) * effectiveLength,
            -Math.cos(Math.sqrt(this.state.angleX ** 2 + this.state.angleZ ** 2)) * effectiveLength,
            Math.sin(this.state.angleZ) * effectiveLength
        )
        
        return origin.clone().add(hookOffset)
    }
    
    // ========================================================================
    // INSTALLATION PENALTY
    // ========================================================================
    
    getInstallationModifier(): number {
        // High sway reduces installation speed
        if (this.state.magnitude > 0.7) return 0.3   // 70% slower
        if (this.state.magnitude > 0.5) return 0.6   // 40% slower
        if (this.state.magnitude > 0.3) return 0.85  // 15% slower
        if (this.state.magnitude < 0.1) return 1.2   // 20% bonus for perfect control
        return 1.0
    }
    
    canInstall(): boolean {
        // Too much sway prevents installation
        return this.state.magnitude < 0.8 && this.state.tension < 0.95
    }
    
    // ========================================================================
    // DEBUG CONTROLS
    // ========================================================================
    
    setDebugWindStrength(strength: number) {
        this.debugWindStrength = Math.max(0, Math.min(3, strength))
    }
    
    setDebugDampingMultiplier(multiplier: number) {
        this.debugDampingMultiplier = Math.max(0.5, Math.min(2, multiplier))
    }
    
    setDebugLoadMultiplier(multiplier: number) {
        this.debugLoadMultiplier = Math.max(0.5, Math.min(3, multiplier))
    }
    
    setDebugGustMultiplier(multiplier: number) {
        this.debugGustMultiplier = Math.max(0, Math.min(3, multiplier))
    }
    
    setDebugGustFrequencyMultiplier(multiplier: number) {
        this.debugGustFrequencyMult = Math.max(0.1, Math.min(3, multiplier))
    }
    
    setDebugGustDurationRange(min: number, max: number) {
        this.debugGustDurationMin = Math.max(0.2, min)
        this.debugGustDurationMax = Math.max(this.debugGustDurationMin + 0.5, max)
    }
    
    setShowDebugLines(show: boolean) {
        this.showDebugLines = show
    }
    
    // Get gust info for UI
    isGustActive(): boolean {
        return this.state.gustActive
    }
    
    getGustStrength(): number {
        return this.state.gustStrength
    }
    
    isGustWarning(): boolean {
        return this.state.gustWarning
    }
    
    // Get current weather sway profile for UI
    getWeatherProfile(): WeatherSwayProfile {
        return WEATHER_SWAY_PROFILES[weatherSystem.getCurrentWeather()]
    }
    
    // Get visual difficulty from weather
    getVisualDifficulty(): number {
        return this.getWeatherProfile().visualDifficulty
    }
    
    getShowDebugLines(): boolean {
        return this.showDebugLines
    }
    
    // ========================================================================
    // GETTERS
    // ========================================================================
    
    getState(): SwayState {
        return { ...this.state }
    }
    
    getStability(): number {
        return this.state.stability
    }
    
    getMagnitude(): number {
        return this.state.magnitude
    }
    
    // ========================================================================
    // SUBSCRIPTION
    // ========================================================================
    
    subscribe(listener: (state: SwayState) => void): () => void {
        this.listeners.add(listener)
        listener(this.state)
        return () => this.listeners.delete(listener)
    }
    
    private notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state)
            } catch (e) {
                console.error('Error in sway system listener:', e)
            }
        })
    }
    
    // ========================================================================
    // RESET
    // ========================================================================
    
    reset() {
        this.state = this.getInitialState()
        this.trolleyVelocity.set(0, 0, 0)
        this.shipRockPhase = 0
        this.skillStreak = 0
        this.notifyListeners()
    }
}

// Export singleton
export const swaySystem = new SwaySystem()

// =============================================================================
// REACT HOOKS
// =============================================================================

import { useState, useEffect } from 'react'

export function useSwaySystem() {
    const [state, setState] = useState<SwayState>(swaySystem.getState())
    
    useEffect(() => {
        return swaySystem.subscribe(setState)
    }, [])
    
    return state
}

export function useStability(): number {
    const [stability, setStability] = useState(1)
    
    useEffect(() => {
        return swaySystem.subscribe((state) => {
            setStability(state.stability)
        })
    }, [])
    
    return stability
}
