// =============================================================================
// HOW TO PLAY MODAL
// =============================================================================

import React, { useState } from 'react'
import { SHIP_COLORS } from '../DesignSystem'
import Modal from './Modal'
import {
    stepsContainerStyle,
    stepCardStyle,
    stepNumberStyle,
    stepContentStyle,
    stepTitleStyle,
    stepDescStyle,
    controlsSectionStyle,
    controlsTitleStyle,
    controlsGridStyle,
    controlItemStyle,
    keysContainerStyle,
    controlKeyStyle,
    controlDescStyle,
} from './modalStyles'

interface HowToPlayModalProps {
    onClose: () => void
}

const steps = [
    {
        icon: '🚢',
        title: 'Spawn Ships',
        desc: 'Click the spawn buttons to bring ships into the harbor. Each ship type has unique lighting needs.',
        color: SHIP_COLORS.cruise.primary,
    },
    {
        icon: '🏗️',
        title: 'Control the Crane',
        useKeyboard: true,
        desc: 'Use Left Stick (WASD) to move spreader, Right Stick (Arrow keys) for rotation. E to engage twistlock.',
        color: '#00d4aa',
    },
    {
        icon: '💡',
        title: 'Install Light Rigs',
        desc: 'Position the crane over attachment points and lower to install lighting systems. Watch for the green indicator!',
        color: '#ff9500',
    },
    {
        icon: '🎵',
        title: 'Enjoy the Show',
        desc: 'Fully upgraded ships activate music-synced light shows. Use TAB to toggle camera views and enjoy the spectacle!',
        color: '#9b59b6',
    },
]

const tugboatSteps = [
    {
        icon: '🚤',
        title: 'Enter Tugboat Mode',
        desc: 'Switch to Tugboat Captain mode for night-shift harbor operations. Navigate, tow, and rescue in challenging conditions.',
        color: '#00d4ff',
    },
    {
        icon: '📡',
        title: 'Navigate with Radar',
        desc: 'Use the acoustic array radar to locate targets and berths. Watch for sweep lines and acoustic signatures.',
        color: '#00ff88',
    },
    {
        icon: '🌊',
        title: 'Respond to Missions',
        desc: 'Accept salvage contracts or storm rescue missions. Manage your engines and navigate challenging waters.',
        color: '#ff6b9d',
    },
    {
        icon: '⚓',
        title: 'Dock & Complete',
        desc: 'Guide your vessel to marked berths and establish magnetic lock. Earn reputation and rewards!',
        color: '#ffa500',
    },
]

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
    const [tab, setTab] = useState<'crane' | 'tugboat'>('crane')
    
    const activeSteps = tab === 'crane' ? steps : tugboatSteps
    const craneControls = [
        { keys: ['W','A','S','D'], desc: 'Move spreader' },
        { keys: ['↑','↓'], desc: 'Raise/Lower cable' },
        { keys: ['E'], desc: 'Toggle twistlock' },
        { keys: ['TAB'], desc: 'Toggle monitor' },
    ]
    const tugboatControls = [
        { keys: ['W','S'], desc: 'Port/Starboard throttle' },
        { keys: ['A','D'], desc: 'Steering' },
        { keys: ['Mouse'], desc: 'First-person look' },
        { keys: ['SHIFT'], desc: 'Boost (if unlocked)' },
        { keys: ['TAB'], desc: 'Toggle HUD' },
        { keys: ['Q'], desc: 'Return to Crane' },
    ]
    const activeControls = tab === 'crane' ? craneControls : tugboatControls

    return (
        <Modal title="How to Play" icon="❓" onClose={onClose}>
            {/* Tab selector */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                justifyContent: 'center',
            }}>
                <button
                    onClick={() => setTab('crane')}
                    style={{
                        padding: '8px 16px',
                        background: tab === 'crane' ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                        border: tab === 'crane' ? '1px solid rgba(0, 212, 170, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                    }}
                >
                    🏗️ Crane Operations
                </button>
                <button
                    onClick={() => setTab('tugboat')}
                    style={{
                        padding: '8px 16px',
                        background: tab === 'tugboat' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                        border: tab === 'tugboat' ? '1px solid rgba(0, 212, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                    }}
                >
                    🚤 Tugboat Operations
                </button>
            </div>

            <div style={stepsContainerStyle}>
                {activeSteps.map((step, i) => (
                    <div key={i} style={stepCardStyle}>
                        <div style={{
                            ...stepNumberStyle,
                            background: step.color,
                            boxShadow: `0 0 20px ${step.color}40`,
                        }}>
                            {step.icon}
                        </div>
                        <div style={stepContentStyle}>
                            <h3 style={stepTitleStyle}>{step.title}</h3>
                            <p style={stepDescStyle}>{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div style={controlsSectionStyle}>
                <h3 style={controlsTitleStyle}>
                    {tab === 'crane' ? 'Crane Controls' : 'Tugboat Controls'}
                </h3>
                <div style={controlsGridStyle}>
                    {activeControls.map((control, i) => (
                        <ControlItem key={i} keys={control.keys} desc={control.desc} />
                    ))}
                </div>
            </div>
        </Modal>
    )
}

function ControlItem({ keys, desc }: { keys: string[]; desc: string }) {
    return (
        <div style={controlItemStyle}>
            <div style={keysContainerStyle}>
                {keys.map((k, i) => (
                    <kbd key={i} style={controlKeyStyle}>{k}</kbd>
                ))}
            </div>
            <span style={controlDescStyle}>{desc}</span>
        </div>
    )
}
