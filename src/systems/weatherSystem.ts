import { useGameStore } from '../store/useGameStore'

// =============================================================================
// WEATHER SYSTEM - HarborGlow
// Dynamic weather affecting visuals, fleet behavior, and music
// =============================================================================

export type WeatherState = 'clear' | 'rain' | 'fog' | 'storm'

export interface WeatherConfig {
  state: WeatherState
  intensity: number // 0.0 - 1.0
  startedAt: number
  nextChange: number
}

interface WeatherEffects {
  particleCount: number
  fogDensity: number
  skyColor: string
  ambientLight: number
  waveHeight: number
  emissiveReduction: number
  departureDelay: number
  returnSpeedModifier: number
  musicTempoModifier: number
  lightningChance: number
}

const WEATHER_CONFIGS: Record<WeatherState, WeatherEffects> = {
  clear: {
    particleCount: 0,
    fogDensity: 0.02,
    skyColor: '#87CEEB',
    ambientLight: 0.6,
    waveHeight: 0.5,
    emissiveReduction: 0,
    departureDelay: 0,
    returnSpeedModifier: 1.0,
    musicTempoModifier: 1.0,
    lightningChance: 0
  },
  rain: {
    particleCount: 1000,
    fogDensity: 0.04,
    skyColor: '#4a5568',
    ambientLight: 0.4,
    waveHeight: 0.8,
    emissiveReduction: 0.2, // -20% LED intensity
    departureDelay: 0,
    returnSpeedModifier: 1.0,
    musicTempoModifier: 0.95,
    lightningChance: 0.1
  },
  fog: {
    particleCount: 200,
    fogDensity: 0.12,
    skyColor: '#718096',
    ambientLight: 0.25,
    waveHeight: 0.3,
    emissiveReduction: 0.3,
    departureDelay: 5000, // 5 second delay
    returnSpeedModifier: 0.7, // 30% slower
    musicTempoModifier: 0.9,
    lightningChance: 0
  },
  storm: {
    particleCount: 3000,
    fogDensity: 0.08,
    skyColor: '#1a202c',
    ambientLight: 0.15,
    waveHeight: 1.5,
    emissiveReduction: 0.1,
    departureDelay: -1, // Special: 50% cancel chance
    returnSpeedModifier: 0.5,
    musicTempoModifier: 1.15, // Faster beat!
    lightningChance: 0.3
  }
}

class WeatherSystem {
  private current: WeatherConfig = {
    state: 'clear',
    intensity: 0,
    startedAt: Date.now(),
    nextChange: Date.now() + this.getRandomInterval()
  }
  
  private lightningActive: boolean = false
  private lastLightning: number = 0

  constructor() {
    // Start random weather change timer
    this.scheduleWeatherChange()
  }

  // ============================================================================
  // WEATHER STATE MANAGEMENT
  // ============================================================================
  setWeather(state: WeatherState, intensity: number = 0.5) {
    const oldState = this.current.state
    this.current = {
      state,
      intensity,
      startedAt: Date.now(),
      nextChange: Date.now() + this.getRandomInterval()
    }
    
    console.log(`🌤️ Weather changed: ${oldState} → ${state}`)
    console.log(`   Effects: ${this.getEffectDescription(state)}`)
    
    // Apply to game store
    const store = useGameStore.getState()
    store.setWeather(state)
    
    // Update music tempo
    this.updateMusicTempo(state)
  }

  getWeather(): WeatherConfig {
    return this.current
  }

  getWeatherEffects(): WeatherEffects {
    return WEATHER_CONFIGS[this.current.state]
  }

  // ============================================================================
  // RANDOM WEATHER CHANGES (every 3-5 minutes)
  // ============================================================================
  private getRandomInterval(): number {
    // 3-5 minutes in ms
    return Math.floor(Math.random() * 120000) + 180000
  }

  private scheduleWeatherChange() {
    setInterval(() => {
      const now = Date.now()
      if (now >= this.current.nextChange) {
        this.changeToRandomWeather()
      }
    }, 10000) // Check every 10 seconds
  }

  private changeToRandomWeather() {
    const states: WeatherState[] = ['clear', 'rain', 'fog', 'storm']
    const weights = [0.4, 0.3, 0.2, 0.1] // Clear most likely
    
    const random = Math.random()
    let cumulative = 0
    let newState: WeatherState = 'clear'
    
    for (let i = 0; i < states.length; i++) {
      cumulative += weights[i]
      if (random <= cumulative) {
        newState = states[i]
        break
      }
    }
    
    // Don't change if same
    if (newState !== this.current.state) {
      this.setWeather(newState, Math.random() * 0.5 + 0.3)
    } else {
      // Reschedule
      this.current.nextChange = Date.now() + this.getRandomInterval()
    }
  }

  // ============================================================================
  // FLEET EFFECTS
  // ============================================================================
  shouldCancelDeparture(): boolean {
    if (this.current.state !== 'storm') return false
    // 50% chance to cancel in storm
    return Math.random() < 0.5
  }

  getReturnSpeedModifier(): number {
    return WEATHER_CONFIGS[this.current.state].returnSpeedModifier
  }

  getEmissiveReduction(): number {
    return WEATHER_CONFIGS[this.current.state].emissiveReduction
  }

  // ============================================================================
  // LIGHTNING (storm only)
  // ============================================================================
  updateLightning() {
    if (this.current.state !== 'storm') {
      this.lightningActive = false
      return
    }
    
    const now = Date.now()
    const config = WEATHER_CONFIGS.storm
    
    // Random lightning
    if (!this.lightningActive && Math.random() < config.lightningChance / 60) {
      this.triggerLightning()
    }
    
    // End lightning flash
    if (this.lightningActive && now - this.lastLightning > 200) {
      this.lightningActive = false
    }
  }

  private triggerLightning() {
    this.lightningActive = true
    this.lastLightning = Date.now()
    console.log('⚡ LIGHTNING FLASH!')
  }

  isLightningActive(): boolean {
    return this.lightningActive
  }

  // ============================================================================
  // VISUAL GETTERS
  // ============================================================================
  getSkyColor(): string {
    return WEATHER_CONFIGS[this.current.state].skyColor
  }

  getFogDensity(): number {
    return WEATHER_CONFIGS[this.current.state].fogDensity
  }

  getAmbientLight(): number {
    return WEATHER_CONFIGS[this.current.state].ambientLight
  }

  getWaveHeight(): number {
    return WEATHER_CONFIGS[this.current.state].waveHeight
  }

  // ============================================================================
  // MUSIC INTEGRATION
  // ============================================================================
  private updateMusicTempo(weather: WeatherState) {
    const modifier = WEATHER_CONFIGS[weather].musicTempoModifier
    console.log(`🎵 Music tempo adjusted: ${Math.round(modifier * 100)}%`)
    
    // Apply via musicSystem
    const store = useGameStore.getState()
    const baseBPM = store.bpm
    store.setBPM(Math.round(baseBPM * modifier))
  }

  // ============================================================================
  // HELPERS
  // ============================================================================
  private getEffectDescription(state: WeatherState): string {
    const descriptions: Record<WeatherState, string> = {
      clear: 'Perfect visibility, normal operations',
      rain: 'LEDs -20% intensity, wave boost',
      fog: 'Reduced visibility, 30% slower returns',
      storm: '50% departure cancel, lightning, faster music!'
    }
    return descriptions[state]
  }

  // Manual control
  forceWeather(state: WeatherState) {
    console.log(`🌤️ Manual weather override: ${state}`)
    this.setWeather(state, 0.7)
  }
}

export const weatherSystem = new WeatherSystem()
