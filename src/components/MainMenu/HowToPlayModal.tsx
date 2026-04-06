// =============================================================================
// HOW TO PLAY MODAL
// =============================================================================

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

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
    return (
        <Modal title="How to Play" icon="❓" onClose={onClose}>
            <div style={stepsContainerStyle}>
                {steps.map((step, i) => (
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
                <h3 style={controlsTitleStyle}>Quick Controls</h3>
                <div style={controlsGridStyle}>
                    <ControlItem keys={['W','A','S','D']} desc="Move spreader" />
                    <ControlItem keys={['↑','↓']} desc="Raise/Lower cable" />
                    <ControlItem keys={['E']} desc="Toggle twistlock" />
                    <ControlItem keys={['TAB']} desc="Toggle monitor" />
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
