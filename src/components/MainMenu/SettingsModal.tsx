// =============================================================================
// SETTINGS MODAL
// =============================================================================

import { useState } from 'react'
import Modal from './Modal'
import {
    settingsContainerStyle,
    settingGroupStyle,
    settingGroupTitleStyle,
    sliderContainerStyle,
    sliderLabelStyle,
    sliderValueStyle,
    sliderStyle,
    qualityButtonsStyle,
    qualityButtonStyle,
    checkboxLabelStyle,
    checkboxStyle,
    settingsNoteStyle,
} from './modalStyles'

interface SettingsModalProps {
    onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
    const [volume, setVolume] = useState(80)
    const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high')
    const [bloom, setBloom] = useState(true)
    
    return (
        <Modal title="Settings" icon="⚙️" onClose={onClose}>
            <div style={settingsContainerStyle}>
                <div style={settingGroupStyle}>
                    <h3 style={settingGroupTitleStyle}>🔊 Audio</h3>
                    <div style={sliderContainerStyle}>
                        <label style={sliderLabelStyle}>
                            Master Volume
                            <span style={sliderValueStyle}>{volume}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            style={sliderStyle}
                        />
                    </div>
                </div>
                
                <div style={settingGroupStyle}>
                    <h3 style={settingGroupTitleStyle}>🎨 Graphics</h3>
                    <div style={qualityButtonsStyle}>
                        {(['low', 'medium', 'high'] as const).map(q => (
                            <button
                                key={q}
                                style={{
                                    ...qualityButtonStyle,
                                    background: quality === q ? '#00d4aa' : 'rgba(255,255,255,0.1)',
                                    color: quality === q ? '#000' : '#fff',
                                }}
                                onClick={() => setQuality(q)}
                            >
                                {q.charAt(0).toUpperCase() + q.slice(1)}
                            </button>
                        ))}
                    </div>
                    <label style={checkboxLabelStyle}>
                        <input
                            type="checkbox"
                            checked={bloom}
                            onChange={(e) => setBloom(e.target.checked)}
                            style={checkboxStyle}
                        />
                        <span>Bloom Effect</span>
                    </label>
                </div>
                
                <p style={settingsNoteStyle}>
                    💡 Settings are automatically saved to your browser.
                </p>
            </div>
        </Modal>
    )
}
