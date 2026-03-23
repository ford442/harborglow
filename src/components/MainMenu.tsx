import React from 'react'

// =============================================================================
// MAIN MENU COMPONENT
// =============================================================================

export interface MainMenuProps {
    hasSave: boolean
    onNewGame: () => void
    onLoadGame: () => void
}

export default function MainMenu({ hasSave, onNewGame, onLoadGame }: MainMenuProps) {
    return (
        <div className="menu-container">
            <div className="menu-backdrop" />
            <div className="menu-content">
                <h1 className="menu-title">
                    <span className="title-glow">HARBOR</span>
                    <span className="title-accent">GLOW</span>
                </h1>
                <p className="menu-subtitle">Light up the night, one ship at a time.</p>

                <nav className="menu-nav">
                    <button className="menu-btn primary" onClick={onNewGame}>
                        <span className="btn-icon">⚡</span>
                        New Game
                    </button>

                    {hasSave && (
                        <button className="menu-btn" onClick={onLoadGame}>
                            <span className="btn-icon">📂</span>
                            Continue
                        </button>
                    )}

                    <button className="menu-btn" onClick={() => alert('Settings: Audio, Graphics, Controls')}>
                        <span className="btn-icon">⚙️</span>
                        Settings
                    </button>

                    <button className="menu-btn" onClick={() => alert('HarborGlow v2.0 - A crane-operator light-show experience. Built with React Three Fiber, Tone.js, and love.')}>
                        <span className="btn-icon">ⓘ</span>
                        Credits
                    </button>
                </nav>

                <p className="menu-hint">
                    <kbd>SPACE</kbd> to start
                </p>

                {/* Control Booth Preview Note */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: 'rgba(0, 212, 170, 0.1)',
                    border: '1px solid rgba(0, 212, 170, 0.3)',
                    borderRadius: '8px',
                    maxWidth: '400px'
                }}>
                    <div style={{
                        fontSize: '12px',
                        color: '#00d4aa',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '4px'
                    }}>
                        NEW: Immersive Control Booth
                    </div>
                    <div style={{ fontSize: '13px', color: '#aaa' }}>
                        Experience HarborGlow from inside a 3D crane operator cabin with live multi-monitor feeds
                    </div>
                </div>
            </div>
        </div>
    )
}
