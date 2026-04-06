// =============================================================================
// VISUAL FEEDBACK SYSTEM - HarborGlow Phase 7-8 Polish
// Particle bursts, upgrade celebrations, underwater improvements
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import * as THREE from 'three'
import * as Tone from 'tone'
import { useGameStore, ShipType } from '../store/useGameStore'
import { GLASSMORPHISM, SHIP_COLORS } from './DesignSystem'

// =============================================================================
// PARTICLE BURST EFFECT - Triggered when light rig is installed
// =============================================================================

interface ParticleBurstProps {
  position: [number, number, number]
  color: string
  active: boolean
  onComplete?: () => void
}

export function ParticleBurst({ position, color, active, onComplete }: ParticleBurstProps) {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    z: number
    vx: number
    vy: number
    vz: number
    life: number
    maxLife: number
    size: number
  }>>([])
  
  const animationRef = useRef<number>()
  
  useEffect(() => {
    if (!active) return
    
    // Initialize particles
    const newParticles = Array.from({ length: 50 }, (_, i) => {
      const angle = (Math.random() * Math.PI * 2)
      const elevation = (Math.random() - 0.5) * Math.PI
      const speed = 2 + Math.random() * 4
      
      return {
        id: i,
        x: position[0],
        y: position[1],
        z: position[2],
        vx: Math.cos(angle) * Math.cos(elevation) * speed,
        vy: Math.sin(elevation) * speed + 2, // Slight upward bias
        vz: Math.sin(angle) * Math.cos(elevation) * speed,
        life: 1.0,
        maxLife: 1.0,
        size: 0.1 + Math.random() * 0.2,
      }
    })
    
    setParticles(newParticles)
    
    // Animate particles
    let lastTime = performance.now()
    
    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000
      lastTime = currentTime
      
      setParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.vx * delta,
          y: p.y + p.vy * delta,
          z: p.z + p.vz * delta,
          vy: p.vy - 9.8 * delta * 0.5, // Gravity
          life: p.life - delta * 1.5,
        })).filter(p => p.life > 0)
        
        if (updated.length === 0) {
          onComplete?.()
          return []
        }
        
        return updated
      })
      
      if (newParticles.length > 0) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active, position, onComplete])
  
  if (!active || particles.length === 0) return null
  
  return (
    <div style={particleBurstOverlayStyle}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            ...particleStyle,
            left: `calc(50% + ${p.x * 50}px)`,
            top: `calc(50% - ${p.y * 50}px)`,
            width: p.size * 20,
            height: p.size * 20,
            background: color,
            opacity: p.life,
            boxShadow: `0 0 ${10 * p.life}px ${color}`,
          }}
        />
      ))}
    </div>
  )
}

// =============================================================================
// SHIP FULLY UPGRADED CELEBRATION
// =============================================================================

interface ShipCelebrationProps {
  shipName: string
  shipType: ShipType
  active: boolean
  onComplete?: () => void
}

export function ShipFullyUpgradedCelebration({ shipName, shipType, active, onComplete }: ShipCelebrationProps) {
  const [phase, setPhase] = useState<'intro' | 'orbit' | 'explosion' | 'outro'>('intro')
  const [progress, setProgress] = useState(0)
  const colors = SHIP_COLORS[shipType]
  
  useEffect(() => {
    if (!active) return
    
    const phases = [
      { name: 'intro' as const, duration: 1000 },
      { name: 'orbit' as const, duration: 3000 },
      { name: 'explosion' as const, duration: 2000 },
      { name: 'outro' as const, duration: 1000 },
    ]
    
    let currentPhase = 0
    let startTime = Date.now()
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const current = phases[currentPhase]
      const phaseProgress = Math.min(1, elapsed / current.duration)
      
      setProgress(phaseProgress)
      
      if (phaseProgress >= 1) {
        currentPhase++
        if (currentPhase >= phases.length) {
          clearInterval(timer)
          onComplete?.()
        } else {
          startTime = Date.now()
          setPhase(phases[currentPhase].name)
        }
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [active, onComplete])
  
  if (!active) return null
  
  return (
    <div style={celebrationOverlayStyle}>
      {/* Background flash */}
      <div style={{
        ...celebrationFlashStyle,
        opacity: phase === 'explosion' ? 0.3 * (1 - progress) : 0,
      }} />
      
      {/* Main content */}
      <div style={{
        ...celebrationContentStyle,
        transform: `scale(${phase === 'intro' ? 0.5 + progress * 0.5 : phase === 'outro' ? 1 - progress * 0.5 : 1})`,
        opacity: phase === 'intro' ? progress : phase === 'outro' ? 1 - progress : 1,
      }}>
        {/* Icon */}
        <div style={{
          ...celebrationIconStyle,
          boxShadow: `0 0 60px ${colors.primary}`,
          borderColor: colors.primary,
        }}>
          <span style={{ fontSize: '48px' }}>✨</span>
        </div>
        
        {/* Title */}
        <h2 style={celebrationTitleStyle}>Ship Fully Upgraded!</h2>
        
        {/* Ship name */}
        <p style={{
          ...celebrationShipNameStyle,
          color: colors.primary,
          textShadow: `0 0 30px ${colors.primary}80`,
        }}>
          {shipName}
        </p>
        
        {/* Progress rings */}
        <div style={celebrationRingsStyle}>
          <div style={{
            ...celebrationRingStyle,
            borderColor: colors.primary,
            transform: `rotate(${progress * 360}deg)`,
          }} />
          <div style={{
            ...celebrationRingStyle,
            borderColor: colors.secondary,
            transform: `rotate(${-progress * 360}deg) scale(0.8)`,
          }} />
        </div>
        
        {/* Phase indicator */}
        <div style={celebrationPhaseStyle}>
          {phase === 'intro' && 'Preparing celebration...'}
          {phase === 'orbit' && 'Orbital camera sequence'}
          {phase === 'explosion' && 'Light explosion! '}
          {phase === 'outro' && 'Upgrade complete!'}
        </div>
      </div>
      
      {/* Particle effects */}
      {phase === 'explosion' && (
        <ParticleBurst
          position={[0, 0, 0]}
          color={colors.primary}
          active={true}
        />
      )}
    </div>
  )
}

// =============================================================================
// UNDERWATER GOD RAYS EFFECT
// =============================================================================

interface GodRaysProps {
  intensity: number
  shipPosition: [number, number, number]
}

export function UnderwaterGodRays({ intensity, shipPosition }: GodRaysProps) {
  const rays = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (i / 8) * Math.PI * 2,
    width: 0.3 + Math.random() * 0.4,
    length: 10 + Math.random() * 10,
    offset: Math.random() * Math.PI * 2,
  }))
  
  return (
    <div style={godRaysContainerStyle}>
      {rays.map(ray => (
        <div
          key={ray.id}
          style={{
            ...godRayStyle,
            left: `calc(50% + ${Math.sin(ray.angle) * 100 * intensity}px)`,
            top: '0',
            width: `${ray.width * 100 * intensity}px`,
            height: '100%',
            background: `linear-gradient(180deg, rgba(0,170,255,${0.2 * intensity}) 0%, transparent 60%)`,
            transform: `rotate(${ray.angle}rad)`,
            transformOrigin: 'top center',
            opacity: 0.3 + Math.sin(Date.now() / 1000 + ray.offset) * 0.2,
          }}
        />
      ))}
      
      {/* Glow from ship hull */}
      <div style={{
        ...shipGlowStyle,
        left: `calc(50% + ${shipPosition[0] * 30}px)`,
        top: `calc(50% - ${shipPosition[1] * 30}px)`,
        width: 200 * intensity,
        height: 200 * intensity,
        background: `radial-gradient(circle, rgba(0,212,170,${0.3 * intensity}) 0%, transparent 70%)`,
      }} />
    </div>
  )
}

// =============================================================================
// SOUND EFFECTS HELPER
// =============================================================================

export function useUpgradeSounds() {
  const playInstallSound = useCallback(async () => {
    try {
      const synth = new Tone.PolySynth(Tone.Synth).toDestination()
      synth.volume.value = -10
      
      // Play a pleasant chord
      synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n')
      
      // Add a sparkle effect
      const sparkle = new Tone.MetalSynth({
        harmonicity: 12,
        resonance: 800,
        modulationIndex: 20,
        envelope: { decay: 0.4, release: 0.2 },
        volume: -15,
      }).toDestination()
      
      sparkle.triggerAttackRelease('32n', '+0.1')
    } catch (e) {
      console.warn('Audio not available:', e)
    }
  }, [])
  
  const playCelebrationSound = useCallback(async () => {
    try {
      const synth = new Tone.PolySynth(Tone.Synth).toDestination()
      synth.volume.value = -5
      
      // Fanfare
      const now = Tone.now()
      synth.triggerAttackRelease('C4', '8n', now)
      synth.triggerAttackRelease('E4', '8n', now + 0.1)
      synth.triggerAttackRelease('G4', '8n', now + 0.2)
      synth.triggerAttackRelease('C5', '2n', now + 0.3)
      
      // Add bass
      const bass = new Tone.MembraneSynth().toDestination()
      bass.volume.value = -10
      bass.triggerAttackRelease('C2', '4n', now)
      bass.triggerAttackRelease('G2', '4n', now + 0.4)
    } catch (e) {
      console.warn('Audio not available:', e)
    }
  }, [])
  
  return { playInstallSound, playCelebrationSound }
}

// =============================================================================
// STYLES
// =============================================================================

const particleBurstOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 5000,
  perspective: '1000px',
}

const particleStyle: React.CSSProperties = {
  position: 'absolute',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  transition: 'none',
}

const celebrationOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 6000,
}

const celebrationFlashStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: '#fff',
  transition: 'opacity 0.1s',
}

const celebrationContentStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  borderRadius: GLASSMORPHISM.borderRadius,
  border: GLASSMORPHISM.border,
  boxShadow: GLASSMORPHISM.boxShadow,
  transition: 'all 0.3s ease',
}

const celebrationIconStyle: React.CSSProperties = {
  width: '100px',
  height: '100px',
  margin: '0 auto 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: '3px solid',
  background: 'rgba(0,0,0,0.3)',
}

const celebrationTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '24px',
  fontWeight: 700,
  color: '#fff',
  letterSpacing: '2px',
}

const celebrationShipNameStyle: React.CSSProperties = {
  margin: '0 0 24px 0',
  fontSize: '32px',
  fontWeight: 900,
}

const celebrationRingsStyle: React.CSSProperties = {
  position: 'relative',
  width: '150px',
  height: '150px',
  margin: '0 auto 24px',
}

const celebrationRingStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  border: '2px solid',
  borderRadius: '50%',
  borderTopColor: 'transparent',
  borderBottomColor: 'transparent',
  transition: 'transform 0.1s linear',
}

const celebrationPhaseStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'rgba(255,255,255,0.6)',
  letterSpacing: '1px',
}

const godRaysContainerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 100,
  overflow: 'hidden',
}

const godRayStyle: React.CSSProperties = {
  position: 'absolute',
  transition: 'opacity 0.5s ease',
  filter: 'blur(2px)',
}

const shipGlowStyle: React.CSSProperties = {
  position: 'absolute',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  filter: 'blur(20px)',
  transition: 'all 0.5s ease',
}
