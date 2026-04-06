// =============================================================================
// CREDITS MODAL
// =============================================================================

import Modal from './Modal'
import {
    creditsContainerStyle,
    creditsHeaderStyle,
    creditsTitleStyle,
    creditsVersionStyle,
    creditsDescStyle,
    techStackStyle,
    techStackTitleStyle,
    techGridStyle,
    techItemStyle,
    techIconStyle,
    techNameStyle,
    techDescStyle,
    creditsFooterStyle,
    creditsRepoStyle,
} from './modalStyles'

interface CreditsModalProps {
    onClose: () => void
}

const techs = [
    { name: 'React Three Fiber', icon: '⚛️', desc: '3D rendering' },
    { name: 'Tone.js', icon: '🎵', desc: 'Audio synthesis' },
    { name: 'Zustand', icon: '🐻', desc: 'State management' },
    { name: 'Leva', icon: '🎛️', desc: 'Debug controls' },
]

export default function CreditsModal({ onClose }: CreditsModalProps) {
    return (
        <Modal title="Credits" icon="ⓘ" onClose={onClose}>
            <div style={creditsContainerStyle}>
                <div style={creditsHeaderStyle}>
                    <h2 style={creditsTitleStyle}>HarborGlow</h2>
                    <p style={creditsVersionStyle}>Version 2.0.0</p>
                </div>
                
                <p style={creditsDescStyle}>
                    A crane-operator light-show experience. 
                    Build and upgrade ships with spectacular music-reactive lighting.
                </p>
                
                <div style={techStackStyle}>
                    <h3 style={techStackTitleStyle}>Built With</h3>
                    <div style={techGridStyle}>
                        {techs.map((tech, i) => (
                            <div key={i} style={techItemStyle}>
                                <span style={techIconStyle}>{tech.icon}</span>
                                <span style={techNameStyle}>{tech.name}</span>
                                <span style={techDescStyle}>{tech.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div style={creditsFooterStyle}>
                    <p>Made with ❤️ for the web</p>
                    <p style={creditsRepoStyle}>github.com/ford442/harborglow</p>
                </div>
            </div>
        </Modal>
    )
}
