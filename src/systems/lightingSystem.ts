import { ShipType } from '../store/useGameStore'
import { getLightShow, LightCue } from './lightShows'

// =============================================================================
// LIGHTING SYSTEM - HarborGlow PBR Edition
// Manages harbor-wide light shows and weather-reactive lighting
// =============================================================================

export interface LightShowState {
  isActive: boolean
  shipId: string | null
  shipType: ShipType | null
  startTime: number
  duration: number
}

// Per-band cue schedules loop on this many beats — matches the 32-beat
// upgrade-cinematic cycle in cinematicSystem.ts (climax at beat 24, hide
// band name at beat 32).
const CUE_LOOP_BEATS = 32

class LightingSystem {
  private currentShow: LightShowState = {
    isActive: false,
    shipId: null,
    shipType: null,
    startTime: 0,
    duration: 30000 // 30 seconds
  }

  private intensityMultiplier: number = 1.0
  private beatPulse: number = 0
  private activeCue: LightCue | null = null

  // ============================================================================
  // HARBOR LIGHT SHOW - Triggered on v2.0 upgrade
  // ============================================================================
  startHarborShow(shipId: string, shipType: ShipType) {
    this.currentShow = {
      isActive: true,
      shipId,
      shipType,
      startTime: Date.now(),
      duration: 30000
    }
    
    console.log('🎆 HARBOR LIGHT SHOW ACTIVATED!')
    console.log(`   Ship: ${shipId} (${shipType})`)
    console.log('   Duration: 30 seconds')
    console.log('   All LEDs, funnels, deck lights PULSING to beat!')
    
    setTimeout(() => {
      this.endHarborShow()
    }, this.currentShow.duration)
  }

  endHarborShow() {
    if (this.currentShow.isActive) {
      console.log('🎆 Harbor light show complete!')
      this.currentShow.isActive = false
      this.currentShow.shipId = null
      this.currentShow.shipType = null
      this.activeCue = null
    }
  }

  // ============================================================================
  // UPDATE - Call in useFrame
  // ============================================================================
  update(time: number, bpm: number) {
    if (this.currentShow.isActive) {
      const elapsed = Date.now() - this.currentShow.startTime
      const progress = elapsed / this.currentShow.duration

      const beatDuration = 60 / bpm
      this.beatPulse = (Math.sin(time * (Math.PI * 2 / beatDuration)) + 1) / 2

      const schedule = this.currentShow.shipType ? getLightShow(this.currentShow.shipType) : undefined
      if (schedule) {
        const elapsedBeats = (elapsed / 1000) / beatDuration
        this.activeCue = this.resolveCue(schedule, elapsedBeats)
      } else {
        this.activeCue = null
      }

      if (progress < 0.2) {
        this.intensityMultiplier = 1.0 + progress * 5
      } else if (progress > 0.8) {
        this.intensityMultiplier = 1.0 + (1 - progress) * 5
      } else {
        this.intensityMultiplier = 2.0
      }
    } else {
      this.intensityMultiplier = 1.0
      this.beatPulse = 0
      this.activeCue = null
    }
  }

  // ============================================================================
  // CUE DISPATCH - Per-band LightCue[] schedules (src/systems/lightShows/)
  // ============================================================================

  /** Find the cue active at `elapsedBeats`, looping the schedule every CUE_LOOP_BEATS. */
  private resolveCue(schedule: LightCue[], elapsedBeats: number): LightCue | null {
    if (schedule.length === 0) return null
    const beatInLoop = elapsedBeats % CUE_LOOP_BEATS
    let active = schedule[0]
    for (const cue of schedule) {
      if (cue.beat <= beatInLoop) active = cue
      else break
    }
    return active
  }

  /** Apply a cue's pattern to a base intensity, modulated by the current beat pulse. */
  private applyCuePattern(baseIntensity: number, cue: LightCue): number {
    const beat = this.beatPulse
    switch (cue.pattern) {
      case 'breathe': {
        const breath = (Math.sin(beat * Math.PI * 0.5) + 1) / 2
        return baseIntensity * cue.intensity * this.intensityMultiplier * (0.6 + breath * 0.4)
      }
      case 'sweep': {
        const sweep = (Math.sin(beat * Math.PI * 2) + 1) / 2
        return baseIntensity * cue.intensity * this.intensityMultiplier * (0.5 + sweep * 0.5)
      }
      case 'strobe': {
        const flicker = beat > 0.5 ? 1 : 0.05
        return baseIntensity * cue.intensity * this.intensityMultiplier * flicker
      }
      case 'snap': {
        const quantizedBeat = Math.floor(beat * 4) / 4
        return baseIntensity * cue.intensity * this.intensityMultiplier * (0.3 + quantizedBeat * 0.7)
      }
      case 'blackout':
        return baseIntensity * 0.02
      default:
        return baseIntensity * cue.intensity * this.intensityMultiplier
    }
  }

  /** The currently active cue for the running show, or null if none/generic. */
  getActiveCue(): LightCue | null {
    return this.activeCue
  }

  // ============================================================================
  // GETTERS for ship components
  // ============================================================================
  getLightIntensity(baseIntensity: number): number {
    if (!this.currentShow.isActive) return baseIntensity

    if (this.activeCue) {
      return this.applyCuePattern(baseIntensity, this.activeCue)
    }

    const quantizedBeat = Math.floor(this.beatPulse * 4) / 4
    return baseIntensity * this.intensityMultiplier * (1 + quantizedBeat * 0.5)
  }

  getEmissiveColor(baseColor: string, shipId: string): string {
    if (!this.currentShow.isActive || this.currentShow.shipId !== shipId) {
      return baseColor
    }

    if (this.activeCue) {
      return this.activeCue.color
    }

    const hue = (Date.now() / 1000 * 60) % 360
    return `hsl(${hue}, 100%, 60%)`
  }

  isShowActive(): boolean {
    return this.currentShow.isActive
  }

  getCurrentShow(): LightShowState {
    return this.currentShow
  }

  getBeatPulse(): number {
    return this.beatPulse
  }

  // ============================================================================
  // CLIMAX TRIGGER - Called from musicSystem
  // ============================================================================
  triggerClimax(shipType: ShipType) {
    console.log(`🎵 CLIMAX SEQUENCE for ${shipType}!`)
    
    const originalMultiplier = this.intensityMultiplier
    this.intensityMultiplier = 3.0
    
    setTimeout(() => {
      this.intensityMultiplier = originalMultiplier
    }, 500)
  }

  // ============================================================================
  // WEATHER LIGHTING - Get lighting config based on weather
  // ============================================================================
  getWeatherLighting(weather: string) {
    switch (weather) {
      case 'storm':
        return {
          sunIntensity: 0.2,
          sunColor: '#444466',
          ambientIntensity: 0.15,
          ambientColor: '#1a1a2e',
          sideLightIntensity: 1.5,
          dramatic: true
        }
      case 'rain':
        return {
          sunIntensity: 0.4,
          sunColor: '#666688',
          ambientIntensity: 0.3,
          ambientColor: '#2a2a3e',
          sideLightIntensity: 0.8,
          dramatic: false
        }
      case 'fog':
        return {
          sunIntensity: 0.6,
          sunColor: '#8888aa',
          ambientIntensity: 0.4,
          ambientColor: '#3a3a4e',
          sideLightIntensity: 0.5,
          dramatic: false
        }
      default: // clear
        return {
          sunIntensity: 1.2,
          sunColor: '#fff8e7',
          ambientIntensity: 0.6,
          ambientColor: '#ffffff',
          sideLightIntensity: 0.5,
          dramatic: false
        }
    }
  }
}

export const lightingSystem = new LightingSystem()
