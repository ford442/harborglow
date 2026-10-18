import { ShipType } from '../store/useGameStore'
import { getLightShowV2, LightCueV2, LightCuePattern, LightShowV2, RigGroupId, SHIP_BPM } from './lightShows'
import {
  RIG_GROUP_IDS,
  createRigGroupCueState,
  patternPulse,
  resolveRigGroupState,
  type RigGroupCueState,
} from './lightShows/rigCues'
import { simNowMs } from './sim/SimContext'

/** A show plays at least this long, rounded up to a whole number of loops. */
const MIN_SHOW_MS = 30000

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
    duration: MIN_SHOW_MS,
    bpm: 128,
  }

  private intensityMultiplier = 1.0
  private beatPulse = 0
  private activeCue: LightCueV2 | null = null
  /** Imported show (share link / .hgshow) that replaces the preset; plays until cleared. */
  private showOverride: LightShowV2 | null = null
  private cueState: { color: string; intensity: number; pattern: LightCuePattern; pulse: number } | null = null
  /** Per-rig-group cue state for the show ship, resolved in update(). */
  private groupStates = Object.fromEntries(
    RIG_GROUP_IDS.map((group) => [group, createRigGroupCueState()]),
  ) as Record<RigGroupId, RigGroupCueState>
  private groupStatesValid = false

  // ============================================================================
  // HARBOR LIGHT SHOW - Triggered on v2.0 upgrade
  // ============================================================================
  startHarborShow(shipId: string, shipType: ShipType) {
    const bpm = SHIP_BPM[shipType] ?? 128
    const show = this.showOverride ?? getLightShowV2(shipType)
    // End on a loop boundary, not mid-phrase. Ending is checked against sim time
    // in update(), so it is deterministic (the Harbor Festival waits on it).
    const loopMs = show ? show.loopBeats * (60 / bpm) * 1000 : 0
    const duration = loopMs > 0 ? Math.ceil(MIN_SHOW_MS / loopMs) * loopMs : MIN_SHOW_MS

    this.currentShow = {
      isActive: true,
      shipId,
      shipType,
      startTime: simNowMs(),
      duration,
      bpm,
    }

    console.log('🎆 HARBOR LIGHT SHOW ACTIVATED!')
    console.log(`   Ship: ${shipId} (${shipType})`)
    console.log(`   Duration: ${(duration / 1000).toFixed(1)} seconds`)
    console.log('   All LEDs, funnels, deck lights PULSING to beat!')
  }

  /** Install (or clear with null) a show that replaces the factory preset. */
  setShowOverride(show: LightShowV2 | null) {
    this.showOverride = show
    if (!show) this.endHarborShow()
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
    this.groupStatesValid = false
    this.beatPulse = 0
    this.intensityMultiplier = 1.0
  }

  // ============================================================================
  // UPDATE - Call in useFrame
  // ============================================================================
  update(time: number, bpm: number) {
    // An imported show loops until the override is cleared.
    if (
      this.currentShow.isActive &&
      !this.showOverride &&
      simNowMs() - this.currentShow.startTime >= this.currentShow.duration
    ) {
      this.endHarborShow()
    }

    if (this.currentShow.isActive) {
      const elapsed = simNowMs() - this.currentShow.startTime
      const progress = elapsed / this.currentShow.duration

      const effectiveBpm = this.currentShow.bpm || bpm
      const beatDuration = 60 / effectiveBpm
      const genericPulse = (Math.sin(time * (Math.PI * 2 / beatDuration)) + 1) / 2
      const show = this.showOverride ?? (this.currentShow.shipType ? getLightShowV2(this.currentShow.shipType) : undefined)

      if (show && show.cues.length > 0) {
        const elapsedBeats = (elapsed / 1000) / beatDuration
        const beatInLoop = elapsedBeats % show.loopBeats
        const active = this.resolveCue(show, elapsedBeats)

        this.activeCue = active
        this.beatPulse = patternPulse(active.pattern, beatInLoop)
        for (const group of RIG_GROUP_IDS) {
          resolveRigGroupState(show, group, beatInLoop, this.groupStates[group])
        }
        this.groupStatesValid = true
        this.intensityMultiplier = active.intensity
        this.cueState = {
          color: active.color,
          intensity: active.intensity,
          pattern: active.pattern,
          pulse: this.beatPulse,
        }
      } else {
        this.activeCue = null
        this.groupStatesValid = false
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
      this.groupStatesValid = false
    }
  }

  // Harbor-wide step function: the active cue is the last one starting at or
  // before the loop-relative beat, whatever it targets. It drives the global
  // beat pulse; per-rig-group playback (target/lengthBeats/easing) is
  // groupStates, read through getRigGroupState().
  private resolveCue(show: LightShowV2, elapsedBeats: number): LightCueV2 {
    const beatInLoop = elapsedBeats % show.loopBeats
    let active = show.cues[0]
    for (const cue of show.cues) {
      if (cue.beat <= beatInLoop) active = cue
      else break
    }
    return active
  }

  private applyCuePattern(baseIntensity: number, cue: LightCueV2): number {
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

    const hue = (simNowMs() / 1000 * 60) % 360
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

  getActiveCue(): LightCueV2 | null {
    return this.activeCue
  }

  getCueState(): { color: string; intensity: number; pattern: LightCuePattern; pulse: number } | null {
    return this.cueState
  }

  /**
   * Cue state of one rig group on the ship whose show is playing, or null when
   * that ship has no cue-driven show running (callers keep the global drive).
   * The returned object is reused every update; read it, don't keep it.
   */
  getRigGroupState(shipId: string, group: RigGroupId): RigGroupCueState | null {
    if (!this.groupStatesValid || this.currentShow.shipId !== shipId) return null
    return this.groupStates[group]
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
