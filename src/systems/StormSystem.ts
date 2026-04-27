// =============================================================================
// STORM SYSTEM - HarborGlow Tugboat Mode
// Timed storm escalation with wind forces, lightning, thunder, and rain density.
// =============================================================================

import * as THREE from 'three'
import * as Tone from 'tone'
import { useGameStore } from '../store/useGameStore'
import { weatherSystem } from './weatherSystem'

// =============================================================================
// TYPES
// =============================================================================

export interface StormState {
  active: boolean
  intensity: number       // 0..1
  duration: number        // total seconds
  elapsed: number         // seconds since start
  windDirection: number   // radians
  windSpeed: number       // m/s
  lightningFlash: boolean // single-frame flash
  rainDensity: number     // 0..1
  visibility: number      // 0..1 (1 = clear, 0 = zero vis)
}

// =============================================================================
// STORM SYSTEM CLASS
// =============================================================================

class StormSystem {
  private state: StormState
  private listeners: Set<(state: StormState) => void> = new Set()
  private windDirTarget: number = 0
  private windDirCurrent: number = 0
  private lastLightning: number = 0
  private lightningEnd: number = 0
  private thunderSynth: Tone.NoiseSynth | null = null
  private thunderDelay: number = 0

  constructor() {
    this.state = {
      active: false,
      intensity: 0,
      duration: 180,
      elapsed: 0,
      windDirection: 0,
      windSpeed: 0,
      lightningFlash: false,
      rainDensity: 0,
      visibility: 1,
    }
    this.windDirTarget = Math.random() * Math.PI * 2
    this.windDirCurrent = this.windDirTarget
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  start(duration = 180) {
    this.state.active = true
    this.state.duration = duration
    this.state.elapsed = 0
    this.state.intensity = 0.2
    this.state.rainDensity = 0.3
    this.state.visibility = 0.7
    this.windDirTarget = Math.random() * Math.PI * 2
    this.windDirCurrent = this.windDirTarget
    this.lastLightning = 0
    this.lightningEnd = 0
    weatherSystem.forceWeather('storm')
    this.notifyListeners()
    console.log(`⛈️ Storm started — ${duration}s duration`)
  }

  stop() {
    this.state.active = false
    this.state.intensity = 0
    this.state.lightningFlash = false
    this.state.rainDensity = 0
    this.state.visibility = 1
    weatherSystem.clearOverride()
    this.notifyListeners()
    console.log('🌤️ Storm ended')
  }

  toggle() {
    if (this.state.active) {
      this.stop()
    } else {
      this.start()
    }
  }

  // ---------------------------------------------------------------------------
  // Audio
  // ---------------------------------------------------------------------------

  private initThunderSynth() {
    if (this.thunderSynth) return
    this.thunderSynth = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: {
        attack: 0.01,
        decay: 0.4,
        sustain: 0,
        release: 1.2,
      },
      volume: -5,
    }).toDestination()

    // Low rumble filter
    const filter = new Tone.Filter(200, 'lowpass').toDestination()
    this.thunderSynth.connect(filter)
  }

  private async playThunder(intensity: number) {
    try {
      this.initThunderSynth()
      await Tone.start()
      if (!this.thunderSynth) return

      const vol = Tone.gainToDb(Math.min(1, intensity * 0.8 + 0.2))
      this.thunderSynth.volume.rampTo(vol, 0.01)
      this.thunderSynth.triggerAttackRelease(
        0.3 + Math.random() * 0.4,
        Tone.now() + this.thunderDelay
      )

      // Secondary crack for high intensity
      if (intensity > 0.6) {
        const crack = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.1 },
          volume: vol + 3,
        }).toDestination()
        crack.triggerAttackRelease(0.05, Tone.now() + this.thunderDelay + 0.05)
      }
    } catch {
      // Audio context may not be started; ignore
    }
  }

  // ---------------------------------------------------------------------------
  // Per-frame update
  // ---------------------------------------------------------------------------

  update(delta: number) {
    if (!this.state.active) return

    this.state.elapsed += delta
    const progress = Math.min(1, this.state.elapsed / this.state.duration)

    // Intensity ramps from 0.2 -> 1.0 over duration
    this.state.intensity = 0.2 + progress * 0.8

    // Rain density follows intensity with slight lag
    this.state.rainDensity = this.state.intensity * (0.5 + Math.random() * 0.5)

    // Visibility drops as intensity rises
    this.state.visibility = Math.max(0.15, 1 - this.state.intensity * 0.85)

    // Wind direction drifts slowly
    this.windDirTarget += (Math.random() - 0.5) * 0.1 * delta
    this.windDirCurrent += (this.windDirTarget - this.windDirCurrent) * 0.5 * delta
    this.state.windDirection = this.windDirCurrent

    // Wind speed scales with intensity
    this.state.windSpeed = this.state.intensity * 25

    // Lightning
    this.state.lightningFlash = false
    const now = performance.now()
    if (now > this.lightningEnd) {
      const strikeProbability = this.state.intensity * 0.3 * delta
      if (Math.random() < strikeProbability) {
        this.state.lightningFlash = true
        this.lightningEnd = now + 150
        this.lastLightning = now

        // Thunder follows lightning after a distance delay
        this.thunderDelay = 0.2 + Math.random() * 0.8
        this.playThunder(this.state.intensity)
      }
    }

    // Sync to store for HUD
    useGameStore.getState().setStormIntensity(this.state.intensity)
    useGameStore.getState().setStormTimeRemaining(
      Math.max(0, this.state.duration - this.state.elapsed)
    )

    // Auto-end
    if (this.state.elapsed >= this.state.duration) {
      this.stop()
    }

    this.notifyListeners()
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  getWindForce(): THREE.Vector3 {
    if (!this.state.active) return new THREE.Vector3(0, 0, 0)
    const force = this.state.intensity * 15
    return new THREE.Vector3(
      Math.cos(this.state.windDirection) * force,
      0,
      Math.sin(this.state.windDirection) * force
    )
  }

  getWindVector(): THREE.Vector3 {
    if (!this.state.active) return new THREE.Vector3(0, 0, 0)
    return new THREE.Vector3(
      Math.cos(this.state.windDirection) * this.state.windSpeed,
      0,
      Math.sin(this.state.windDirection) * this.state.windSpeed
    )
  }

  getIntensity(): number {
    return this.state.intensity
  }

  getRainDensity(): number {
    return this.state.rainDensity
  }

  getVisibility(): number {
    return this.state.visibility
  }

  isActive(): boolean {
    return this.state.active
  }

  isLightningFlash(): boolean {
    return this.state.lightningFlash
  }

  getState(): StormState {
    return { ...this.state }
  }

  // ---------------------------------------------------------------------------
  // Listeners
  // ---------------------------------------------------------------------------

  subscribe(listener: (state: StormState) => void) {
    this.listeners.add(listener)
    listener(this.getState())
    return () => this.listeners.delete(listener)
  }

  unsubscribe(listener: (state: StormState) => void) {
    this.listeners.delete(listener)
  }

  private notifyListeners() {
    const state = this.getState()
    this.listeners.forEach((l) => {
      try {
        l(state)
      } catch (e) {
        console.error('StormSystem listener error:', e)
      }
    })
  }
}

export const stormSystem = new StormSystem()

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react'

export function useStormSystem(): StormState {
  const [state, setState] = useState<StormState>(stormSystem.getState())

  useEffect(() => {
    const unsubscribe = stormSystem.subscribe(setState)
    return () => { unsubscribe() }
  }, [])

  return state
}
