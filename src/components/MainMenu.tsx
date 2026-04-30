// =============================================================================
// MAIN MENU COMPONENT — Phase 8 Audio-Reactive Edition
// Glassmorphism modals with beat-synced animations driven by intro music.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { audioVisualSync } from '../systems/audioVisualSync'
import { introMusicSystem } from '../systems/introMusicSystem'
export interface MainMenuProps {
    hasSave: boolean
    onNewGame: () => void
    onLoadGame: () => void
    onTraining?: () => void
}
import HowToPlayModal from './MainMenu/HowToPlayModal'
import SettingsModal from './MainMenu/SettingsModal'
import CreditsModal from './MainMenu/CreditsModal'
import MenuButton from './MainMenu/MenuButton'
import {
    containerStyle,
    backgroundStyle,
    gradientOverlayStyle,
    particleStyle,
    shipLightsContainerStyle,
    shipLightStyle,
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

type ModalType = 'settings' | 'credits' | 'howtoplay' | null

export default function MainMenu({ hasSave, onNewGame, onLoadGame, onTraining }: MainMenuProps) {
    const [activeModal, setActiveModal] = useState<ModalType>(null)
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

                <div style={shipLightsContainerStyle}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                ...shipLightStyle,
                                left: `${15 + i * 18}%`,
                                bottom: `${20 + Math.sin(i * 0.5) * 10}%`,
                                animationDelay: `${i * 0.5}s`,
                                animationDuration: `${3 + i * 0.5}s`,
                                // Bass-reactive scale
                                transform: `scale(${1 + bass * 0.4})`,
                                transition: 'transform 0.08s ease-out',
                            }}
                        />
                    ))}
                </div>

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
                    <p style={subtitleStyle}>Crane Operator Experience</p>
                </div>

                <nav style={navStyle}>
                    {hasSave && (
                        <MenuButton
                            label="Continue"
                            icon="▶️"
                            variant="primary"
                            onClick={onLoadGame}
                        />
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

            <div style={versionBadgeStyle}>
                <span style={versionDotStyle} />
                <span>v2.0.0</span>
            </div>

            {activeModal === 'howtoplay' && <HowToPlayModal onClose={closeModal} />}
            {activeModal === 'settings' && <SettingsModal onClose={closeModal} />}
            {activeModal === 'credits' && <CreditsModal onClose={closeModal} />}

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
