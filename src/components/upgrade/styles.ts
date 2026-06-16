import React from 'react';

export const menuContainerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    background: 'rgba(0,0,0,0.9)',
    padding: '16px',
    borderRadius: '12px',
    pointerEvents: 'auto',
    width: '280px',
    maxHeight: '400px',
    overflow: 'hidden',
    border: '1px solid #333',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)'
}

export const progressBarBgStyle: React.CSSProperties = {
    height: '6px',
    backgroundColor: '#333',
    borderRadius: '3px',
    overflow: 'hidden'
}

export const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    transition: 'width 0.5s ease',
    borderRadius: '3px'
}

export const upgradeRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    margin: '6px 0',
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid #444',
    borderRadius: '8px',
    color: '#ddd',
    fontSize: '12px',
    textAlign: 'left',
    transition: 'all 0.2s ease',
}

export const installButtonStyle: React.CSSProperties = {
    marginLeft: '8px',
    padding: '6px 12px',
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    border: '1px solid rgba(0, 212, 170, 0.4)',
    borderRadius: '6px',
    color: '#00d4aa',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
}

export const installingSpinnerStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: 'currentColor',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
}

export const structuralOverhaulButtonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    margin: '16px 0 0 0',
    padding: '16px 12px',
    background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
    border: '2px solid #ffcc00',
    borderRadius: '12px',
    color: '#000',
    fontSize: '13px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)'
}

export const flashOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffd700',
    opacity: 0.3,
    pointerEvents: 'none',
    zIndex: 9999,
    animation: 'flash 0.5s ease-out'
}

export const v2NotificationStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'linear-gradient(135deg, rgba(255,0,128,0.95), rgba(128,0,255,0.95))',
    padding: '40px 60px',
    borderRadius: '20px',
    border: '3px solid #ff00ff',
    color: '#fff',
    textAlign: 'center',
    zIndex: 10000,
    pointerEvents: 'none',
    animation: 'pulseIn 0.5s ease-out, glow 2s infinite',
    boxShadow: '0 0 60px rgba(255,0,255,0.6), inset 0 0 30px rgba(255,255,255,0.2)'
}

export const upgradeCompleteBannerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 32px',
    background: 'rgba(10, 15, 30, 0.92)',
    backdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 212, 170, 0.4)',
    boxShadow: '0 0 40px rgba(0,212,170,0.2), 0 8px 32px rgba(0,0,0,0.5)',
    animation: 'banner-slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
}

export const bannerGlowLineStyle: React.CSSProperties = {
    width: '100%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #00d4aa, transparent)',
    opacity: 0.6,
}

export const bannerContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
}

export const bannerLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '3px',
    color: '#00d4aa',
    textTransform: 'uppercase',
}

export const bannerBandNameStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '1px',
    textShadow: '0 0 20px rgba(0,212,170,0.5)',
}

export const bannerGenreStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
}

export const watchLightShowButtonStyle: React.CSSProperties = {
    marginTop: '10px',
    padding: '10px 24px',
    background: 'rgba(0, 212, 170, 0.15)',
    border: '1px solid rgba(0, 212, 170, 0.5)',
    borderRadius: '8px',
    color: '#00d4aa',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
}

export const confettiPieceStyle: React.CSSProperties = {
    position: 'absolute',
    width: '8px',
    height: '3px',
    borderRadius: '999px',
    pointerEvents: 'none',
    opacity: 0,
    animationName: 'confetti-burst',
    animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    animationFillMode: 'forwards',
    filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.15))',
}

export const queueStatusStyle: React.CSSProperties = {
    position: 'absolute',
    right: '20px',
    bottom: '430px',
    width: '280px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(0, 18, 24, 0.95)',
    border: '1px solid rgba(0, 212, 170, 0.35)',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    zIndex: 15,
    pointerEvents: 'auto',
}

export const queueStatusTextStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    color: '#bffef4',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}

export const queueAbortButtonStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    cursor: 'pointer',
}

export const queueProgressBarBgStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    right: '12px',
    bottom: '8px',
    height: '4px',
    background: 'rgba(0, 212, 170, 0.12)',
    borderRadius: '999px',
    overflow: 'hidden',
}

export const queueProgressBarFillStyle: React.CSSProperties = {
    height: '100%',
    background: 'linear-gradient(90deg, #00d4aa, #00ffff)',
    boxShadow: '0 0 8px rgba(0, 212, 170, 0.5)',
    transition: 'width 0.25s ease',
}

export const queueCheckboxStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8px',
}

export const queueButtonStyle: React.CSSProperties = {
    width: '100%',
    marginTop: '10px',
    padding: '10px 12px',
    background: 'linear-gradient(135deg, rgba(0,212,170,0.22), rgba(0,255,255,0.12))',
    border: '1px solid rgba(0, 212, 170, 0.45)',
    borderRadius: '8px',
    color: '#bffef4',
    fontWeight: 700,
    letterSpacing: '0.5px',
}

export const queuePreviewOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 12,
}
