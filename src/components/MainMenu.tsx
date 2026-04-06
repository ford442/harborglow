// =============================================================================
// MAIN MENU COMPONENT - Phase 7-8 Polish
// Glassmorphism modals, background animation, How to Play
// =============================================================================

import { useState, useEffect } from 'react'
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

    return (
        <div style={containerStyle}>
            <div style={backgroundStyle}>
                <div style={gradientOverlayStyle} />
                
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
                            }}
                        />
                    ))}
                </div>
                
                <div style={harborGlowStyle} />
            </div>
            
            <div style={contentStyle}>
                <div style={logoContainerStyle}>
                    <h1 style={titleStyle}>
                        <span style={titleGlowStyle}>HARBOR</span>
                        <span style={titleAccentStyle}>GLOW</span>
                    </h1>
                    <div style={titleUnderlineStyle} />
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
        </div>
    )
}
