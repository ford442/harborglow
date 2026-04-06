// =============================================================================
// MODAL COMPONENT - Base modal for MainMenu
// =============================================================================

import { useEffect } from 'react'
import {
    modalOverlayStyle,
    modalContentStyle,
    modalHeaderStyle,
    modalTitleContainerStyle,
    modalIconStyle,
    modalTitleStyle,
    modalCloseStyle,
    modalBodyStyle,
} from './styles'

export interface ModalProps {
    onClose: () => void
    title: string
    icon: string
    children: React.ReactNode
}

export default function Modal({ onClose, title, icon, children }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])
    
    return (
        <div 
            style={modalOverlayStyle}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={modalContentStyle}>
                <div style={modalHeaderStyle}>
                    <div style={modalTitleContainerStyle}>
                        <span style={modalIconStyle}>{icon}</span>
                        <h2 style={modalTitleStyle}>{title}</h2>
                    </div>
                    <button style={modalCloseStyle} onClick={onClose}>×</button>
                </div>
                <div style={modalBodyStyle}>
                    {children}
                </div>
            </div>
        </div>
    )
}
