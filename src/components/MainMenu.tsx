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

function HarborLightsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let w = 0, h = 0

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    }
    resize()
    window.addEventListener('resize', resize)

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

    const render = (time: number) => {
      const t = time * 0.001
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
      harborLights.forEach(light => {
        const lx = light.x * w
        const ly = light.y * h
        const pulse = light.blink
          ? 0.5 + 0.5 * Math.sin(t * light.speed + light.phase)
          : 0.7 + 0.3 * Math.sin(t * light.speed + light.phase)

        ctx.globalAlpha = pulse
        ctx.shadowColor = light.color
        ctx.shadowBlur = light.glowSize
        ctx.fillStyle = light.color
        ctx.beginPath()
        ctx.arc(lx, ly, light.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      })

      animId = requestAnimationFrame(render)
    }
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
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
  )
}

export default function MainMenu({ hasSave, onNewGame, onLoadGame, onTraining, onTugboatMode }: MainMenuProps) {
    const [activeModal, setActiveModal] = useState<ModalType>(null)
    const [saveInfo, setSaveInfo] = useState<{ reputation?: number; shipCount?: number } | null>(null)
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

    const openModal = (modal: ModalType) => setActiveModal(modal)
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
                style={{ ...versionBadgeStyle, cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => openModal('changelog')}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.5)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(0,212,170,0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}
            >
                <span style={versionDotStyle} />
                <span>v2.0.0</span>
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
