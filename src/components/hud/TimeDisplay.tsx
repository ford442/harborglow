// =============================================================================
// TIME DISPLAY - Day/night cycle display
// =============================================================================

import { useEffect, useState } from 'react'
import { timeSystem, DayPhase } from '../../systems/timeSystem'
import {
  timeDisplayContainerStyle,
  timeIconStyle,
  timeTextStyle,
  phaseBadgeStyle,
} from './styles'

const PHASE_COLORS: Record<DayPhase, string> = {
  pre_dawn: '#1a1a2e',
  sunrise: '#ff6b35',
  mid_morning: '#4ecdc4',
  midday: '#ffe66d',
  golden_hour: '#ff8c42',
  night: '#2d1b4e',
}

const PHASE_ICONS: Record<DayPhase, string> = {
  pre_dawn: '🌙',
  sunrise: '🌅',
  mid_morning: '🌤️',
  midday: '☀️',
  golden_hour: '🌇',
  night: '🌃',
}

export default function TimeDisplay() {
  const [timeState, setTimeState] = useState(timeSystem.getState())
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeState(timeSystem.getState())
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  const formatTime = (hour: number, minute: number) => {
    const h = Math.floor(hour)
    const m = Math.floor(minute)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
  }
  
  return (
    <div style={timeDisplayContainerStyle}>
      <span style={timeIconStyle}>{PHASE_ICONS[timeState.currentPhase]}</span>
      <span style={timeTextStyle}>
        {formatTime(timeState.hour, timeState.minute)}
      </span>
      <span style={{
        ...phaseBadgeStyle,
        background: PHASE_COLORS[timeState.currentPhase],
        color: timeState.currentPhase === 'midday' ? '#000' : '#fff',
      }}>
        {timeState.currentPhase.replace('_', ' ')}
      </span>
    </div>
  )
}
