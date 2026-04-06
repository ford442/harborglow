// =============================================================================
// MODAL-SPECIFIC STYLES
// =============================================================================

// HowToPlay styles
export const stepsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
}

export const stepCardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
}

export const stepNumberStyle: React.CSSProperties = {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    fontSize: '20px',
    flexShrink: 0,
}

export const stepContentStyle: React.CSSProperties = {
    flex: 1,
}

export const stepTitleStyle: React.CSSProperties = {
    margin: '0 0 4px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
}

export const stepDescStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.5,
}

export const controlsSectionStyle: React.CSSProperties = {
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '12px',
}

export const controlsTitleStyle: React.CSSProperties = {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.8)',
}

export const controlsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
}

export const controlItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
}

export const keysContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
}

export const controlKeyStyle: React.CSSProperties = {
    display: 'inline-block',
    minWidth: '28px',
    padding: '6px 8px',
    background: 'rgba(0,212,170,0.15)',
    border: '1px solid rgba(0,212,170,0.3)',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: '"JetBrains Mono", monospace',
    color: '#00d4aa',
    textAlign: 'center',
}

export const controlDescStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
}

// Settings styles
export const settingsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
}

export const settingGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}

export const settingGroupTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.8)',
}

export const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
}

export const sliderLabelStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
}

export const sliderValueStyle: React.CSSProperties = {
    color: '#00d4aa',
    fontWeight: 600,
}

export const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '6px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
}

export const qualityButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
}

export const qualityButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
}

export const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
}

export const checkboxStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    accentColor: '#00d4aa',
    cursor: 'pointer',
}

export const settingsNoteStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
}

// Credits styles
export const creditsContainerStyle: React.CSSProperties = {
    textAlign: 'center',
}

export const creditsHeaderStyle: React.CSSProperties = {
    marginBottom: '16px',
}

export const creditsTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '28px',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #00d4aa, #00ffb8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
}

export const creditsVersionStyle: React.CSSProperties = {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
}

export const creditsDescStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    marginBottom: '24px',
}

export const techStackStyle: React.CSSProperties = {
    marginBottom: '24px',
}

export const techStackTitleStyle: React.CSSProperties = {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.8)',
}

export const techGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
}

export const techItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '16px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
}

export const techIconStyle: React.CSSProperties = {
    fontSize: '24px',
}

export const techNameStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
}

export const techDescStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
}

export const creditsFooterStyle: React.CSSProperties = {
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
}

export const creditsRepoStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.3)',
    marginTop: '4px',
    fontFamily: '"JetBrains Mono", monospace',
}
