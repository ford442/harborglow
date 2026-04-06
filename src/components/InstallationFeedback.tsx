// =============================================================================
// INSTALLATION FEEDBACK - HarborGlow Phase 9
// Screen effects, sound, and celebration for rig installation
// =============================================================================

import { useEffect, useState, useCallback } from 'react'
import * as Tone from 'tone'
import { useGameStore } from '../store/useGameStore'
import { useScreenShake } from '../hooks/useScreenShake'
import { RigType } from '../systems/attachmentSystem'

interface InstallationFeedbackProps {
  shipId: string
  partName: string
  rigType: RigType
  position: [number, number, number]
  onComplete?: () => void
}

// Sound effects using Tone.js
const playInstallSound = async (rigType: RigType) => {
  await Tone.start()
  
  const synth = new Tone.PolySynth(Tone.Synth).toDestination()
  const metal = new Tone.MetalSynth({
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
  }).toDestination()
  
  // Play satisfying mechanical lock sound
  const now = Tone.now()
  
  // Chord based on rig type
  const chords: Record<RigType, string[]> = {
    rgb_matrix: ['C5', 'E5', 'G5'],
    projector: ['D5', 'F#5', 'A5'],
    emergency_strobe: ['G4', 'B4', 'D5'],
    led_strip: ['F5', 'A5', 'C6'],
    searchlight: ['A4', 'C#5', 'E5'],
  }
  
  const chord = chords[rigType]
  
  // Mechanical "clunk"
  metal.triggerAttackRelease('32n', now)
  
  // Musical chime
  synth.triggerAttackRelease(chord, '8n', now + 0.05)
  
  // Sparkle effect
  const sparkle = new Tone.MetalSynth({
    harmonicity: 12,
    resonance: 800,
    modulationIndex: 20,
    envelope: { decay: 0.4, release: 0.2 },
    volume: -15,
  }).toDestination()
  
  sparkle.triggerAttackRelease('32n', now + 0.1)
}

// Play celebration sound for fully upgraded ship
const playCelebrationSound = async () => {
  await Tone.start()
  
  const synth = new Tone.PolySynth(Tone.Synth).toDestination()
  const bass = new Tone.MembraneSynth().toDestination()
  
  const now = Tone.now()
  
  // Fanfare
  synth.triggerAttackRelease('C5', '8n', now)
  synth.triggerAttackRelease('E5', '8n', now + 0.1)
  synth.triggerAttackRelease('G5', '8n', now + 0.2)
  synth.triggerAttackRelease('C6', '2n', now + 0.3)
  
  // Bass hit
  bass.triggerAttackRelease('C2', '4n', now)
  bass.triggerAttackRelease('G2', '4n', now + 0.4)
}

// Screen flash overlay
function ScreenFlash({ active, color }: { active: boolean; color: string }) {
  if (!active) return null
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: color,
        opacity: 0.3,
        pointerEvents: 'none',
        zIndex: 9999,
        animation: 'flash 0.3s ease-out',
      }}
    />
  )
}

// LOCKED text overlay
function LockedOverlay({ active }: { active: boolean }) {
  if (!active) return null
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9998,
        animation: 'locked-pop 0.5s ease-out',
      }}
    >
      <div
        style={{
          fontSize: '72px',
          fontWeight: 900,
          color: '#00ff00',
          textShadow: '0 0 40px #00ff00, 0 0 80px #00ff00',
          letterSpacing: '8px',
        }}
      >
        LOCKED
      </div>
    </div>
  )
}

// Progress ring overlay
function InstallProgressOverlay({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 50
  const strokeDashoffset = circumference * (1 - progress)
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9997,
      }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#00ff00"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 0.1s ease',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '24px',
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {Math.round(progress * 100)}%
      </div>
    </div>
  )
}

export default function InstallationFeedback({
  shipId,
  partName,
  rigType,
  position,
  onComplete,
}: InstallationFeedbackProps) {
  const [phase, setPhase] = useState<'idle' | 'installing' | 'locked' | 'celebrating'>('idle')
  const [progress, setProgress] = useState(0)
  const [showFlash, setShowFlash] = useState(false)
  
  const { triggerInstallationShake } = useScreenShake()
  const ships = useGameStore(state => state.ships)
  const installedUpgrades = useGameStore(state => state.installedUpgrades)
  
  const ship = ships.find(s => s.id === shipId)
  
  // Check if ship is fully upgraded
  const isFullyUpgraded = useCallback(() => {
    if (!ship) return false
    const upgradeCounts: Record<string, number> = {
      cruise: 8,
      container: 10,
      tanker: 8,
      bulk: 9,
      lng: 10,
      roro: 8,
      research: 7,
      droneship: 6,
    }
    const installed = installedUpgrades.filter(u => u.shipId === shipId).length
    return installed >= upgradeCounts[ship.type]
  }, [ship, shipId, installedUpgrades])
  
  useEffect(() => {
    // Start installation sequence
    setPhase('installing')
    
    // Play install sound
    playInstallSound(rigType)
    
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 1) {
          clearInterval(progressInterval)
          return 1
        }
        return p + 0.05
      })
    }, 50)
    
    // LOCKED phase
    const lockedTimeout = setTimeout(() => {
      setPhase('locked')
      setShowFlash(true)
      
      // Trigger screen shake
      if (ship) {
        triggerInstallationShake(ship.length)
      }
      
      // Hide flash after animation
      setTimeout(() => setShowFlash(false), 300)
      
      // Check for full upgrade celebration
      if (isFullyUpgraded()) {
        setTimeout(() => {
          setPhase('celebrating')
          playCelebrationSound()
          
          // Trigger camera orbit and light show
          // This would integrate with your camera/lighting systems
          
          // End celebration
          setTimeout(() => {
            setPhase('idle')
            onComplete?.()
          }, 3000)
        }, 500)
      } else {
        // End normally
        setTimeout(() => {
          setPhase('idle')
          onComplete?.()
        }, 1000)
      }
    }, 1000)
    
    return () => {
      clearInterval(progressInterval)
      clearTimeout(lockedTimeout)
    }
  }, [rigType, ship, triggerInstallationShake, isFullyUpgraded, onComplete])
  
  if (phase === 'idle') return null
  
  return (
    <>
      {/* Screen flash */}
      <ScreenFlash 
        active={showFlash} 
        color={phase === 'celebrating' ? '#00d4ff' : '#00ff00'} 
      />
      
      {/* LOCKED overlay */}
      <LockedOverlay active={phase === 'locked'} />
      
      {/* Progress overlay */}
      {phase === 'installing' && <InstallProgressOverlay progress={progress} />}
      
      {/* Celebration overlay */}
      {phase === 'celebrating' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 9996,
            animation: 'celebration-in 0.5s ease-out',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#fff',
              textShadow: '0 0 40px #00d4ff, 0 0 80px #00d4ff',
              textAlign: 'center',
            }}
          >
            SHIP FULLY UPGRADED!
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#00d4ff',
              marginTop: '16px',
            }}
          >
            {ship?.name || ship?.type}
          </div>
        </div>
      )}
      
      {/* CSS animations */}
      <style>{`
        @keyframes flash {
          0% { opacity: 0.5; }
          100% { opacity: 0; }
        }
        
        @keyframes locked-pop {
          0% { 
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes celebration-in {
          0% { 
            transform: scale(0.8);
            opacity: 0;
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
