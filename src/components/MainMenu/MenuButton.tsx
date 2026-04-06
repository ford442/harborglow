// =============================================================================
// MENU BUTTON COMPONENT
// =============================================================================

import { useState } from 'react'
import {
    buttonBaseStyle,
    buttonPrimaryStyle,
    buttonSecondaryStyle,
    buttonIconStyle,
    buttonLabelStyle,
    buttonShineStyle,
} from './styles'

interface MenuButtonProps {
    label: string
    icon: string
    variant?: 'primary' | 'secondary'
    onClick: () => void
}

export default function MenuButton({ label, icon, variant = 'primary', onClick }: MenuButtonProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)
    
    return (
        <button
            style={{
                ...buttonBaseStyle,
                ...(variant === 'primary' ? buttonPrimaryStyle : buttonSecondaryStyle),
                transform: isPressed ? 'scale(0.96)' : isHovered ? 'scale(1.02)' : 'scale(1)',
                boxShadow: variant === 'primary' 
                    ? '0 4px 20px rgba(0,212,170,0.4), 0 0 30px rgba(0,212,170,0.2)'
                    : isHovered 
                        ? '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                        : undefined,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onClick={onClick}
        >
            <span style={buttonIconStyle}>{icon}</span>
            <span style={buttonLabelStyle}>{label}</span>
            {variant === 'primary' && <div style={buttonShineStyle} />}
        </button>
    )
}
