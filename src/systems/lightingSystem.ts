import { ShipType } from '../store/useGameStore'
import { getLightShow, LightCue, LightCuePattern, SHIP_BPM } from './lightShows'

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
  bpm: number
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
    duration: 30000, // 30 seconds
    bpm: 128,
  }

  private intensityMultiplier = 1.0
  private beatPulse = 0
  private activeCue: LightCue | null = null
  private cueState: { color: string; intensity: number; pattern: LightCuePattern; pulse: number } | null = null

  // ============================================================================
  // HARBOR LIGHT SHOW - Triggered on v2.0 upgrade
  // ============================================================================
  startHarborShow(shipId: string, shipType: ShipType) {
    this.currentShow = {
      isActive: true,
      shipId,
      shipType,
      startTime: Date.now(),
      duration: 30000,
      bpm: SHIP_BPM[shipType] ?? 128,
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
    }

    this.activeCue = null
    this.cueState = null
    this.beatPulse = 0
    this.intensityMultiplier = 1.0
  }

  // ============================================================================
  // UPDATE - Call in useFrame
  // ============================================================================
  update(time: number, bpm: number) {
    if (this.currentShow.isActive) {
      const elapsed = Date.now() - this.currentShow.startTime
      const progress = elapsed / this.currentShow.duration

      const effectiveBpm = this.currentShow.bpm || bpm
      const beatDuration = 60 / effectiveBpm
      const genericPulse = (Math.sin(time * (Math.PI * 2 / beatDuration)) + 1) / 2
      const schedule = this.currentShow.shipType ? getLightShow(this.currentShow.shipType) : undefined

      if (schedule && schedule.length > 0) {
        const elapsedBeats = (elapsed / 1000) / beatDuration
        const active = this.resolveCue(schedule, elapsedBeats)

        this.activeCue = active
        this.beatPulse = this.computePulse(active.pattern, elapsedBeats % CUE_LOOP_BEATS)
        this.intensityMultiplier = active.intensity
        this.cueState = {
          color: active.color,
          intensity: active.intensity,
          pattern: active.pattern,
          pulse: this.beatPulse,
        }
      } else {
        this.activeCue = null
        this.beatPulse = genericPulse

        if (progress < 0.2) {
          this.intensityMultiplier = 1.0 + progress * 5
        } else if (progress > 0.8) {
          this.intensityMultiplier = 1.0 + (1 - progress) * 5
        } else {
          this.intensityMultiplier = 2.0
        }

        this.cueState = null
      }
    } else {
      this.intensityMultiplier = 1.0
      this.beatPulse = 0
      this.activeCue = null
      this.cueState = null
    }
  }

  private resolveCue(schedule: LightCue[], elapsedBeats: number): LightCue {
    const beatInLoop = elapsedBeats % CUE_LOOP_BEATS
    let active = schedule[0]
    for (const cue of schedule) {
      if (cue.beat <= beatInLoop) active = cue
      else break
    }
    return active
  }

  private computePulse(pattern: LightCuePattern, currentBeat: number): number {
    switch (pattern) {
      case 'breathe':
        return (Math.sin(currentBeat * Math.PI / 2) + 1) / 2
      case 'sweep':
        return (currentBeat % 4) / 4
      case 'strobe':
        return ((currentBeat * 8) % 2) < 1 ? 1 : 0
      case 'snap': {
        const frac = currentBeat % 1
        return frac < 0.25 ? 1 - frac * 4 : 0
      }
      case 'blackout':
        return 0
      default:
        return 0
    }
  }

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

  getActiveCue(): LightCue | null {
    return this.activeCue
  }

  getCueState(): { color: string; intensity: number; pattern: LightCuePattern; pulse: number } | null {
    return this.cueState
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
          dramatic: true,
        }
      case 'rain':
        return {
          sunIntensity: 0.4,
          sunColor: '#666688',
          ambientIntensity: 0.3,
          ambientColor: '#2a2a3e',
          sideLightIntensity: 0.8,
          dramatic: false,
        }
      case 'fog':
        return {
          sunIntensity: 0.6,
          sunColor: '#8888aa',
          ambientIntensity: 0.4,
          ambientColor: '#3a3a4e',
          sideLightIntensity: 0.5,
          dramatic: false,
        }
      default: // clear
        return {
          sunIntensity: 1.2,
          sunColor: '#fff8e7',
          ambientIntensity: 0.6,
          ambientColor: '#ffffff',
          sideLightIntensity: 0.5,
          dramatic: false,
        }
    }
  }
}

export const lightingSystem = new LightingSystem()
