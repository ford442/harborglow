// =============================================================================
// CREDIT FEEDBACK - HarborGlow
// Floating +HC text when earning credits
// =============================================================================

import { useEffect, useState, useCallback } from 'react'
import { economySystem, InstallationEarnings } from '../systems/economySystem'

interface FloatingText {
  id: string
  amount: number
  breakdown?: InstallationEarnings
  x: number
  y: number
  startTime: number
}

export default function CreditFeedback() {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])

  const showEarnings = useCallback((earnings: InstallationEarnings, x: number = window.innerWidth / 2, y: number = window.innerHeight / 3) => {
    const id = `credit-${Date.now()}-${Math.random()}`
    
    setFloatingTexts(prev => [...prev, {
      id,
      amount: earnings.total,
      breakdown: earnings,
      x,
      y,
      startTime: Date.now()
    }])

    // Remove after animation
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id))
    }, 2000)
  }, [])

  useEffect(() => {
    // Hook into economy system
    const originalRecord = economySystem.recordInstallation.bind(economySystem)
    economySystem.recordInstallation = function(data) {
      const earnings = originalRecord(data)
      
      // Show floating text
      const event = new CustomEvent('showCreditFeedback', { detail: earnings })
      window.dispatchEvent(event)
      
      return earnings
    }

    const handleShowFeedback = (e: Event) => {
      const earnings = (e as CustomEvent).detail as InstallationEarnings
      showEarnings(earnings)
    }

    window.addEventListener('showCreditFeedback', handleShowFeedback)
    
    return () => {
      window.removeEventListener('showCreditFeedback', handleShowFeedback)
    }
  }, [showEarnings])

  return (
    <div style={containerStyle}>
      {floatingTexts.map(text => (
        <FloatingCreditText key={text.id} text={text} />
      ))}
    </div>
  )
}

function FloatingCreditText({ text }: { text: FloatingText }) {
  const [opacity, setOpacity] = useState(1)
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    const startTime = text.startTime
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / 2000 // 2 second animation
      
      if (progress >= 1) return
      
      setOpacity(1 - progress)
      setOffsetY(-progress * 100) // Float upward 100px
      
      requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }, [text.startTime])

  const hasBreakdown = text.breakdown && (
    text.breakdown.speedBonus > 0 ||
    text.breakdown.precisionBonus > 0 ||
    text.breakdown.syncBonus > 0 ||
    text.breakdown.weatherBonus > 0 ||
    text.breakdown.eventBonus > 0 ||
    text.breakdown.streakBonus > 0
  )

  return (
    <div 
      style={{
        ...floatingTextStyle,
        left: text.x,
        top: text.y + offsetY,
        opacity
      }}
    >
      <div style={mainAmountStyle}>
        <span style={currencyIconStyle}>💰</span>
        <span style={amountStyle}>+{text.amount}</span>
        <span style={hcLabelStyle}>HC</span>
      </div>
      
      {hasBreakdown && text.breakdown && (
        <div style={breakdownStyle}>
          {text.breakdown.speedBonus > 0 && (
            <span style={bonusTagStyle}>⚡ Speed +{text.breakdown.speedBonus}</span>
          )}
          {text.breakdown.precisionBonus > 0 && (
            <span style={bonusTagStyle}>🎯 Precision +{text.breakdown.precisionBonus}</span>
          )}
          {text.breakdown.syncBonus > 0 && (
            <span style={bonusTagStyle}>🎵 Sync +{text.breakdown.syncBonus}</span>
          )}
          {text.breakdown.weatherBonus > 0 && (
            <span style={bonusTagStyle}>🌤️ Weather +{text.breakdown.weatherBonus}</span>
          )}
          {text.breakdown.eventBonus > 0 && (
            <span style={bonusTagStyle}>🌊 Event +{text.breakdown.eventBonus}</span>
          )}
          {text.breakdown.streakBonus > 0 && (
            <span style={bonusTagStyle}>🔥 Streak +{text.breakdown.streakBonus}</span>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// STYLES
// =============================================================================

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 300
}

const floatingTextStyle: React.CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  animation: 'floatUp 2s ease-out'
}

const mainAmountStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 16px',
  background: 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,180,0,0.9))',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,215,0,0.2)',
  border: '2px solid rgba(255,255,255,0.3)'
}

const currencyIconStyle: React.CSSProperties = {
  fontSize: '20px'
}

const amountStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#000',
  fontFamily: 'monospace'
}

const hcLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#000',
  opacity: 0.7
}

const breakdownStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  justifyContent: 'center',
  maxWidth: '200px'
}

const bonusTagStyle: React.CSSProperties = {
  padding: '3px 8px',
  background: 'rgba(0,0,0,0.7)',
  borderRadius: '10px',
  fontSize: '10px',
  color: '#00d4aa',
  fontWeight: 600,
  border: '1px solid rgba(0,212,170,0.3)',
  whiteSpace: 'nowrap'
}

// CSS Animation
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes floatUp {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0;
    }
    20% {
      transform: translate(-50%, -60%) scale(1.1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -150%) scale(1);
      opacity: 0;
    }
  }
`
document.head.appendChild(styleSheet)
