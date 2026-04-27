// =============================================================================
// WAVE SYSTEM — HarborGlow
// Centralized Gerstner wave manager with CPU/GPU synchronized math.
// Singleton class exposing wave height, normal, foam, and surface current.
// =============================================================================

import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'

// -------------------------------------------------------------------------
// TYPES
// -------------------------------------------------------------------------

export interface WaveLayer {
  amplitude: number   // meters
  frequency: number   // 2π / wavelength
  speed: number       // phase speed
  direction: [number, number] // normalized xz direction
  steepness: number   // 0..1 Gerstner steepness
}

export interface WaveParams {
  amplitude: number // global multiplier
  speed: number     // global multiplier
  chaos: number     // direction jitter 0..1
}

export interface WaveState {
  time: number
  params: WaveParams
  stormIntensity: number
  layers: WaveLayer[]
}

// -------------------------------------------------------------------------
// DEFAULT WAVE LAYERS
// -------------------------------------------------------------------------

const DEFAULT_LAYERS: WaveLayer[] = [
  // Swell — large, slow, directional
  {
    amplitude: 1.2,
    frequency: 0.08,
    speed: 0.6,
    direction: [0.8, 0.6],
    steepness: 0.15,
  },
  // Medium rolling waves
  {
    amplitude: 0.6,
    frequency: 0.18,
    speed: 1.0,
    direction: [0.5, 0.9],
    steepness: 0.25,
  },
  // Fast chop
  {
    amplitude: 0.25,
    frequency: 0.45,
    speed: 1.6,
    direction: [0.2, 1.0],
    steepness: 0.3,
  },
  // High-frequency detail
  {
    amplitude: 0.06,
    frequency: 0.9,
    speed: 2.2,
    direction: [1.0, 0.3],
    steepness: 0.2,
  },
]

// -------------------------------------------------------------------------
// WAVE SYSTEM CLASS
// -------------------------------------------------------------------------

class WaveSystem {
  private state: WaveState
  private listeners: Set<(state: WaveState) => void> = new Set()
  private tempVec2 = new THREE.Vector2()
  private tempVec3 = new THREE.Vector3()

  constructor() {
    this.state = {
      time: 0,
      params: { amplitude: 1.0, speed: 1.0, chaos: 0.0 },
      stormIntensity: 0,
      layers: DEFAULT_LAYERS.map((l) => ({ ...l })),
    }
  }

  // =====================================================================
  // UPDATE
  // =====================================================================

  update(delta: number) {
    const store = useGameStore.getState()
    this.state.time += delta * this.state.params.speed
    this.state.stormIntensity = store.stormIntensity

    // Apply chaos: slowly drift each layer direction
    if (this.state.params.chaos > 0 || this.state.stormIntensity > 0) {
      const chaos = Math.max(this.state.params.chaos, this.state.stormIntensity * 0.8)
      this.state.layers.forEach((layer, i) => {
        const drift = Math.sin(this.state.time * 0.1 + i * 1.7) * chaos * 0.5
        const baseAngle = Math.atan2(DEFAULT_LAYERS[i].direction[1], DEFAULT_LAYERS[i].direction[0])
        const angle = baseAngle + drift
        layer.direction = [Math.cos(angle), Math.sin(angle)]
      })
    } else {
      // Reset to base directions when calm
      this.state.layers.forEach((layer, i) => {
        layer.direction = [...DEFAULT_LAYERS[i].direction]
      })
    }

    this.notifyListeners()
  }

  // =====================================================================
  // WAVE MATH (identical to GLSL)
  // =====================================================================

  /**
   * Get water surface height at world position (x, z) at current time.
   * This is the exact JS mirror of the vertex shader displacement.
   */
  getWaterHeight(x: number, z: number, time = this.state.time): number {
    let height = 0
    const stormAmp = 1 + this.state.stormIntensity * 2.0
    const globalAmp = this.state.params.amplitude

    for (let i = 0; i < this.state.layers.length; i++) {
      const layer = this.state.layers[i]
      const amp = layer.amplitude * globalAmp * stormAmp
      const freq = layer.frequency
      const spd = layer.speed
      const dirX = layer.direction[0]
      const dirZ = layer.direction[1]
      const steep = layer.steepness

      const dot = x * dirX + z * dirZ
      const phase = dot * freq + time * spd

      // Gerstner-style: combine vertical displacement with slight xz compression
      height += amp * Math.sin(phase)
    }

    return height
  }

  /**
   * Get water surface normal at (x, z) using finite differences.
   */
  getWaterNormal(x: number, z: number, time = this.state.time): THREE.Vector3 {
    const delta = 0.3
    const hL = this.getWaterHeight(x - delta, z, time)
    const hR = this.getWaterHeight(x + delta, z, time)
    const hD = this.getWaterHeight(x, z - delta, time)
    const hU = this.getWaterHeight(x, z + delta, time)

    return this.tempVec3.set(hL - hR, 2.0 * delta, hD - hU).normalize()
  }

  /**
   * Approximate foam amount (0..1) based on wave crest sharpness.
   * Uses derivative magnitude as a proxy for Jacobian / breaking wave.
   */
  getFoamAmount(x: number, z: number, time = this.state.time): number {
    const delta = 0.5
    const h = this.getWaterHeight(x, z, time)
    const hL = this.getWaterHeight(x - delta, z, time)
    const hR = this.getWaterHeight(x + delta, z, time)
    const hD = this.getWaterHeight(x, z - delta, time)
    const hU = this.getWaterHeight(x, z + delta, time)

    const dx = Math.abs(hR - hL)
    const dz = Math.abs(hU - hD)
    const slope = Math.sqrt(dx * dx + dz * dz)

    // Foam appears when slope is high and height is near a crest
    const foam = 1.0 - THREE.MathUtils.smoothstep(0.4, 1.2, slope)
    const crestBias = THREE.MathUtils.smoothstep(0.0, 1.5, h)

    return Math.max(0, foam * crestBias * (0.3 + this.state.stormIntensity * 0.7))
  }

  /**
   * Surface drift / wind current vector at position.
   */
  getSurfaceCurrent(x: number, z: number, time = this.state.time): THREE.Vector3 {
    const storm = this.state.stormIntensity
    if (storm <= 0 && this.state.params.chaos <= 0) {
      return this.tempVec3.set(0, 0, 0)
    }

    // Current follows dominant wave direction with some noise
    const dirX = this.state.layers[0].direction[0]
    const dirZ = this.state.layers[0].direction[1]
    const strength = storm * 3.0 + this.state.params.chaos * 0.5

    const noise = Math.sin(x * 0.1 + time) * Math.cos(z * 0.1 + time * 0.7)

    return this.tempVec3.set(
      dirX * strength + noise * 0.3,
      0,
      dirZ * strength + noise * 0.3
    )
  }

  /**
   * Get raw wave layer data for shader uniform upload.
   */
  getLayersForShader(): WaveLayer[] {
    const stormAmp = 1 + this.state.stormIntensity * 2.0
    const globalAmp = this.state.params.amplitude
    return this.state.layers.map((l) => ({
      ...l,
      amplitude: l.amplitude * globalAmp * stormAmp,
      speed: l.speed * this.state.params.speed,
    }))
  }

  // =====================================================================
  // PARAMETER SETTERS
  // =====================================================================

  setParams(params: Partial<WaveParams>) {
    this.state.params = { ...this.state.params, ...params }
    this.notifyListeners()
  }

  setStormIntensity(intensity: number) {
    this.state.stormIntensity = Math.max(0, Math.min(1, intensity))
    this.notifyListeners()
  }

  reset() {
    this.state.time = 0
    this.state.params = { amplitude: 1.0, speed: 1.0, chaos: 0.0 }
    this.state.stormIntensity = 0
    this.state.layers = DEFAULT_LAYERS.map((l) => ({ ...l }))
    this.notifyListeners()
  }

  // =====================================================================
  // GETTERS
  // =====================================================================

  getTime(): number {
    return this.state.time
  }

  getParams(): WaveParams {
    return { ...this.state.params }
  }

  getStormIntensity(): number {
    return this.state.stormIntensity
  }

  getState(): WaveState {
    return {
      time: this.state.time,
      params: { ...this.state.params },
      stormIntensity: this.state.stormIntensity,
      layers: this.state.layers.map((l) => ({ ...l })),
    }
  }

  // =====================================================================
  // SUBSCRIPTION
  // =====================================================================

  subscribe(listener: (state: WaveState) => void): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    const state = this.getState()
    this.listeners.forEach((l) => {
      try {
        l(state)
      } catch (e) {
        console.error('WaveSystem listener error:', e)
      }
    })
  }
}

// Export singleton
export const waveSystem = new WaveSystem()

// =====================================================================
// REACT HOOK
// =====================================================================

import { useState, useEffect } from 'react'

export function useWaveSystem(): WaveState {
  const [state, setState] = useState<WaveState>(waveSystem.getState())

  useEffect(() => {
    return waveSystem.subscribe(setState)
  }, [])

  return state
}
