// =============================================================================
// WEATHER SYSTEM - HarborGlow Bay
// Dynamic weather with visual effects and gameplay impact
// =============================================================================

import { useGameStore } from '../store/useGameStore'
import { timeSystem, DayPhase } from './timeSystem'
import { musicSystem } from './musicSystem'

// =============================================================================
// TYPES
// =============================================================================

export type WeatherType = 'clear' | 'fog' | 'rain' | 'storm' | 'golden_hour'

export interface WeatherState {
    type: WeatherType
    intensity: number           // 0-1
    duration: number            // Minutes remaining
    windSpeed: number          // m/s
    windDirection: number      // degrees
    visibility: number         // 0-1
    temperature: number        // Celsius
    humidity: number           // 0-1
    
    // Visual multipliers
    fogDensity: number
    rainIntensity: number
    cloudCover: number
    
    // Gameplay effects
    craneSwayMultiplier: number
    craneSpeedMultiplier: number
    lightPenetration: number   // How well lights cut through weather
    bioluminescenceBoost: number
}

export interface WeatherTransition {
    from: WeatherType
    to: WeatherType
    duration: number
    progress: number
}

// =============================================================================
// CONSTANTS
// =============================================================================

const WEATHER_CONFIG: Record<WeatherType, Partial<WeatherState>> = {
    clear: {
        windSpeed: 5,
        visibility: 1.0,
        fogDensity: 0.0,
        rainIntensity: 0.0,
        cloudCover: 0.1,
        craneSwayMultiplier: 1.0,
        craneSpeedMultiplier: 1.0,
        lightPenetration: 1.0,
        bioluminescenceBoost: 1.0
    },
    golden_hour: {
        windSpeed: 3,
        visibility: 0.95,
        fogDensity: 0.02,
        rainIntensity: 0.0,
        cloudCover: 0.2,
        craneSwayMultiplier: 0.9,
        craneSpeedMultiplier: 1.05,
        lightPenetration: 1.1,
        bioluminescenceBoost: 0.8
    },
    fog: {
        windSpeed: 2,
        visibility: 0.3,
        fogDensity: 0.08,
        rainIntensity: 0.0,
        cloudCover: 0.8,
        craneSwayMultiplier: 0.8,
        craneSpeedMultiplier: 0.9,
        lightPenetration: 1.3,  // Lights cut through fog dramatically
        bioluminescenceBoost: 0.6
    },
    rain: {
        windSpeed: 12,
        visibility: 0.6,
        fogDensity: 0.03,
        rainIntensity: 0.5,
        cloudCover: 0.9,
        craneSwayMultiplier: 1.3,
        craneSpeedMultiplier: 0.95,
        lightPenetration: 0.8,
        bioluminescenceBoost: 0.9
    },
    storm: {
        windSpeed: 25,
        visibility: 0.25,
        fogDensity: 0.05,
        rainIntensity: 1.0,
        cloudCover: 1.0,
        craneSwayMultiplier: 1.8,
        craneSpeedMultiplier: 0.8,
        lightPenetration: 0.6,
        bioluminescenceBoost: 0.4
    }
}

// Weather probabilities by time of day
const WEATHER_SCHEDULE: Record<DayPhase, Record<WeatherType, number>> = {
    pre_dawn: { clear: 0.3, fog: 0.4, rain: 0.1, storm: 0.05, golden_hour: 0 },
    sunrise: { clear: 0.5, fog: 0.3, rain: 0.1, storm: 0.05, golden_hour: 0.05 },
    mid_morning: { clear: 0.6, fog: 0.15, rain: 0.15, storm: 0.05, golden_hour: 0.05 },
    midday: { clear: 0.7, fog: 0.05, rain: 0.15, storm: 0.05, golden_hour: 0.05 },
    golden_hour: { clear: 0.4, fog: 0.1, rain: 0.1, storm: 0.05, golden_hour: 0.35 },
    night: { clear: 0.5, fog: 0.25, rain: 0.15, storm: 0.1, golden_hour: 0 }
}

// =============================================================================
// WEATHER SYSTEM CLASS
// =============================================================================

class WeatherSystem {
    private state: WeatherState
    private transition: WeatherTransition | null = null
    private listeners: Set<(state: WeatherState) => void> = new Set()
    private lastLightning: number = 0
    private lightningActive: boolean = false
    private override: WeatherType | null = null
    
    constructor() {
        this.state = this.createWeatherState('clear', 0.5)
        this.state = { ...this.state, ...WEATHER_CONFIG.clear }
    }
    
    private createWeatherState(type: WeatherType, intensity: number): WeatherState {
        const base = WEATHER_CONFIG[type]
        return {
            type,
            intensity,
            duration: 60 + Math.random() * 120,
            windSpeed: base.windSpeed || 5,
            windDirection: Math.random() * 360,
            visibility: base.visibility || 1,
            temperature: 15 + Math.random() * 10,
            humidity: type === 'fog' ? 0.9 : type === 'rain' ? 0.8 : 0.6,
            fogDensity: base.fogDensity || 0,
            rainIntensity: base.rainIntensity || 0,
            cloudCover: base.cloudCover || 0,
            craneSwayMultiplier: base.craneSwayMultiplier || 1,
            craneSpeedMultiplier: base.craneSpeedMultiplier || 1,
            lightPenetration: base.lightPenetration || 1,
            bioluminescenceBoost: base.bioluminescenceBoost || 1
        }
    }
    
    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
    update(deltaSeconds: number) {
        const deltaMinutes = deltaSeconds * (timeSystem.getState().timeScale / 60)
        
        // Update transition
        if (this.transition) {
            this.transition.progress += deltaMinutes / this.transition.duration
            if (this.transition.progress >= 1) {
                this.state.type = this.transition.to
                this.transition = null
            } else {
                this.interpolateWeather(deltaMinutes)
            }
        }
        
        // Update duration
        this.state.duration -= deltaMinutes
        
        // Natural weather change
        if (this.state.duration <= 0 && !this.override) {
            this.selectNextWeather()
        }
        
        // Update wind variation
        this.state.windDirection += (Math.random() - 0.5) * 2
        this.state.windSpeed += (Math.random() - 0.5) * 0.5
        this.state.windSpeed = Math.max(0, this.state.windSpeed)
        
        // Update lightning for storms
        if (this.state.type === 'storm') {
            this.updateLightning()
        }
        
        this.notifyListeners()
    }
    
    private interpolateWeather(deltaMinutes: number) {
        if (!this.transition) return
        
        const fromConfig = WEATHER_CONFIG[this.transition.from]
        const toConfig = WEATHER_CONFIG[this.transition.to]
        const t = this.transition.progress
        
        // Smooth interpolation
        this.state.fogDensity = this.lerp(fromConfig.fogDensity || 0, toConfig.fogDensity || 0, t)
        this.state.rainIntensity = this.lerp(fromConfig.rainIntensity || 0, toConfig.rainIntensity || 0, t)
        this.state.visibility = this.lerp(fromConfig.visibility || 1, toConfig.visibility || 1, t)
        this.state.craneSwayMultiplier = this.lerp(fromConfig.craneSwayMultiplier || 1, toConfig.craneSwayMultiplier || 1, t)
        this.state.lightPenetration = this.lerp(fromConfig.lightPenetration || 1, toConfig.lightPenetration || 1, t)
    }
    
    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t
    }
    
    private selectNextWeather() {
        const currentPhase = timeSystem.getState().currentPhase
        const probabilities = WEATHER_SCHEDULE[currentPhase]
        
        const rand = Math.random()
        let cumulative = 0
        
        for (const [weather, prob] of Object.entries(probabilities)) {
            cumulative += prob
            if (rand <= cumulative) {
                this.transitionTo(weather as WeatherType, 5)
                break
            }
        }
    }
    
    // ========================================================================
    // LIGHTNING
    // ========================================================================
    
    updateLightning() {
        const now = Date.now()
        if (now - this.lastLightning > 5000 + Math.random() * 10000) {
            this.lightningActive = true
            this.lastLightning = now
            
            // Flash effect
            setTimeout(() => {
                this.lightningActive = false
            }, 150)
            
            // Thunder sound delay
            setTimeout(() => {
                console.log('⚡ Thunder!')
            }, 1000 + Math.random() * 2000)
        }
    }
    
    isLightning(): boolean {
        return this.lightningActive
    }
    
    // Alias for MainScene compatibility
    isLightningActive(): boolean {
        return this.lightningActive
    }
    
    getWeatherEffects() {
        return {
            fogDensity: this.state.fogDensity,
            rainDrops: this.state.rainIntensity > 0.1,
            rainIntensity: this.state.rainIntensity,
            lensFlare: this.state.type === 'golden_hour',
            desaturate: this.state.type === 'fog' ? 0.2 : 0,
            ambientLight: this.state.visibility
        }
    }
    
    // ========================================================================
    // TRANSITIONS
    // ========================================================================
    
    transitionTo(weather: WeatherType, durationMinutes: number = 5) {
        if (weather === this.state.type) return
        
        console.log(`🌦️ Weather changing: ${this.state.type} → ${weather}`)
        
        this.transition = {
            from: this.state.type,
            to: weather,
            duration: durationMinutes,
            progress: 0
        }
        
        // Music shift for storm
        if ((weather as string) === 'storm') {
            musicSystem.setBPM(140)
        } else if ((this.state.type as string) === 'storm' && (weather as string) !== 'storm') {
            musicSystem.setBPM(128)
        }
        
        this.notifyListeners()
    }
    
    forceWeather(weather: WeatherType) {
        this.override = weather
        this.transitionTo(weather, 2)
    }
    
    clearOverride() {
        this.override = null
        this.selectNextWeather()
    }
    
    // ========================================================================
    // CAMERA EFFECTS
    // ========================================================================
    
    getCameraEffects() {
        return {
            fogDensity: this.state.fogDensity,
            rainDrops: this.state.rainIntensity > 0.1,
            rainIntensity: this.state.rainIntensity,
            lensFlare: this.state.type === 'golden_hour',
            desaturate: this.state.type === 'fog' ? 0.2 : 0
        }
    }
    
    // ========================================================================
    // GETTERS
    // ========================================================================
    
    getState(): WeatherState {
        return { ...this.state }
    }
    
    getCurrentWeather(): WeatherType {
        return this.state.type
    }
    
    getCraneSwayMultiplier(): number {
        return this.state.craneSwayMultiplier
    }
    
    getCraneSpeedMultiplier(): number {
        return this.state.craneSpeedMultiplier
    }
    
    getVisibility(): number {
        return this.state.visibility
    }
    
    getLightPenetration(): number {
        return this.state.lightPenetration
    }
    
    getBioluminescenceMultiplier(): number {
        return this.state.bioluminescenceBoost
    }
    
    // ========================================================================
    // SUBSCRIPTION
    // ========================================================================
    
    subscribe(listener: (state: WeatherState) => void): () => void {
        this.listeners.add(listener)
        listener(this.state)
        return () => this.listeners.delete(listener)
    }
    
    private notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state)
            } catch (e) {
                console.error('Error in weather system listener:', e)
            }
        })
    }
    
    // ========================================================================
    // UTILITIES
    // ========================================================================
    
    getWeatherIcon(): string {
        const icons: Record<WeatherType, string> = {
            clear: '✨',
            golden_hour: '🌅',
            fog: '🌫️',
            rain: '🌧️',
            storm: '⛈️'
        }
        return icons[this.state.type]
    }
    
    getWeatherDescription(): string {
        const descriptions: Record<WeatherType, string> = {
            clear: 'Clear skies, excellent visibility',
            golden_hour: 'Golden hour, dramatic lighting',
            fog: 'Marine layer fog, reduced visibility',
            rain: 'Light rain, moderate crane sway',
            storm: 'Storm conditions, high wind warning'
        }
        return descriptions[this.state.type]
    }
}

// Export singleton
export const weatherSystem = new WeatherSystem()

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react'

export function useWeatherSystem() {
    const [state, setState] = useState<WeatherState>(weatherSystem.getState())
    
    useEffect(() => {
        return weatherSystem.subscribe(setState)
    }, [])
    
    return state
}
