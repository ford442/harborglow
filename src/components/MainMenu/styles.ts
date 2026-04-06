// =============================================================================
// MAIN MENU STYLES
// =============================================================================

import { GLASSMORPHISM, createGlassPanelStyles } from '../DesignSystem'

export const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    overflow: 'hidden',
}

export const backgroundStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2e 30%, #0d1a2e 70%, #0a1520 100%)',
    overflow: 'hidden',
}

export const gradientOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 100%, rgba(0,212,170,0.1) 0%, transparent 50%)',
}

export const particleStyle: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(0, 212, 170, 0.4)',
    borderRadius: '50%',
    animation: 'float-up linear infinite',
    filter: 'blur(1px)',
}

export const shipLightsContainerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
}

export const shipLightStyle: React.CSSProperties = {
    position: 'absolute',
    width: '8px',
    height: '8px',
    background: '#ffaa00',
    borderRadius: '50%',
    boxShadow: '0 0 20px #ffaa00, 0 0 40px #ff6600',
    animation: 'pulse-glow ease-in-out infinite',
}

export const harborGlowStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: 'radial-gradient(ellipse at 50% 100%, rgba(0,212,170,0.15) 0%, transparent 60%)',
}

export const contentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
    animation: 'slide-up 0.6s ease-out',
}

export const logoContainerStyle: React.CSSProperties = {
    textAlign: 'center',
}

export const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '64px',
    fontWeight: 900,
    letterSpacing: '8px',
    lineHeight: 1,
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
}

export const titleGlowStyle: React.CSSProperties = {
    color: '#fff',
    textShadow: '0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(255,255,255,0.3)',
}

export const titleAccentStyle: React.CSSProperties = {
    color: '#00d4aa',
    textShadow: '0 0 40px rgba(0,212,170,0.6), 0 0 80px rgba(0,212,170,0.4)',
}

export const titleUnderlineStyle: React.CSSProperties = {
    width: '120px',
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #00d4aa, transparent)',
    margin: '16px auto',
    borderRadius: '2px',
}

export const subtitleStyle: React.CSSProperties = {
    margin: '8px 0 0 0',
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: '3px',
    textTransform: 'uppercase',
}

export const navStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '280px',
}

export const buttonBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    border: 'none',
    borderRadius: GLASSMORPHISM.borderRadiusSmall,
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
}

export const buttonPrimaryStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #00d4aa, #00ffb8)',
    color: '#000',
}

export const buttonSecondaryStyle: React.CSSProperties = {
    background: GLASSMORPHISM.background,
    backdropFilter: GLASSMORPHISM.backdropFilter,
    color: '#fff',
    border: GLASSMORPHISM.border,
}

export const buttonIconStyle: React.CSSProperties = {
    fontSize: '20px',
    width: '28px',
    textAlign: 'center',
}

export const buttonLabelStyle: React.CSSProperties = {
    flex: 1,
    textAlign: 'left',
}

export const buttonShineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: 'shine 3s infinite',
}

export const hintStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
}

export const kbdStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 10px',
    background: 'rgba(0,212,170,0.2)',
    border: '1px solid rgba(0,212,170,0.4)',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: '"JetBrains Mono", monospace',
    color: '#00d4aa',
}

export const versionBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: GLASSMORPHISM.background,
    backdropFilter: GLASSMORPHISM.backdropFilter,
    border: GLASSMORPHISM.border,
    borderRadius: '20px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
}

export const versionDotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    background: '#00d4aa',
    borderRadius: '50%',
    boxShadow: '0 0 8px #00d4aa',
}

// Modal base styles
export const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '24px',
    animation: 'fade-in 0.2s ease-out',
}

export const modalContentStyle: React.CSSProperties = {
    ...createGlassPanelStyles({ glowColor: '#00d4aa' }),
    width: '100%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slide-up 0.3s ease-out',
}

export const modalHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
}

export const modalTitleContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
}

export const modalIconStyle: React.CSSProperties = {
    fontSize: '24px',
}

export const modalTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff',
}

export const modalCloseStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
}

export const modalBodyStyle: React.CSSProperties = {
    padding: '24px',
    overflow: 'auto',
}

export function createGlassPanelStylesWithGlow(options?: { glowColor?: string }): React.CSSProperties {
    const { glowColor } = options || {}
    return {
        background: GLASSMORPHISM.background,
        backdropFilter: GLASSMORPHISM.backdropFilter,
        borderRadius: GLASSMORPHISM.borderRadius,
        border: GLASSMORPHISM.border,
        boxShadow: glowColor ? `0 8px 32px ${glowColor}40, 0 2px 8px rgba(0,0,0,0.4)` : GLASSMORPHISM.boxShadow,
        WebkitBackdropFilter: GLASSMORPHISM.backdropFilter,
    }
}
