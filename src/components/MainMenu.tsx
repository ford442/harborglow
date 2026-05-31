// =============================================================================
// MAIN MENU COMPONENT — Phase 8 Audio-Reactive Edition
// Glassmorphism modals with beat-synced animations driven by intro music.
// =============================================================================

import { useState, useEffect, useRef } from 'react'
import { audioVisualSync } from '../systems/audioVisualSync'
import { introMusicSystem } from '../systems/introMusicSystem'
import { loadGameState } from '../utils/storage_manager'
export interface MainMenuProps {
    hasSave: boolean
    onNewGame: () => void
    onLoadGame: () => void
    onTraining?: () => void
    onTugboatMode?: () => void
}
import HowToPlayModal from './MainMenu/HowToPlayModal'
import SettingsModal from './MainMenu/SettingsModal'
import CreditsModal from './MainMenu/CreditsModal'
import ChangelogModal from './MainMenu/ChangelogModal'
import MenuButton from './MainMenu/MenuButton'
import {
    containerStyle,
    backgroundStyle,
    gradientOverlayStyle,
    particleStyle,
    harborGlowStyle,
    contentStyle,
    logoContainerStyle,
    titleStyle,
    titleGlowStyle,
    titleAccentStyle,
    titleUnderlineStyle,
    subtitleStyle,
    navStyle,
    hintStyle,
    kbdStyle,
    versionBadgeStyle,
    versionDotStyle,
    beatOrbStyle,
} from './MainMenu/styles'

type ModalType = 'settings' | 'credits' | 'howtoplay' | 'changelog' | null
const CURRENT_VERSION = 'v2.0.0'

function HarborLightsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fogNearRef = useRef<HTMLDivElement>(null)
  const fogFarRef = useRef<HTMLDivElement>(null)
  const mouseOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let w = 0, h = 0

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    }
    resize()
    window.addEventListener('resize', resize)

    const setFogTransform = () => {
      const { x } = mouseOffsetRef.current
      if (fogNearRef.current) fogNearRef.current.style.transform = `translateX(${x * 0.005}px)`
      if (fogFarRef.current) fogFarRef.current.style.transform = `translateX(${x * 0.012}px)`
    }

    const handleMouseMove = (event: MouseEvent) => {
      mouseOffsetRef.current.x = event.clientX - window.innerWidth / 2
      setFogTransform()
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Pre-generate lights
    const harborLights = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random(),
      y: 0.55 + Math.random() * 0.4,
      size: 1 + Math.random() * 3,
      color: i % 3 === 0 ? '#ffaa00' : i % 3 === 1 ? '#00d4aa' : '#ff6600',
      glowSize: 10 + Math.random() * 30,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
      blink: Math.random() > 0.7,
    }))

    const ships = Array.from({ length: 3 }, (_, i) => ({
      x: canvas.width + i * 260,
      y: 0.66 + Math.random() * 0.12,
      speed: 0.08 + Math.random() * 0.07,
      scale: 0.6 + Math.random() * 0.8,
      hue: i % 2 === 0 ? 210 : 25,
    }))

    const gulls: Array<{ x: number; y: number; speed: number; phase: number; scale: number }> = []
    let nextGullSpawnAt = 0

    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.5,
      size: Math.random() * 1.2 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 1,
    }))

    // Crane silhouette points
    const cranePoints = [
      { x: 0.15, y: 0.6 }, { x: 0.15, y: 0.35 }, { x: 0.35, y: 0.3 },
      { x: 0.35, y: 0.32 }, { x: 0.2, y: 0.36 }, { x: 0.2, y: 0.6 },
    ]

    const lighthouse = { x: 0.82, y: 0.55, beamAngle: 0 }

    const drawShip = (x: number, y: number, scale: number, hue: number) => {
      const shipWidth = 140 * scale
      const shipHeight = 36 * scale
      const keelY = y
      ctx.fillStyle = `hsl(${hue} 25% 10%)`
      ctx.beginPath()
      ctx.moveTo(x - shipWidth * 0.5, keelY)
      ctx.lineTo(x - shipWidth * 0.25, keelY - shipHeight * 0.08)
      ctx.lineTo(x + shipWidth * 0.25, keelY - shipHeight * 0.08)
      ctx.lineTo(x + shipWidth * 0.46, keelY - shipHeight * 0.48)
      ctx.lineTo(x + shipWidth * 0.32, keelY - shipHeight * 0.48)
      ctx.lineTo(x + shipWidth * 0.18, keelY - shipHeight * 0.26)
      ctx.lineTo(x - shipWidth * 0.38, keelY - shipHeight * 0.26)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = `hsl(${hue} 18% 18%)`
      ctx.fillRect(x - shipWidth * 0.12, keelY - shipHeight * 0.7, shipWidth * 0.22, shipHeight * 0.42)
      ctx.fillRect(x + shipWidth * 0.08, keelY - shipHeight * 0.92, shipWidth * 0.08, shipHeight * 0.24)
    }

    const drawGull = (gull: { x: number; y: number; speed: number; phase: number; scale: number }, t: number) => {
      const wing = Math.sin(t * 2 + gull.phase) * 8 * gull.scale
      ctx.strokeStyle = 'rgba(245, 248, 255, 0.7)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(gull.x - 10 * gull.scale, gull.y)
      ctx.bezierCurveTo(
        gull.x - 4 * gull.scale,
        gull.y - 8 * gull.scale - wing,
        gull.x + 2 * gull.scale,
        gull.y - 8 * gull.scale - wing,
        gull.x + 10 * gull.scale,
        gull.y
      )
      ctx.bezierCurveTo(
        gull.x + 2 * gull.scale,
        gull.y - 4 * gull.scale + wing * 0.25,
        gull.x - 2 * gull.scale,
        gull.y - 4 * gull.scale + wing * 0.25,
        gull.x - 10 * gull.scale,
        gull.y
      )
      ctx.stroke()
    }

    const render = (time: number) => {
      const t = time * 0.001
      const audio = audioVisualSync.analyze(t)
      ctx.clearRect(0, 0, w, h)

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6)
      skyGrad.addColorStop(0, '#02040a')
      skyGrad.addColorStop(1, '#0a1a2e')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      // Stars
      stars.forEach(star => {
        const twinkle = 0.3 + 0.7 * Math.sin(t * star.speed + star.phase)
        ctx.fillStyle = `rgba(200, 220, 255, ${twinkle * 0.8})`
        ctx.beginPath()
        ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Water
      const waterY = h * 0.6
      const waterGrad = ctx.createLinearGradient(0, waterY, 0, h)
      waterGrad.addColorStop(0, '#0a1a2e')
      waterGrad.addColorStop(1, '#020510')
      ctx.fillStyle = waterGrad
      ctx.fillRect(0, waterY, w, h - waterY)

      // Water shimmer
      for (let i = 0; i < 10; i++) {
        const y = waterY + (i + 1) * (h - waterY) / 11
        const shimmer = 0.05 + 0.08 * Math.sin(t * 1.5 + i * 0.8)
        ctx.fillStyle = `rgba(0, 212, 170, ${shimmer})`
        ctx.fillRect(0, y, w, 1)
      }

      // Harbor silhouettes in the distance
      ctx.fillStyle = '#06101c'
      ctx.fillRect(0, waterY - h * 0.04, w, h * 0.04)

      // Crane silhouette
      ctx.fillStyle = '#040810'
      ctx.beginPath()
      cranePoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x * w, p.y * h)
        else ctx.lineTo(p.x * w, p.y * h)
      })
      ctx.closePath()
      ctx.fill()

      // Crane cabin light
      ctx.fillStyle = '#ffaa00'
      ctx.shadowColor = '#ffaa00'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(0.15 * w, 0.36 * h, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Moving ship silhouettes
      ships.forEach((ship) => {
        ship.x += ship.speed * (16 + audio.energy * 8)
        if (ship.x > w + 220) {
          ship.x = -220
          ship.y = 0.66 + Math.random() * 0.12
          ship.scale = 0.6 + Math.random() * 0.8
          ship.hue = Math.random() > 0.5 ? 210 : 25
        }
        drawShip(ship.x, waterY + ship.y * h * 0.18, ship.scale, ship.hue)
      })

      // Lighthouse
      ctx.fillStyle = '#1a1a2e'
      ctx.beginPath()
      ctx.moveTo((lighthouse.x - 0.01) * w, lighthouse.y * h)
      ctx.lineTo((lighthouse.x + 0.01) * w, lighthouse.y * h)
      ctx.lineTo((lighthouse.x + 0.008) * w, (lighthouse.y - 0.08) * h)
      ctx.lineTo((lighthouse.x - 0.008) * w, (lighthouse.y - 0.08) * h)
      ctx.closePath()
      ctx.fill()

      // Lighthouse beacon
      lighthouse.beamAngle = (t * 0.5) % (Math.PI * 2)
      const beamX = Math.cos(lighthouse.beamAngle) * w * 0.15
      const beamY = Math.sin(lighthouse.beamAngle) * h * 0.08
      const beamGrad = ctx.createRadialGradient(
        lighthouse.x * w, (lighthouse.y - 0.06) * h, 0,
        lighthouse.x * w + beamX, (lighthouse.y - 0.06) * h + beamY, w * 0.2
      )
      beamGrad.addColorStop(0, 'rgba(255, 255, 200, 0.3)')
      beamGrad.addColorStop(1, 'rgba(255, 255, 200, 0)')
      ctx.fillStyle = beamGrad
      ctx.beginPath()
      ctx.moveTo(lighthouse.x * w, (lighthouse.y - 0.06) * h)
      ctx.lineTo(lighthouse.x * w + beamX + w * 0.02, (lighthouse.y - 0.06) * h + beamY - h * 0.02)
      ctx.lineTo(lighthouse.x * w + beamX - w * 0.02, (lighthouse.y - 0.06) * h + beamY + h * 0.02)
      ctx.closePath()
      ctx.fill()

      // Harbor lights
      const beatPhase = audio.beatPhase
      const beatActive = audio.beat || audio.energy > 0.12
      harborLights.forEach(light => {
        const lx = light.x * w
        const ly = light.y * h
        const pulse = light.blink
          ? 0.5 + 0.5 * Math.sin(t * light.speed + light.phase)
          : 0.7 + 0.3 * Math.sin(t * light.speed + light.phase)
        const beatScale = beatActive ? 1 + 0.25 * Math.exp(-beatPhase * 4) : 1

        ctx.globalAlpha = pulse
        ctx.shadowColor = light.color
        ctx.shadowBlur = light.glowSize
        ctx.fillStyle = light.color
        ctx.beginPath()
        ctx.arc(lx, ly, light.size * beatScale, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      })

      // Seagulls
      if (t > nextGullSpawnAt) {
        nextGullSpawnAt = t + 8 + Math.random() * 12
        gulls.push({
          x: -40,
          y: 40 + Math.random() * 120,
          speed: 0.7 + Math.random() * 0.6,
          phase: Math.random() * Math.PI * 2,
          scale: 0.9 + Math.random() * 0.7,
        })
      }
      for (let i = gulls.length - 1; i >= 0; i--) {
        const gull = gulls[i]
        gull.x += gull.speed * (12 + audio.energy * 2)
        gull.y += Math.sin(t * 1.4 + gull.phase) * 0.15
        drawGull(gull, t)
        if (gull.x > w + 60) gulls.splice(i, 1)
      }

      animId = requestAnimationFrame(render)
    }
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <div
        ref={fogFarRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 40%, rgba(200,220,255,0.08) 0%, transparent 55%), radial-gradient(ellipse at 70% 30%, rgba(0,212,170,0.05) 0%, transparent 50%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
      <div
        ref={fogNearRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(140,180,220,0.02) 0%, rgba(120,150,190,0.08) 100%)',
          opacity: 0.9,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      />
    </>
  )
}

export default function MainMenu({ hasSave, onNewGame, onLoadGame, onTraining, onTugboatMode }: MainMenuProps) {
    const [activeModal, setActiveModal] = useState<ModalType>(null)
    const [saveInfo, setSaveInfo] = useState<{ reputation?: number; shipCount?: number } | null>(null)
    const [hasNewVersion, setHasNewVersion] = useState(false)
    const [particles, setParticles] = useState<Array<{
        id: number
        x: number
        y: number
        size: number
        speed: number
        opacity: number
        delay: number
    }>>([])

    // Beat-reactive refs (avoid React re-render thrashing)
    const containerRef = useRef<HTMLDivElement>(null)
    const beatStateRef = useRef({ beat: false, energy: 0, bass: 0, intensity: 0 })

    // Initialize particles
    useEffect(() => {
        const newParticles = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 2 + Math.random() * 4,
            speed: 0.2 + Math.random() * 0.5,
            opacity: 0.1 + Math.random() * 0.3,
            delay: Math.random() * 5,
        }))
        setParticles(newParticles)
    }, [])

    // Load save state info
    useEffect(() => {
        if (hasSave) {
            const savedState = loadGameState()
            if (savedState) {
                setSaveInfo({
                    reputation: (savedState as any).reputation || 0,
                    shipCount: (savedState as any).ships?.length || 0
                })
            }
        }
    }, [hasSave])

    useEffect(() => {
        const seen = localStorage.getItem('harborglow_last_seen_version')
        setHasNewVersion(seen !== CURRENT_VERSION)
    }, [])

    // Start intro music when menu mounts
    useEffect(() => {
        introMusicSystem.playTitle().catch(() => {
            // Audio may be blocked until user interaction — that's fine,
            // the gesture handler in App.tsx will unlock it.
        })
    }, [])

    // Initialize audio-visual sync for the menu (outside the R3F Canvas)
    useEffect(() => {
        audioVisualSync.initialize().catch(() => {})
    }, [])

    // Subscribe to audio analysis and update CSS custom properties directly
    useEffect(() => {
        let rafId: number
        let running = true

        const loop = () => {
            if (!running) return
            const data = audioVisualSync.analyze(performance.now() / 1000)

            beatStateRef.current = {
                beat: data.beat,
                energy: data.energy,
                bass: data.bass,
                intensity: data.beatIntensity,
            }

            const el = containerRef.current
            if (el) {
                el.style.setProperty('--beat-energy', String(data.energy))
                el.style.setProperty('--beat-bass', String(data.bass))
                el.style.setProperty('--beat-intensity', String(data.beatIntensity))
                el.style.setProperty('--beat-phase', String(data.beatPhase))

                if (data.beat) {
                    el.style.setProperty('--beat-flash', '1')
                    setTimeout(() => {
                        if (el) el.style.setProperty('--beat-flash', '0')
                    }, 80)
                }
            }

            rafId = requestAnimationFrame(loop)
        }

        rafId = requestAnimationFrame(loop)

        return () => {
            running = false
            cancelAnimationFrame(rafId)
        }
    }, [])

    const openModal = (modal: ModalType) => {
        if (modal === 'changelog') {
            localStorage.setItem('harborglow_last_seen_version', CURRENT_VERSION)
            setHasNewVersion(false)
        }
        setActiveModal(modal)
    }
    const closeModal = () => setActiveModal(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && activeModal) {
                closeModal()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeModal])

    // Derive reactive values for inline styles that can't use CSS vars
    const { energy, bass } = beatStateRef.current

    return (
        <div style={containerStyle}>
            <div ref={containerRef} style={backgroundStyle} className="menu-audio-reactive">
                <div style={gradientOverlayStyle} />

                {/* Beat-reactive ambient orb */}
                <div style={beatOrbStyle(energy)} />

                {particles.map(p => (
                    <div
                        key={p.id}
                        style={{
                            ...particleStyle,
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                            opacity: p.opacity,
                            animationDelay: `${p.delay}s`,
                            animationDuration: `${15 + p.speed * 10}s`,
                        }}
                    />
                ))}

                <HarborLightsBackground />

                <div style={harborGlowStyle} />
            </div>

            <div style={contentStyle}>
                <div style={logoContainerStyle}>
                    <h1 style={titleStyle}>
                        <span style={{
                            ...titleGlowStyle,
                            // Energy-reactive text shadow
                            textShadow: `0 0 ${40 + energy * 40}px rgba(255,255,255,${0.3 + energy * 0.4}),
                                         0 0 ${80 + energy * 80}px rgba(255,255,255,${0.2 + energy * 0.3})`,
                            transition: 'text-shadow 0.1s ease-out',
                        }}>HARBOR</span>
                        <span style={{
                            ...titleAccentStyle,
                            textShadow: `0 0 ${40 + bass * 60}px rgba(0,212,170,${0.4 + bass * 0.5}),
                                         0 0 ${80 + bass * 80}px rgba(0,212,170,${0.3 + bass * 0.4})`,
                            transition: 'text-shadow 0.08s ease-out',
                        }}>GLOW</span>
                    </h1>
                    <div style={{
                        ...titleUnderlineStyle,
                        // Beat-reactive underline glow
                        boxShadow: `0 0 ${8 + bass * 20}px rgba(0,212,170,${0.4 + bass * 0.6})`,
                        transition: 'box-shadow 0.08s ease-out',
                    }} />
                    <p style={subtitleStyle}>Harbor Operations Experience</p>
                </div>

                <nav style={navStyle}>
                    {hasSave && (
                        <div style={{ width: '100%' }}>
                            <MenuButton
                                label="Continue"
                                icon="▶️"
                                variant="primary"
                                onClick={onLoadGame}
                            />
                            {saveInfo && (
                                <div style={{
                                    marginTop: '8px',
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontFamily: '"JetBrains Mono", monospace'
                                }}>
                                    <div>Reputation: ⭐{saveInfo.reputation || 0}</div>
                                    <div>Active Ships: 🚢{saveInfo.shipCount || 0}</div>
                                </div>
                            )}
                        </div>
                    )}

                    <MenuButton
                        label="New Game"
                        icon="🚢"
                        variant={hasSave ? 'secondary' : 'primary'}
                        onClick={onNewGame}
                    />

                    <MenuButton
                        label="Training"
                        icon="🎓"
                        variant="secondary"
                        onClick={onTraining || (() => {})}
                    />

                    <MenuButton
                        label="Tugboat Captain"
                        icon="🚤"
                        variant="secondary"
                        onClick={onTugboatMode || (() => {})}
                    />

                    <MenuButton
                        label="How to Play"
                        icon="❓"
                        variant="secondary"
                        onClick={() => openModal('howtoplay')}
                    />

                    <MenuButton
                        label="Settings"
                        icon="⚙️"
                        variant="secondary"
                        onClick={() => openModal('settings')}
                    />

                    <MenuButton
                        label="Credits"
                        icon="⭐"
                        variant="secondary"
                        onClick={() => openModal('credits')}
                    />
                </nav>

                <div style={hintStyle}>
                    <kbd style={kbdStyle}>ESC</kbd>
                    <span>to close modals</span>
                </div>
            </div>

            <div
                style={{
                    ...versionBadgeStyle,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: hasNewVersion ? '0 0 18px rgba(0,212,170,0.25)' : versionBadgeStyle.boxShadow,
                }}
                onClick={() => openModal('changelog')}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.5)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(0,212,170,0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}
            >
                <span style={versionDotStyle} />
                <span>{CURRENT_VERSION}</span>
                {hasNewVersion && (
                    <span style={{
                        marginLeft: '4px',
                        padding: '2px 6px',
                        borderRadius: '999px',
                        background: 'rgba(0,212,170,0.2)',
                        color: '#00d4aa',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        animation: 'harbor-pulse 1.4s ease-in-out infinite',
                    }}>
                        NEW
                    </span>
                )}
            </div>

            {activeModal === 'howtoplay' && <HowToPlayModal onClose={closeModal} />}
            {activeModal === 'settings' && <SettingsModal onClose={closeModal} />}
            {activeModal === 'credits' && <CreditsModal onClose={closeModal} />}
            {activeModal === 'changelog' && <ChangelogModal onClose={closeModal} />}

            {/* Beat-reactive CSS animations */}
            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.4; }
                    90% { opacity: 0.4; }
                    100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px #ffaa00, 0 0 40px #ff6600; }
                    50% { box-shadow: 0 0 30px #ffaa00, 0 0 60px #ff6600; }
                }
                @keyframes beat-pulse-logo {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                @keyframes harbor-pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                .menu-audio-reactive {
                    --beat-energy: 0;
                    --beat-bass: 0;
                    --beat-intensity: 0;
                    --beat-phase: 0;
                    --beat-flash: 0;
                }
            `}</style>
        </div>
    )
}
