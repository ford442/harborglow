// =============================================================================
// DYNAMIC EVENT NOTIFIER - HarborGlow
// Displays active dynamic events and their effects on the port
// =============================================================================

import { useState, useEffect } from 'react'
import { useDynamicEventSystem, DynamicEvent } from '../systems/dynamicEventSystem'

interface EventNotificationProps {
  event: DynamicEvent
  onDismiss?: () => void
}

function EventNotification({ event, onDismiss }: EventNotificationProps) {
  const [progress, setProgress] = useState(100)
  
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = event.remaining / event.duration
      setProgress(remaining * 100)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [event])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'weather': return '🌪️'
      case 'wildlife': return '🐋'
      case 'emergency': return '🚨'
      case 'operational': return '⚓'
      case 'geopolitical': return '🌍'
      default: return '📢'
    }
  }

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'weather': return '#4a9eff'
      case 'wildlife': return '#00d4aa'
      case 'emergency': return '#ff4757'
      case 'operational': return '#ffd700'
      case 'geopolitical': return '#a855f7'
      default: return '#888'
    }
  }

  return (
    <div style={{
      ...notificationStyle,
      borderLeft: `3px solid ${getCategoryColor(event.category)}`
    }}>
      <div style={notificationHeaderStyle}>
        <span style={{ fontSize: '18px' }}>{getCategoryIcon(event.category)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
            {event.title}
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            {event.description}
          </div>
        </div>
        {onDismiss && (
          <button style={dismissButtonStyle} onClick={onDismiss}>✕</button>
        )}
      </div>
      
      <div style={effectsContainerStyle}>
        {event.effects.weather && (
          <EffectBadge icon="🌤️" label="Weather Alert" color="#4a9eff" />
        )}
        {event.effects.crane?.swayMultiplier && event.effects.crane.swayMultiplier > 1 && (
          <EffectBadge icon="🏗️" label={`+${Math.round((event.effects.crane.swayMultiplier - 1) * 100)}% Sway`} color="#ff9500" />
        )}
        {event.effects.ships?.arrivalModifier && event.effects.ships.arrivalModifier < 1 && (
          <EffectBadge icon="🚢" label="Ship Delays" color="#ff4757" />
        )}
        {event.effects.audio?.alertTone && (
          <EffectBadge icon="🔊" label="Emergency Audio" color="#ff4757" />
        )}
      </div>
      
      <div style={progressBarContainerStyle}>
        <div style={{
          ...progressBarFillStyle,
          width: `${progress}%`,
          background: getCategoryColor(event.category)
        }} />
      </div>
      
      <div style={timeRemainingStyle}>
        {Math.ceil(event.remaining / 60)} min remaining
      </div>
    </div>
  )
}

function EffectBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <span style={{
      ...effectBadgeStyle,
      background: color + '20',
      color,
      border: `1px solid ${color}40`
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

// =============================================================================
// MAIN NOTIFIER COMPONENT
// =============================================================================

export default function DynamicEventNotifier() {
  const { events, effects } = useDynamicEventSystem()
  const [isExpanded, setIsExpanded] = useState(true)
  const [dismissedEvents, setDismissedEvents] = useState<Set<string>>(new Set())
  
  // Clear dismissed events that are no longer active
  useEffect(() => {
    const activeIds = new Set(events.map(e => e.id))
    setDismissedEvents(prev => {
      const next = new Set(prev)
      prev.forEach(id => {
        if (!activeIds.has(id)) next.delete(id)
      })
      return next
    })
  }, [events])

  const visibleEvents = events.filter(e => !dismissedEvents.has(e.id))
  
  if (events.length === 0) return null

  return (
    <div style={containerStyle}>
      <button 
        style={toggleButtonStyle}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ fontSize: '16px' }}>🌊</span>
        <span style={{ fontSize: '12px', fontWeight: 600 }}>
          Port Events {events.length > 0 && `(${events.length})`}
        </span>
        <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div style={notificationsContainerStyle}>
          {visibleEvents.map(event => (
            <EventNotification
              key={event.id}
              event={event}
              onDismiss={() => setDismissedEvents(prev => new Set([...prev, event.id]))}
            />
          ))}
          
          {visibleEvents.length === 0 && (
            <div style={allDismissedStyle}>
              All events dismissed. {events.length} active.
            </div>
          )}
          
          {/* Active Effects Summary */}
          {Object.keys(effects).length > 0 && (
            <div style={effectsSummaryStyle}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                Active Port Conditions
              </div>
              <div style={effectsGridStyle}>
                {effects.crane?.swayMultiplier && (
                  <div style={effectItemStyle}>
                    <span style={{ color: '#ff9500' }}>🏗️</span>
                    <span style={{ fontSize: '11px' }}>
                      Sway ×{effects.crane.swayMultiplier.toFixed(2)}
                    </span>
                  </div>
                )}
                {effects.ships?.arrivalModifier && (
                  <div style={effectItemStyle}>
                    <span style={{ color: '#4a9eff' }}>🚢</span>
                    <span style={{ fontSize: '11px' }}>
                      Arrivals ×{effects.ships.arrivalModifier.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
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
  top: '80px',
  right: '20px',
  zIndex: 150,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxWidth: '300px'
}

const toggleButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.2s',
  alignSelf: 'flex-end'
}

const notificationsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const notificationStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  animation: 'slideIn 0.3s ease'
}

const notificationHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  marginBottom: '8px'
}

const dismissButtonStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  color: '#666',
  cursor: 'pointer',
  fontSize: '12px',
  padding: 0,
  ':hover': {
    color: '#fff'
  }
} as React.CSSProperties

const effectsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginBottom: '10px'
}

const effectBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 500
}

const progressBarContainerStyle: React.CSSProperties = {
  height: '3px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '2px',
  overflow: 'hidden',
  marginBottom: '6px'
}

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 1s linear'
}

const timeRemainingStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#666',
  textAlign: 'right'
}

const allDismissedStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(0,0,0,0.5)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#888',
  textAlign: 'center'
}

const effectsSummaryStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(0,0,0,0.6)',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.05)'
}

const effectsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}

const effectItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '4px'
}
