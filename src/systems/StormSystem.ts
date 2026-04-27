// =============================================================================
// STORM SYSTEM - HarborGlow Tugboat Mode
// Timed storm escalation with wind forces and lightning for tugboat gameplay
// =============================================================================

import * as THREE from 'three'
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

  constructor() {
    this.state = {
      active: false,
      intensity: 0,
      duration: 180,
      elapsed: 0,
      windDirection: 0,
      windSpeed: 0,
      lightningFlash: false,
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
    weatherSystem.clearOverride()
    this.notifyListeners()
    console.log('🌤️ Storm ended')
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
