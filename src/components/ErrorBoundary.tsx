// =============================================================================
// ERROR BOUNDARY - HarborGlow
// Catches errors in MainScene and displays user-friendly fallback
// =============================================================================

import { Component, type ReactNode } from 'react'
import { GLASSMORPHISM } from './DesignSystem'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: string
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: '' }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: '' }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught error:', error, errorInfo)
        this.setState({ errorInfo: errorInfo.componentStack || '' })
    }

    handleReload = () => {
        window.location.reload()
    }

    handleReset = () => {
        // Clear any corrupted state
        localStorage.removeItem('harborglow_state')
        this.setState({ hasError: false, error: null, errorInfo: '' })
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={containerStyle}>
                    <div style={contentStyle}>
                        {/* Error icon */}
                        <div style={iconContainerStyle}>
                            <span style={iconStyle}>⚠️</span>
                        </div>
                        
                        {/* Title */}
                        <h1 style={titleStyle}>Something Went Wrong</h1>
                        
                        {/* Description */}
                        <p style={descriptionStyle}>
                            We encountered an error while loading the harbor. 
                            This might be due to WebGL compatibility or memory constraints.
                        </p>
                        
                        {/* Error details (collapsible) */}
                        <details style={detailsStyle}>
                            <summary style={summaryStyle}>Error Details</summary>
                            <pre style={preStyle}>
                                {this.state.error?.message}
                                {this.state.errorInfo}
                            </pre>
                        </details>
                        
                        {/* Actions */}
                        <div style={actionsStyle}>
                            <button onClick={this.handleReload} style={primaryButtonStyle}>
                                <span>🔄</span> Reload Game
                            </button>
                            <button onClick={this.handleReset} style={secondaryButtonStyle}>
                                <span>🗑️</span> Clear Save & Reset
                            </button>
                        </div>
                        
                        {/* Help text */}
                        <p style={helpStyle}>
                            If the problem persists, try:
                            <ul style={helpListStyle}>
                                <li>Updating your browser to the latest version</li>
                                <li>Enabling hardware acceleration in browser settings</li>
                                <li>Closing other tabs to free up memory</li>
                                <li>Checking console (F12) for detailed error logs</li>
                            </ul>
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

// =============================================================================
// STYLES
// =============================================================================

const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a15 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '24px',
    overflow: 'auto',
}

const contentStyle: React.CSSProperties = {
    ...createGlassPanelStyles({ glowColor: '#ff4757' }),
    maxWidth: '600px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '20px',
}

const iconContainerStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(255, 71, 87, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255, 71, 87, 0.3)',
}

const iconStyle: React.CSSProperties = {
    fontSize: '40px',
}

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#ff4757',
}

const descriptionStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
}

const detailsStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
}

const summaryStyle: React.CSSProperties = {
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    userSelect: 'none',
}

const preStyle: React.CSSProperties = {
    margin: 0,
    padding: '16px',
    background: 'rgba(0,0,0,0.5)',
    color: '#ff6b6b',
    fontSize: '11px',
    fontFamily: '"JetBrains Mono", monospace',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
}

const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
}

const primaryButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #00d4aa, #00ffb8)',
    border: 'none',
    borderRadius: '10px',
    color: '#000',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(0,212,170,0.4)',
}

const secondaryButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
}

const helpStyle: React.CSSProperties = {
    margin: '12px 0 0 0',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'left',
}

const helpListStyle: React.CSSProperties = {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
    lineHeight: 1.8,
}

function createGlassPanelStyles(options?: { glowColor?: string }): React.CSSProperties {
    const { glowColor } = options || {}
    return {
        background: GLASSMORPHISM.background,
        backdropFilter: GLASSMORPHISM.backdropFilter,
        borderRadius: GLASSMORPHISM.borderRadius,
        border: GLASSMORPHISM.border,
        boxShadow: glowColor ? GLASSMORPHISM.boxShadowGlow(glowColor) : GLASSMORPHISM.boxShadow,
        padding: '32px',
        WebkitBackdropFilter: GLASSMORPHISM.backdropFilter,
    }
}
