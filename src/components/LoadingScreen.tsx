// =============================================================================
// ENHANCED LOADING SCREEN - HarborGlow Phase 7-8 Polish
// Real progress tracking with glassmorphism design
// =============================================================================

import { useState, useEffect } from 'react'
import { GLASSMORPHISM } from './DesignSystem'

interface LoadingScreenProps {
    progress: number
    status?: string
}

export default function LoadingScreen({ progress, status }: LoadingScreenProps) {
    const [dots, setDots] = useState('')
    const [currentStage, setCurrentStage] = useState(0)
    
    const stages = [
        { threshold: 0, label: 'Initializing', icon: '⚡' },
        { threshold: 20, label: 'Loading Assets', icon: '📦' },
        { threshold: 45, label: 'Building Harbor', icon: '🏗️' },
        { threshold: 70, label: 'Calibrating Systems', icon: '🔧' },
        { threshold: 90, label: 'Finalizing', icon: '✨' },
        { threshold: 100, label: 'Ready', icon: '🚀' },
    ]
    
    // Animated dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.')
        }, 500)
        return () => clearInterval(interval)
    }, [stages])
    
    // Update current stage based on progress
    useEffect(() => {
        const stage = stages.findIndex((s, i) => {
            const next = stages[i + 1]
            return progress >= s.threshold && (!next || progress < next.threshold)
        })
        if (stage !== -1) setCurrentStage(stage)
    }, [progress])
    
    const currentStageInfo = stages[currentStage]
    
    return (
        <div style={containerStyle}>
            {/* Animated background particles */}
            <div style={particlesContainerStyle}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            ...particleStyle,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${4 + Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>
            
            {/* Main content */}
            <div style={contentStyle}>
                {/* Logo */}
                <div style={logoContainerStyle}>
                    <h1 style={titleStyle}>
                        <span style={titleGlowStyle}>HARBOR</span>
                        <span style={titleAccentStyle}>GLOW</span>
                    </h1>
                    <p style={subtitleStyle}>Light up the night, one ship at a time</p>
                </div>
                
                {/* Loading indicator */}
                <div style={loadingContainerStyle}>
                    {/* Stage indicator */}
                    <div style={stageStyle}>
                        <span style={stageIconStyle}>{currentStageInfo?.icon}</span>
                        <span style={stageTextStyle}>
                            {status || currentStageInfo?.label}
                            {progress < 100 && <span style={dotsStyle}>{dots}</span>}
                        </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div style={progressBarContainerStyle}>
                        <div style={progressBarBgStyle}>
                            <div 
                                style={{
                                    ...progressBarFillStyle,
                                    width: `${Math.min(100, Math.max(0, progress))}%`,
                                }}
                            />
                        </div>
                        
                        {/* Progress markers */}
                        <div style={markersStyle}>
                            {stages.slice(0, -1).map((stage, i) => (
                                <div
                                    key={i}
                                    style={{
                                        ...markerStyle,
                                        left: `${stage.threshold}%`,
                                        background: progress >= stage.threshold 
                                            ? '#00d4aa' 
                                            : 'rgba(255,255,255,0.2)',
                                        boxShadow: progress >= stage.threshold 
                                            ? '0 0 8px #00d4aa' 
                                            : 'none',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    
                    {/* Progress percentage */}
                    <div style={percentageStyle}>
                        {Math.round(progress)}%
                    </div>
                </div>
                
                {/* Tips */}
                <div style={tipsContainerStyle}>
                    <p style={tipStyle}>
                        💡 Tip: Use <kbd style={kbdStyle}>TAB</kbd> to toggle camera views
                    </p>
                </div>
            </div>
            
            {/* Version */}
            <div style={versionStyle}>v2.0.0</div>
            
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
                    50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px #00d4aa40; }
                    50% { box-shadow: 0 0 40px #00d4aa60; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    )
}

// =============================================================================
// STYLES
// =============================================================================

const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2e 50%, #0d1525 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    overflow: 'hidden',
}

const particlesContainerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
}

const particleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '4px',
    height: '4px',
    background: 'rgba(0, 212, 170, 0.4)',
    borderRadius: '50%',
    animation: 'float 6s ease-in-out infinite',
}

const contentStyle: React.CSSProperties = {
    ...createGlassPanelStyles({ glowColor: '#00d4aa', padding: '48px', maxWidth: '480px' }),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
    zIndex: 1,
}

const logoContainerStyle: React.CSSProperties = {
    textAlign: 'center',
}

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '42px',
    fontWeight: 900,
    letterSpacing: '4px',
    lineHeight: 1,
}

const titleGlowStyle: React.CSSProperties = {
    color: '#fff',
    textShadow: '0 0 30px rgba(255,255,255,0.5)',
}

const titleAccentStyle: React.CSSProperties = {
    color: '#00d4aa',
    textShadow: '0 0 30px rgba(0,212,170,0.6)',
}

const subtitleStyle: React.CSSProperties = {
    margin: '12px 0 0 0',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '2px',
}

const loadingContainerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
}

const stageStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
}

const stageIconStyle: React.CSSProperties = {
    fontSize: '18px',
}

const stageTextStyle: React.CSSProperties = {
    fontWeight: 500,
    letterSpacing: '1px',
}

const dotsStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '24px',
    textAlign: 'left',
}

const progressBarContainerStyle: React.CSSProperties = {
    width: '100%',
    position: 'relative',
}

const progressBarBgStyle: React.CSSProperties = {
    height: '8px',
    background: 'rgba(0,0,0,0.4)',
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
}

const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    background: 'linear-gradient(90deg, #00d4aa 0%, #00ffb8 50%, #00d4aa 100%)',
    backgroundSize: '200% 100%',
    borderRadius: '4px',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: 'shimmer 2s linear infinite, pulse-glow 2s ease-in-out infinite',
    boxShadow: '0 0 20px rgba(0,212,170,0.4)',
}

const markersStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
}

const markerStyle: React.CSSProperties = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'all 0.3s ease',
    border: '2px solid rgba(0,0,0,0.5)',
}

const percentageStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#00d4aa',
    textShadow: '0 0 20px rgba(0,212,170,0.5)',
    fontFamily: '"JetBrains Mono", monospace',
}

const tipsContainerStyle: React.CSSProperties = {
    padding: '12px 20px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
}

const tipStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
}

const kbdStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.2)',
    fontSize: '11px',
    fontFamily: '"JetBrains Mono", monospace',
    color: '#00d4aa',
}

const versionStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
    fontFamily: '"JetBrains Mono", monospace',
}

function createGlassPanelStyles(options?: { glowColor?: string; padding?: string; maxWidth?: string }): React.CSSProperties {
    const { glowColor, padding = '16px', maxWidth } = options || {}
    return {
        background: GLASSMORPHISM.background,
        backdropFilter: GLASSMORPHISM.backdropFilter,
        borderRadius: GLASSMORPHISM.borderRadius,
        border: GLASSMORPHISM.border,
        boxShadow: glowColor ? GLASSMORPHISM.boxShadowGlow(glowColor) : GLASSMORPHISM.boxShadow,
        padding,
        maxWidth,
        WebkitBackdropFilter: GLASSMORPHISM.backdropFilter,
    }
}
