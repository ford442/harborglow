// =============================================================================
// TIME SYSTEM - HarborGlow Bay
// Accelerated day/night cycle with real SF Bay marine layer behavior
// 6 distinct phases, smooth sun/moon movement, realistic color temperature
// =============================================================================

import { useGameStore } from '../store/useGameStore'
import { harborEventSystem } from './eventSystem'
import { moonSystem, MoonState } from './moonSystem'

// =============================================================================
// CONSTANTS
// =============================================================================

// Time scaling: 1 real minute = 20 game minutes (default)
export const DEFAULT_TIME_SCALE = 20 // game minutes per real minute
export const MINUTES_PER_DAY = 1440
export const SECONDS_PER_MINUTE = 60

// Color temperatures (Kelvin)
export const COLOR_TEMPS = {
    PRE_DAWN: 1500,
    SUNRISE: 2000,
    GOLDEN_HOUR: 3000,
    MID_MORNING: 4000,
    MIDDAY: 5500,
    AFTERNOON: 5000,
    SUNSET: 2500,
    DUSK: 4000,
    NIGHT: 8000, // Moonlight
    DEEP_NIGHT: 10000
} as const

// Marine layer fog density (0-0.1)
export const FOG_DENSITY = {
    NIGHT_MAX: 0.045,
    PRE_DAWN: 0.040,
    SUNRISE: 0.030,
    MID_MORNING: 0.018,
    MIDDAY_MIN: 0.012,
    AFTERNOON: 0.015,
    GOLDEN_HOUR: 0.025,
    DUSK: 0.035,
    NIGHT_RETURN: 0.042
} as const

// =============================================================================
// TYPES
// =============================================================================

export type DayPhase = 
    | 'pre_dawn'      // 4:00-6:00
    | 'sunrise'       // 6:00-8:00
    | 'mid_morning'   // 8:00-11:00
    | 'midday'        // 11:00-16:00
    | 'golden_hour'   // 16:00-19:00
    | 'night'         // 19:00-4:00

export interface TimeState {
    // Time tracking
    gameTime: number        // Minutes since midnight (0-1440)
    dayNumber: number       // Days since start
    timeScale: number       // Game minutes per real minute
    
    // Sun/moon
    sunPosition: [number, number, number]
    moonPosition: [number, number, number]
    sunAltitude: number     // -90 to 90 degrees
    moonPhase: number       // 0-1 (0=new, 0.5=full)
    
    // Lighting
    colorTemperature: number    // Kelvin
    sunIntensity: number        // 0-2
    ambientIntensity: number    // 0-1
    
    // Atmosphere
    fogDensity: number
    fogColor: [number, number, number]
    skyColor: [number, number, number]
    
    // Phase
    currentPhase: DayPhase
    phaseProgress: number   // 0-1 within current phase
    
    // Display time
    hour: number           // 0-23
    minute: number         // 0-59
    
    // Moon system integration
    moonState: MoonState | null
}

export interface PhaseConfig {
    name: string
    startHour: number
    endHour: number
    colorTempStart: number
    colorTempEnd: number
    fogDensity: number
    sunIntensity: number
    ambientIntensity: number
    skyColor: [number, number, number]
    fogColor: [number, number, number]
    events: string[]
}

// =============================================================================
// PHASE CONFIGURATIONS
// =============================================================================

export const PHASES: Record<DayPhase, PhaseConfig> = {
    pre_dawn: {
        name: 'Pre-Dawn',
        startHour: 4,
        endHour: 6,
        colorTempStart: COLOR_TEMPS.DEEP_NIGHT,
        colorTempEnd: COLOR_TEMPS.PRE_DAWN,
        fogDensity: FOG_DENSITY.PRE_DAWN,
        sunIntensity: 0.05,
        ambientIntensity: 0.08,
        skyColor: [0.05, 0.05, 0.15],
        fogColor: [0.08, 0.08, 0.15],
        events: ['whale_breach_chance', 'early_dolphin']
    },
    sunrise: {
        name: 'Sunrise',
        startHour: 6,
        endHour: 8,
        colorTempStart: COLOR_TEMPS.SUNRISE,
        colorTempEnd: COLOR_TEMPS.GOLDEN_HOUR,
        fogDensity: FOG_DENSITY.SUNRISE,
        sunIntensity: 0.6,
        ambientIntensity: 0.25,
        skyColor: [0.9, 0.5, 0.3],
        fogColor: [0.7, 0.5, 0.4],
        events: ['whale_migration_peak', 'fog_rays', 'bird_chorus']
    },
    mid_morning: {
        name: 'Mid-Morning',
        startHour: 8,
        endHour: 11,
        colorTempStart: COLOR_TEMPS.MID_MORNING,
        colorTempEnd: COLOR_TEMPS.MIDDAY,
        fogDensity: FOG_DENSITY.MID_MORNING,
        sunIntensity: 1.0,
        ambientIntensity: 0.5,
        skyColor: [0.6, 0.75, 0.95],
        fogColor: [0.7, 0.75, 0.85],
        events: ['sea_lion_haulout', 'clear_operations']
    },
    midday: {
        name: 'Midday',
        startHour: 11,
        endHour: 16,
        colorTempStart: COLOR_TEMPS.MIDDAY,
        colorTempEnd: COLOR_TEMPS.AFTERNOON,
        fogDensity: FOG_DENSITY.MIDDAY_MIN,
        sunIntensity: 1.4,
        ambientIntensity: 0.7,
        skyColor: [0.5, 0.7, 1.0],
        fogColor: [0.75, 0.8, 0.9],
        events: ['heat_haze', 'shark_deep_water']
    },
    golden_hour: {
        name: 'Golden Hour',
        startHour: 16,
        endHour: 19,
        colorTempStart: COLOR_TEMPS.AFTERNOON,
        colorTempEnd: COLOR_TEMPS.SUNSET,
        fogDensity: FOG_DENSITY.GOLDEN_HOUR,
        sunIntensity: 0.7,
        ambientIntensity: 0.35,
        skyColor: [0.95, 0.6, 0.3],
        fogColor: [0.8, 0.55, 0.4],
        events: ['navy_arrival', 'dramatic_shadows', 'whale_song']
    },
    night: {
        name: 'Night',
        startHour: 19,
        endHour: 4, // Wraps around
        colorTempStart: COLOR_TEMPS.NIGHT,
        colorTempEnd: COLOR_TEMPS.DEEP_NIGHT,
        fogDensity: FOG_DENSITY.NIGHT_MAX,
        sunIntensity: 0,
        ambientIntensity: 0.05,
        skyColor: [0.02, 0.02, 0.08],
        fogColor: [0.05, 0.06, 0.12],
        events: ['bioluminescence_peak', 'neon_show', 'night_feeding']
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Convert Kelvin to RGB (approximation)
export function kelvinToRGB(kelvin: number): [number, number, number] {
    const temp = kelvin / 100
    let r: number, g: number, b: number
    
    // Red
    if (temp <= 66) {
        r = 255
    } else {
        r = 329.698727446 * Math.pow(temp - 60, -0.1332047592)
        r = Math.max(0, Math.min(255, r))
    }
    
    // Green
    if (temp <= 66) {
        g = 99.4708025861 * Math.log(temp) - 161.1195681661
    } else {
        g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492)
    }
    g = Math.max(0, Math.min(255, g))
    
    // Blue
    if (temp >= 66) {
        b = 255
    } else if (temp <= 19) {
        b = 0
    } else {
        b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307
        b = Math.max(0, Math.min(255, b))
    }
    
    return [r / 255, g / 255, b / 255]
}

// Smooth interpolation between values
export function smoothstep(min: number, max: number, value: number): number {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)))
    return x * x * (3 - 2 * x)
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

// Color interpolation
export function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
    return [
        lerp(a[0], b[0], t),
        lerp(a[1], b[1], t),
        lerp(a[2], b[2], t)
    ]
}

// Get phase from hour
export function getPhaseFromHour(hour: number): DayPhase {
    if (hour >= 4 && hour < 6) return 'pre_dawn'
    if (hour >= 6 && hour < 8) return 'sunrise'
    if (hour >= 8 && hour < 11) return 'mid_morning'
    if (hour >= 11 && hour < 16) return 'midday'
    if (hour >= 16 && hour < 19) return 'golden_hour'
    return 'night'
}

// Calculate sun position
export function calculateSunPosition(hour: number): { position: [number, number, number]; altitude: number } {
    // Map 6am (sunrise) to -PI/2, 12pm (noon) to 0, 6pm (sunset) to PI/2
    const sunAngle = ((hour - 6) / 12) * Math.PI - Math.PI / 2
    const altitude = Math.sin(sunAngle) * 90 // -90 to 90 degrees
    
    return {
        position: [
            Math.sin(sunAngle) * 100,  // East-West
            Math.cos(sunAngle) * 100,  // Height
            20                         // Slight north offset
        ],
        altitude
    }
}

// Calculate moon position
export function calculateMoonPosition(hour: number, day: number): { position: [number, number, number]; phase: number } {
    // Moon rises ~50 min later each day
    const moonOffset = (day * 50 / 60) % 24
    const moonHour = (hour + 24 - moonOffset) % 24
    
    // Moon visible 6pm to 6am roughly
    const moonAngle = ((moonHour - 18) / 12) * Math.PI - Math.PI / 2
    
    // Moon phase cycles every 28 days
    const phase = (day % 28) / 28
    
    return {
        position: [
            Math.sin(moonAngle) * 80,
            Math.max(0, Math.cos(moonAngle) * 80),
            -30
        ],
        phase
    }
}

// Calculate marine layer fog based on time
export function calculateMarineLayer(hour: number): number {
    // Real SF Bay pattern:
    // Max at night/dawn, burns off midday, returns evening
    
    if (hour >= 4 && hour < 8) {
        // Pre-dawn to sunrise: thick fog
        return lerp(FOG_DENSITY.PRE_DAWN, FOG_DENSITY.SUNRISE, smoothstep(4, 8, hour))
    } else if (hour >= 8 && hour < 12) {
        // Morning burn-off
        return lerp(FOG_DENSITY.SUNRISE, FOG_DENSITY.MIDDAY_MIN, smoothstep(8, 12, hour))
    } else if (hour >= 12 && hour < 16) {
        // Midday minimum
        return FOG_DENSITY.MIDDAY_MIN
    } else if (hour >= 16 && hour < 20) {
        // Evening return
        return lerp(FOG_DENSITY.MIDDAY_MIN, FOG_DENSITY.NIGHT_MAX, smoothstep(16, 20, hour))
    } else {
        // Night thick
        return FOG_DENSITY.NIGHT_MAX
    }
}

// =============================================================================
// TIME SYSTEM CLASS
// =============================================================================

class TimeSystem {
    private state: TimeState
    private lastUpdate: number = 0
    private phaseEventsTriggered: Set<string> = new Set()
    private listeners: Set<(state: TimeState) => void> = new Set()
    
    constructor() {
        // Start at sunrise for dramatic intro
        this.state = {
            gameTime: 6 * 60, // 6:00 AM
            dayNumber: 1,
            timeScale: DEFAULT_TIME_SCALE,
            sunPosition: [0, 0, 0],
            moonPosition: [0, 0, 0],
            sunAltitude: 0,
            moonPhase: 0,
            colorTemperature: COLOR_TEMPS.SUNRISE,
            sunIntensity: 0.6,
            ambientIntensity: 0.25,
            fogDensity: FOG_DENSITY.SUNRISE,
            fogColor: PHASES.sunrise.fogColor,
            skyColor: PHASES.sunrise.skyColor,
            currentPhase: 'sunrise',
            phaseProgress: 0,
            hour: 6,
            minute: 0,
            moonState: null
        }
        
        // Subscribe to moon system updates
        moonSystem.subscribe((moonState) => {
            this.state.moonState = moonState
        })
    }
    
    // Subscribe to time changes
    subscribe(listener: (state: TimeState) => void): () => void {
        this.listeners.add(listener)
        // Immediately call with current state
        listener(this.state)
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener)
        }
    }
    
    // Notify all listeners
    private notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state)
            } catch (e) {
                console.error('Error in time system listener:', e)
            }
        })
    }

    // ========================================================================
    // CORE UPDATE
    // ========================================================================
    
    update(deltaSeconds: number) {
        // Advance game time
        const gameMinutes = (deltaSeconds / 60) * this.state.timeScale
        this.advanceTime(gameMinutes)
        
        // Calculate all derived values
        this.recalculateState()
        
        // Update moon system (pass total game minutes for lunar cycle)
        const totalGameMinutes = this.state.dayNumber * MINUTES_PER_DAY + this.state.gameTime
        moonSystem.update(totalGameMinutes)
        
        // Sync to store
        this.syncToStore()
    }

    private advanceTime(minutes: number) {
        this.state.gameTime += minutes
        
        // Handle day wrap
        if (this.state.gameTime >= MINUTES_PER_DAY) {
            this.state.gameTime -= MINUTES_PER_DAY
            this.state.dayNumber++
            this.phaseEventsTriggered.clear() // Reset daily events
        }
    }

    private recalculateState() {
        const hour = this.state.gameTime / 60
        const currentPhase = getPhaseFromHour(hour)
        const phaseConfig = PHASES[currentPhase]
        
        // Calculate phase progress
        const phaseStart = phaseConfig.startHour
        const phaseEnd = phaseConfig.endHour
        let phaseProgress = 0
        
        // Handle night wrap-around
        if (currentPhase === 'night') {
            if (hour >= 19) {
                phaseProgress = (hour - 19) / 9
            } else {
                phaseProgress = (hour + 5) / 9
            }
        } else {
            phaseProgress = (hour - phaseStart) / (phaseEnd - phaseStart)
        }
        phaseProgress = Math.max(0, Math.min(1, phaseProgress))
        
        this.state.currentPhase = currentPhase
        this.state.phaseProgress = phaseProgress
        
        // Calculate sun position
        const sun = calculateSunPosition(hour)
        this.state.sunPosition = sun.position
        this.state.sunAltitude = sun.altitude
        
        // Calculate moon position
        const moon = calculateMoonPosition(hour, this.state.dayNumber)
        this.state.moonPosition = moon.position
        this.state.moonPhase = moon.phase
        
        // Interpolate color temperature
        this.state.colorTemperature = lerp(
            phaseConfig.colorTempStart,
            phaseConfig.colorTempEnd,
            phaseProgress
        )
        
        // Calculate fog density with marine layer pattern
        this.state.fogDensity = calculateMarineLayer(hour)
        
        // Interpolate colors
        this.state.skyColor = phaseConfig.skyColor
        this.state.fogColor = phaseConfig.fogColor
        
        // Calculate intensities
        this.state.sunIntensity = phaseConfig.sunIntensity
        this.state.ambientIntensity = phaseConfig.ambientIntensity
        
        // Set display time
        this.state.hour = Math.floor(hour)
        this.state.minute = Math.floor((hour % 1) * 60)
        
        // Trigger phase events
        this.checkPhaseEvents(currentPhase, phaseProgress)
        
        // Notify listeners
        this.notifyListeners()
    }

    private checkPhaseEvents(phase: DayPhase, progress: number) {
        const eventKey = `${phase}-${Math.floor(progress * 4) / 4}`
        
        if (!this.phaseEventsTriggered.has(eventKey)) {
            this.phaseEventsTriggered.add(eventKey)
            
            const config = PHASES[phase]
            
            // Trigger events based on phase
            config.events.forEach(eventType => {
                switch (eventType) {
                    case 'whale_migration_peak':
                        if (Math.random() > 0.5) {
                            harborEventSystem.triggerWhaleMigration('humpback')
                        }
                        break
                    case 'sea_lion_haulout':
                        if (Math.random() > 0.6) {
                            harborEventSystem.triggerSeaLionHaulout()
                        }
                        break
                    case 'navy_arrival':
                        if (Math.random() > 0.7) {
                            harborEventSystem.triggerNavyResupply()
                        }
                        break
                    case 'bioluminescence_peak':
                        // Boosts existing plankton bloom
                        break
                }
            })
        }
    }

    private syncToStore() {
        const store = useGameStore.getState()
        
        // Only update if significant change
        if (Math.abs(store.timeOfDay - this.state.gameTime / 60) > 0.1) {
            store.setTimeOfDay(this.state.gameTime / 60)
        }
    }

    // ========================================================================
    // GETTERS
    // ========================================================================
    
    getState(): TimeState {
        return { ...this.state }
    }

    getGameTime(): number {
        return this.state.gameTime
    }

    getGameHour(): number {
        return this.state.gameTime / 60
    }

    getFormattedTime(): string {
        const hours = Math.floor(this.state.gameTime / 60)
        const minutes = Math.floor(this.state.gameTime % 60)
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
    }

    getCurrentPhase(): DayPhase {
        return this.state.currentPhase
    }

    getPhaseName(): string {
        return PHASES[this.state.currentPhase].name
    }

    getColorTemperature(): number {
        return this.state.colorTemperature
    }

    getSunColor(): [number, number, number] {
        return kelvinToRGB(this.state.colorTemperature)
    }

    getFogDensity(): number {
        return this.state.fogDensity
    }

    getMoonPhase(): number {
        return this.state.moonPhase
    }

    getMoonPhaseName(): string {
        const phase = this.state.moonPhase
        if (phase < 0.125) return 'New Moon'
        if (phase < 0.25) return 'Waxing Crescent'
        if (phase < 0.375) return 'First Quarter'
        if (phase < 0.5) return 'Waxing Gibbous'
        if (phase < 0.625) return 'Full Moon'
        if (phase < 0.75) return 'Waning Gibbous'
        if (phase < 0.875) return 'Last Quarter'
        return 'Waning Crescent'
    }

    // Bioluminescence multiplier based on moon phase
    getBioluminescenceMultiplier(): number {
        // New moon = 1.5x, Full moon = 0.5x
        const phase = this.state.moonPhase
        const fullness = 1 - Math.abs(phase - 0.5) * 2
        return 1.5 - fullness
    }

    // Tide height modifier (-1 to 1) based on moon phase
    getTideModifier(): number {
        // Spring tides at new/full moon (0, 0.5)
        // Neap tides at quarter moons (0.25, 0.75)
        const phase = this.state.moonPhase
        return Math.cos(phase * Math.PI * 2)
    }

    // ========================================================================
    // SETTERS
    // ========================================================================
    
    setTimeScale(scale: number) {
        this.state.timeScale = Math.max(1, Math.min(120, scale))
    }

    setGameTime(hour: number, minute: number = 0) {
        this.state.gameTime = hour * 60 + minute
        this.recalculateState()
        
        // Sync moon system
        const totalGameMinutes = this.state.dayNumber * MINUTES_PER_DAY + this.state.gameTime
        moonSystem.update(totalGameMinutes)
    }

    jumpToPhase(phase: DayPhase) {
        const config = PHASES[phase]
        this.state.gameTime = config.startHour * 60
        this.recalculateState()
    }

    // ========================================================================
    // PAUSE / RESUME
    // ========================================================================
    
    private isPaused: boolean = false
    
    pause() {
        this.isPaused = true
    }

    resume() {
        this.isPaused = false
    }

    togglePause() {
        this.isPaused = !this.isPaused
    }

    getIsPaused(): boolean {
        return this.isPaused
    }
}

// Export singleton
export const timeSystem = new TimeSystem()

// Export phase info for UI
export function getPhaseDescription(phase: DayPhase): string {
    const descriptions: Record<DayPhase, string> = {
        pre_dawn: 'Thick marine layer, whales awakening',
        sunrise: 'Golden rays pierce through fog',
        mid_morning: 'Fog burns off, operations begin',
        midday: 'Clear skies, maximum visibility',
        golden_hour: 'Dramatic light, navy arrivals',
        night: 'Neon glow, bioluminescence blooms'
    }
    return descriptions[phase]
}

// Export time as percentage for sliders
export function getTimeAsPercent(gameTime: number): number {
    return (gameTime / MINUTES_PER_DAY) * 100
}

// Export percent to time
export function percentToTime(percent: number): number {
    return (percent / 100) * MINUTES_PER_DAY
}
