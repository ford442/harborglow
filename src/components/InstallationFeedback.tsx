// =============================================================================
// INSTALLATION FEEDBACK - HarborGlow Phase 9
// Screen effects, sound, and celebration for rig installation
// =============================================================================

import { useEffect, useState, useCallback } from 'react'
import { Instrument, unlockAudio } from '../systems/audio/voices'
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

// Sound effects — instruments created once, on first use
let sounds: { synth: Instrument; metal: Instrument; sparkle: Instrument; bass: Instrument } | null = null

function getSounds() {
  sounds ??= {
    synth: new Instrument(),
    metal: new Instrument({ waveform: 'metal' }),
    sparkle: new Instrument({ waveform: 'metal', envelope: { decay: 0.4, release: 0.2 }, volumeDb: -15 }),
    bass: new Instrument({ waveform: 'membrane' }),
  }
  return sounds
}

const playInstallSound = async (rigType: RigType) => {
  await unlockAudio()

  const { synth, metal, sparkle } = getSounds()

  // Small lookahead so the clunk, chime and sparkle keep their spacing
  const now = 0.05

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
  metal.play(240, '32n', { delay: now })

  // Musical chime
  synth.play(chord, '8n', { delay: now + 0.05 })

  // Sparkle effect
  sparkle.play(240, '32n', { delay: now + 0.1 })
}

// Play celebration sound for fully upgraded ship
const playCelebrationSound = async () => {
  await unlockAudio()

  const { synth, bass } = getSounds()

  // Fanfare
  synth.play('C5', '8n')
  synth.play('E5', '8n', { delay: 0.1 })
  synth.play('G5', '8n', { delay: 0.2 })
  synth.play('C6', '2n', { delay: 0.3 })

  // Bass hit
  bass.play('C2', '4n')
  bass.play('G2', '4n', { delay: 0.4 })
}

// Chromatic full-screen flash overlay
function ChromaticFlash({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00ffff',
        opacity: 0.35,
        mixBlendMode: 'screen',
        backdropFilter: 'hue-rotate(30deg)',
        WebkitBackdropFilter: 'hue-rotate(30deg)',
        pointerEvents: 'none',
        zIndex: 10000,
        animation: 'chromatic-flash 0.15s ease-out forwards',
      }}
    />
  )
}

// Screen flash overlay (legacy, kept for celebration)
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

// CSS radial shockwave overlay
function RadialShockwaveOverlay({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '10vmin',
        height: '10vmin',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9995,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid rgba(0, 255, 255, 0.9)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.6), inset 0 0 20px rgba(0, 255, 255, 0.3)',
          animation: 'shockwave-expand 0.6s ease-out forwards',
        }}
      />
    </div>
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
          fontSize: '96px',
          fontWeight: 900,
          color: '#00ff00',
          textShadow:
            '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 40px #00ff00, 0 0 80px #00ff00, 0 0 120px #00cc00',
          letterSpacing: '10px',
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
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{
          filter: 'drop-shadow(0 0 8px currentColor)',
        }}
      >
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
            filter: 'drop-shadow(0 0 6px #00ff00)',
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
  rigType,
  onComplete,
}: InstallationFeedbackProps) {
  const [phase, setPhase] = useState<'idle' | 'installing' | 'locked' | 'celebrating'>('idle')
  const [progress, setProgress] = useState(0)
  const [showFlash, setShowFlash] = useState(false)
  const [showChromatic, setShowChromatic] = useState(false)
  const [showShockwave, setShowShockwave] = useState(false)

  const { triggerInstallationShake } = useScreenShake()
  const ships = useGameStore((state) => state.ships)
  const installedUpgrades = useGameStore((state) => state.installedUpgrades)

  const ship = ships.find((s) => s.id === shipId)

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
    const installed = installedUpgrades.filter((u) => u.shipId === shipId).length
    return installed >= upgradeCounts[ship.type]
  }, [ship, shipId, installedUpgrades])

  useEffect(() => {
    // Start installation sequence
    setPhase('installing')

    // Play install sound
    playInstallSound(rigType)

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((p) => {
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
      setShowChromatic(true)
      setShowShockwave(true)

      // Trigger screen shake
      if (ship) {
        triggerInstallationShake(ship.length)
      }

      // Hide flash after animation
      setTimeout(() => setShowFlash(false), 300)
      setTimeout(() => setShowChromatic(false), 150)
      setTimeout(() => setShowShockwave(false), 600)

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
      {/* Haptic-style shake wrapper */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9990,
          animation:
            phase === 'locked' ? 'haptic-shake 0.4s ease-in-out' : undefined,
        }}
      />

      {/* Chromatic flash */}
      <ChromaticFlash active={showChromatic} />

      {/* Screen flash */}
      <ScreenFlash
        active={showFlash}
        color={phase === 'celebrating' ? '#00d4ff' : '#00ff00'}
      />

      {/* Radial shockwave overlay */}
      <RadialShockwaveOverlay active={showShockwave} />

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

        @keyframes chromatic-flash {
          0% { opacity: 0.45; }
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

        @keyframes shockwave-expand {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(20);
            opacity: 0;
          }
        }

        @keyframes haptic-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, 2px); }
          20% { transform: translate(4px, -2px); }
          30% { transform: translate(-3px, -3px); }
          40% { transform: translate(3px, 3px); }
          50% { transform: translate(-2px, 1px); }
          60% { transform: translate(2px, -1px); }
          70% { transform: translate(-1px, -2px); }
          80% { transform: translate(1px, 2px); }
          90% { transform: translate(-1px, 1px); }
        }
      `}</style>
    </>
  )
}
