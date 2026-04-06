// =============================================================================
// SCREEN SHAKE HOOK - HarborGlow Phase 9
// Reusable hook for camera shake effects with configurable intensity
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'

export interface ShakeConfig {
  intensity: number      // Base shake intensity (0-1)
  duration: number       // Duration in seconds
  decay: number         // Decay rate (0-1, higher = faster decay)
  direction?: [number, number, number]  // Optional direction vector
}

export interface ShakeState {
  x: number
  y: number
  z: number
  active: boolean
  intensity: number
}

const DEFAULT_CONFIG: ShakeConfig = {
  intensity: 0.5,
  duration: 0.5,
  decay: 0.9,
}

export function useScreenShake() {
  const [shake, setShake] = useState<ShakeState>({
    x: 0,
    y: 0,
    z: 0,
    active: false,
    intensity: 0,
  })
  
  const animationRef = useRef<number>()
  const shakeDataRef = useRef<{
    intensity: number
    decay: number
    timeLeft: number
    direction?: [number, number, number]
  } | null>(null)
  
  // Trigger a screen shake
  const triggerShake = useCallback((config: Partial<ShakeConfig> = {}) => {
    const fullConfig = { ...DEFAULT_CONFIG, ...config }
    
    shakeDataRef.current = {
      intensity: fullConfig.intensity,
      decay: fullConfig.decay,
      timeLeft: fullConfig.duration,
      direction: fullConfig.direction,
    }
    
    setShake(prev => ({ ...prev, active: true, intensity: fullConfig.intensity }))
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    let lastTime = performance.now()
    
    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000
      lastTime = currentTime
      
      const data = shakeDataRef.current
      if (!data || data.timeLeft <= 0) {
        setShake({ x: 0, y: 0, z: 0, active: false, intensity: 0 })
        return
      }
      
      // Decay intensity
      data.intensity *= Math.pow(data.decay, delta * 60)
      data.timeLeft -= delta
      
      // Calculate shake offset
      const getOffset = () => (Math.random() - 0.5) * 2 * data.intensity
      
      let x = getOffset()
      let y = getOffset()
      let z = getOffset()
      
      // Apply directional bias if specified
      if (data.direction) {
        const [dx, dy, dz] = data.direction
        const dirIntensity = data.intensity * 0.5
        x += dx * dirIntensity
        y += dy * dirIntensity
        z += dz * dirIntensity
      }
      
      setShake({
        x,
        y,
        z,
        active: true,
        intensity: data.intensity,
      })
      
      if (data.timeLeft > 0 && data.intensity > 0.01) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setShake({ x: 0, y: 0, z: 0, active: false, intensity: 0 })
        shakeDataRef.current = null
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }, [])
  
  // Trigger installation shake (bigger ships = bigger shake)
  const triggerInstallationShake = useCallback((shipLength: number = 100) => {
    // Scale intensity by ship size (larger ships = more impactful installation)
    const baseIntensity = 0.3
    const sizeScale = Math.min(shipLength / 100, 2) // Cap at 2x
    const intensity = baseIntensity * sizeScale
    
    triggerShake({
      intensity,
      duration: 0.4,
      decay: 0.85,
    })
  }, [triggerShake])
  
  // Trigger magnetic snap shake (subtle)
  const triggerSnapShake = useCallback(() => {
    triggerShake({
      intensity: 0.15,
      duration: 0.15,
      decay: 0.7,
    })
  }, [triggerShake])
  
  // Trigger tension shake (when load is heavy)
  const triggerTensionShake = useCallback((tension: number) => {
    if (tension < 0.5) return
    
    const intensity = (tension - 0.5) * 0.4 // Max 0.2 at tension=1
    
    triggerShake({
      intensity,
      duration: 0.1,
      decay: 0.6,
    })
  }, [triggerShake])
  
  // Stop shake immediately
  const stopShake = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    shakeDataRef.current = null
    setShake({ x: 0, y: 0, z: 0, active: false, intensity: 0 })
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  return {
    shake,
    triggerShake,
    triggerInstallationShake,
    triggerSnapShake,
    triggerTensionShake,
    stopShake,
  }
}
