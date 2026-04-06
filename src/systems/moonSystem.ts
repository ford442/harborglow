// =============================================================================
// MOON SYSTEM - HarborGlow Bay
// Realistic moon phases with visual and gameplay effects
// =============================================================================

import { useGameStore } from '../store/useGameStore'

// =============================================================================
// TYPES
// =============================================================================

export type MoonPhaseName = 
    | 'new_moon'
    | 'waxing_crescent'
    | 'first_quarter'
    | 'waxing_gibbous'
    | 'full_moon'
    | 'waning_gibbous'
    | 'last_quarter'
    | 'waning_crescent'

export interface MoonPhaseConfig {
    name: string
    icon: string
    illumination: number        // 0-1 (fraction of moon lit)
    lightIntensity: number      // Moonlight brightness multiplier
    colorTemp: number           // Kelvin (cooler = higher)
    tideMultiplier: number      // Effect on tide height
    bioluminescenceMult: number // Effect on plankton glow
    wildlifeActivity: number    // Effect on animal visibility
    godRayIntensity: number     // Moonlight shaft visibility underwater
}

export interface MoonState {
    // Position
    position: [number, number, number]
    altitude: number            // Above horizon
    azimuth: number             // Compass direction
    
    // Phase
    phase: MoonPhaseName
    phaseProgress: number       // 0-1 within current phase (8 phases = 3.5 days each)
    lunarDay: number           // 0-29.5 days in lunar cycle
    
    // Visual
    lightIntensity: number
    colorTemperature: number
    
    // Effects
    tideHeight: number         // -1 to 1 (low to high)
    bioluminescenceBoost: number
    wildlifeVisibility: number
    underwaterVisibility: number
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Lunar cycle: 29.53 days
export const LUNAR_CYCLE_DAYS = 29.53
export const LUNAR_CYCLE_MINUTES = LUNAR_CYCLE_DAYS * 24 * 60

// Moon phase configurations
export const MOON_PHASES: Record<MoonPhaseName, MoonPhaseConfig> = {
    new_moon: {
        name: 'New Moon',
        icon: '🌑',
        illumination: 0,
        lightIntensity: 0.02,
        colorTemp: 6500,
        tideMultiplier: 1.0,      // Spring tide (high)
        bioluminescenceMult: 1.5, // Maximum
        wildlifeActivity: 0.8,
        godRayIntensity: 0.1
    },
    waxing_crescent: {
        name: 'Waxing Crescent',
        icon: '🌒',
        illumination: 0.25,
        lightIntensity: 0.15,
        colorTemp: 6000,
        tideMultiplier: 0.7,
        bioluminescenceMult: 1.3,
        wildlifeActivity: 0.85,
        godRayIntensity: 0.2
    },
    first_quarter: {
        name: 'First Quarter',
        icon: '🌓',
        illumination: 0.5,
        lightIntensity: 0.35,
        colorTemp: 5500,
        tideMultiplier: 0.4,      // Neap tide (low)
        bioluminescenceMult: 1.0,
        wildlifeActivity: 0.9,
        godRayIntensity: 0.4
    },
    waxing_gibbous: {
        name: 'Waxing Gibbous',
        icon: '🌔',
        illumination: 0.75,
        lightIntensity: 0.6,
        colorTemp: 5200,
        tideMultiplier: 0.7,
        bioluminescenceMult: 0.7,
        wildlifeActivity: 0.95,
        godRayIntensity: 0.6
    },
    full_moon: {
        name: 'Full Moon',
        icon: '🌕',
        illumination: 1.0,
        lightIntensity: 0.85,
        colorTemp: 4800,
        tideMultiplier: 1.0,      // Spring tide (high)
        bioluminescenceMult: 0.4, // Minimum
        wildlifeActivity: 1.0,    // Peak visibility
        godRayIntensity: 1.0      // Maximum shafts
    },
    waning_gibbous: {
        name: 'Waning Gibbous',
        icon: '🌖',
        illumination: 0.75,
        lightIntensity: 0.6,
        colorTemp: 5000,
        tideMultiplier: 0.7,
        bioluminescenceMult: 0.6,
        wildlifeActivity: 0.9,
        godRayIntensity: 0.7
    },
    last_quarter: {
        name: 'Last Quarter',
        icon: '🌗',
        illumination: 0.5,
        lightIntensity: 0.35,
        colorTemp: 5500,
        tideMultiplier: 0.4,      // Neap tide
        bioluminescenceMult: 0.9,
        wildlifeActivity: 0.85,
        godRayIntensity: 0.4
    },
    waning_crescent: {
        name: 'Waning Crescent',
        icon: '🌘',
        illumination: 0.25,
        lightIntensity: 0.15,
        colorTemp: 6000,
        tideMultiplier: 0.7,
        bioluminescenceMult: 1.2,
        wildlifeActivity: 0.8,
        godRayIntensity: 0.2
    }
}

// Color temperature to RGB
export function colorTempToRGB(temp: number): [number, number, number] {
    // Simplified color temperature approximation
    // 4800K = warm silver, 6500K = cool blue-white
    const t = temp / 1000
    
    let r: number, g: number, b: number
    
    if (t <= 6.5) {
        r = 1.0
        g = Math.min(1.0, Math.pow(t / 6.5, 0.5))
        b = Math.min(1.0, Math.pow(t / 6.5, 2))
    } else {
        r = Math.min(1.0, Math.pow(6.5 / t, 0.5))
        g = Math.min(1.0, Math.pow(6.5 / t, 0.3))
        b = 1.0
    }
    
    return [r, g, b]
}

// =============================================================================
// MOON SYSTEM CLASS
// =============================================================================

class MoonSystem {
    private state: MoonState
    private listeners: Set<(state: MoonState) => void> = new Set()
    private overridePhase: MoonPhaseName | null = null
    private brightnessMultiplier: number = 1.0
    private tideStrength: number = 1.0
    
    constructor() {
        this.state = this.calculateState(0) // Start at new moon
    }
    
    // ========================================================================
    // SUBSCRIPTION
    // ========================================================================
    
    subscribe(listener: (state: MoonState) => void): () => void {
        this.listeners.add(listener)
        listener(this.state)
        return () => this.listeners.delete(listener)
    }
    
    private notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state)
            } catch (e) {
                console.error('Error in moon system listener:', e)
            }
        })
    }
    
    // ========================================================================
    // CORE CALCULATIONS
    // ========================================================================
    
    update(gameMinutes: number) {
        this.state = this.calculateState(gameMinutes)
        this.notifyListeners()
    }
    
    private calculateState(gameMinutes: number): MoonState {
        // Calculate lunar day (0-29.53)
        const lunarDay = (gameMinutes % LUNAR_CYCLE_MINUTES) / (24 * 60)
        
        // Determine phase based on lunar day
        const phase = this.getPhaseFromLunarDay(lunarDay)
        const config = MOON_PHASES[phase]
        
        // Calculate phase progress (0-1 within phase)
        const phaseIndex = Object.keys(MOON_PHASES).indexOf(phase)
        const phaseStart = phaseIndex * (LUNAR_CYCLE_DAYS / 8)
        const phaseEnd = (phaseIndex + 1) * (LUNAR_CYCLE_DAYS / 8)
        const phaseProgress = (lunarDay - phaseStart) / (phaseEnd - phaseStart)
        
        // Calculate moon position (simplified)
        // Moon rises ~50 min later each day
        const moonHour = (gameMinutes / 60) % 24
        const moonAngle = ((moonHour - 18) / 12) * Math.PI - Math.PI / 2
        const altitude = Math.max(0, Math.cos(moonAngle) * 90)
        
        // Calculate tide height
        // Spring tides at new/full moon (0, 14.75 days)
        // Neap tides at quarters (7.375, 22.125 days)
        const tideHeight = this.calculateTideHeight(lunarDay) * this.tideStrength
        
        return {
            position: [
                Math.sin(moonAngle) * 100,
                Math.max(0, Math.cos(moonAngle) * 100),
                -30
            ],
            altitude,
            azimuth: moonHour * 15, // 15 degrees per hour
            phase,
            phaseProgress: Math.max(0, Math.min(1, phaseProgress)),
            lunarDay,
            lightIntensity: config.lightIntensity * this.brightnessMultiplier,
            colorTemperature: config.colorTemp,
            tideHeight,
            bioluminescenceBoost: config.bioluminescenceMult,
            wildlifeVisibility: config.wildlifeActivity,
            underwaterVisibility: 0.3 + config.godRayIntensity * 0.7
        }
    }
    
    private getPhaseFromLunarDay(day: number): MoonPhaseName {
        // 8 phases over 29.53 days = ~3.69 days per phase
        const phaseIndex = Math.floor((day % LUNAR_CYCLE_DAYS) / (LUNAR_CYCLE_DAYS / 8))
        const phases: MoonPhaseName[] = [
            'new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
            'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent'
        ]
        return phases[Math.min(7, phaseIndex)]
    }
    
    private calculateTideHeight(lunarDay: number): number {
        // Spring tides at new moon (0) and full moon (14.75)
        // Neap tides at quarters (7.375, 22.125)
        const cyclePos = (lunarDay % LUNAR_CYCLE_DAYS) / LUNAR_CYCLE_DAYS
        
        // Two complete cycles per lunar month
        const tideCycle = Math.sin(cyclePos * Math.PI * 2)
        
        // Normalize to -1 to 1 range with spring/neap variation
        return tideCycle
    }
    
    // ========================================================================
    // GETTERS
    // ========================================================================
    
    getState(): MoonState {
        return { ...this.state }
    }
    
    getPhase(): MoonPhaseName {
        return this.state.phase
    }
    
    getPhaseConfig(): MoonPhaseConfig {
        return MOON_PHASES[this.state.phase]
    }
    
    getTideHeight(): number {
        return this.state.tideHeight
    }
    
    getBioluminescenceMultiplier(): number {
        return this.state.bioluminescenceBoost
    }
    
    getWildlifeActivityMultiplier(): number {
        return this.state.wildlifeVisibility
    }
    
    getMoonlightColor(): [number, number, number] {
        return colorTempToRGB(this.state.colorTemperature)
    }
    
    getGodRayIntensity(): number {
        return MOON_PHASES[this.state.phase].godRayIntensity
    }
    
    // ========================================================================
    // SETTERS (Leva Controls)
    // ========================================================================
    
    setPhaseOverride(phase: MoonPhaseName | null) {
        this.overridePhase = phase
        if (phase) {
            // Apply override to current state
            this.state = {
                ...this.state,
                phase,
                lightIntensity: MOON_PHASES[phase].lightIntensity * this.brightnessMultiplier,
                colorTemperature: MOON_PHASES[phase].colorTemp,
                bioluminescenceBoost: MOON_PHASES[phase].bioluminescenceMult,
                wildlifeVisibility: MOON_PHASES[phase].wildlifeActivity,
                underwaterVisibility: 0.3 + MOON_PHASES[phase].godRayIntensity * 0.7
            }
            this.notifyListeners()
        }
    }
    
    setBrightnessMultiplier(multiplier: number) {
        this.brightnessMultiplier = Math.max(0, Math.min(2, multiplier))
        const config = MOON_PHASES[this.state.phase]
        this.state.lightIntensity = config.lightIntensity * this.brightnessMultiplier
        this.notifyListeners()
    }
    
    setTideStrength(strength: number) {
        this.tideStrength = Math.max(0, Math.min(3, strength))
        this.state.tideHeight = this.calculateTideHeight(this.state.lunarDay) * this.tideStrength
        this.notifyListeners()
    }
    
    // ========================================================================
    // UTILITIES
    // ========================================================================
    
    // Fast-forward to specific phase (for testing)
    jumpToPhase(phase: MoonPhaseName) {
        const phaseIndex = Object.keys(MOON_PHASES).indexOf(phase)
        const lunarDay = phaseIndex * (LUNAR_CYCLE_DAYS / 8)
        const gameMinutes = lunarDay * 24 * 60
        this.state = this.calculateState(gameMinutes)
        this.notifyListeners()
    }
    
    // Get time until next phase
    getTimeUntilNextPhase(): number {
        const currentIndex = Object.keys(MOON_PHASES).indexOf(this.state.phase)
        const nextIndex = (currentIndex + 1) % 8
        const daysPerPhase = LUNAR_CYCLE_DAYS / 8
        const currentPhaseStart = currentIndex * daysPerPhase
        const nextPhaseStart = nextIndex * daysPerPhase
        const daysRemaining = nextPhaseStart - (this.state.lunarDay % LUNAR_CYCLE_DAYS)
        return daysRemaining * 24 * 60 // Return minutes
    }
}

// Export singleton
export const moonSystem = new MoonSystem()

// =============================================================================
// PHASE INFO FOR UI
// =============================================================================

export function getPhaseDescription(phase: MoonPhaseName): string {
    const descriptions: Record<MoonPhaseName, string> = {
        new_moon: 'Dark skies, brilliant bioluminescence, spring tides',
        waxing_crescent: 'Growing light, good plankton viewing',
        first_quarter: 'Half moon, neap tides, balanced conditions',
        waxing_gibbous: 'Bright nights, active wildlife, rising tides',
        full_moon: 'Maximum moonlight, peak wildlife, spring tides',
        waning_gibbous: 'Diminishing light, still excellent visibility',
        last_quarter: 'Half moon, neap tides, returning darkness',
        waning_crescent: 'Fading moon, bioluminescence strengthening'
    }
    return descriptions[phase]
}

export function getPhaseGameplayEffects(phase: MoonPhaseName): string[] {
    const effects: Record<MoonPhaseName, string[]> = {
        new_moon: ['🌊 Highest tides', '✨ Max bioluminescence', '🐋 Reduced whale visibility'],
        waxing_crescent: ['🌊 Moderate tides', '✨ Strong bioluminescence', '🐋 Good wildlife viewing'],
        first_quarter: ['🌊 Neap tides (low)', '✨ Normal plankton', '🐋 Excellent visibility'],
        waxing_gibbous: ['🌊 Rising tides', '✨ Dimming plankton', '🐋 Peak wildlife activity'],
        full_moon: ['🌊 Highest tides', '✨ Min bioluminescence', '🐋 Maximum wildlife visibility'],
        waning_gibbous: ['🌊 High tides', '✨ Low plankton glow', '🐋 Good wildlife viewing'],
        last_quarter: ['🌊 Neap tides (low)', '✨ Increasing plankton', '🐋 Good visibility'],
        waning_crescent: ['🌊 Moderate tides', '✨ Strong bioluminescence', '🐋 Wildlife less active']
    }
    return effects[phase]
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react'

export function useMoonSystem() {
    const [state, setState] = useState<MoonState>(moonSystem.getState())
    
    useEffect(() => {
        return moonSystem.subscribe(setState)
    }, [])
    
    return state
}
