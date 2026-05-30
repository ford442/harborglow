// =============================================================================
// TUGBOAT WELCOME MODAL - First-time Tugboat Mode Introduction
// =============================================================================

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

interface TugboatWelcomeModalProps {
    onClose: () => void
}

const features = [
    {
        icon: '🚤',
        title: 'Twin Screws Control',
        desc: 'Command independent port and starboard engines. Manage throttle and steering independently for precise maneuvering.',
        color: '#00d4ff',
    },
    {
        icon: '📡',
        title: 'Acoustic Array & Radar',
        desc: 'Navigate using sonar sweep lines and acoustic targeting. Receive handshake signals from docking berths.',
        color: '#00ff88',
    },
    {
        icon: '🌊',
        title: 'Storm Rescue Missions',
        desc: 'Respond to distressed vessels in challenging weather. Tow ships to safety while managing wind shear and currents.',
        color: '#ff6b9d',
    },
    {
        icon: '⚓',
        title: 'Precision Docking',
        desc: 'Navigate to designated berths and establish magnetic lock. Master the night shift of harbor operations.',
        color: '#ffa500',
    },
]

export default function TugboatWelcomeModal({ onClose }: TugboatWelcomeModalProps) {
    return (
        <Modal title="🚤 Welcome Aboard, Captain!" icon="🚤" onClose={onClose}>
            <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.9)',
            }}>
                <p style={{ margin: '0 0 8px 0' }}>
                    Welcome aboard the night shift, Captain. Twin screws are yours.
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(0, 212, 255, 0.8)' }}>
                    Navigate the dark waters, manage your vessel, and master the harbor tug ops experience.
                </p>
            </div>

            <div style={stepsContainerStyle}>
                {features.map((feature, i) => (
                    <div key={i} style={stepCardStyle}>
                        <div style={{
                            ...stepNumberStyle,
                            background: feature.color,
                            boxShadow: `0 0 20px ${feature.color}40`,
                        }}>
                            {feature.icon}
                        </div>
                        <div style={stepContentStyle}>
                            <h3 style={stepTitleStyle}>{feature.title}</h3>
                            <p style={stepDescStyle}>{feature.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={controlsSectionStyle}>
                <h3 style={controlsTitleStyle}>Tugboat Controls</h3>
                <div style={controlsGridStyle}>
                    <ControlItem keys={['W', 'S']} desc="Both engines forward / reverse" />
                    <ControlItem keys={['A', 'D']} desc="Differential steering (twin-screw)" />
                    <ControlItem keys={['SPACE']} desc="Emergency stop" />
                    <ControlItem keys={['SHIFT']} desc="Engine boost" />
                    <ControlItem keys={['T']} desc="Attach / detach tow line" />
                    <ControlItem keys={['RMB']} desc="First-person look" />
                    <ControlItem keys={['TAB']} desc="Toggle HUD" />
                    <ControlItem keys={['Q']} desc="Return to Crane Mode" />
                </div>
            </div>

            <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(255, 165, 0, 0.1)',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'rgba(255, 165, 0, 0.9)',
            }}>
                <strong>💡 Twin-Screw Tip:</strong> WASD drives <em>both</em> engines and their RPM differential. Watch the Propulsion bars in the HUD — cavitation warnings mean you're over-revving! Open the console panel to fine-tune each prop independently.
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
