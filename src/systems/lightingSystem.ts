import { ShipType } from '../store/useGameStore'
import { LightCue, LightCuePattern, SHIP_BPM, lightShowRegistry } from './lightShows'

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

class LightingSystem {
  private currentShow: LightShowState = {
    isActive: false,
    shipId: null,
    shipType: null,
    startTime: 0,
    duration: 30000, // 30 seconds
    bpm: 128
  }

  private intensityMultiplier: number = 1.0
  private beatPulse: number = 0
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
      bpm: SHIP_BPM[shipType] ?? 128
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

    this.cueState = null
    this.beatPulse = 0
    this.intensityMultiplier = 1.0
  }

  // ============================================================================
  // UPDATE - Call in useFrame
  // ============================================================================
  update(time: number, bpm: number) {
    if (this.currentShow.isActive) {
      const elapsedMs = Date.now() - this.currentShow.startTime
      const progress = elapsedMs / this.currentShow.duration

      const cues = this.currentShow.shipType ? lightShowRegistry[this.currentShow.shipType] : undefined

      if (cues && cues.length > 0) {
        const effectiveBpm = this.currentShow.bpm || bpm
        const beatDuration = 60 / effectiveBpm
        const currentBeat = elapsedMs / 1000 / beatDuration

        const active = this.resolveActiveCue(cues, currentBeat)
        const pulse = this.computePulse(active.pattern, currentBeat)

        this.beatPulse = pulse
        this.intensityMultiplier = active.intensity
        this.cueState = { color: active.color, intensity: active.intensity, pattern: active.pattern, pulse }
      } else {
        const beatDuration = 60 / bpm
        this.beatPulse = (Math.sin(time * (Math.PI * 2 / beatDuration)) + 1) / 2

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
      this.cueState = null
    }
  }

  private resolveActiveCue(cues: LightCue[], currentBeat: number): LightCue {
    if (currentBeat < cues[0].beat) {
      return cues[0]
    }

    let active = cues[0]
    for (let i = 1; i < cues.length; i++) {
      if (cues[i].beat <= currentBeat) {
        active = cues[i]
      } else {
        break
      }
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

  // ============================================================================
  // GETTERS for ship components
  // ============================================================================
  getLightIntensity(baseIntensity: number): number {
    if (!this.currentShow.isActive) return baseIntensity
    const quantizedBeat = Math.floor(this.beatPulse * 4) / 4
    return baseIntensity * this.intensityMultiplier * (1 + quantizedBeat * 0.5)
  }

  getEmissiveColor(baseColor: string, shipId: string): string {
    if (!this.currentShow.isActive || this.currentShow.shipId !== shipId) {
      return baseColor
    }

    if (this.cueState) {
      return this.cueState.color
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
